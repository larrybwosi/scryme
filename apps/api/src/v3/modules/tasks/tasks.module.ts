import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../prisma/prisma.module';
import { ProjectUseCase } from './application/use-cases/project.use-case';
import { TaskUseCase } from './application/use-cases/task.use-case';
import { ProjectController } from './interfaces/http/project.controller';
import { TaskController } from './interfaces/http/task.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectController, TaskController],
  providers: [ProjectUseCase, TaskUseCase],
  exports: [ProjectUseCase, TaskUseCase],
})
export class TasksModule {}
