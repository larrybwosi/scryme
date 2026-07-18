import { Module, Global, forwardRef } from "@nestjs/common";
import {
  MembersController,
  TerminalMembersController,
} from "./interfaces/http/members.controller";
import { InvitationController } from "./interfaces/http/invitation.controller";
import { RoleManagementController } from "./interfaces/http/role-management.controller";
import { DepartmentController } from "./interfaces/http/department.controller";
import { AttendanceController } from "./interfaces/http/attendance.controller";

import { MemberUseCase } from "./application/use-cases/member.use-case";
import { InvitationUseCase } from "./application/use-cases/invitation.use-case";
import { RoleManagementUseCase } from "./application/use-cases/role-management.use-case";
import { DepartmentUseCase } from "./application/use-cases/department.use-case";
import { AttendanceUseCase } from "./application/use-cases/attendance.use-case";
import { AttendanceScheduler } from "./application/services/attendance.scheduler";
import { ScrymeModule } from "@/v2/scryme/scryme.module";

@Module({
  imports: [ScrymeModule],
  controllers: [
    MembersController,
    TerminalMembersController,
    InvitationController,
    RoleManagementController,
    DepartmentController,
    AttendanceController,
  ],
  providers: [
    MemberUseCase,
    InvitationUseCase,
    RoleManagementUseCase,
    DepartmentUseCase,
    AttendanceUseCase,
    AttendanceScheduler,
  ],
  exports: [
    MemberUseCase,
    InvitationUseCase,
    RoleManagementUseCase,
    DepartmentUseCase,
    AttendanceUseCase,
  ],
})
export class MembersModule {}
