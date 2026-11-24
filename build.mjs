// Gera as páginas do site a partir de catalogo.json.
// Uso: node build.mjs   (rode de novo sempre que mudar catalogo.json)
// Saída: index.html, produto/<id>/index.html, calculadora-de-encolhimento/index.html, js/catalogo.js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const cat = JSON.parse(readFileSync(new URL("./catalogo.json", import.meta.url), "utf8"));
const SITE = "https://estudio314.com.br";
const WHATS = "5547991067565";

// Prazos do Natal (confirmados pelo Pietro em 24/11/2026). Aparecem na home, nas páginas de Natal e no carrinho.
const NATAL = { pac: "7/12", sedex: "14/12", retirada: "22/12" };
// Carimbo personalizado: 3 dias úteis antes, por causa da prévia (regra do Pietro, 24/11/2026).
const NATAL_CARIMBO = { pac: "2/12", sedex: "9/12", retirada: "17/12" };
const PRAZO_PADRAO = 3; // dias úteis para produzir quando o produto não diz (Pietro, 24/11/2026: 3 para todos)

// Fotos de cada produto (o catálogo não tem): principal, extras e a foto de cada variante.
const FOTOS = {
  "carimbo-personalizado": {
    fotos: [
      ["carimbo-personalizado", "Carimbo com assinatura em relevo e cabo encaixado, impresso em PLA claro"],
      ["carimbo-personalizado-marca", "A marca que o carimbo deixa na argila"],
      ["carimbo-personalizado-costas", "Carimbo visto por trás, com o cabo"],
    ],
  },
  "kit-natal": {
    fotos: [
      ["kit-natal-kit7", "Os 7 cortadores de Natal com os carimbos que marcam o relevo"],
      ["kit-natal-par", "Um cortador de floco de neve com o carimbo"],
      ["kit-natal-resultado-mesa", "Enfeites de argila crua feitos com o kit, sobre uma mesa de madeira"],
      ["kit-natal-resultado-pendurados", "Enfeites de cerâmica pendurados por fitas"],
    ],
    variante: { par: "kit-natal-par", "kit-4": "kit-natal-kit7", "kit-7": "kit-natal-kit7" },
  },
  presepio: {
    fotos: [
      ["presepio-kit", "Os 8 cortadores do presépio e a fôrma do telhado"],
      ["presepio-resultado", "Presépio de cerâmica montado com o kit"],
    ],
  },
  casinha: {
    fotos: [
      ["casinha-duas-aguas", "Cortadores, carimbos de porta e janela e fôrma do telhado de duas águas"],
      ["casinha-quatro-aguas", "Kit da casinha com a fôrma do telhado de quatro águas"],
      ["casinha-resultado", "Prévia da casinha montada"],
    ],
    variante: { "duas-aguas": "casinha-duas-aguas", "quatro-aguas": "casinha-quatro-aguas" },
  },
  "gabaritos-alca": {
    fotos: [
      ["gabaritos-alca-kit11", "Os 11 gabaritos de alça em PLA claro"],
      ["gabaritos-alca-kit6", "Kit com 6 gabaritos de alça"],
    ],
    variante: { avulso: "gabaritos-alca-kit6", "kit-6": "gabaritos-alca-kit6", "kit-11": "gabaritos-alca-kit11" },
  },
};
const IMG = (n) => `/img/produtos/${n}.webp`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const precos = (p) => p.variantes.map((v) => v.preco);
const faixa = (p) => {
  const min = Math.min(...precos(p)), max = Math.max(...precos(p));
  if (p.personalizado) return `a partir de ${brl(min)}`;
  return min === max ? brl(min) : `${brl(min)} a ${brl(max)}`;
};
// Nome longo vira título curto + complemento: "Kit presépio de cerâmica (cortadores…)" -> título "Kit presépio de cerâmica".
// Nome longo vira título curto + complemento: "Kit presépio de cerâmica (cortadores…)".
const partesNome = (p) => { const m = p.nome.match(/^(.*) \((.*)\)$/); return m ? [m[1], m[2]] : [p.nome, ""]; };
const nomeTitulo = (p) => esc(partesNome(p)[0]);
const nomeExtra = (p) => partesNome(p)[1] ? `<p class="peca-extra">${esc(partesNome(p)[1][0].toUpperCase() + partesNome(p)[1].slice(1))}.</p>` : "";
const wa = (texto) => `https://wa.me/${WHATS}?text=${encodeURIComponent(texto)}`;

// Só o que é público vai para o navegador (o catálogo tem notas internas).
const publico = cat.produtos.map((p) => ({
  id: p.id, nome: p.nome, variantes: p.variantes, opcoes: p.opcoes || {},
  personalizado: !!p.personalizado, natal: !!p.natal,
  foto: IMG(FOTOS[p.id]?.fotos[0][0]), fotoVariante: Object.fromEntries(Object.entries(FOTOS[p.id]?.variante || {}).map(([k, v]) => [k, IMG(v)])),
}));

const cabeca = ({ titulo, descricao, caminho, imagem, jsonld }) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${SITE}${caminho}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Estúdio314">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${SITE}${caminho}">
<meta property="og:image" content="${SITE}${imagem}">
<meta name="theme-color" content="#3D0A12">
<link rel="icon" href="/icone.svg" type="image/svg+xml">
<link rel="preload" href="/fontes/AlbertSans-Regular.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="/css/loja.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<script src="/js/catalogo.js" defer></script>
<script src="/js/loja.js" type="module"></script>
</head>`;

const LOGO = (cor) => `<a class="marca" href="/" aria-label="Estúdio314, página inicial"><img src="/img/marca/estudio314-horizontal-${cor}.svg" alt="" width="151" height="45"></a>`;
const BOTAO_CARRINHO = `<button class="botao-carrinho" type="button" data-abrir-carrinho aria-haspopup="dialog">Carrinho <span data-contagem>(0)</span></button>`;
const NAV = `<nav aria-label="Principal"><a href="/#pecas">Peças</a><a href="/calculadora-de-encolhimento/">Calculadora</a><a href="/#perguntas">Dúvidas</a></nav>`;

const CARRINHO = `
<dialog class="carrinho" id="carrinho" aria-labelledby="carrinho-titulo">
  <div class="carrinho-topo">
    <h2 id="carrinho-titulo">Seu pedido</h2>
    <button type="button" class="fechar" data-fechar-carrinho>Fechar</button>
  </div>
  <p class="vazio" data-vazio>O carrinho está vazio. <a href="/#pecas">Ver as peças</a></p>
  <ul class="itens" data-itens></ul>
  <form class="fechar-pedido" data-fechar-pedido hidden>
    <p class="total">Total das peças <strong data-total>R$ 0,00</strong></p>
    <fieldset>
      <legend>Entrega</legend>
      <label><input type="radio" name="entrega" value="correios" checked> Correios, para todo o Brasil</label>
      <label><input type="radio" name="entrega" value="retirada"> Retirar em Joinville</label>
    </fieldset>
    <label class="campo" data-campo-cep>CEP para calcular o frete <input name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" spellcheck="false" placeholder="89200-000"></label>
    <label class="campo">Seu nome <input name="nome" autocomplete="name"></label>
    <button class="botao" type="submit">Fechar pedido no WhatsApp</button>
    <p class="nota">Abre o WhatsApp com o pedido escrito. Frete e pagamento a gente combina por lá. Natal: Correios PAC até ${NATAL.pac}, SEDEX até ${NATAL.sedex}, retirada até ${NATAL.retirada}. Carimbo personalizado: PAC até ${NATAL_CARIMBO.pac}, SEDEX até ${NATAL_CARIMBO.sedex}, retirada até ${NATAL_CARIMBO.retirada}.</p>
  </form>
</dialog>`;

const RODAPE = `
<footer class="rodape">
  <p class="rodape-314" aria-hidden="true">314</p>
  <div class="rodape-texto">
    <p class="rodape-assina">Estúdio314</p>
    <p>Ferramentas para cerâmica, impressas em 3D em Joinville, SC. Só imprimimos depois do pedido.</p>
    <ul>
      <li><a href="${wa("Oi! Vim pelo site do Estúdio314.")}">WhatsApp (47) 99106-7565</a></li>
      <li><a href="/calculadora-de-encolhimento/">Calculadora de encolhimento da argila</a></li>
      <li>Retirada em Joinville, SC</li>
    </ul>
    <p class="rodape-nota">O 314 é o π: o pi de Pietro, que faz aniversário em 14/3.</p>
  </div>
</footer>
${CARRINHO}
</body>
</html>
`;

const cabecalhoSimples = `<header class="barra">${LOGO("sangue")}${NAV}${BOTAO_CARRINHO}</header>`;

// ---------- calculadora (mesmo bloco na home e na página própria) ----------
const calculadora = (nivel = "h2") => `
<section class="calc" id="calculadora" aria-labelledby="calc-titulo">
  <div class="calc-texto">
    <${nivel} id="calc-titulo">Quanto a argila encolhe?</${nivel}>
    <p>A argila perde de 5 a 16% do tamanho entre o molde e a peça queimada. Diga o tamanho que a peça precisa ter no fim e o encolhimento da sua argila: a conta mostra o tamanho do molde.</p>
    <p class="calc-dica">Não sabe o encolhimento? Risque uma linha de 100 mm na placa crua e meça depois da queima: se deu 88 mm, a argila encolhe 12%. Em geral: terracota 5 a 8%, grés 10 a 13%, porcelana 12 a 16%.</p>
  </div>
  <form class="calc-form" data-calc>
    <div class="calc-entradas">
    <label>Tamanho final da peça <span class="entrada"><input name="final" type="number" inputmode="decimal" min="1" step="0.1" value="62" required> mm</span></label>
    <label>Encolhimento da argila <span class="entrada"><input name="pct" type="number" inputmode="decimal" min="0" max="40" step="0.1" value="12" required> %</span></label>
    </div>
    <output name="resultado" class="calc-resultado" aria-live="polite">
      <span class="calc-numero" data-molde>70,5 mm</span>
      <span data-detalhe>é o tamanho do molde. A peça encolhe 8,5 mm.</span>
    </output>
    <noscript><p>A conta: tamanho do molde = tamanho final ÷ (1 − encolhimento). Com 12%: tamanho final × 1,136.</p></noscript>
  </form>
</section>`;

// ---------- home ----------
const natalBand = `
<section class="natal" aria-labelledby="natal-titulo">
  <h2 id="natal-titulo">Para chegar antes do Natal</h2>
  <div class="natal-datas">
    <p><strong>${NATAL.pac}</strong> último dia para pedir com envio PAC</p>
    <p><strong>${NATAL.sedex}</strong> último dia com SEDEX</p>
    <p><strong>${NATAL.retirada}</strong> último dia para retirar em Joinville</p>
  </div>
  <p>Carimbo personalizado, por causa da prévia: PAC até ${NATAL_CARIMBO.pac}, SEDEX até ${NATAL_CARIMBO.sedex}, retirada até ${NATAL_CARIMBO.retirada}.</p>
  <p>Cada peça é impressa depois do pedido. A produção leva cerca de ${PRAZO_PADRAO} dias úteis; as datas já contam com isso.</p>
</section>`;

const linhaProduto = (p, i) => {
  const [foto, alt] = FOTOS[p.id].fotos[0];
  return `
  <li class="peca${i % 2 ? " peca-inversa" : ""}">
    <a class="peca-foto" href="/produto/${p.id}/" tabindex="-1" aria-hidden="true"><img src="${IMG(foto)}" alt="" width="1200" height="1200" loading="lazy"></a>
    <div class="peca-texto">
      <h3><a href="/produto/${p.id}/">${nomeTitulo(p)}</a></h3>${nomeExtra(p)}
      <p>${esc(p.resumo)}</p>
      <p class="peca-preco">${faixa(p)}</p>
      <ul class="peca-variantes">${p.variantes.map((v) => `<li>${esc(v.nome)} <span>${brl(v.preco)}</span></li>`).join("")}</ul>
      <a class="botao botao-claro" href="/produto/${p.id}/">Escolher${p.variantes.length > 1 ? " o tamanho" : ""}<span class="sr"> — ${esc(p.nome)}</span></a>
    </div>
  </li>`;
};

const passos = [
  ["kit-natal-par", "Você escolhe", "Monte o pedido no carrinho e mande pelo WhatsApp. Frete e pagamento combinamos por lá.", "recorte/kit-natal-par"],
  ["kit-natal-kit7", "Imprimimos o seu", "A impressora só liga depois do pedido. Carimbo personalizado ganha prévia antes.", "recorte/kit-natal-kit7"],
  ["kit-natal-resultado-mesa", "Você marca o barro", "Chega pelos Correios ou você retira em Joinville. Lave com água fria e use de novo.", "kit-natal-resultado-mesa"],
];

const perguntas = [
  ["Como faço o pedido?", "Escolha as peças, abra o carrinho e toque em “Fechar pedido no WhatsApp”. A mensagem vai pronta com os itens e o total; respondemos com o frete e a forma de pagamento."],
  ["Quanto tempo demora?", `Cada peça é impressa depois do pedido: cerca de ${PRAZO_PADRAO} dias úteis para produzir, mais o tempo dos Correios. Para o Natal, peça até ${NATAL.pac} (PAC) ou ${NATAL.sedex} (SEDEX); o carimbo personalizado, até ${NATAL_CARIMBO.pac} (PAC) ou ${NATAL_CARIMBO.sedex} (SEDEX).`],
  ["Serve para argila e cerâmica fria?", "Serve para argila, cerâmica fria, biscuit e massinha. As peças são de PLA: lave com água fria e sabão neutro. Não vão ao forno nem à lava-louças, porque o PLA amolece perto de 55 °C."],
  ["Por que o molde é maior que a peça?", `A argila encolhe ao secar e queimar. Nossos moldes já vêm 13,6% maiores, para a retração de 12% da maioria das argilas. Para outra argila, use a <a href="/calculadora-de-encolhimento/">calculadora</a>.`],
  ["Como mando o desenho do carimbo?", "Depois do pedido, mande a logo, a assinatura ou o desenho pelo WhatsApp. Mostramos a prévia espelhada e a marca no barro antes de imprimir. O traço precisa ter pelo menos 0,4 mm."],
  ["Entregam em todo o Brasil?", "Sim, pelos Correios. Em Joinville você também pode retirar a encomenda."],
];

const emBreve = cat.em_breve.map((e) => `<li><span class="eb-nome">${esc(e.nome)}</span> <span class="eb-preco">cerca de ${brl(e.preco_previsto)}</span></li>`).join("");

const home = `${cabeca({
  // TODO-SEO: trocar título e descrição quando SEO/palavras_chave.md existir
  titulo: "Estúdio314: carimbos, cortadores e moldes para cerâmica impressos em 3D",
  descricao: "Carimbo personalizado para cerâmica, cortadores de Natal, kit presépio, casinha e gabaritos de alça. Impressos em 3D em Joinville e enviados para todo o Brasil.",
  caminho: "/",
  imagem: IMG("kit-natal-kit7"),
  jsonld: { "@context": "https://schema.org", "@type": "Organization", name: "Estúdio314", url: SITE, logo: `${SITE}/icone.svg`, telephone: "+55-47-99106-7565", address: { "@type": "PostalAddress", addressLocality: "Joinville", addressRegion: "SC", addressCountry: "BR" } },
})}
<body class="home">
<a class="pular" href="#pecas">Pular para as peças</a>
<header class="heroi">
  <div class="heroi-painel">
    <div class="barra barra-escura">${LOGO("biscoito")}${NAV}${BOTAO_CARRINHO}</div>
  </div>
  <img class="heroi-objeto" src="/img/produtos/recorte/kit-natal-kit7.webp" alt="Os 7 cortadores e carimbos de Natal, impressos em PLA claro" width="1200" height="1200" fetchpriority="high">
  <div class="heroi-texto">
    <h1>Ferramentas para cerâmica, <span>impressas em 3D.</span></h1>
    <p>Carimbos, cortadores e moldes feitos em Joinville, só depois do seu pedido. Para o Natal, peça até ${NATAL.pac}.</p>
    <a class="botao" href="#pecas">Ver as 5 peças</a>
  </div>
</header>
<main>
<section class="pecas" id="pecas" aria-labelledby="pecas-titulo">
  <h2 id="pecas-titulo">As peças</h2>
  <ul class="lista-pecas">${cat.produtos.map(linhaProduto).join("")}
  </ul>
</section>
${natalBand}
${calculadora()}
<section class="passos" aria-labelledby="passos-titulo">
  <h2 id="passos-titulo">Do pedido ao barro</h2>
  <ol class="passos-lista">${passos.map(([, nome, texto, foto], i) => `
    <li class="passo passo-${i + 1}"><div class="passo-tile"><img src="${IMG(foto)}" alt="" width="1200" height="1200" loading="lazy"></div><h3>${nome}</h3><p>${texto}</p></li>`).join("")}
  </ol>
</section>
<section class="em-breve" aria-labelledby="eb-titulo">
  <h2 id="eb-titulo">Em breve</h2>
  <p>Desenhos nossos, em produção. Quer um deles antes? <a href="${wa("Oi! Quero saber quando sai um dos itens em breve do Estúdio314.")}">Avise no WhatsApp</a>.</p>
  <ul class="eb-lista">${emBreve}</ul>
</section>
<section class="perguntas" id="perguntas" aria-labelledby="perguntas-titulo">
  <h2 id="perguntas-titulo">Perguntas de quem mexe com barro</h2>
  <div class="perguntas-lista">${perguntas.map(([q, r]) => `
    <details><summary>${q}</summary><p>${r}</p></details>`).join("")}
  </div>
</section>
</main>
${RODAPE}`;

// ---------- produto ----------
const paginaProduto = (p) => {
  const f = FOTOS[p.id];
  const prazo = p.prazo_dias_uteis || PRAZO_PADRAO;
  const opcoes = Object.entries(p.opcoes || {});
  const jsonld = {
    "@context": "https://schema.org", "@type": "Product", name: p.nome, description: p.descricao,
    image: f.fotos.map(([n]) => SITE + IMG(n)), brand: { "@type": "Brand", name: "Estúdio314" },
    offers: { "@type": "AggregateOffer", priceCurrency: "BRL", lowPrice: Math.min(...precos(p)).toFixed(2), highPrice: Math.max(...precos(p)).toFixed(2), offerCount: p.variantes.length, availability: "https://schema.org/MadeToOrder", url: `${SITE}/produto/${p.id}/` },
  };
  return `${cabeca({
    // TODO-SEO: título e descrição do catálogo; trocar pelos do SEO quando existirem
    titulo: `${p.nome} | Estúdio314`,
    descricao: `${p.resumo} ${faixa(p).replace(/^./, (c) => c.toUpperCase())}. Impresso em 3D em Joinville, enviado para todo o Brasil.`,
    caminho: `/produto/${p.id}/`, imagem: IMG(f.fotos[0][0]), jsonld,
  })}
<body class="pagina-produto">
<a class="pular" href="#conteudo">Pular para o produto</a>
${cabecalhoSimples}
<main id="conteudo" class="produto">
  <div class="produto-fotos">
    <img class="produto-principal" data-foto-principal src="${IMG(f.fotos[0][0])}" alt="${esc(f.fotos[0][1])}" width="1200" height="1200">
    ${f.fotos.length > 1 ? `<ul class="produto-miniaturas" aria-label="Mais fotos">${f.fotos.map(([n, alt], i) => `<li><button type="button" data-foto="${IMG(n)}" data-alt="${esc(alt)}" aria-pressed="${i === 0}"><img src="${IMG(n)}" alt="${esc(alt)}" width="120" height="120" loading="lazy"></button></li>`).join("")}</ul>` : ""}
  </div>
  <div class="produto-info">
    <p class="volta"><a href="/#pecas">← Todas as peças</a></p>
    <h1>${nomeTitulo(p)}</h1>${nomeExtra(p)}
    <p class="produto-resumo">${esc(p.resumo)}</p>
    <form class="produto-form" data-produto="${p.id}">
      <fieldset class="variantes">
        <legend>${p.variantes.length > 1 ? "Escolha" : "Item"}</legend>
        ${p.variantes.map((v, i) => `<label><input type="radio" name="variante" value="${v.id}"${i === 0 ? " checked" : ""}> <span class="v-nome">${esc(v.nome)}</span> <span class="v-preco">${p.personalizado ? "a partir de " : ""}${brl(v.preco)}</span></label>`).join("\n        ")}
      </fieldset>
      ${opcoes.map(([nome, valores]) => `<fieldset class="opcao"><legend>${esc(nome[0].toUpperCase() + nome.slice(1))}</legend>${valores.map((v, i) => `<label><input type="radio" name="op-${esc(nome)}" value="${esc(v)}"${i === 0 ? " checked" : ""}> ${esc(v)}</label>`).join("")}</fieldset>`).join("\n      ")}
      <label class="campo">Observação <span class="campo-dica">${p.id === "kit-natal" ? "quais desenhos você quer" : p.personalizado ? "o que vai no carimbo (o desenho você manda no WhatsApp)" : "opcional"}</span><textarea name="obs" rows="2" maxlength="300"></textarea></label>
      <div class="comprar">
        <label class="qtd">Quantidade <input name="qtd" type="number" min="1" max="20" value="1" inputmode="numeric"></label>
        <p class="preco-atual" aria-live="polite" data-preco>${brl(p.variantes[0].preco)}</p>
      </div>
      <button class="botao" type="submit">Pôr no carrinho</button>
      <noscript><p><a href="${wa(`Oi! Quero o ${p.nome}.`)}">Pedir pelo WhatsApp</a></p></noscript>
    </form>
    <div class="produto-descricao">
      <h2>Como é</h2>
      <p>${esc(p.descricao)}</p>
      <p>Produção: ${prazo} dias úteis depois do pedido, mais o frete. ${p.natal ? `Para o Natal: Correios PAC até ${NATAL.pac}, SEDEX até ${NATAL.sedex}, retirada em Joinville até ${NATAL.retirada}.` : ""}${p.personalizado ? `Para o Natal, por causa da prévia: Correios PAC até ${NATAL_CARIMBO.pac}, SEDEX até ${NATAL_CARIMBO.sedex}, retirada em Joinville até ${NATAL_CARIMBO.retirada}.` : ""}</p>
      ${p.personalizado ? "<p>Depois do pedido, mande a logo ou o desenho pelo WhatsApp. O preço final depende do tamanho do desenho e vai na prévia.</p>" : ""}
    </div>
  </div>
</main>
${RODAPE}`;
};

// ---------- calculadora sozinha ----------
const paginaCalc = `${cabeca({
  titulo: "Calculadora de encolhimento da argila | Estúdio314",
  descricao: "Calcule o tamanho do molde a partir do tamanho final da peça e do encolhimento da sua argila. Grátis, direto no navegador.",
  caminho: "/calculadora-de-encolhimento/", imagem: IMG("kit-natal-resultado-mesa"),
  jsonld: { "@context": "https://schema.org", "@type": "WebApplication", name: "Calculadora de encolhimento da argila", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer navegador", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" }, url: `${SITE}/calculadora-de-encolhimento/` },
})}
<body class="pagina-calc">
<a class="pular" href="#calculadora">Pular para a calculadora</a>
${cabecalhoSimples}
<main>${calculadora("h1")}
<section class="calc-pecas"><h2>Moldes que já vêm na medida</h2><p>Nossos cortadores e moldes já saem 13,6% maiores, para argila de 12%. <a href="/#pecas">Ver as peças</a></p></section>
</main>
${RODAPE}`;

// ---------- grava ----------
const grava = (caminho, conteudo) => {
  const url = new URL(caminho, import.meta.url);
  mkdirSync(new URL(".", url), { recursive: true });
  writeFileSync(url, conteudo);
};
grava("./index.html", home);
for (const p of cat.produtos) grava(`./produto/${p.id}/index.html`, paginaProduto(p));
grava("./calculadora-de-encolhimento/index.html", paginaCalc);
grava("./js/catalogo.js", `// Gerado por build.mjs a partir de catalogo.json. Não edite à mão.\nwindow.CATALOGO = ${JSON.stringify({ produtos: publico, whats: WHATS, natal: NATAL })};\n`);

const urls = ["/", "/calculadora-de-encolhimento/", ...cat.produtos.map((p) => `/produto/${p.id}/`)];
grava("./sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
grava("./robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`ok: ${urls.length} páginas`);
