import { Controller, All, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('*')
  async handleAuth(@Req() req: any, @Res() res: any) {
    const response = await this.authService.auth.handler(req.raw);

    // Better Auth handler returns a Web Response object
    // We need to map it to the NestJS (Fastify) response

    // Copy headers
    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    res.status(response.status);

    if (response.body) {
        // For JSON responses, better-auth usually returns JSON.
        // We can use the text() or json() method of the Response object.
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return res.send(await response.json());
        }
        return res.send(await response.text());
    }

    return res.send();
  }
}
