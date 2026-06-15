import { Controller, Post, Req, Res, BadRequestException } from '@nestjs/common';
import { storageService } from '@repo/shared/server';
import { v7 as uuidv7 } from 'uuid';
import { RequirePermission } from '../decorators/auth.decorator';

@Controller('upload')
export class UploadController {
  @Post()
  @RequirePermission('common:upload')
  async uploadFile(@Req() req: any, @Res() res: any) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file provided');
    }

    const fileExtension = data.filename.split('.').pop() || '';
    const fileName = `${uuidv7()}.${fileExtension}`;

    const buffer = await data.toBuffer();

    // Correctly use storageService.upload with proper argument order: (buffer, filename, mimetype)
    // This fixes a previous bug where it called a non-existent 'uploadFile' method.
    await storageService.upload(buffer, fileName, data.mimetype);

    return res.send({ url: fileName });
  }
}
