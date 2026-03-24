const sharp = require('sharp');
const path = require('path');

async function convertIcon() {
  const svgPath = path.join(__dirname, '..', 'resources', 'icon.svg');
  const pngPath = path.join(__dirname, '..', 'resources', 'icon.png');
  const ico256Path = path.join(__dirname, '..', 'resources', 'icon-256.png');
  const icoPath = path.join(__dirname, '..', 'resources', 'icon.ico');

  // 1024x1024 PNG
  await sharp(svgPath).resize(1024, 1024).png().toFile(pngPath);

  // 256x256 PNG
  await sharp(svgPath).resize(256, 256).png().toFile(ico256Path);

  // ICO (256x256 BMP wrapped in ICO format)
  const png256 = await sharp(svgPath).resize(256, 256).png().toBuffer();
  const icoBuffer = createIco(png256, 256, 256);
  require('fs').writeFileSync(icoPath, icoBuffer);

  console.log('Icons generated successfully!');
  console.log('  - resources/icon.png (1024x1024)');
  console.log('  - resources/icon-256.png (256x256)');
  console.log('  - resources/icon.ico (256x256)');
}

function createIco(pngBuffer, width, height) {
  // ICO file format: header + directory entry + PNG data
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffset = headerSize + dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);       // reserved
  header.writeUInt16LE(1, 2);       // type: 1 = ICO
  header.writeUInt16LE(1, 4);       // number of images

  const dirEntry = Buffer.alloc(dirEntrySize);
  dirEntry.writeUInt8(width >= 256 ? 0 : width, 0);   // width (0 = 256)
  dirEntry.writeUInt8(height >= 256 ? 0 : height, 1);  // height (0 = 256)
  dirEntry.writeUInt8(0, 2);        // color palette
  dirEntry.writeUInt8(0, 3);        // reserved
  dirEntry.writeUInt16LE(1, 4);     // color planes
  dirEntry.writeUInt16LE(32, 6);    // bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8);  // image data size
  dirEntry.writeUInt32LE(dataOffset, 12);       // offset to image data

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

convertIcon().catch(console.error);
