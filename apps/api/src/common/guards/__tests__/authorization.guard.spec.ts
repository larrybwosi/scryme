import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthorizationGuard } from '../authorization.guard';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PERMISSIONS_KEY, SCOPES_KEY, ALLOW_PUBLIC_KEY } from '../../decorators/auth.decorator';

describe('AuthorizationGuard (Default Deny)', () => {
  let guard: AuthorizationGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthorizationGuard>(AuthorizationGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (v2Context: any = {}): ExecutionContext => ({
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ v2Context }),
    }),
  } as unknown as ExecutionContext);

  it('should deny access if no decorators are present (Default Deny)', () => {
    vi.mocked(reflector.getAllAndOverride).mockImplementation((key) => {
      if (key === ALLOW_PUBLIC_KEY) return undefined;
      if (key === PERMISSIONS_KEY) return undefined;
      if (key === SCOPES_KEY) return undefined;
      return undefined;
    });

    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Security restriction: Handler missing authorization decorators (Default Deny)');
  });

  it('should allow access if @AllowPublic() is present', () => {
    vi.mocked(reflector.getAllAndOverride).mockImplementation((key) => {
      if (key === ALLOW_PUBLIC_KEY) return true;
      return undefined;
    });

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if @RequirePermission() is present but user lacks it', () => {
    vi.mocked(reflector.getAllAndOverride).mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return ['required:permission'];
      return undefined;
    });

    const context = createMockContext({ permissions: ['other:permission'] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Insufficient permissions');
  });

  it('should allow access if @RequirePermission() is present and user has it', () => {
    vi.mocked(reflector.getAllAndOverride).mockImplementation((key) => {
      if (key === PERMISSIONS_KEY) return ['required:permission'];
      return undefined;
    });

    const context = createMockContext({ permissions: ['required:permission'] });
    expect(guard.canActivate(context)).toBe(true);
  });
});
