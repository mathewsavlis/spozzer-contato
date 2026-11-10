import imageVariants from "../data/imageVariants.json";

export function assetPath(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = String(path).replace(/^\/+/, "");

  return `${normalizedBase}${normalizedPath}`;
}

/*
 * srcset com as variantes geradas por
 * `npm run images`. A original continua
 * sendo o maior candidato.
 *
 * Retorna undefined quando a imagem não está
 * no manifest — o <img> segue só com src.
 */
export function assetSrcset(path = "") {
  const key = `/${String(path).replace(/^\/+/, "")}`;
  const entry = imageVariants[key];

  if (!entry) return undefined;

  return [
    ...entry.variants.map(
      (variant) => `${assetPath(variant.src)} ${variant.width}w`
    ),
    `${assetPath(key)} ${entry.width}w`,
  ].join(", ");
}

/*
 * Dimensões reais da original, para os
 * atributos width/height do <img> (reservam
 * a proporção certa antes do download).
 */
export function assetSize(path = "") {
  const key = `/${String(path).replace(/^\/+/, "")}`;
  const entry = imageVariants[key];

  return entry
    ? { width: entry.width, height: entry.height }
    : { width: undefined, height: undefined };
}
