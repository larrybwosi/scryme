import {Injectable} from "@nestjs/common";
import {V3AuthService} from "../../infrastructure/services/v3-auth.service";

@Injectable()
export class ExchangeTokenUseCase {
  constructor(private readonly v3AuthService: V3AuthService) {}

  async execute(clientId: string, clientSecret: string) {
    const client = await this.v3AuthService.validateClient(
      clientId,
      clientSecret,
    );
    const accessToken = await this.v3AuthService.generateToken(client);

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
    };
  }
}
