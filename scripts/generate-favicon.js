import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const BASE = '/vercel/share/v0-project';
const sizes = [16, 32, 48];

async function generateFavicon() {
  const srcPath = resolve(BASE, 'public/favicon-source.jpg');
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(srcPath)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  await sharp(srcPath)
    .resize(32, 32)
    .png()
    .toFile(resolve(BASE, 'public/favicon.png'));

  // Create ICO file manually
  // ICO format: ICONDIR header + ICONDIRENTRY for each image + PNG data
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);     // Reserved
  iconDir.writeUInt16LE(1, 2);     // Type: 1 = ICO
  iconDir.writeUInt16LE(sizes.length, 4); // Number of images

  const entries = [];
  let dataOffset = 6 + (sizes.length * 16); // After header + all entries

  for (let i = 0; i < sizes.length; i++) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0);  // Width
    entry.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 1);  // Height
    entry.writeUInt8(0, 2);            // Color palette
    entry.writeUInt8(0, 3);            // Reserved
    entry.writeUInt16LE(1, 4);         // Color planes
    entry.writeUInt16LE(32, 6);        // Bits per pixel
    entry.writeUInt32LE(pngBuffers[i].length, 8);  // Size of image data
    entry.writeUInt32LE(dataOffset, 12);            // Offset of image data
    entries.push(entry);
    dataOffset += pngBuffers[i].length;
  }

  const ico = Buffer.concat([iconDir, ...entries, ...pngBuffers]);
  writeFileSync(resolve(BASE, 'app/favicon.ico'), ico);
  console.log('Favicon generated successfully: app/favicon.ico');
}

generateFavicon().catch(console.error);
