import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { authOptions } from '@repo/auth/server';

@Injectable()
export class AuthService {
  public auth: any;

  constructor() {
    this.auth = betterAuth(authOptions as any);
  }
}
