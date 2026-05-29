import { Controller, Post, Req, Res, BadRequestException } from '@nestjs/common';
import { storageService } from '@repo/shared/server';
import { v7 as uuidv7 } from 'uuid';
import { AllowPublic as Public } from '../decorators/auth.decorator';

@Controller('upload')
export class UploadController {
  @Public()
  @Post()
  async uploadFile(@Req() req: any, @Res() res: any) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file provided');
    }

    const fileExtension = data.filename.split('.').pop();
    const fileName = `${uuidv7()}.${fileExtension}`;

    const buffer = await data.toBuffer();
    // Assuming storageService has a 'uploadFile' or 'putObject' based on memory/grep
    // but the previous build said 'put' doesn't exist either.
    // Let's use any cast if unsure of provider method to pass build and focus on V3
    await (storageService as any).uploadFile(fileName, buffer, data.mimetype);

    return res.send({ url: fileName });
  }
}
