// Outro Mundo Otaku · código comum do início e da loja.
// Segurança: só aceita link curto da Shopee (s.shopee.com.br/<código>) e foto do servidor da Shopee.
// Qualquer produto com link ou foto fora desse formato é descartado antes de aparecer na tela.
"use strict";
document.documentElement.classList.add("js");

// não deixa outro site abrir a vitrine dentro de um quadro (golpe de clique por cima)
if (window.top !== window.self) { try { window.top.location.replace(window.self.location.href); } catch (e) { document.documentElement.style.display = "none"; } }

const OMO = (() => {
  const CODIGO = /^[A-Za-z0-9]{5,14}$/;
  const FOTO = /^[A-Za-z0-9-]{10,64}$/;
  const brutos = Array.isArray(window.PRODUTOS) ? window.PRODUTOS : [];
  const produtos = brutos
    .filter(p => p && CODIGO.test(p.l) && FOTO.test(p.img) && typeof p.p === "number" && p.p > 0 && typeof p.n === "string")
    .map((p, i) => ({
      n: p.n.slice(0, 120), p: p.p, d: typeof p.d === "number" && p.d > p.p ? p.d : 0,
      v: String(p.v || "").slice(0, 12), vn: Number(p.vn) || 0, img: p.img, a: String(p.a || "Vários").slice(0, 30), l: p.l,
      rank: i, off: p.d > p.p ? Math.round((1 - p.p / p.d) * 100) : 0,
    }));
  Object.freeze(produtos);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = l => (CODIGO.test(l) ? "https://s.shopee.com.br/" + l : "#");
  const foto = (h, mini) => (FOTO.test(h) ? "https://down-br.img.susercontent.com/file/" + h + (mini ? "_tn" : "") : "img/icone.png");
  const brl = v => "R$ " + v.toFixed(2).replace(".", ",");
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const porAnime = {};
  produtos.forEach(p => (porAnime[p.a] = (porAnime[p.a] || 0) + 1));

  const card = (p, atraso = 0) => `
    <a class="card vidro surge" data-atraso="${atraso}" href="${link(p.l)}" target="_blank" rel="noopener sponsored">
      <div class="foto">${p.off >= 10 ? `<span class="tag desc">-${p.off}%</span>` : ""}
        <img src="${foto(p.img, true)}" alt="${esc(p.n)}" loading="lazy" width="300" height="300" referrerpolicy="no-referrer"></div>
      <span class="anime">${esc(p.a)}</span>
      <h3 class="nome">${esc(p.n)}</h3>
      <div class="linha-preco"><span class="preco">${brl(p.p)}</span>${p.d ? `<span class="antes">${brl(p.d)}</span>` : ""}</div>
      <span class="vendidos">${esc(p.v)} vendidos</span>
      <span class="comprar">Comprar na Shopee</span>
    </a>`;

  const visto = new IntersectionObserver(ents => ents.forEach(en => {
    if (!en.isIntersecting) return;
    const d = Number(en.target.dataset.atraso) || 0;
    if (d) en.target.style.transitionDelay = d + "ms";
    en.target.classList.add("dentro"); visto.unobserve(en.target);
  }), { rootMargin: "0px 0px -5% 0px" });
  const observa = (raiz = document) => raiz.querySelectorAll(".surge:not(.dentro)").forEach(e => visto.observe(e));

  return { produtos, porAnime, esc, link, foto, brl, card, observa, reduz, vistoEm: String(window.VISTO_EM || "").slice(0, 10) };
})();

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".visto").forEach(e => (e.textContent = OMO.vistoEm));
  document.querySelectorAll(".n-produtos").forEach(e => (e.textContent = OMO.produtos.length));
  document.querySelectorAll(".ano").forEach(e => (e.textContent = new Date().getFullYear()));

  // menu do celular (☰): abre e fecha; fecha ao escolher um link, ao tocar fora ou com Esc
  const abre = document.querySelector(".abre-menu"), menu = document.getElementById("menu");
  if (abre && menu) {
    const poe = aberto => { menu.classList.toggle("aberto", aberto); abre.setAttribute("aria-expanded", aberto); abre.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu"); };
    abre.addEventListener("click", () => poe(!menu.classList.contains("aberto")));
    menu.addEventListener("click", e => { if (e.target.closest("a")) poe(false); });
    document.addEventListener("click", e => { if (!e.target.closest(".barra")) poe(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") poe(false); });
  }

  // o balão do mascote some depois de alguns segundos
  const m = document.querySelector(".mascote");
  if (m) setTimeout(() => m.classList.remove("fala"), 6000);

  // partículas: pontinhos de luz subindo devagar (pausa com a aba escondida)
  const cv = document.getElementById("particulas");
  if (cv && !OMO.reduz) {
    const cx = cv.getContext("2d");
    let w, h, pts = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cores = ["#ffffff", "#22d3ee", "#ff4d8d", "#c4b5fd"];
    const novo = y => ({ x: Math.random() * w, y, r: Math.random() * 1.8 + .4, v: Math.random() * .35 + .1, d: Math.random() * .6 - .3, c: cores[(Math.random() * cores.length) | 0], f: Math.random() * Math.PI * 2 });
    const tam = () => {
      w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px"; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: Math.round(Math.min(70, (w * h) / 16000)) }, () => novo(Math.random() * h));
    };
    const quadro = t => {
      if (!document.hidden) {
        cx.clearRect(0, 0, w, h);
        for (const p of pts) {
          p.y -= p.v; p.x += Math.sin(t / 1800 + p.f) * .25 + p.d * .1;
          if (p.y < -10) Object.assign(p, novo(h + 10));
          cx.globalAlpha = .35 + .35 * Math.sin(t / 700 + p.f); cx.fillStyle = p.c;
          cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fill();
        }
      }
      requestAnimationFrame(quadro);
    };
    addEventListener("resize", tam); tam(); requestAnimationFrame(quadro);
  }
});
