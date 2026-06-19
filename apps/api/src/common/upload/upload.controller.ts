import { Controller, Post, Req, Res, BadRequestException } from '@nestjs/common';
import { storageService, type V2ApiContext } from '@repo/shared/server';
import { v7 as uuidv7 } from 'uuid';
import { RequirePermission } from '../decorators/auth.decorator';
import { v2Context } from '../decorators/v2-context.decorator';

@Controller('upload')
export class UploadController {
  @Post()
  @RequirePermission('common:upload')
  async uploadFile(
    @Req() req: any,
    @Res() res: any,
    @v2Context() ctx: V2ApiContext,
  ) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file provided');
    }

    const fileExtension = data.filename.split('.').pop() || '';
    const fileName = `${uuidv7()}.${fileExtension}`;

    const buffer = await data.toBuffer();

    // Correctly use storageService.upload with proper argument order: (buffer, filename, mimetype)
    // and pass organizationId for multi-tenant isolation.
    await storageService.upload(buffer, fileName, data.mimetype, {
      organizationId: ctx.organizationId,
    });

    return res.send({ url: fileName });
  }
}
