import sharp, { FormatEnum } from "sharp";

export async function optimizeImage(
  imageBuffer: Buffer,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: keyof FormatEnum;
  } = {},
): Promise<{ data: Buffer; info: sharp.OutputInfo }> {
  let transformer = sharp(imageBuffer, { failOn: "none" });

  if (options.width || options.height) {
    transformer = transformer.resize({
      width: options.width,
      height: options.height,
      fit: "cover",
      withoutEnlargement: true,
    });
  }

  const format = options.format || "webp";
  const quality = options.quality || 80;

  // @ts-ignore
  transformer = transformer[format]({ quality });

  const result = await transformer.toBuffer({ resolveWithObject: true });

  // Explicitly nulling input buffer to help GC as per memory optimization guidelines
  (imageBuffer as any) = null;

  return result;
}

export { sharp };
