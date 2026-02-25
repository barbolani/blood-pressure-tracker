import sharp from 'sharp';
import { copyFileSync } from 'fs';

const generateIcons = async () => {
    const input = '/home/alfonso/.gemini/antigravity/brain/53ba70a1-363b-4be2-ad73-0596f8497b40/logo_1772050629315.png';
    const outDir = './public';

    const sizes = [192, 512];

    for (const size of sizes) {
        await sharp(input)
            .resize(size, size)
            .toFile(`${outDir}/pwa-${size}x${size}.png`);
        console.log(`Generated ${size}x${size} icon`);
    }

    // Create maskable icon (same as 512 with a bit of padding usually, but for this demo just use 512)
    await sharp(input)
        .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toFile(`${outDir}/maskable-icon-512x512.png`);

    console.log('Generated maskable icon');

    // also create apple touch icon
    await sharp(input)
        .resize(180, 180)
        .toFile(`${outDir}/apple-touch-icon.png`);

    // also create favicon
    await sharp(input)
        .resize(32, 32)
        .toFile(`${outDir}/favicon.ico`);

    console.log('Done!');
};

generateIcons().catch(console.error);
