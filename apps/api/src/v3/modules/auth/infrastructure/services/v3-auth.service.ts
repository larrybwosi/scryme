import { Injectable } from "@nestjs/common";
import { V3AuthCoreService } from "../../../auth-core/infrastructure/services/v3-auth-core.service";

@Injectable()
export class V3AuthService {
  constructor(private readonly authCore: V3AuthCoreService) {}

  async provisionDevice(token: string) {
    return this.authCore.provisionDevice(token);
  }

  async validateClient(clientId: string, clientSecret: string) {
    return this.authCore.validateClient(clientId, clientSecret);
  }

  async generateToken(client: any, member?: any) {
    return this.authCore.generateToken(client, member);
  }

  async loginMember(clientId: string, pin: string) {
    // SECURITY: Use centralized secure login logic that includes rate limiting
    return this.authCore.loginMember(clientId, pin);
  }

  async verifyToken(token: string) {
    return this.authCore.verifyToken(token);
  }
}
