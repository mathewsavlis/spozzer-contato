/*
 * =========================================
 * CONVERSÃO "LEAD" DO META
 * =========================================
 *
 * No site com formulário, o GTM (GTM-PLDHFWZ2)
 * dispara o evento Lead do Pixel quando a URL
 * contém "obrigado" — ou seja, depois do envio.
 * Aqui não existe /obrigado: o clique no botão
 * do WhatsApp é a conversão, então o Lead sai
 * daqui, direto pelo fbq que o GTM carrega.
 *
 * Também empurramos `whatsapp_lead_click` no
 * dataLayer. Se um dia o Lead passar a ser
 * configurado no GTM com esse evento, remova a
 * chamada ao fbq abaixo — senão conta duas vezes.
 *
 * O GTM é carregado depois do load (BaseLayout),
 * então num clique muito precoce o fbq pode ainda
 * não existir: tentamos de novo por alguns segundos.
 */

const RETRY_INTERVAL_MS = 500;
const MAX_ATTEMPTS = 20;

let tracked = false;

export function trackWhatsappLead() {
  // Uma conversão por página, mesmo com cliques repetidos.
  if (tracked) return;
  tracked = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "whatsapp_lead_click",
  });

  let attempts = 0;

  const fire = () => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead");
      return;
    }

    attempts += 1;

    if (attempts < MAX_ATTEMPTS) {
      window.setTimeout(fire, RETRY_INTERVAL_MS);
    }
  };

  fire();
}
