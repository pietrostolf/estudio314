// Carrinho (localStorage) que fecha o pedido no WhatsApp, formulário do produto e calculadora.
export const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const mm = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mm";

// Tamanho do molde para a peça chegar em `final` depois de encolher `pct` %.
export const tamanhoMolde = (final, pct) => final / (1 - pct / 100);

const CHAVE = "estudio314-carrinho";
export const chaveItem = (i) => [i.id, i.variante, JSON.stringify(i.opcoes || {}), i.obs || ""].join("|");

// Junta itens do catálogo com o carrinho; ignora o que saiu do catálogo.
export function linhas(itens, catalogo) {
  return itens.flatMap((i) => {
    const p = catalogo.produtos.find((x) => x.id === i.id);
    const v = p?.variantes.find((x) => x.id === i.variante);
    return p && v ? [{ ...i, produto: p, v, subtotal: v.preco * i.qtd }] : [];
  });
}

export function mensagem(ls, { entrega, cep, nome }) {
  const total = ls.reduce((s, l) => s + l.subtotal, 0);
  const itens = ls.map((l) => {
    const ops = Object.entries(l.opcoes || {}).map(([k, v]) => `${k}: ${v}`);
    const extra = [...ops, l.obs && `obs.: ${l.obs}`].filter(Boolean).join("; ");
    return `• ${l.qtd}× ${l.produto.nome} — ${l.v.nome}${extra ? ` (${extra})` : ""}: ${brl(l.subtotal)}`;
  });
  const temPerso = ls.some((l) => l.produto.personalizado);
  return [
    "Oi! Quero fazer este pedido no Estúdio314:",
    "",
    ...itens,
    "",
    `Total das peças: ${brl(total)}${temPerso ? " (carimbo personalizado: a partir de)" : ""}`,
    entrega === "retirada" ? "Entrega: retiro em Joinville" : `Entrega: Correios${cep ? `, CEP ${cep}` : ""}`,
    nome ? `Nome: ${nome}` : "",
  ].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n").trim();
}

if (typeof document !== "undefined") iniciar();

function iniciar() {
  const cat = window.CATALOGO;
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; } };
  const salvar = (itens) => { try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch {} desenhar(); };
  const dlg = document.getElementById("carrinho");

  function desenhar() {
    const ls = linhas(ler(), cat);
    const n = ls.reduce((s, l) => s + l.qtd, 0);
    document.querySelectorAll("[data-contagem]").forEach((e) => (e.textContent = `(${n})`));
    if (!dlg) return;
    dlg.querySelector("[data-vazio]").hidden = ls.length > 0;
    dlg.querySelector("[data-fechar-pedido]").hidden = ls.length === 0;
    dlg.querySelector("[data-total]").textContent = brl(ls.reduce((s, l) => s + l.subtotal, 0));
    const ul = dlg.querySelector("[data-itens]");
    ul.replaceChildren(...ls.map((l) => {
      const li = document.createElement("li");
      const ops = Object.values(l.opcoes || {}).join(", ");
      li.innerHTML = `<img src="${l.produto.fotoVariante[l.variante] || l.produto.foto}" alt="" width="72" height="72">
        <div class="item-texto"><p class="item-nome"></p><p class="item-var"></p></div>
        <div class="item-qtd"><button type="button" data-menos aria-label="Tirar um">−</button><span aria-live="polite">${l.qtd}</span><button type="button" data-mais aria-label="Pôr mais um">+</button></div>
        <p class="item-preco">${brl(l.subtotal)}</p>
        <button type="button" class="item-tirar" data-tirar>Tirar<span class="sr"> do carrinho</span></button>`;
      li.querySelector(".item-nome").textContent = l.produto.nome;
      li.querySelector(".item-var").textContent = [l.v.nome, ops, l.obs].filter(Boolean).join(" · ");
      const muda = (d) => {
        const itens = ler(), k = chaveItem(l);
        const it = itens.find((x) => chaveItem(x) === k);
        if (it) it.qtd = Math.max(0, Math.min(20, it.qtd + d));
        salvar(itens.filter((x) => x.qtd > 0));
      };
      li.querySelector("[data-menos]").onclick = () => muda(-1);
      li.querySelector("[data-mais]").onclick = () => muda(1);
      li.querySelector("[data-tirar]").onclick = () => muda(-l.qtd);
      return li;
    }));
  }

  document.querySelectorAll("[data-abrir-carrinho]").forEach((b) => (b.onclick = () => dlg.showModal()));
  dlg?.querySelector("[data-fechar-carrinho]").addEventListener("click", () => dlg.close());
  // Fecha só no fundo escuro: o painel tem 100dvh e um toque no vazio dele também tem target === dlg.
  dlg?.addEventListener("click", (e) => {
    const r = dlg.getBoundingClientRect();
    if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dlg.close();
  });

  const fp = dlg?.querySelector("[data-fechar-pedido]");
  fp?.addEventListener("change", () => { fp.querySelector("[data-campo-cep]").hidden = fp.entrega.value === "retirada"; });
  fp?.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = mensagem(linhas(ler(), cat), { entrega: fp.entrega.value, cep: fp.cep.value.trim(), nome: fp.nome.value.trim() });
    window.open(`https://wa.me/${cat.whats}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  });

  // Página de produto
  const pf = document.querySelector("[data-produto]");
  if (pf) {
    const p = cat.produtos.find((x) => x.id === pf.dataset.produto);
    const principal = document.querySelector("[data-foto-principal]");
    const mostra = (src, alt) => {
      principal.src = src; if (alt) principal.alt = alt;
      document.querySelectorAll("[data-foto]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.foto === src));
    };
    const atual = () => {
      const v = p.variantes.find((x) => x.id === pf.variante.value);
      const q = Math.max(1, Math.min(20, parseInt(pf.qtd.value) || 1));
      pf.querySelector("[data-preco]").textContent = (p.personalizado ? "a partir de " : "") + brl(v.preco * q);
      return { v, q };
    };
    pf.addEventListener("input", atual);
    pf.addEventListener("change", (e) => {
      const src = e.target.name === "variante" && p.fotoVariante[e.target.value];
      if (src) mostra(src, document.querySelector(`[data-foto="${src}"]`)?.dataset.alt);
      if (e.target.name === "qtd") pf.qtd.value = atual().q;
    });
    atual(); // preço certo já ao abrir (e com o formulário que o Voltar do navegador restaura)
    document.querySelectorAll("[data-foto]").forEach((b) => (b.onclick = () => mostra(b.dataset.foto, b.dataset.alt)));
    pf.addEventListener("submit", (e) => {
      e.preventDefault();
      const { v, q } = atual();
      const opcoes = Object.fromEntries(Object.keys(p.opcoes).map((k) => [k, pf[`op-${k}`].value]));
      const novo = { id: p.id, variante: v.id, opcoes, obs: pf.obs.value.trim(), qtd: q };
      const itens = ler(), k = chaveItem(novo);
      const it = itens.find((x) => chaveItem(x) === k);
      if (it) it.qtd = Math.min(20, it.qtd + q); else itens.push(novo);
      salvar(itens);
      pf.obs.value = "";
      dlg.showModal();
    });
  }

  // Calculadora
  const cf = document.querySelector("[data-calc]");
  if (cf) {
    const conta = () => {
      const final = parseFloat(cf.final.value.replace(",", ".")), pct = parseFloat(cf.pct.value.replace(",", "."));
      const ok = final > 0 && pct >= 0 && pct < 40;
      cf.querySelector("[data-molde]").textContent = ok ? mm(tamanhoMolde(final, pct)) : "—";
      cf.querySelector("[data-detalhe]").textContent = ok
        ? `é o tamanho do molde. A peça encolhe ${mm(tamanhoMolde(final, pct) - final)}.`
        : "Use um tamanho maior que zero e encolhimento entre 0 e 40%.";
    };
    cf.addEventListener("input", conta);
    cf.addEventListener("submit", (e) => e.preventDefault());
    conta();
  }

  // Entrada das seções (só com movimento permitido; sem script tudo já aparece)
  if (matchMedia("(prefers-reduced-motion: no-preference)").matches && "IntersectionObserver" in window) {
    const alvos = document.querySelectorAll("main section > h2, main section > p, .lista-pecas > li > *, .natal-datas > p, .calc > *, .passos-lista > li, .eb-lista > li, .perguntas details, .produto > *");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    alvos.forEach((a) => { if (a.getBoundingClientRect().top > innerHeight) { a.classList.add("entra"); io.observe(a); } });
  }

  window.addEventListener("storage", (e) => e.key === CHAVE && desenhar());
  desenhar();
}
