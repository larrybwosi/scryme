import { BaseModule } from './base';
import { Member, AttendanceLog, Department, Invitation } from '@repo/db';
import { PaginationParams, PaginatedResponse, PaginationHelper } from '../../core/pagination';

export class MembersModule extends BaseModule {
  async getMembers(params?: PaginationParams): Promise<PaginatedResponse<Member>> {
    return this.client.get(this.getOrgPath('/members'), {
      params: params ? PaginationHelper.toParams(params) : undefined
    });
  }

  async getMember(id: string): Promise<Member> {
    return this.client.get(this.getOrgPath(`/members/${id}`));
  }

  async createMember(data: any): Promise<Member> {
    return this.client.post(this.getOrgPath('/members'), data);
  }

  async updateMember(id: string, data: any): Promise<Member> {
    return this.client.patch(this.getOrgPath(`/members/${id}`), data);
  }

  async getAttendance(params?: PaginationParams): Promise<PaginatedResponse<AttendanceLog>> {
    return this.client.get(this.getOrgPath('/members/attendance'), {
      params: params ? PaginationHelper.toParams(params) : undefined
    });
  }

  async recordAttendance(data: any): Promise<AttendanceLog> {
    return this.client.post(this.getOrgPath('/members/attendance'), data);
  }

  async getDepartments(): Promise<Department[]> {
    return this.client.get(this.getOrgPath('/members/departments'));
  }

  async getInvitations(): Promise<Invitation[]> {
    return this.client.get(this.getOrgPath('/members/invitations'));
  }

  async sendInvitation(data: any): Promise<Invitation> {
    return this.client.post(this.getOrgPath('/members/invitations'), data);
  }
}
