import { Controller, Get, Delete, Headers, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as crypto from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { AllowPublic } from '../../common/decorators/auth.decorator';

let startTime = Date.now();
let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @AllowPublic()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  async getHealth() {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @AllowPublic()
  @Get('enhanced')
  @ApiOperation({ summary: 'Comprehensive system health check' })
  async getEnhanced() {
    const checkStartTime = performance.now();
    requestCount++;

    try {
      const dbCheck = await this.checkDatabase();
      const systemCheck = this.checkSystem();

      const checks = [dbCheck, systemCheck];
      const overallStatus = checks.some(c => c.status === 'unhealthy')
        ? 'unhealthy'
        : checks.some(c => c.status === 'degraded')
          ? 'degraded'
          : 'healthy';

      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
      const avgResponseTime = requestCount > 0 ? totalResponseTime / requestCount : 0;

      const responseTime = performance.now() - checkStartTime;
      totalResponseTime += responseTime;

      const health = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        uptime,
        checks: {
          database: dbCheck,
          system: systemCheck,
        },
        metrics: {
          requestCount,
          errorRate: Math.round(errorRate * 100) / 100,
          avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        },
      };

      if (overallStatus === 'unhealthy') {
        throw new ServiceUnavailableException(health);
      }

      return health;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      errorCount++;
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @AllowPublic()
  @Delete('metrics')
  @ApiOperation({ summary: 'Reset in-process metrics' })
  async resetMetrics(@Headers('x-admin-secret') secret: string) {
    const internalSecret = process.env.INTERNAL_ADMIN_SECRET;

    if (!internalSecret || !secret) {
      throw new UnauthorizedException();
    }

    // Use timing-safe comparison to prevent timing attacks.
    // Hashing ensures both buffers have the same length before comparison,
    // preventing leakage of the secret's length.
    const expectedHash = crypto.createHash('sha256').update(internalSecret).digest();
    const actualHash = crypto.createHash('sha256').update(secret).digest();

    if (!crypto.timingSafeEqual(expectedHash, actualHash)) {
      throw new UnauthorizedException();
    }

    startTime = Date.now();
    requestCount = 0;
    errorCount = 0;
    totalResponseTime = 0;
    return { message: 'Metrics reset' };
  }

  private async checkDatabase() {
    const start = performance.now();
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      const responseTime = performance.now() - start;
      return {
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        message: responseTime > 1000 ? 'Database responding slowly' : 'Database connected',
        responseTime: Math.round(responseTime),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        responseTime: Math.round(performance.now() - start),
      };
    }
  }

  private checkSystem() {
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryUsagePercent = (memoryUsedMB / memoryTotalMB) * 100;

    let status = 'healthy';
    if (memoryUsagePercent > 90) status = 'unhealthy';
    else if (memoryUsagePercent > 75) status = 'degraded';

    return {
      status,
      message: status === 'healthy' ? 'System resources normal' : 'High memory usage',
      details: { memory: { percentage: Math.round(memoryUsagePercent) } },
    };
  }
}
