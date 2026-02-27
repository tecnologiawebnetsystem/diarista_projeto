import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'fs';

const src = '/vercel/share/v0-project/app/icon.jpg';

async function convert() {
  // Read the jpg and create ico
  const img = readFileSync(src);
  
  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map(size => sharp(img).resize(size, size).png().toBuffer())
  );

  // Create ICO
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);
  iconDir.writeUInt16LE(1, 2);
  iconDir.writeUInt16LE(sizes.length, 4);

  const entries = [];
  let dataOffset = 6 + (sizes.length * 16);

  for (let i = 0; i < sizes.length; i++) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(sizes[i], 0);
    entry.writeUInt8(sizes[i], 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(pngBuffers[i].length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    entries.push(entry);
    dataOffset += pngBuffers[i].length;
  }

  const ico = Buffer.concat([iconDir, ...entries, ...pngBuffers]);
  writeFileSync('/vercel/share/v0-project/app/favicon.ico', ico);
  console.log('favicon.ico created successfully!');
}

convert().catch(console.error);
