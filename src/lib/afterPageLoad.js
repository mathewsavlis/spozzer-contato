/*
 * Roda `callback` depois do evento load,
 * no primeiro momento ocioso do main thread
 * (ou em até `timeout` ms).
 *
 * Usado para trabalho que não pode disputar
 * banda/CPU com o caminho crítico — fontes,
 * pôster do Hero e entrada da Intro.
 *
 * Devolve uma função de cancelamento.
 */

export function afterPageLoad(
  callback,
  { timeout = 2000 } = {}
) {
  let cancelled = false;
  let idleId = null;
  let timeoutId = null;

  const invoke = () => {
    if (!cancelled) callback();
  };

  const schedule = () => {
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(
        invoke,
        { timeout }
      );
    } else {
      timeoutId = window.setTimeout(
        invoke,
        0
      );
    }
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener(
      "load",
      schedule,
      { once: true }
    );
  }

  return () => {
    cancelled = true;

    window.removeEventListener(
      "load",
      schedule
    );

    if (idleId !== null) {
      window.cancelIdleCallback?.(idleId);
    }

    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  };
}
