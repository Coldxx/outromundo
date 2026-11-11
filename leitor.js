/* Leitores do site: mangá (manga.html) e novel (novel.html). Sem dependências; os dados vêm de leitura/*.js. */
(() => {
  "use strict";
  if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (e) { document.body.textContent = ""; return; } }

  const $ = s => document.querySelector(s);
  const guarda = {
    ler(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    pôr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado: tudo bem */ } },
  };
  const num = (v, min, max, padrao) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= min && n <= max ? n : padrao; };

  /* Livro: folhas empilhadas que viram como página de papel. */
  function Livro(palco, folhas, aoMudar) {
    let atual = 0, ocupado = false;
    folhas.forEach(f => palco.appendChild(f));
    const mostra = i => {
      folhas.forEach((f, j) => f.className = f.className.replace(/\b(ativa|embaixo|vira-frente|vira-tras)\b/g, "").trim() + (j === i ? " ativa" : ""));
      palco.classList.toggle("no-inicio", i === 0); palco.classList.toggle("no-fim", i === folhas.length - 1);
    };
    function vai(i, animar = true) {
      i = Math.max(0, Math.min(folhas.length - 1, i));
      if (i === atual || ocupado) { if (!ocupado) aoMudar(atual, folhas.length); return; }
      const de = folhas[atual], para = folhas[i];
      if (!animar || Math.abs(i - atual) > 1) { atual = i; mostra(i); aoMudar(i, folhas.length); return; }
      ocupado = true;
      if (i > atual) { para.classList.add("embaixo"); de.classList.remove("ativa"); de.classList.add("vira-frente"); }
      else { de.classList.add("embaixo"); de.classList.remove("ativa"); para.classList.add("vira-tras"); }
      const fim = () => { ocupado = false; atual = i; mostra(i); aoMudar(i, folhas.length); };
      setTimeout(fim, 560);
    }
    mostra(0);
    const api = { vai, get atual() { return atual; }, get total() { return folhas.length; } };
    palco._livro = api; // ao remontar (novel), só o livro mais novo responde
    if (!palco._ouvindo) {
      palco._ouvindo = true;
      let x0 = null;
      palco.addEventListener("pointerdown", e => { x0 = e.clientX; });
      palco.addEventListener("pointerup", e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; const l = palco._livro; if (Math.abs(dx) > 50) l.vai(l.atual + (dx < 0 ? 1 : -1)); });
      document.addEventListener("keydown", e => {
        const l = palco._livro; if (document.body.classList.contains("modo-rolar")) return;
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); l.vai(l.atual + 1); }
        if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); l.vai(l.atual - 1); }
      });
    }
    return api;
  }

  const SETA = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  function zonas(palco) {
    ["esq", "dir"].forEach(lado => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "zona " + lado; b.setAttribute("aria-label", lado === "esq" ? "Página anterior" : "Próxima página");
      b.innerHTML = `<span class="seta">${SETA(lado === "esq" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7")}</span>`;
      b.addEventListener("click", () => { const l = palco._livro; l.vai(l.atual + (lado === "dir" ? 1 : -1)); });
      palco.appendChild(b);
    });
    // botões também na barra de baixo, perto do polegar
    const rod = document.querySelector(".l-rodape");
    if (rod && !rod.querySelector(".passa")) {
      const mk = (lado, txt) => { const b = document.createElement("button"); b.type = "button"; b.className = "passa " + lado; b.innerHTML = lado === "esq" ? SETA("m15 5-7 7 7 7") + `<span>${txt}</span>` : `<span>${txt}</span>` + SETA("m9 5 7 7-7 7"); b.setAttribute("aria-label", txt);
        b.addEventListener("click", () => { const l = palco._livro; l.vai(l.atual + (lado === "dir" ? 1 : -1)); }); return b; };
      rod.prepend(mk("esq", "Voltar")); rod.append(mk("dir", "Próxima"));
    }
    // dica na primeira visita
    if (!guarda.ler("ler-dica") && !palco.querySelector(".dica")) {
      const d = document.createElement("div"); d.className = "dica";
      d.innerHTML = `<div><b>Como ler</b><p>Toque nas setas <span>‹ ›</span> dos lados ou arraste a página para o lado.</p><button type="button" class="botao">Entendi</button></div>`;
      const some = () => { d.remove(); guarda.pôr("ler-dica", 1); };
      d.addEventListener("click", some);
      palco.appendChild(d);
    }
  }

  /* ---------------- MANGÁ ---------------- */
  if (document.body.dataset.leitor === "manga" && window.MANGA) {
    const caps = window.MANGA.caps;
    const q = new URLSearchParams(location.search);
    const c = num(q.get("c"), 1, caps.length, 1);
    const cap = caps[c - 1];
    const pasta = "leitura/manga/c" + String(c).padStart(2, "0") + "/p";
    const src = i => pasta + String(i).padStart(2, "0") + ".jpg";
    document.title = `Mangá · Cap. ${c} · ${cap.titulo} | Outro Mundo Otaku`;
    $("#l-cap").textContent = `Cap. ${c} · ${cap.titulo}`;
    const salvo = guarda.ler("ler-manga") || {};
    const inicio = salvo.c === c ? num(salvo.p, 0, cap.paginas - 1, 0) : 0;

    const folhas = [];
    for (let i = 0; i < cap.paginas; i++) {
      const f = document.createElement("div"); f.className = "folha";
      const img = document.createElement("img");
      img.alt = `Página ${i + 1} do capítulo ${c}`; img.decoding = "async";
      img.dataset.src = src(i);
      f.appendChild(img); folhas.push(f);
    }
    const carrega = i => [i, i + 1, i + 2, i - 1].forEach(j => { const im = folhas[j]?.firstChild; if (im && !im.src) im.src = im.dataset.src; });
    const regua = $("#l-regua"), cont = $("#l-pag"), fimEl = $("#l-fim");
    regua.max = cap.paginas;
    const livro = Livro($("#palco"), folhas, (i, n) => {
      carrega(i); regua.value = i + 1; cont.textContent = `${i + 1} / ${n}`;
      guarda.pôr("ler-manga", { c, p: i });
      if (i < n - 1) fimEl.classList.remove("ativo");
    });
    zonas($("#palco"), livro);
    carrega(inicio); livro.vai(inicio, false);
    regua.addEventListener("input", () => livro.vai(regua.value - 1, false));
    // fim do capítulo
    const proximo = $("#l-proximo");
    if (c < caps.length) { proximo.href = "manga.html?c=" + (c + 1); proximo.textContent = `Ler Cap. ${c + 1}`; } else { proximo.href = "novel.html?v=2"; proximo.textContent = "Continuar na novel (Vol. 2)"; }
    // aviso de fim: quando a pessoa tenta passar DA última página (o clique é lido antes de virar)
    document.addEventListener("click", e => {
      if (e.target.closest(".zona.dir, .passa.dir") && livro.atual === livro.total - 1) fimEl.classList.add("ativo");
    }, true);
    $("#l-fecha-fim").addEventListener("click", () => fimEl.classList.remove("ativo"));
    // modo rolagem
    const rol = $("#rolagem");
    $("#l-modo").addEventListener("click", () => {
      const rolar = document.body.classList.toggle("modo-rolar");
      $("#l-modo").textContent = rolar ? "Página" : "Rolar";
      if (rolar && !rol.childElementCount) for (let i = 0; i < cap.paginas; i++) { const im = document.createElement("img"); im.loading = "lazy"; im.src = src(i); im.alt = `Página ${i + 1}`; rol.appendChild(im); }
    });
  }

  /* ---------------- NOVEL ---------------- */
  if (document.body.dataset.leitor === "novel") {
    const v = num(new URLSearchParams(location.search).get("v"), 1, 3, 1);
    const s = document.createElement("script");
    s.src = `leitura/novel_v${v}.js`; s.onload = iniciaNovel;
    document.body.appendChild(s);
  }
  function iniciaNovel() {
    const N = window.NOVEL; if (!N) return;
    const q = new URLSearchParams(location.search);
    document.title = `${N.volume} · ${N.titulo} | Novel | Outro Mundo Otaku`;
    $("#l-cap").textContent = `${N.volume} · ${N.titulo}`;
    const palco = $("#palco"), regua = $("#l-regua"), cont = $("#l-pag");
    const chave = "ler-novel-v" + N.v;
    let fonte = num((guarda.ler("ler-fonte") || {}).f, 14, 24, 17);
    document.documentElement.style.setProperty("--fonte", fonte + "px");

    // sequência de blocos com o capítulo de cada um
    const blocos = [];
    N.capitulos.forEach((cap, ci) => { blocos.push({ t: "titulo", h: cap.titulo, ci }); cap.blocos.forEach(b => blocos.push({ ...b, ci })); });
    blocos.push({ t: "fim", ci: N.capitulos.length - 1 });
    const html = b => {
      if (b.t === "titulo") return `<h2>${b.h.replace(/</g, "&lt;")}</h2>`;
      if (b.t === "sep") return `<div class="sep">* * *</div>`;
      if (b.t === "tela") return `<div class="tela">${b.l.join("<br>")}</div>`;
      if (b.t === "fim") return `<div class="sep">◆</div><p class="cont"><em>Continua no ${N.continua.volume}: ${N.continua.titulo}.</em></p>`;
      return `<p${b.cont ? ' class="cont"' : ""}>${b.h}</p>`;
    };

    let livro = null, paginas = [];
    function pagina() {
      const f = document.createElement("div"); f.className = "folha papel ativa";
      f.style.visibility = "hidden"; palco.appendChild(f);
      const corpo = document.createElement("div"); corpo.className = "corpo"; f.appendChild(corpo);
      return { f, corpo };
    }
    // corta o texto em páginas do tamanho da tela
    function pagina_tudo() {
      palco.querySelectorAll(".folha").forEach(f => f.remove());
      const capa = document.createElement("div"); capa.className = "folha capa-livro";
      capa.innerHTML = `<img src="leitura/capas/novel_v${N.v}.jpg" alt="Capa do ${N.volume}">`;
      const lista = [capa]; const inicioBloco = [0];
      let { f, corpo } = pagina(), comeco = 0;
      const fecha = (prox) => { f.style.visibility = ""; f.classList.remove("ativa"); const n = document.createElement("div"); n.className = "num"; n.textContent = lista.length; f.appendChild(n); lista.push(f); inicioBloco.push(comeco); comeco = prox; ({ f, corpo } = pagina()); };
      // cópia local: os pedaços de parágrafo partido não se acumulam ao remontar; .o = índice original do bloco
      const bl = blocos.map((b, o) => ({ ...b, o }));
      const orig = i => (bl[i] ? bl[i].o : blocos.length);
      for (let i = 0; i < bl.length; i++) {
        const b = bl[i];
        if (b.t === "titulo" && corpo.childElementCount) fecha(orig(i));
        corpo.insertAdjacentHTML("beforeend", html(b));
        if (corpo.scrollHeight <= corpo.clientHeight) continue;
        const ultimo = corpo.lastElementChild;
        if (b.t === "p" && ultimo) {
          // parte o parágrafo pela palavra
          const palavras = b.h.split(" "); let lo = 0, hi = palavras.length;
          while (lo < hi) { const m = (lo + hi + 1) >> 1; ultimo.innerHTML = palavras.slice(0, m).join(" "); if (corpo.scrollHeight <= corpo.clientHeight) lo = m; else hi = m - 1; }
          if (lo === 0 && corpo.childElementCount > 1) { ultimo.remove(); fecha(orig(i)); i--; continue; }
          lo = Math.max(lo, 1);
          ultimo.innerHTML = palavras.slice(0, lo).join(" ");
          if (lo < palavras.length) bl.splice(i + 1, 0, { ...b, h: palavras.slice(lo).join(" "), cont: true });
          fecha(orig(i + 1));
        } else if (corpo.childElementCount > 1) { ultimo.remove(); fecha(orig(i)); i--; }
        else fecha(orig(i + 1));
      }
      if (corpo.childElementCount) fecha(blocos.length);
      f.remove(); // a folha de medida que sobrou
      paginas = lista.map((p, i) => ({ el: p, bloco: inicioBloco[i] }));
      return lista;
    }
    function monta(blocoAlvo) {
      const lista = pagina_tudo();
      palco.querySelectorAll(".zona").forEach(z => z.remove());
      const novo = Livro(palco, lista, (i, n) => {
        regua.value = i + 1; cont.textContent = `${i + 1} / ${n}`;
        guarda.pôr(chave, { b: paginas[i].bloco });
      });
      regua.max = lista.length;
      zonas(palco, novo);
      let alvo = 0;
      if (blocoAlvo > 0) paginas.forEach((p, i) => { if (p.bloco <= blocoAlvo) alvo = i; });
      novo.vai(alvo, false);
      livro = novo;
    }
    const salvo = guarda.ler(chave);
    let capPedido = num(q.get("c"), 1, N.capitulos.length, 0);
    const blocoDoCap = ci => blocos.findIndex(b => b.t === "titulo" && b.ci === ci);
    document.fonts.ready.then(() => monta(capPedido ? blocoDoCap(capPedido - 1) : (salvo?.b || 0)));
    regua.addEventListener("input", () => livro && livro.vai(regua.value - 1, false));
    let espera;
    addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(() => monta(paginas[livro.atual]?.bloco || 0), 250); });
    const muda = d => { fonte = Math.max(14, Math.min(24, fonte + d)); document.documentElement.style.setProperty("--fonte", fonte + "px"); guarda.pôr("ler-fonte", { f: fonte }); monta(paginas[livro.atual]?.bloco || 0); };
    $("#l-menos").addEventListener("click", () => muda(-1));
    $("#l-mais").addEventListener("click", () => muda(1));
    // sumário
    const sum = $("#sumario");
    N.capitulos.forEach((cap, ci) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = cap.titulo;
      b.addEventListener("click", () => { const alvo = blocoDoCap(ci); let p = 0; paginas.forEach((x, i) => { if (x.bloco <= alvo) p = i; }); livro.vai(p, false); sum.classList.remove("aberto"); });
      sum.appendChild(b);
    });
    $("#l-sumario").addEventListener("click", () => sum.classList.toggle("aberto"));
  }

  /* ---------------- ÍNDICE (ler.html) ---------------- */
  if (document.body.dataset.pagina === "ler") {
    const estM = $("#estante-manga"), estN = $("#estante-novel");
    const salvoM = guarda.ler("ler-manga");
    const card = (href, img, titulo, sub, lendo) => {
      const a = document.createElement("a"); a.className = "livro-card vidro"; a.href = href;
      const im = document.createElement("img"); im.src = img; im.alt = ""; im.loading = "lazy";
      const b = document.createElement("b"); b.textContent = titulo;
      const s = document.createElement("span"); s.textContent = sub; if (lendo) s.className = "lendo";
      a.append(im, b, s); return a;
    };
    (window.MANGA?.caps || []).forEach(cap => {
      const lendo = salvoM && salvoM.c === cap.n;
      estM.appendChild(card(`manga.html?c=${cap.n}`, `leitura/capas/manga_c${String(cap.n).padStart(2, "0")}.jpg`, `Cap. ${cap.n} · ${cap.titulo}`, lendo ? `Parou na pág. ${salvoM.p + 1}` : `${cap.paginas} páginas`, lendo));
    });
    if (salvoM) { const c = $("#continuar-manga"); c.href = `manga.html?c=${salvoM.c}`; c.classList.add("ativo"); }
    (window.NOVELS || []).forEach(v => {
      const lendo = !!guarda.ler("ler-novel-v" + v.v);
      estN.appendChild(card(`novel.html?v=${v.v}`, `leitura/capas/novel_v${v.v}.jpg`, `${v.volume} · ${v.titulo}`, lendo ? "Continuar lendo" : `${v.capitulos} capítulos`, lendo));
    });
  }
})();
