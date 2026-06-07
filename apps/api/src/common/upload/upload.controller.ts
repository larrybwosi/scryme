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
    const result = await storageService.upload(buffer, fileName, data.mimetype);

    return res.send({ url: result.url || fileName });
  }
}
