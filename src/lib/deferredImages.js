/*
 * =========================================
 * IMAGENS ADIADAS
 * =========================================
 *
 * <img data-src data-srcset> sem src: o navegador
 * não baixa nada até o JS decidir.
 *
 * Por quê não só loading="lazy": antes do JS criar
 * o pin da Intro a página é curta, então o grid do
 * Portfolio (atrás do Hero) e até o Sobre ficam
 * "dentro" do raio do lazy loading nativo (~2500px em
 * conexão lenta) e baixam junto com fontes e JS — sem
 * ninguém vê-las ainda. Medido em laboratório: ~185 KB
 * disputando banda com o JS que revela o Hero.
 *
 * Sem JS, o <noscript> ao lado entrega a imagem
 * normal; se o bundle falhar, o boot guard do
 * BaseLayout carrega todas (ver js-fallback).
 */

export function loadDeferredImage(image) {
  if (!(image instanceof HTMLImageElement)) return;

  const { src, srcset } = image.dataset;

  if (srcset) {
    image.srcset = srcset;
    delete image.dataset.srcset;
  }

  if (src) {
    image.src = src;
    delete image.dataset.src;
  }
}


export function loadDeferredImages(root = document) {
  root
    ?.querySelectorAll?.("img[data-src]")
    .forEach(loadDeferredImage);
}


/*
 * Carrega quando a imagem chega a `rootMargin`
 * da viewport. Devolve a função de cleanup.
 */
export function loadDeferredImagesNear(
  root,
  rootMargin = "1200px 0px"
) {
  const images = [
    ...(root?.querySelectorAll?.("img[data-src]") ?? []),
  ];

  if (images.length === 0) {
    return () => {};
  }

  if (!("IntersectionObserver" in window)) {
    images.forEach(loadDeferredImage);
    return () => {};
  }

  const observer =
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          loadDeferredImage(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin }
    );

  images.forEach((image) => observer.observe(image));

  return () => observer.disconnect();
}
