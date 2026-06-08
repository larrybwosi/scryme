import { Controller, Post, Req, Res, BadRequestException } from '@nestjs/common';
import { storageService } from '@repo/shared/server';
import { v7 as uuidv7 } from 'uuid';

@Controller('upload')
export class UploadController {
  @Post()
  async uploadFile(@Req() req: any, @Res() res: any) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file provided');
    }

    const fileExtension = data.filename.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
    const fileName = `${uuidv7()}.${fileExtension}`;

    const buffer = await data.toBuffer();
    const result = await storageService.upload(buffer, fileName, data.mimetype);

    return res.send({ url: result.url || fileName });
  }
}
