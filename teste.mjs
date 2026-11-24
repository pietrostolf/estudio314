// node teste.mjs : confere a conta da calculadora e a mensagem do WhatsApp.
import assert from "node:assert/strict";
import { tamanhoMolde, linhas, mensagem } from "./js/loja.js";

assert.equal(tamanhoMolde(88, 12).toFixed(1), "100.0");
assert.equal((tamanhoMolde(1, 12) - 1).toFixed(3), "0.136"); // os +13,6% do catálogo

const cat = { produtos: [
  { id: "kit-natal", nome: "Kit Natal", variantes: [{ id: "par", nome: "1 desenho", preco: 19.9 }] },
  { id: "carimbo", nome: "Carimbo", personalizado: true, variantes: [{ id: "a", nome: "Até 4 cm", preco: 49 }] },
] };
const ls = linhas([
  { id: "kit-natal", variante: "par", qtd: 2, obs: "estrela" },
  { id: "carimbo", variante: "a", qtd: 1, opcoes: { cabo: "Bulbo" } },
  { id: "sumiu", variante: "x", qtd: 1 },
], cat);
assert.equal(ls.length, 2);
const m = mensagem(ls, { entrega: "correios", cep: "89200-000", nome: "Ana" });
assert.match(m, /2× Kit Natal — 1 desenho \(obs\.: estrela\): R\$\s?39,80/);
assert.match(m, /cabo: Bulbo/);
assert.match(m, /Total das peças: R\$\s?88,80 \(carimbo personalizado: a partir de\)/);
assert.match(m, /CEP 89200-000/);
assert.match(mensagem(ls, { entrega: "retirada" }), /retiro em Joinville/);
console.log("ok\n" + m);
