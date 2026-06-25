import { Injectable } from "@nestjs/common";
import { auth } from "@repo/auth/nest";

@Injectable()
export class AuthService {
  public auth = auth;
}
