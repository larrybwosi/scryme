import { Controller, Get, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { ImageService } from './image.service';
import { AllowPublic } from '../decorators/auth.decorator';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get(':id')
  @AllowPublic()
  async getImage(
    @Param('id') id: string,
    @Res() res: any,
    @Query('w') w?: string,
    @Query('h') h?: string,
    @Query('q') q?: string,
    @Query('fm') fm?: string,
  ) {
    const width = w ? parseInt(w, 10) : undefined;
    const height = h ? parseInt(h, 10) : undefined;
    const quality = q ? parseInt(q, 10) : undefined;
    const format = fm;

    try {
      const { data, contentType } = await this.imageService.optimizeImage(id, {
        width,
        height,
        quality,
        format,
      });

      res.header('Content-Type', contentType);
      res.header('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(HttpStatus.OK).send(data);
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).send('Image not found or could not be processed');
    }
  }
}
