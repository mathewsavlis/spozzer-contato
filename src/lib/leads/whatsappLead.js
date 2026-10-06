import { getAttribution } from "./attribution.js";
import { getVisitorId } from "../analytics/visitorId.js";


const API_URL =
  import.meta.env
    .PUBLIC_LEADS_API_URL
    ?.trim();

const STORAGE_KEY =
  "spozzer_whatsapp_request_id";

/*
 * Precisa coincidir com WHATSAPP_FORM_NAME
 * no Worker (byspozzer-api) — é o que faz
 * o Worker aceitar um lead sem e-mail,
 * telefone e mensagem.
 */
const FORM_NAME =
  "whatsapp_sthefani_pozzer";

/*
 * O navegador não tem acesso ao nome nem
 * ao número do WhatsApp de quem clica — o
 * link wa.me só abre o app. Esses dados
 * só chegam no WhatsApp da Sthefani quando
 * a pessoa envia a mensagem.
 *
 * O lead do clique guarda o que existe
 * aqui: dispositivo/navegador, UTMs,
 * visitorId e horário. A mensagem que a
 * pessoa envia é limpa, sem nenhum código.
 */


function createRequestId() {
  if (
    typeof globalThis.crypto
      ?.randomUUID === "function"
  ) {
    return globalThis.crypto
      .randomUUID();
  }

  /*
   * Compatível com a validação do Worker:
   * /^[a-zA-Z0-9-]{20,80}$/
   */
  return [
    "whatsapp",
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 12),
    Math.random()
      .toString(36)
      .slice(2, 12),
  ].join("-");
}


/*
 * =========================================
 * IDENTIDADE DO NAVEGADOR
 * =========================================
 *
 * Substitui o nome enquanto a conversa não
 * chega: dispositivo + navegador, o que já
 * separa por exemplo "iPhone · Instagram"
 * (anúncio) de "Windows · Chrome".
 *
 * A ordem dos testes importa: navegadores
 * embutidos (Instagram, Facebook, TikTok)
 * também se anunciam como Safari/Chrome.
 */

function detectDevice(userAgent) {
  if (/iPhone/.test(userAgent)) {
    return "iPhone";
  }

  if (
    /iPad/.test(userAgent) ||
    (
      /Macintosh/.test(userAgent) &&
      navigator.maxTouchPoints > 1
    )
  ) {
    return "iPad";
  }

  if (/Android/.test(userAgent)) {
    return "Android";
  }

  if (/Windows/.test(userAgent)) {
    return "Windows";
  }

  if (/Macintosh/.test(userAgent)) {
    return "Mac";
  }

  if (/CrOS/.test(userAgent)) {
    return "Chromebook";
  }

  if (/Linux/.test(userAgent)) {
    return "Linux";
  }

  return "Dispositivo";
}


function detectBrowser(userAgent) {
  const browsers = [
    [/Instagram/, "Instagram"],
    [/FBAN|FBAV|FB_IAB/, "Facebook"],
    [/TikTok|musical_ly|BytedanceWebview/, "TikTok"],
    [/SamsungBrowser/, "Samsung Internet"],
    [/EdgA?\/|EdgiOS/, "Edge"],
    [/OPR\/|Opera/, "Opera"],
    [/Firefox|FxiOS/, "Firefox"],
    [/CriOS|Chrome\//, "Chrome"],
    [/Safari/, "Safari"],
  ];

  for (
    const [
      pattern,
      label,
    ] of browsers
  ) {
    if (pattern.test(userAgent)) {
      return label;
    }
  }

  return "Navegador";
}


function getBrowserIdentity() {
  const userAgent =
    navigator.userAgent || "";

  return `${detectDevice(userAgent)} · ${detectBrowser(userAgent)}`;
}


/*
 * =========================================
 * MENSAGEM
 * =========================================
 */

export const WHATSAPP_MESSAGE =
  [
    "Olá, Sthefani!",
    "",
    "Quero saber sobre minha sessão.",
  ].join("\n");


export function buildWhatsappUrl(
  phone,
  message
) {
  return `https://wa.me/${
    phone.replace(/\D/g, "")
  }?text=${
    encodeURIComponent(message)
  }`;
}


/*
 * =========================================
 * LEAD DO CLIQUE
 * =========================================
 *
 * Um lead por aba: cliques repetidos
 * reaproveitam o mesmo requestId
 * (sessionStorage), e o Worker descarta
 * o requestId repetido — a pessoa nunca
 * vira dois leads só por clicar duas vezes.
 */

function getClickRequestId() {
  try {
    const stored =
      sessionStorage.getItem(
        STORAGE_KEY
      );

    if (stored) {
      return stored;
    }
  } catch {
    // Storage indisponível — segue com um lead novo.
  }

  const requestId =
    createRequestId();

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      requestId
    );
  } catch {
    // Storage indisponível.
  }

  return requestId;
}


/*
 * Registra o lead. Precisa ser síncrono:
 * roda dentro do clique, antes do navegador
 * seguir o link.
 *
 * sendBeacon (text/plain, sem preflight)
 * sobrevive à troca de aba / abertura do
 * app do WhatsApp — o mesmo caminho que
 * session.js já usa para /events.
 */

export function registerWhatsappLead() {
  if (!API_URL) {
    return;
  }

  const payload = {
    requestId:
      getClickRequestId(),

    name:
      `Visitante · ${getBrowserIdentity()}`,

    email: "",
    phone: "",

    message:
      WHATSAPP_MESSAGE,

    website: "",

    form_name:
      FORM_NAME,

    ...getAttribution(),

    visitorId:
      getVisitorId(),
  };

  try {
    navigator.sendBeacon(
      API_URL,
      JSON.stringify(payload)
    );
  } catch {
    // Envio best-effort — nunca bloqueia a ida ao WhatsApp.
  }
}
