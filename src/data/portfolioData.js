/*
 * =========================================
 * GRID DO PORTFOLIO
 * =========================================
 *
 * Cada foto declara sua célula no celular
 * (`mobile`, 2 colunas × 8 linhas) e no desktop
 * (`desktop`, 4 colunas × 4 linhas): [coluna,
 * linha inicial, quantas linhas ocupa].
 *
 * As colunas precisam somar a mesma altura para
 * o bloco terminar numa linha reta — 6 fotos
 * altas (2 linhas) + 4 baixas (1 linha) = 16
 * linhas = 2 × 8 ou 4 × 4. Ao trocar fotos,
 * mantenha essa conta.
 *
 *   Celular        Desktop
 *   [1][2]         [1][4][3][2]
 *   [1][3]         [1][5][3][8]
 *   [4][3]         [7][5][9][10]
 *   [5][6]         [7][6][9][10]
 *   [5][7]
 *   [8][7]
 *   [9][10]
 *   [9][10]
 *
 * As fotos baixas (1 linha) cortam retratos
 * verticais quase em quadrado: ficam nelas as
 * horizontais ou as que aguentam o recorte, e
 * `position` (object-position) mantém o rosto
 * dentro da célula.
 */
export const portfolioData = {
  eyebrow: "Diferentes mulheres. Diferentes histórias.",
  title: "SESSÕES",

  items: [
    {
      title: "YZE",
      image: "/assets/imgs/portfolio/yze.webp",
      mobile: [1, 1, 2],
      desktop: [1, 1, 2],
    },
    {
      title: "Cliente em sessão fotográfica",
      image: "/assets/imgs/portfolio/cliente-por-do-sol.webp",
      mobile: [2, 1, 1],
      desktop: [4, 1, 1],
    },
    {
      title: "Cliente em sessão fotográfica",
      image: "/assets/imgs/portfolio/cliente-quarto.webp",
      position: "66% 50%",
      mobile: [2, 2, 2],
      desktop: [3, 1, 2],
    },
    {
      title: "Cliente em sessão fotográfica",
      image: "/assets/imgs/portfolio/cliente-retrato.webp",
      position: "50% 72%",
      mobile: [1, 3, 1],
      desktop: [2, 1, 1],
    },
    {
      title: "ANDRESSA",
      image: "/assets/imgs/portfolio/andressa.webp",
      mobile: [1, 4, 2],
      desktop: [2, 2, 2],
    },
    {
      title: "Cliente em sessão fotográfica",
      image: "/assets/imgs/portfolio/cliente-banho.webp",
      position: "50% 25%",
      mobile: [2, 4, 1],
      desktop: [2, 4, 1],
    },
    {
      title: "Cliente em sessão fotográfica",
      image: "/assets/imgs/portfolio/cliente-mar.webp",
      mobile: [2, 5, 2],
      desktop: [1, 3, 2],
    },
    {
      /* ro_22 — pose horizontal, fica inteira na célula baixa. */
      title: "Cliente em sessão fotográfica",
      image: "/assets/imgs/portfolio/cliente-areia.webp",
      mobile: [1, 6, 1],
      desktop: [4, 2, 1],
    },
    {
      title: "KAMILA",
      image: "/assets/imgs/portfolio/cliente-lago.webp",
      mobile: [1, 7, 2],
      desktop: [3, 3, 2],
    },
    {
      title: "Cliente em sessão fotográfica",
      image: "/assets/imgs/portfolio/cliente-praia.webp",
      mobile: [2, 7, 2],
      desktop: [4, 3, 2],
    },
  ],
};
