import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { NodeIO } from "@gltf-transform/core";
import { MeshoptSimplifier } from "meshoptimizer";

const sourcePath = path.resolve(
  process.argv[2] ?? "D:/工作/趣传/牛蒙蒙/e8c14c3f8c41fbd7e18d57fefd8781ab.glb",
);
const outputPath = path.resolve(
  process.argv[3] ?? "public/assets/kilns/intro-3d/opened-clay.glb",
);
const targetTriangleRatio = 0.22;

const copyAttribute = (document, primitive, semantic, remap, unique) => {
  const source = primitive.getAttribute(semantic);
  if (!source) return;

  const sourceArray = source.getArray();
  const componentSize = source.getElementSize();
  const targetArray = new sourceArray.constructor(unique * componentSize);

  for (let sourceIndex = 0; sourceIndex < remap.length; sourceIndex += 1) {
    const targetIndex = remap[sourceIndex];
    if (targetIndex === 0xffffffff) continue;
    const sourceOffset = sourceIndex * componentSize;
    const targetOffset = targetIndex * componentSize;
    targetArray.set(
      sourceArray.subarray(sourceOffset, sourceOffset + componentSize),
      targetOffset,
    );
  }

  source.setArray(targetArray);
}

const compactPrimitive = (document, primitive, indices) => {
  const [remap, unique] = MeshoptSimplifier.compactMesh(indices);

  for (const semantic of primitive.listSemantics()) {
    copyAttribute(document, primitive, semantic, remap, unique);
  }

  primitive.getIndices().setArray(indices);
};

const resizeTexture = (texture, tempDirectory) => {
  const image = texture.getImage();
  if (!image) return;

  const name = texture.getName().toLowerCase();
  const targetSize = name.includes("normal") || name.includes("roughness") || name.includes("metallic")
    ? 1024
    : 2048;
  const inputPath = path.join(tempDirectory, `${texture.getName() || "texture"}.png`);
  const outputPath = path.join(tempDirectory, `${texture.getName() || "texture"}-${targetSize}.png`);
  fs.writeFileSync(inputPath, image);
  execFileSync("ffmpeg.exe", [
    "-v",
    "error",
    "-y",
    "-i",
    inputPath,
    "-vf",
    `scale=${targetSize}:${targetSize}:flags=lanczos`,
    "-compression_level",
    "9",
    outputPath,
  ]);
  texture.setImage(fs.readFileSync(outputPath)).setMimeType("image/png");
  return { targetSize, bytes: fs.statSync(outputPath).size };
};

await MeshoptSimplifier.ready;
const io = new NodeIO();
const document = await io.read(sourcePath);
const root = document.getRoot();
const mesh = root.listMeshes()[0];
if (!mesh) throw new Error("No mesh found in source GLB.");

let sourceTriangles = 0;
let targetTriangles = 0;
let simplificationError = 0;

for (const primitive of mesh.listPrimitives()) {
  if (primitive.getMode() !== 4) {
    throw new Error(`Expected TRIANGLES primitive, got mode ${primitive.getMode()}.`);
  }

  const position = primitive.getAttribute("POSITION");
  const indices = primitive.getIndices();
  if (!position || !indices) throw new Error("Expected indexed POSITION primitive.");

  const sourceIndices = new Uint32Array(indices.getArray());
  sourceTriangles += sourceIndices.length / 3;
  const requestedIndexCount = Math.floor((sourceIndices.length * targetTriangleRatio) / 3) * 3;
  const [simplifiedIndices, error] = MeshoptSimplifier.simplify(
    sourceIndices,
    position.getArray(),
    3,
    requestedIndexCount,
    0.004,
    [],
  );
  simplificationError = Math.max(simplificationError, error);
  compactPrimitive(document, primitive, simplifiedIndices);
  targetTriangles += simplifiedIndices.length / 3;
}

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kiln-intro-glb-"));
const textureStats = [];
try {
  for (const texture of root.listTextures()) {
    const stats = resizeTexture(texture, tempDirectory);
    if (stats) textureStats.push({ name: texture.getName(), ...stats });
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await io.write(outputPath, document);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

const outputBytes = fs.statSync(outputPath).size;
console.log(
  JSON.stringify(
    {
      source: sourcePath,
      output: outputPath,
      sourceTriangles,
      targetTriangles,
      simplificationError,
      textureStats,
      outputBytes,
    },
    null,
    2,
  ),
);
