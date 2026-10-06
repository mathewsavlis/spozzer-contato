import {
  gsap,
  ScrollTrigger,
} from "../lib/gsap.js";

import { afterPageLoad }
  from "../lib/afterPageLoad.js";


const MOBILE_QUERY =
  "(max-width: 47.999rem)";


const REDUCED_MOTION_QUERY =
  "(prefers-reduced-motion: reduce)";


/*
 * Economia de dados ou rede 2G: o vídeo
 * (4–9 MB) não vale o custo — o pôster
 * continua cobrindo o Hero.
 */
function prefersLightMedia() {
  const connection =
    navigator.connection;

  return Boolean(
    connection?.saveData ||
    /(^|-)2g$/.test(
      connection?.effectiveType ?? ""
    )
  );
}


/*
 * =========================================
 * STABLE INTRO VIEWPORT
 * =========================================
 *
 * Hero + Portfolio usam o mesmo
 * canvas vertical no mobile.
 *
 * A altura do canvas é capturada no início
 * e não muda quando apenas a altura da
 * viewport muda por causa da toolbar.
 *
 * A área extra visível é tratada
 * separadamente através de:
 *
 * --intro-viewport-extension
 */

function initStableIntroViewport(
  master
) {
  const mobileQuery =
    window.matchMedia(
      MOBILE_QUERY
    );


  let stableWidth =
    window.innerWidth;


  let stableHeight =
    0;


  let resizeFrame =
    0;


  const getViewportHeight =
    () => {
      return Math.round(
        window.visualViewport?.height ??
        window.innerHeight
      );
    };


  /*
   * A geometria estável vem do small viewport
   * do CSS, não do visualViewport transitório.
   * Isso evita uma captura errada enquanto
   * a toolbar do Safari ainda está assentando.
   */
  const getStableViewportHeight =
    () => {
      if (
        !window.CSS?.supports?.(
          "height",
          "100svh"
        )
      ) {
        return getViewportHeight();
      }

      const probe =
        document.createElement("div");

      probe.style.cssText =
        "position:fixed;inset:0 auto auto 0;width:1px;height:100svh;visibility:hidden;pointer-events:none;contain:strict;";

      document.documentElement
        .appendChild(probe);

      const height = Math.round(
        probe.getBoundingClientRect()
          .height
      );

      probe.remove();

      return height > 0
        ? height
        : getViewportHeight();
    };


  /*
   * =========================================
   * CLEAR
   * =========================================
   */

  const clearMeasurements =
    () => {
      master.style.removeProperty(
        "--intro-canvas-height"
      );


      master.style.removeProperty(
        "--intro-viewport-extension"
      );
    };


  /*
   * =========================================
   * VISUAL EXTENSION
   * =========================================
   *
   * Essa medida pode mudar com a toolbar.
   *
   * Ela NÃO participa do layout.
   */

  const updateExtension =
    () => {
      if (
        !mobileQuery.matches ||
        stableHeight <= 0
      ) {
        master.style.removeProperty(
          "--intro-viewport-extension"
        );

        return;
      }


      const currentHeight =
        getViewportHeight();


      const extension =
        Math.max(
          0,
          currentHeight -
          stableHeight
        );


      master.style.setProperty(
        "--intro-viewport-extension",
        `${extension}px`
      );
    };


  /*
   * =========================================
   * STABLE GEOMETRY
   * =========================================
   *
   * Essa medida só deve mudar quando
   * existe uma mudança REAL de viewport.
   */

  const captureGeometry =
    () => {
      if (
        !mobileQuery.matches
      ) {
        stableWidth =
          window.innerWidth;


        stableHeight =
          0;


        clearMeasurements();


        return;
      }


      stableWidth =
        window.innerWidth;


      stableHeight =
        getStableViewportHeight();


      master.style.setProperty(
        "--intro-canvas-height",
        `${stableHeight}px`
      );


      updateExtension();
    };


  /*
   * =========================================
   * RESIZE
   * =========================================
   */

  const handleResize =
    () => {
      cancelAnimationFrame(
        resizeFrame
      );


      resizeFrame =
        requestAnimationFrame(
          () => {
            const currentWidth =
              window.innerWidth;


            /*
             * Desktop não utiliza
             * o canvas mobile congelado.
             */

            if (
              !mobileQuery.matches
            ) {
              stableWidth =
                currentWidth;


              stableHeight =
                0;


              clearMeasurements();


              return;
            }


            /*
             * =================================
             * TOOLBAR / KEYBOARD
             * =================================
             *
             * A altura muda,
             * mas a largura permanece
             * praticamente igual.
             *
             * Portanto:
             *
             * canvas continua igual;
             * extensão visual é atualizada.
             */

            if (
              Math.abs(
                currentWidth -
                stableWidth
              ) < 20
            ) {
              updateExtension();


              return;
            }


            /*
             * =================================
             * REAL VIEWPORT CHANGE
             * =================================
             *
             * Mudança significativa de largura:
             *
             * portrait → landscape
             * landscape → portrait
             */

            captureGeometry();
          }
        );
    };


  /*
   * Primeira captura.
   */

  captureGeometry();


  window.addEventListener(
    "resize",
    handleResize,
    {
      passive: true,
    }
  );


  window.visualViewport
    ?.addEventListener(
      "resize",
      handleResize
    );


  /*
   * =========================================
   * PUBLIC API
   * =========================================
   */

  return {
    updateExtension,


    cleanup() {
      cancelAnimationFrame(
        resizeFrame
      );


      window.removeEventListener(
        "resize",
        handleResize
      );


      window.visualViewport
        ?.removeEventListener(
          "resize",
          handleResize
        );


      clearMeasurements();
    },
  };
}


/*
 * =========================================
 * HERO VIDEO PLAYBACK
 * =========================================
 */

function initHeroVideoPlayback(
  video
) {
  if (
    !(
      video instanceof
      HTMLVideoElement
    )
  ) {
    return () => { };
  }


  let destroyed =
    false;


  /*
   * Depois que o Hero sai da tela, o vídeo
   * fica pausado para não disputar CPU/GPU
   * com o scroll do restante da página.
   */
  let isInView =
    true;


  /*
   * =========================================
   * RESPONSIVE SOURCE
   * =========================================
   *
   * O HTML não possui mais <source>.
   *
   * Escolhemos UMA única mídia somente depois
   * que o JavaScript já conhece a viewport real.
   * Isso impede o preload scanner de considerar
   * simultaneamente os vídeos mobile e desktop.
   */

  const isMobile =
    window.matchMedia(
      MOBILE_QUERY
    ).matches;


  const source =
    isMobile
      ? video.dataset.mobileSrc
      : video.dataset.desktopSrc;


  const media =
    video.closest(
      ".hero-media"
    );


  const markPlaying =
    () => {
      video.dataset.playback =
        "playing";

      media?.classList.add(
        "is-video-playing"
      );
    };


  const markBlocked =
    () => {
      video.dataset.playback =
        "blocked";

      media?.classList.remove(
        "is-video-playing"
      );
    };


  if (!source) {
    video.dataset.playback =
      "missing-source";

    return () => { };
  }


  video.dataset.playback =
    "deferred";


  /*
   * A URL entra no elemento apenas aqui, e só
   * depois do load: o vídeo é o maior arquivo
   * da página e não deve disputar banda com
   * fontes, JS e o pôster (LCP). Até lá o
   * pôster cobre o Hero.
   */

  let started =
    false;


  const startVideo =
    () => {
      video.src =
        source;


      /*
       * Reforçamos os requisitos
       * de autoplay também via JS.
       */

      video.autoplay =
        true;


      video.loop =
        true;


      video.muted =
        true;


      video.defaultMuted =
        true;


      video.controls =
        false;


      video.disablePictureInPicture =
        true;


      video.removeAttribute(
        "controls"
      );


      video.setAttribute(
        "disableRemotePlayback",
        ""
      );


      video.dataset.playback =
        "pending";


      video.playsInline =
        true;


      video.setAttribute(
        "muted",
        ""
      );


      video.setAttribute(
        "playsinline",
        ""
      );


      video.load();


      started =
        true;


      attemptPlay();
    };


  /*
   * =========================================
   * PLAY
   * =========================================
   */

  const attemptPlay =
    async () => {
      if (
        destroyed ||
        !started ||
        document.hidden ||
        !isInView
      ) {
        return false;
      }


      if (
        !video.paused &&
        !video.ended
      ) {
        markPlaying();


        return true;
      }


      try {
        await video.play();


        markPlaying();


        return true;
      } catch {
        /*
         * Safari/iOS pode bloquear autoplay.
         *
         * Não criamos loop infinito.
         * Apenas esperamos uma próxima
         * oportunidade legítima.
         */

        markBlocked();


        return false;
      }
    };


  /*
   * =========================================
   * EVENTS
   * =========================================
   */

  const handleUserGesture =
    () => {
      attemptPlay();
    };


  const handleVisibilityChange =
    () => {
      if (
        !document.hidden
      ) {
        attemptPlay();
      }
    };


  const handlePageShow =
    () => {
      attemptPlay();
    };


  const handleCanPlay =
    () => {
      attemptPlay();
    };


  const handlePlaying =
    () => {
      markPlaying();
    };


  /*
   * =========================================
   * VIEWPORT OBSERVER
   * =========================================
   */

  let observer =
    null;


  if (
    "IntersectionObserver" in window
  ) {
    observer =
      new IntersectionObserver(
        (entries) => {
          const entry =
            entries[entries.length - 1];

          if (!entry) return;

          isInView =
            entry.isIntersecting;

          if (isInView) {
            attemptPlay();

            return;
          }

          /*
           * Totalmente fora da viewport:
           * pausa mantendo o frame atual.
           */
          if (!video.paused) {
            video.pause();
          }
        },

        {
          threshold:
            0,
        }
      );


    observer.observe(
      video
    );
  }


  window.addEventListener(
    "pointerdown",
    handleUserGesture,
    {
      passive: true,
    }
  );


  window.addEventListener(
    "pageshow",
    handlePageShow
  );


  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );


  video.addEventListener(
    "canplay",
    handleCanPlay
  );


  video.addEventListener(
    "playing",
    handlePlaying
  );


  const cancelStart =
    prefersLightMedia()
      ? () => { }
      : afterPageLoad(
        startVideo
      );


  /*
   * =========================================
   * CLEANUP
   * =========================================
   */

  return () => {
    if (
      destroyed
    ) {
      return;
    }


    destroyed =
      true;


    cancelStart();


    observer?.disconnect();


    window.removeEventListener(
      "pointerdown",
      handleUserGesture
    );


    window.removeEventListener(
      "pageshow",
      handlePageShow
    );


    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    video.removeEventListener(
      "canplay",
      handleCanPlay
    );


    video.removeEventListener(
      "playing",
      handlePlaying
    );


    media?.classList.remove(
      "is-video-playing"
    );


    video.pause();

    video.removeAttribute(
      "src"
    );

    video.load();


    delete video.dataset.playback;
  };
}


/*
 * =========================================
 * ELEMENTS
 * =========================================
 */


/*
 * =========================================
 * ELEMENTS
 * =========================================
 */

function getExperienceElements(master) {
  const heroPanel = master.querySelector(
    "[data-intro-hero-panel]"
  );

  const heroStage = master.querySelector(
    "[data-hero-stage]"
  );

  const heroVideo = master.querySelector(
    "[data-hero-video]"
  );

  const heroContent = master.querySelector(
    "[data-hero-content]"
  );

  const heroItems = [
    ...master.querySelectorAll(
      "[data-hero-item]"
    ),
  ];

  const overlay = master.querySelector(
    "[data-hero-overlay]"
  );

  const portfolioIntro = master.querySelector(
    "[data-portfolio-intro]"
  );

  const portfolioStage = master.querySelector(
    "[data-portfolio-stage]"
  );

  const portfolioViewport = master.querySelector(
    "[data-portfolio-viewport]"
  );

  const portfolioGrid = master.querySelector(
    "[data-portfolio-grid]"
  );

  const requiredElements = [
    heroPanel,
    heroStage,
    heroContent,
    overlay,
    portfolioIntro,
    portfolioStage,
    portfolioViewport,
    portfolioGrid,
  ];

  const hasMissingElement = requiredElements.some(
    (element) => !(element instanceof HTMLElement)
  );

  const hasMissingVideo = !(
    heroVideo instanceof HTMLVideoElement
  );

  if (
    hasMissingElement ||
    hasMissingVideo ||
    heroItems.length === 0
  ) {
    return null;
  }

  return {
    heroPanel,
    heroStage,
    heroVideo,
    heroContent,
    heroItems,
    overlay,
    portfolioIntro,
    portfolioStage,
    portfolioViewport,
    portfolioGrid,
  };
}


/*
 * =========================================
 * ENHANCED MODE
 * =========================================
 */

function enableEnhancedMode({
  master,
  heroStage,
  portfolioStage,
}) {
  master.classList.add(
    "is-enhanced",
    "is-viewport-active"
  );

  heroStage.classList.add(
    "is-enhanced"
  );

  portfolioStage.classList.add(
    "is-enhanced"
  );

  return () => {
    master.classList.remove(
      "is-enhanced",
      "is-viewport-active"
    );

    heroStage.classList.remove(
      "is-enhanced"
    );

    portfolioStage.classList.remove(
      "is-enhanced"
    );
  };
}


/*
 * =========================================
 * INTRO EXPERIENCE
 * =========================================
 */

export function initIntroExperience() {
  const master = document.querySelector(
    "[data-intro-master]"
  );

  if (!(master instanceof HTMLElement)) {
    return () => {};
  }

  const reducedMotion = window.matchMedia(
    REDUCED_MOTION_QUERY
  );

  if (reducedMotion.matches) {
    return () => {};
  }

  const elements = getExperienceElements(
    master
  );

  if (!elements) {
    return () => {};
  }

  const {
    heroPanel,
    heroStage,
    heroVideo,
    heroContent,
    heroItems,
    overlay,
    portfolioIntro,
    portfolioStage,
    portfolioViewport,
    portfolioGrid,
  } = elements;

  const stableViewport =
    initStableIntroViewport(master);

  const disableEnhancedMode =
    enableEnhancedMode({
      master,
      heroStage,
      portfolioStage,
    });

  const cleanupHeroVideo =
    initHeroVideoPlayback(heroVideo);

  const getPortfolioDistance = () => {
    const viewportHeight =
      portfolioViewport.clientHeight;

    const gridHeight =
      portfolioGrid.scrollHeight;

    return -Math.max(
      0,
      gridHeight - viewportHeight
    );
  };

  const getScrollDistance = () => {
    const canvasHeight = Math.max(
      master.clientHeight,
      1
    );

    const galleryTravel = Math.abs(
      getPortfolioDistance()
    );

    /*
     * O Hero mantém praticamente a mesma quantidade
     * de scroll percebida da versão anterior.
     *
     * O Portfolio, porém, não deve consumir várias telas
     * para deslocar poucos pixels. Essa proporção menor
     * deixa o grid mais responsivo sem torná-lo brusco.
     */
    const heroDistance =
      canvasHeight * 2.5;

    const portfolioDistance = Math.max(
      canvasHeight * 1.65,
      galleryTravel * 1.08
    );

    return Math.round(
      heroDistance + portfolioDistance
    );
  };

  const isMobile = window.matchMedia(
    MOBILE_QUERY
  ).matches;

  const context = gsap.context(
    () => {
      gsap.set(heroContent, {
        y: 0,
        clipPath: "inset(0% 0% 0% 0%)",
      });

      gsap.set(heroItems, {
        autoAlpha: 0,
        y: 20,
        clipPath: "inset(100% 0% 0% 0%)",
      });

      gsap.set(portfolioIntro, {
        autoAlpha: 0,
        y: 20,
        clipPath: "inset(100% 0% 0% 0%)",
      });

      gsap.set(portfolioGrid, {
        y: 0,
        force3D: true,
      });

      const heroEntrance = gsap.to(
        heroItems,
        {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.2,
          stagger: 0.15,
          ease: "power2.out",
          paused: true,
        }
      );

      let heroEntranceStarted = false;

      const startHeroEntrance = () => {
        if (heroEntranceStarted) {
          return;
        }

        heroEntranceStarted = true;
        fontFallback.kill();
        heroEntrance.play(0);
      };

      const fontFallback = gsap.delayedCall(
        1.6,
        startHeroEntrance
      );

      if (document.fonts?.load) {
        Promise.allSettled([
          document.fonts.load(
            '300 1rem "Cormorant Garamond"'
          ),
          document.fonts.load(
            '400 1rem "Italianno"'
          ),
          document.fonts.load(
            '300 1rem "Montserrat"'
          ),
        ]).then(startHeroEntrance);
      } else {
        startHeroEntrance();
      }

      const timeline = gsap.timeline({
        defaults: {
          ease: "power2.inOut",
        },
        scrollTrigger: {
          trigger: master,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 10,
          onEnter: () => {
            master.classList.add(
              "is-viewport-active"
            );
            stableViewport.updateExtension();
          },
          onEnterBack: () => {
            master.classList.add(
              "is-viewport-active"
            );
            stableViewport.updateExtension();
          },
          onLeave: () => {
            master.classList.remove(
              "is-viewport-active"
            );
          },
        },
      });

      timeline
        .addLabel("heroExit", 0)
        .addLabel("portfolioReveal", 0.8)
        .addLabel("heroLeaves", 1.85)
        .addLabel("portfolioTextClose", 2.48)
        .addLabel("portfolioTravel", 2.8)
        .addLabel("portfolioEnd", 5.0);

      /* 01 — Texto principal sai. */
      timeline.to(
        heroContent,
        {
          y: -40,
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 1,
        },
        "heroExit"
      );

      /* 02 — Profundidade visual do Hero permanece igual. */
      timeline.to(
        heroVideo,
        isMobile
          ? {
              scale: 1.012,
              duration: 1,
              ease: "power2.inOut",
            }
          : {
              filter: "blur(7px)",
              scale: 1.025,
              duration: 1,
              ease: "power2.inOut",
            },
        "portfolioReveal"
      );

      timeline.to(
        overlay,
        {
          backgroundColor:
            "rgba(0, 0, 0, 0.30)",
          duration: 1,
          ease: "power2.inOut",
        },
        "portfolioReveal"
      );

      /* 03 — Texto 2 aparece. */
      timeline.to(
        portfolioIntro,
        {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1,
          ease: "power2.out",
        },
        "portfolioReveal"
      );

      /*
       * 04 — O Hero fecha a janela quase imediatamente
       * depois que SESSÕES termina de aparecer.
       *
       * O texto não sobe nem muda de escala: permanece
       * no centro até a fase final do fechamento.
       */
      timeline.to(
        heroPanel,
        {
          yPercent: -100,
          duration: 0.95,
          force3D: true,
        },
        "heroLeaves"
      );

      /*
       * 05 — Pouco antes da janela fechar por completo,
       * SESSÕES desaparece com o mesmo inset usado no
       * fechamento das imagens do antigo carrossel.
       */
      timeline.to(
        portfolioIntro,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.32,
          ease: "power3.inOut",
        },
        "portfolioTextClose"
      );

      /*
       * 06 — O Portfolio rola verticalmente dentro do
       * canvas estável. A seção nunca cresce com a toolbar;
       * apenas o grid interno é transladado.
       */
      timeline.to(
        portfolioGrid,
        {
          y: getPortfolioDistance,
          duration: 2.2,
          ease: "none",
          force3D: true,
        },
        "portfolioTravel"
      );

      timeline.set(
        portfolioGrid,
        {
          willChange: "auto",
        },
        "portfolioEnd"
      );
    },
    master
  );

  let destroyed = false;
  let refreshFrame = 0;

  const refresh = () => {
    if (
      destroyed ||
      window.scrollY > 2 ||
      ScrollTrigger.isScrolling()
    ) {
      return;
    }

    cancelAnimationFrame(refreshFrame);

    refreshFrame = requestAnimationFrame(
      () => {
        if (
          destroyed ||
          window.scrollY > 2 ||
          ScrollTrigger.isScrolling()
        ) {
          return;
        }

        ScrollTrigger.refresh();
      }
    );
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(refresh);
  }

  if (document.readyState === "complete") {
    refresh();
  } else {
    window.addEventListener(
      "load",
      refresh,
      { once: true }
    );
  }

  return () => {
    if (destroyed) {
      return;
    }

    destroyed = true;

    cancelAnimationFrame(refreshFrame);

    window.removeEventListener(
      "load",
      refresh
    );

    cleanupHeroVideo();
    context.revert();
    stableViewport.cleanup();
    disableEnhancedMode();
  };
}
