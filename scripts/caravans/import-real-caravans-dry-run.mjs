const candidates = [
  ["Tailândia, Camboja e Vietnã — Festival das Lanternas", "tailandia-camboja-vietna-festival-lanternas", "Novembro de 2026", "US$ 6.726", "https://leehovturismo.com.br/caravana-para-tailandia-camboja-e-vietna-festival-das-lanternas/"],
  ["África do Sul", "africa-do-sul", "3 a 13 de agosto de 2026", "US$ 6.011", "https://leehovturismo.com.br/caravana-para-africa-do-sul/"],
  ["Marrocos", "marrocos", "Outubro de 2026", "€ 3.266", "https://leehovturismo.com.br/caravana-para-marrocos/"],
  ["Japão — Outono", "japao-outono", "Outubro de 2026", "R$ 50.500,00", "https://leehovturismo.com.br/caravana-japao-outono-2026/"],
  ["Segredos de Israel", "segredos-de-israel", "Dezembro de 2026", "US$ 6.525", "https://leehovturismo.com.br/caravana-segredos-de-israel-dezembro-2026/"],
  ["Leste Europeu", "leste-europeu", "Outubro de 2026", "€ 6.595", "https://leehovturismo.com.br/caravana-leste-europeu-outubro-2026/"],
  ["Finlândia, Estônia e Noruega", "finlandia-estonia-noruega", "2027 — mês a confirmar", "€ 10.420,00", "https://leehovturismo.com.br/caravana-finlandia-estonia-e-noruega-2027/"],
  ["China e Singapura", "china-e-singapura", "Novembro de 2026", "US$ 7.142", "https://leehovturismo.com.br/caravana-china-e-singapura/"],
  ["Egito Fabuloso", "egito-fabuloso", "Data flexível — confirmar", "US$ 3.117,45", "https://leehovturismo.com.br/caravana-egito-fabuloso-saida-todos-meses/"],
  ["Egito, Jordânia e Israel", "egito-jordania-israel", "Data flexível — confirmar", "US$ 7.800", "https://leehovturismo.com.br/egito-jordania-e-israel-16-dias-e-15-noites/"],
  ["Turquia — Sete Igrejas", "turquia-sete-igrejas", "Novembro de 2026", "R$ 22.900,00", "https://leehovturismo.com.br/caravana-para-turquia/"],
].map(([title, slug, departureLabel, price, sourceUrl]) => ({
  title,
  slug,
  departureLabel,
  price,
  sourceUrl,
  published: false,
  featuredHome: false,
  featuredHero: false,
  status: "draft",
}));

if (process.argv.includes("--apply")) {
  console.error("Este utilitário é exclusivamente dry-run. Nenhuma gravação remota é permitida.");
  process.exit(2);
}

const slugs = new Set(candidates.map((candidate) => candidate.slug));
if (slugs.size !== candidates.length) {
  console.error("Dry-run inválido: há slugs duplicados.");
  process.exit(1);
}

console.log(JSON.stringify({
  mode: "dry-run",
  writesPerformed: 0,
  totalCandidates: candidates.length,
  defaults: { published: false, status: "draft", featuredHome: false, featuredHero: false },
  warnings: [
    "Datas, valores, vagas, líderes, inclusos e autorização de imagens precisam de validação comercial.",
    "Nenhum dado [DEV] será removido ou substituído por este utilitário.",
    "Roteiros, imagens e demais campos editoriais ainda precisam de curadoria antes de qualquer importação autorizada.",
  ],
  candidates,
}, null, 2));
