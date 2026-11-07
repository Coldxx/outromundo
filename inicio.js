// Outro Mundo Otaku · página inicial (slide, painel, ofertas, destaques, amostra dos mais vendidos)
"use strict";
(() => {
  const { produtos, porAnime, esc, link, foto, brl, card, observa, reduz } = OMO;
  if (!produtos.length) return;

  // slide do topo: mais vendidos com desconto
  const noSlide = produtos.filter(p => p.off >= 15 && p.vn >= 1000).sort((a, b) => b.vn - a.vn).slice(0, 6);
  const slides = document.getElementById("slides"), pontos = document.getElementById("pontos");
  slides.innerHTML = noSlide.map((p, i) => `
    <a class="slide" href="${link(p.l)}" target="_blank" rel="noopener sponsored" aria-hidden="${i ? "true" : "false"}" ${i ? 'tabindex="-1"' : ""}>
      <div class="foto"><span class="tag top">${esc(p.a)}</span><span class="tag desc">-${p.off}%</span>
        <img src="${foto(p.img)}" alt="${esc(p.n)}" width="600" height="600" ${i ? 'loading="lazy"' : ""} referrerpolicy="no-referrer"></div>
      <h2>${esc(p.n)}</h2>
      <div class="linha-preco"><span class="preco">${brl(p.p)}</span><span class="antes">${brl(p.d)}</span></div>
      <span class="botao">Comprar na Shopee</span>
    </a>`).join("");
  pontos.innerHTML = noSlide.map((p, i) => `<button type="button" aria-label="Oferta ${i + 1}" aria-current="${!i}"></button>`).join("");
  let atual = 0, relogio = null;
  const vai = n => {
    atual = (n + noSlide.length) % noSlide.length;
    slides.style.transform = `translateX(${-atual * 100}%)`;
    slides.querySelectorAll(".slide").forEach((s, i) => { const ok = i === atual; s.setAttribute("aria-hidden", !ok); ok ? s.removeAttribute("tabindex") : s.setAttribute("tabindex", "-1"); });
    pontos.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-current", i === atual));
  };
  const roda = () => { if (!reduz) { clearInterval(relogio); relogio = setInterval(() => vai(atual + 1), 4500); } };
  const para = () => clearInterval(relogio);
  document.getElementById("prox").addEventListener("click", () => { vai(atual + 1); roda(); });
  document.getElementById("ant").addEventListener("click", () => { vai(atual - 1); roda(); });
  pontos.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { vai([...pontos.children].indexOf(b)); roda(); } });
  const caixa = document.querySelector(".slider");
  caixa.addEventListener("mouseenter", para); caixa.addEventListener("mouseleave", roda);
  caixa.addEventListener("focusin", para); caixa.addEventListener("focusout", roda);
  let x0 = null;
  caixa.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  caixa.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) { vai(atual + (dx < 0 ? 1 : -1)); roda(); } });
  document.addEventListener("visibilitychange", () => (document.hidden ? para() : roda()));
  roda();

  // painel da semana
  const melhor = (lista, ordem) => [...lista].sort(ordem)[0];
  const maisVendido = melhor(produtos, (a, b) => b.vn - a.vn);
  const maiorDesc = melhor(produtos.filter(p => p.vn >= 300), (a, b) => b.off - a.off);
  const maisBarato = melhor(produtos, (a, b) => a.p - b.p);
  const comDesc = produtos.filter(p => p.off > 0);
  const media = comDesc.reduce((s, p) => s + p.off, 0) / (comDesc.length || 1);
  const recorde = (rot, p, valor) => `<a class="recorde vidro surge" href="${link(p.l)}" target="_blank" rel="noopener sponsored">
    <img src="${foto(p.img, true)}" alt="" loading="lazy" referrerpolicy="no-referrer">
    <div><span>${rot}</span><b>${esc(p.n)}</b><em>${valor}</em></div></a>`;
  const ranking = Object.entries(porAnime).filter(([a]) => a !== "Vários").sort((a, b) => b[1] - a[1]);
  const maxA = ranking.length ? ranking[0][1] : 1;
  document.getElementById("painel-grade").innerHTML = `
    <div class="numero vidro surge"><span>Achadinhos na loja</span><strong>${produtos.length}</strong><small>${Object.keys(porAnime).length} categorias</small></div>
    <div class="numero vidro surge"><span>Desconto médio</span><strong>${Math.round(media)}%</strong><small>em ${comDesc.length} produtos com desconto</small></div>
    <div class="ranking vidro surge"><h3>Animes com mais achadinhos</h3><div class="barras">${ranking.map(([a, n]) =>
      `<a href="loja.html?a=${encodeURIComponent(a)}"><span>${esc(a)}</span><span class="trilha"><span class="enche" data-x="${(n / maxA).toFixed(3)}"></span></span><b>${n}</b></a>`).join("")}</div></div>
    ${recorde("Mais vendido", maisVendido, `${esc(maisVendido.v)} vendidos`)}
    ${recorde("Maior desconto", maiorDesc, `-${maiorDesc.off}% · ${brl(maiorDesc.p)}`)}
    ${recorde("Mais barato", maisBarato, brl(maisBarato.p))}
    <div class="numero vidro surge"><span>A partir de</span><strong>${brl(maisBarato.p)}</strong><small>com link direto na Shopee</small></div>`;
  const enche = new IntersectionObserver(ents => ents.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.querySelectorAll(".enche").forEach(e => e.style.setProperty("transform", `scaleX(${Number(e.dataset.x) || 0})`));
    enche.disconnect();
  }), { threshold: .3 });
  enche.observe(document.querySelector(".ranking"));

  // ofertas, action figures e amostra dos mais vendidos
  const trilho = document.getElementById("trilho");
  trilho.innerHTML = produtos.filter(p => p.off >= 20).sort((a, b) => b.off - a.off).slice(0, 16).map(p => card(p)).join("");
  document.querySelectorAll("[data-trilho]").forEach(b => b.addEventListener("click", () =>
    trilho.scrollBy({ left: Number(b.dataset.trilho) * trilho.clientWidth * .8, behavior: reduz ? "auto" : "smooth" })));
  const figuras = produtos.filter(p => /figure|boneco|figura|estátua/i.test(p.n)).sort((a, b) => b.vn - a.vn);
  document.getElementById("destaques").innerHTML = figuras.slice(0, 5).map(p => card(p)).join("");
  const usados = new Set(figuras.slice(0, 5));
  document.getElementById("vendidos").innerHTML = produtos.filter(p => !usados.has(p)).slice(0, 8).map((p, i) => card(p, i * 40)).join("");
  document.getElementById("chips").innerHTML = ranking.slice(0, 8).map(([a, n]) => `<a href="loja.html?a=${encodeURIComponent(a)}">${esc(a)} · ${n}</a>`).join("");
  observa();
})();
