// Outro Mundo Otaku · loja completa: filtro por anime, busca, faixa de preço, ordem e "ver mais".
// O que vem na URL (?a=anime&q=busca) é só lido e comparado com a lista; nunca vira HTML sem escapar.
"use strict";
(() => {
  const { produtos, porAnime, esc, card, observa } = OMO;
  const POR_VEZ = 24;
  const animes = ["Todos", ...Object.keys(porAnime).filter(a => a !== "Vários").sort((a, b) => porAnime[b] - porAnime[a]), ...(porAnime["Vários"] ? ["Vários"] : [])];
  const url = new URLSearchParams(location.search);
  let anime = animes.includes(url.get("a")) ? url.get("a") : "Todos";
  let mostrando = POR_VEZ;

  const filtros = document.getElementById("filtros");
  const grade = document.getElementById("grade");
  const busca = document.getElementById("busca");
  const ordem = document.getElementById("ordem");
  const faixa = document.getElementById("faixa");
  const mais = document.getElementById("mais");
  const contagem = document.getElementById("contagem");
  busca.value = (url.get("q") || "").slice(0, 60);

  filtros.innerHTML = animes.map(a => `<button class="filtro" type="button" data-a="${esc(a)}" aria-pressed="${a === anime}">${esc(a)}<small>${a === "Todos" ? produtos.length : porAnime[a]}</small></button>`).join("");

  const lista = () => {
    const q = busca.value.trim().toLowerCase();
    const [min, max] = (faixa.value || "0-99999").split("-").map(Number);
    let l = produtos.filter(p => (anime === "Todos" || p.a === anime) && p.p >= min && p.p <= max && (!q || (p.n + " " + p.a).toLowerCase().includes(q)));
    if (ordem.value === "menor") l = [...l].sort((a, b) => a.p - b.p);
    else if (ordem.value === "maior") l = [...l].sort((a, b) => b.p - a.p);
    else if (ordem.value === "desconto") l = [...l].sort((a, b) => b.off - a.off);
    return l;
  };
  const guardaNaUrl = () => {
    const u = new URLSearchParams();
    if (anime !== "Todos") u.set("a", anime);
    if (busca.value.trim()) u.set("q", busca.value.trim().slice(0, 60));
    history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
  };
  const desenha = () => {
    const l = lista();
    contagem.textContent = `${l.length} ${l.length === 1 ? "achadinho" : "achadinhos"}${anime !== "Todos" ? " de " + anime : ""}`;
    grade.innerHTML = l.length
      ? l.slice(0, mostrando).map((p, i) => card(p, Math.min(i % POR_VEZ, 8) * 40)).join("")
      : `<p class="vazio">Nenhum achadinho com esses filtros. Tente outro nome ou limpe a busca.</p>`;
    mais.parentElement.hidden = l.length <= mostrando;
    mais.textContent = `Ver mais (${Math.max(0, l.length - mostrando)})`;
    observa(grade);
    guardaNaUrl();
  };

  filtros.addEventListener("click", e => {
    const b = e.target.closest(".filtro"); if (!b) return;
    anime = animes.includes(b.dataset.a) ? b.dataset.a : "Todos"; mostrando = POR_VEZ;
    filtros.querySelectorAll(".filtro").forEach(x => x.setAttribute("aria-pressed", x.dataset.a === anime));
    desenha();
  });
  busca.addEventListener("input", () => { mostrando = POR_VEZ; desenha(); });
  ordem.addEventListener("change", () => { mostrando = POR_VEZ; desenha(); });
  faixa.addEventListener("change", () => { mostrando = POR_VEZ; desenha(); });
  mais.addEventListener("click", () => { mostrando += POR_VEZ; desenha(); });
  const ativo = filtros.querySelector('[aria-pressed="true"]');
  if (ativo) ativo.scrollIntoView({ block: "nearest", inline: "center" });
  desenha();
})();
