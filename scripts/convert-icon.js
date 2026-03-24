const sharp = require('sharp');
const path = require('path');

async function convertIcon() {
  const svgPath = path.join(__dirname, '..', 'resources', 'icon.svg');
  const pngPath = path.join(__dirname, '..', 'resources', 'icon.png');

  await sharp(svgPath)
    .resize(1024, 1024)
    .png()
    .toFile(pngPath);

  // Also create a 256x256 version for Windows
  const icoInputPath = path.join(__dirname, '..', 'resources', 'icon-256.png');
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(icoInputPath);

  console.log('Icons generated successfully!');
  console.log('  - resources/icon.png (1024x1024)');
  console.log('  - resources/icon-256.png (256x256)');
}

convertIcon().catch(console.error);
