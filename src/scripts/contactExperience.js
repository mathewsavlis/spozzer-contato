import { gsap } from "../lib/gsap.js";

import {
  registerWhatsappLead,
} from "../lib/leads/whatsappLead.js";

import { trackWhatsappLead }
  from "../lib/analytics/metaLead.js";


const MOBILE_QUERY =
  "(max-width: 47.999rem)";

const DESKTOP_QUERY =
  "(min-width: 48rem)";

const REDUCED_MOTION_QUERY =
  "(prefers-reduced-motion: reduce)";


export function initContactExperience({
  onWhatsappClick,
} = {}) {
  const section =
    document.querySelector(
      "[data-contact]"
    );


  if (
    !(section instanceof HTMLElement)
  ) {
    return () => { };
  }


  const whatsappLink =
    section.querySelector(
      "[data-whatsapp-cta]"
    );


  if (
    !(
      whatsappLink instanceof
      HTMLAnchorElement
    )
  ) {
    return () => { };
  }


  /*
   * =========================================
   * STABLE MOBILE VIEWPORT
   * =========================================
   *
   * O Contact NÃO recebe uma height fixa.
   *
   * Congelamos somente a altura mínima
   * de referência usada pelo layout.
   *
   * Assim:
   *
   * toolbar aparece/desaparece
   * → composição não recalcula
   *
   * conteúdo precisa crescer
   * → section continua podendo crescer
   */

  const mobileViewportQuery =
    window.matchMedia(
      MOBILE_QUERY
    );


  let stableViewportWidth =
    window.innerWidth;


  const setStableContactHeight =
    () => {
      /*
       * Desktop não utiliza
       * a variável mobile.
       */
      if (
        !mobileViewportQuery.matches
      ) {
        section.style.removeProperty(
          "--contact-stable-height"
        );

        return;
      }


      /*
       * Capturamos a altura útil
       * somente quando uma geometria
       * válida precisa ser estabelecida.
       */
      const height =
        Math.round(
          window.visualViewport
            ?.height ??
          window.innerHeight
        );


      /*
       * Guardamos também a largura.
       *
       * Ela será usada para diferenciar:
       *
       * toolbar / teclado
       *
       * de
       *
       * mudança real de orientação.
       */
      stableViewportWidth =
        window.innerWidth;


      section.style.setProperty(
        "--contact-stable-height",
        `${height}px`
      );
    };


  const handleViewportResize =
    () => {
      const currentWidth =
        window.innerWidth;


      /*
       * =====================================
       * MOBILE → DESKTOP
       * =====================================
       */

      if (
        !mobileViewportQuery.matches
      ) {
        section.style.removeProperty(
          "--contact-stable-height"
        );


        stableViewportWidth =
          currentWidth;


        return;
      }


      /*
       * =====================================
       * TOOLBAR / KEYBOARD
       * =====================================
       *
       * Safari altera fortemente
       * a altura da viewport quando:
       *
       * - barra aparece;
       * - barra desaparece;
       * - teclado abre.
       *
       * Mas a largura permanece
       * praticamente igual.
       *
       * Nesses casos NÃO recalculamos
       * a altura estável.
       */

      if (
        Math.abs(
          currentWidth -
          stableViewportWidth
        ) < 20
      ) {
        return;
      }


      /*
       * =====================================
       * REAL VIEWPORT CHANGE
       * =====================================
       *
       * Se a largura mudou de forma
       * relevante, normalmente tivemos:
       *
       * portrait → landscape
       * ou
       * landscape → portrait.
       *
       * Agora uma nova medição é válida.
       */

      setStableContactHeight();
    };


  /*
   * Primeira captura.
   */

  setStableContactHeight();


  window.addEventListener(
    "resize",
    handleViewportResize,
    {
      passive: true,
    }
  );


  /*
   * =========================================
   * WHATSAPP CLICK
   * =========================================
   *
   * Não chamamos preventDefault: o link segue
   * normalmente para o WhatsApp. Antes disso,
   * ainda dentro do clique:
   *
   * - o lead é gravado no banco (sendBeacon);
   * - o Pixel do Meta recebe o Lead (antes
   *   disparado pela página /obrigado);
   * - a sessão é marcada e o clique vira uma
   *   linha própria em visitor_sessions.
   *
   * Sem número configurado no build, o href
   * estático já está quebrado de qualquer
   * forma — não gravamos um lead que não
   * leva a lugar nenhum.
   */

  const whatsappNumber =
    whatsappLink.dataset
      .whatsappNumber ?? "";


  const handleWhatsappClick =
    () => {
      if (!whatsappNumber) return;


      registerWhatsappLead();


      trackWhatsappLead();


      onWhatsappClick?.();
    };


  whatsappLink.addEventListener(
    "click",
    handleWhatsappClick
  );


  /*
   * =========================================
   * MOTION
   * =========================================
   */

  let motionCleanup =
    () => { };


  if (
    !window
      .matchMedia(
        REDUCED_MOTION_QUERY
      )
      .matches
  ) {
    const eyebrow =
      section.querySelector(
        ".contact__eyebrow"
      );

    const title =
      section.querySelector(
        ".contact__title"
      );

    const description =
      section.querySelector(
        ".contact__description"
      );

    const cta =
      section.querySelector(
        ".contact-cta"
      );


    const media =
      gsap.matchMedia();


    media.add(
      {
        mobile:
          MOBILE_QUERY,

        desktop:
          DESKTOP_QUERY,
      },

      ({ conditions }) => {
        const context =
          gsap.context(
            () => {

              /*
               * =====================================
               * MOBILE
               * =====================================
               *
               * Mantemos por enquanto o modelo
               * one-shot já validado.
               *
               * A alteração desta rodada é somente
               * de estabilidade da viewport.
               */

              if (
                conditions.mobile
              ) {
                /*
                 * EYEBROW
                 */

                if (eyebrow) {
                  gsap.set(
                    eyebrow,
                    {
                      autoAlpha:
                        0,

                      y:
                        10,

                      willChange:
                        "transform, opacity",
                    }
                  );
                }


                /*
                 * TITLE
                 */

                if (title) {
                  gsap.set(
                    title,
                    {
                      autoAlpha:
                        0,

                      y:
                        18,

                      clipPath:
                        "inset(0% 0% 100% 0%)",

                      willChange:
                        "transform, opacity, clip-path",
                    }
                  );
                }


                /*
                 * DESCRIPTION
                 */

                if (description) {
                  gsap.set(
                    description,
                    {
                      autoAlpha:
                        0,

                      y:
                        12,

                      willChange:
                        "transform, opacity",
                    }
                  );
                }


                /*
                 * CTA
                 */

                if (cta) {
                  gsap.set(
                    cta,
                    {
                      autoAlpha:
                        0,

                      y:
                        10,

                      willChange:
                        "transform, opacity",
                    }
                  );
                }


                /*
                 * MOBILE TIMELINE
                 */

                const timeline =
                  gsap.timeline({
                    scrollTrigger: {
                      trigger:
                        section,

                      start:
                        "top 90%",

                      once:
                        true,
                    },
                  });


                /*
                 * EYEBROW
                 */

                if (eyebrow) {
                  timeline.to(
                    eyebrow,
                    {
                      autoAlpha:
                        1,

                      y:
                        0,

                      duration:
                        0.34,

                      ease:
                        "power2.out",
                    },

                    0
                  );
                }


                /*
                 * TITLE
                 */

                if (title) {
                  timeline.to(
                    title,
                    {
                      autoAlpha:
                        1,

                      y:
                        0,

                      clipPath:
                        "inset(0% 0% 0% 0%)",

                      duration:
                        0.58,

                      ease:
                        "power3.out",
                    },

                    0.06
                  );
                }


                /*
                 * DESCRIPTION
                 */

                if (description) {
                  timeline.to(
                    description,
                    {
                      autoAlpha:
                        1,

                      y:
                        0,

                      duration:
                        0.42,

                      ease:
                        "power2.out",
                    },

                    0.2
                  );
                }


                /*
                 * CTA
                 */

                if (cta) {
                  timeline.to(
                    cta,
                    {
                      autoAlpha:
                        1,

                      y:
                        0,

                      duration:
                        0.36,

                      ease:
                        "power2.out",
                    },

                    0.4
                  );
                }


                /*
                 * Reveal one-shot: libera as
                 * camadas de composição ao final.
                 */
                timeline.set(
                  [
                    eyebrow,
                    title,
                    description,
                    cta,
                  ].filter(Boolean),
                  {
                    willChange:
                      "auto",
                  }
                );


                return;
              }


              /*
               * =====================================
               * DESKTOP
               * =====================================
               *
               * Preserva o reveal reversível
               * ligado ao progresso do scroll.
               */

              if (eyebrow) {
                gsap.set(
                  eyebrow,
                  {
                    autoAlpha:
                      0,

                    y:
                      8,
                  }
                );
              }


              if (title) {
                gsap.set(
                  title,
                  {
                    autoAlpha:
                      0,

                    y:
                      14,

                    clipPath:
                      "inset(0% 0% 100% 0%)",
                  }
                );
              }


              if (description) {
                gsap.set(
                  description,
                  {
                    autoAlpha:
                      0,

                    y:
                      10,
                  }
                );
              }


              if (cta) {
                gsap.set(
                  cta,
                  {
                    autoAlpha:
                      0,

                    y:
                      10,
                  }
                );
              }


              /*
               * DESKTOP TIMELINE
               */

              const timeline =
                gsap.timeline({
                  scrollTrigger: {
                    trigger:
                      section,

                    start:
                      "top 62%",

                    end:
                      "top 8%",

                    scrub:
                      0.72,

                    invalidateOnRefresh:
                      true,

                    refreshPriority:
                      -20,
                  },
                });


              /*
               * EYEBROW
               */

              if (eyebrow) {
                timeline.to(
                  eyebrow,
                  {
                    autoAlpha:
                      1,

                    y:
                      0,

                    duration:
                      0.16,

                    ease:
                      "power2.out",
                  },

                  0
                );
              }


              /*
               * TITLE
               */

              if (title) {
                timeline.to(
                  title,
                  {
                    autoAlpha:
                      1,

                    y:
                      0,

                    clipPath:
                      "inset(0% 0% 0% 0%)",

                    duration:
                      0.28,

                    ease:
                      "power3.out",
                  },

                  0.08
                );
              }


              /*
               * DESCRIPTION
               */

              if (description) {
                timeline.to(
                  description,
                  {
                    autoAlpha:
                      1,

                    y:
                      0,

                    duration:
                      0.22,

                    ease:
                      "power2.out",
                  },

                  0.22
                );
              }


              /*
               * CTA
               */

              if (cta) {
                timeline.to(
                  cta,
                  {
                    autoAlpha:
                      1,

                    y:
                      0,

                    duration:
                      0.2,

                    ease:
                      "power2.out",
                  },

                  0.4
                );
              }
            },

            section
          );


        return () => {
          context.revert();
        };
      }
    );


    motionCleanup =
      () => {
        media.revert();
      };
  }


  /*
   * =========================================
   * CLEANUP
   * =========================================
   *
   * Fundamental para Astro HMR:
   *
   * - remove click listener;
   * - remove viewport listener;
   * - remove CSS variable;
   * - destrói timelines / ScrollTriggers.
   */

  return () => {
    whatsappLink.removeEventListener(
      "click",
      handleWhatsappClick
    );


    window.removeEventListener(
      "resize",
      handleViewportResize
    );


    section.style.removeProperty(
      "--contact-stable-height"
    );


    motionCleanup();
  };
}