const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const root = __dirname;
const outputDir = path.join(root, "ready-to-upload");

async function savePng(pipeline, filename) {
  await pipeline
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(outputDir, filename));
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const start = path.join(root, "01-glb-top-start-reference.png");
  const cavity = path.join(root, "02-cavity-style-reference.webp");
  const cizhou = path.join(root, "03-cizhou-end-reference.png");

  // The clay object is centered at approximately (160, 260) inside the
  // captured device. These crops remove the browser selector and phone shell.
  await savePng(
    sharp(start)
      .extract({ left: 70, top: 189, width: 180, height: 180 })
      .resize(1024, 1024, { kernel: sharp.kernel.lanczos3 }),
    "01-start-frame-square-1024.png",
  );

  await savePng(
    sharp(start)
      .extract({ left: 70, top: 118, width: 180, height: 320 })
      .resize(720, 1280, { kernel: sharp.kernel.lanczos3 }),
    "01-start-frame-portrait-720x1280.png",
  );

  await savePng(
    sharp(cavity).resize(1024, 1024, { kernel: sharp.kernel.lanczos3 }),
    "02-cavity-motion-reference-square-1024.png",
  );

  // Select the most complete peony-and-vine region while avoiding the
  // equirectangular panorama seam at both edges.
  await savePng(
    sharp(cizhou)
      .extract({ left: 835, top: 60, width: 755, height: 755 })
      .resize(1024, 1024, { kernel: sharp.kernel.lanczos3 }),
    "03-cizhou-end-frame-square-1024.png",
  );

  await savePng(
    sharp(cizhou)
      .extract({ left: 1060, top: 60, width: 425, height: 755 })
      .resize(720, 1280, { kernel: sharp.kernel.lanczos3 }),
    "03-cizhou-end-frame-portrait-720x1280.png",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
