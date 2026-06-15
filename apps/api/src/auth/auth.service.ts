import {Injectable} from "@nestjs/common";
import {auth} from "@repo/auth/server";

@Injectable()
export class AuthService {
  public auth = auth;
}
