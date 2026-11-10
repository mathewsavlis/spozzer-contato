/*
 * Gera versões menores das imagens de conteúdo
 * para uso em srcset.
 *
 * A imagem original continua sendo o maior
 * candidato do srcset — nenhuma qualidade é
 * perdida em telas que realmente precisam dela.
 *
 * Uso:
 *   npm run images
 *
 * Rodar novamente sempre que uma imagem em
 * public/assets/imgs/{portfolio,about}
 * for adicionada ou substituída.
 */

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const MANIFEST = path.join(ROOT, "src", "data", "imageVariants.json");

const FOLDERS = [
  "assets/imgs/portfolio",
  "assets/imgs/about",
];

const WIDTHS = [480, 800, 1200];

/* Não gera variante quase do tamanho do original. */
const MIN_REDUCTION = 0.85;

const VARIANT_PATTERN = /-\d+w\.webp$/;

const manifest = {};

for (const folder of FOLDERS) {
  const dir = path.join(PUBLIC_DIR, folder);

  const files = (await readdir(dir))
    .filter(
      (file) =>
        file.endsWith(".webp") &&
        !VARIANT_PATTERN.test(file)
    )
    .sort();

  for (const file of files) {
    const source = path.join(dir, file);
    const { width, height } = await sharp(source).metadata();
    const baseName = file.replace(/\.webp$/, "");

    const variants = [];

    for (const targetWidth of WIDTHS) {
      if (targetWidth > width * MIN_REDUCTION) continue;

      const variantFile = `${baseName}-${targetWidth}w.webp`;

      await sharp(source)
        .resize({ width: targetWidth })
        .webp({ quality: 82, effort: 6 })
        .toFile(path.join(dir, variantFile));

      variants.push({
        width: targetWidth,
        src: `/${folder}/${variantFile}`,
      });
    }

    manifest[`/${folder}/${file}`] = {
      width,
      height,
      variants,
    };

    console.log(
      `${folder}/${file} (${width}x${height}) → ${variants
        .map((variant) => `${variant.width}w`)
        .join(", ") || "sem variantes"}`
    );
  }
}

await writeFile(
  MANIFEST,
  `${JSON.stringify(manifest, null, 2)}\n`
);

console.log(`\nManifest: ${path.relative(ROOT, MANIFEST)}`);
