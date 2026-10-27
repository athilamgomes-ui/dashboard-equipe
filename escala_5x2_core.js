/* Escala 5x2 — lógica pura (sem DOM), usada pela página escala_5x2.html e testada em node.
 * Pessoas são identificadas por id (G=gerente, C=caixa, V0..V3=vendedoras) para que renomear não quebre trocas. */
(function (root) {
  const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  // gOff/cOff/slots = índice do dia de folga (0=Seg … 5=Sáb). slots[i] é a folga da vendedora i na semana 0 do ciclo;
  // a cada semana o vetor gira (vendedora i pega slots[(i+w) % n]).
  const LOJAS = {
    L1: { nome: "L1 · Casa da Beleza Altamira", gerenteVende: true, G: "Tatiane", C: "Marines", V: ["Rayra Luana", "Bárbara Sabrina", "Sofia de Oliveira"], gOff: 1, cOff: 2, slots: [0, 3, 5] },
    L3: { nome: "L3 · Casa da Beleza Itaituba", gerenteVende: true, G: "Ana Mira", C: "Irislene", V: ["Gisele Pauleane", "Raimunda Erlita", "Vendedora 3 (confirmar)", "Vendedora 4 (confirmar)"], gOff: 2, cOff: 0, slots: [1, 3, 5, 5] },
    L4: { nome: "L4 · MissBeleza Altamira", gerenteVende: false, G: "Alessandra", C: "Bia", V: ["Bruna Figueiró", "Debora Emily", "Josilene", "Ronald Lima"], gOff: 1, cOff: 2, slots: [0, 3, 4, 5] },
    L5: { nome: "L5 · MissBeleza Santarém", gerenteVende: false, G: "Rose", C: "Diego", V: ["Karina Paiva", "Rayssa Elis", "Rosiene Silva", "Joyce Rafaela"], gOff: 1, cOff: 3, slots: [0, 0, 2, 2] },
  };
  const FECHADOS_PADRAO = ["2026-12-25", "2027-01-01"];
  const TRANSICAO = "2026-12-14"; // segunda da semana em que começa o 5x2 (quarta 16/12)
  const CICLO0 = "2027-01-04"; // segunda da 1ª semana do ciclo normal
  const LIMITE_MIN = 42 * 60; // teto semanal vigente: 42h até dez/2027 (a regra seguinte deve ser confirmada)
  const ONDAS = { 1: [11, 13], 2: [12, 14], 3: [14, 16] };
  const TAM = { 6: [2, 2, 2], 5: [1, 2, 2], 4: [1, 1, 2], 3: [1, 1, 1], 2: [1, 1, 0], 1: [1, 0, 0], 0: [0, 0, 0] };

  const d0 = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
  const addDias = (isoStr, n) => iso(d0(isoStr) + n * 864e5);
  const segundaDe = (isoStr) => { const dow = new Date(d0(isoStr)).getUTCDay(); return addDias(isoStr, dow === 0 ? 1 : -(dow - 1)); };
  const semanasEntre = (a, b) => Math.round((d0(b) - d0(a)) / (7 * 864e5));

  function pessoas(cfg) { return [["G", cfg.G, "Gerente"], ["C", cfg.C, "Caixa"], ...cfg.V.map((v, i) => ["V" + i, v, "Vendedora"])]; }
  const ordem = (cfg) => pessoas(cfg).map((p) => p[0]);

  /** Escala de uma semana (segunda = isoSeg) para uma loja.
   *  opts: { fechados:Set<iso>, trocas:[{a,b}] }  → {tipo, folga:{id:dia}, cel:{id:[6 células]}, presentes:[6]} */
  function semana(loja, isoSeg, opts) {
    opts = opts || {};
    const cfg = LOJAS[loja], ids = ordem(cfg), n = cfg.V.length;
    const fechados = opts.fechados || new Set(FECHADOS_PADRAO);
    const datas = DIAS.map((_, i) => addDias(isoSeg, i));
    const fechDia = datas.map((x) => fechados.has(x));
    let tipo = "norm";
    if (isoSeg < TRANSICAO) tipo = "antes";
    else if (isoSeg === TRANSICAO) tipo = "trans";
    else if (fechDia.slice(0, 5).some(Boolean)) tipo = "fer";
    const cel = {}; ids.forEach((id) => (cel[id] = Array(6).fill(null)));
    if (tipo === "antes") { ids.forEach((id) => cel[id].fill("regime atual")); return { tipo, datas, fechDia, folga: {}, cel, presentes: Array(6).fill(null) }; }
    const nSem = semanasEntre(CICLO0, isoSeg);
    const w = tipo === "trans" ? n - 1 : (((nSem % n) + n) % n);
    const folga = {};
    if (tipo === "norm" || tipo === "trans") {
      folga.G = cfg.gOff; folga.C = cfg.cOff;
      cfg.V.forEach((_, i) => (folga["V" + i] = cfg.slots[(i + w) % n]));
    }
    if (tipo === "trans") { // a semana começou no regime antigo: folga de seg/ter migra p/ qua–sex (máx. 2 por dia)
      const cont = { 2: 0, 3: 0, 4: 0 }; Object.values(folga).forEach((d) => { if (d in cont) cont[d]++; });
      ids.forEach((id) => { if (folga[id] === 0 || folga[id] === 1) {
        const d = [2, 3, 4].sort((a, b) => (cont[a] >= 2) - (cont[b] >= 2) || cont[a] - cont[b] || a - b)[0]; folga[id] = d; cont[d]++; } });
    }
    if (tipo === "norm" || tipo === "trans") (opts.trocas || []).forEach(({ a, b }) => {
      if (folga[a] !== undefined && folga[b] !== undefined) { const t = folga[a]; folga[a] = folga[b]; folga[b] = t; } });
    for (let d = 0; d < 6; d++) {
      if (tipo === "trans" && d < 2) { ids.forEach((id) => (cel[id][d] = "regime atual")); continue; }
      if (fechDia[d]) { ids.forEach((id) => (cel[id][d] = "FECHADO")); continue; }
      const pres = ids.filter((id) => folga[id] !== d);
      ids.forEach((id) => { if (folga[id] === d) cel[id][d] = "FOLGA"; });
      if (d === 5) { pres.forEach((id) => (cel[id][d] = "8–14h")); continue; }
      const s = TAM[Math.min(pres.length, 6)]; const slots = [...Array(s[0]).fill(1), ...Array(s[1]).fill(2), ...Array(s[2]).fill(3)];
      const atrib = {};
      if (pres.includes("G") && slots.includes(3)) { slots.splice(slots.indexOf(3), 1); atrib.G = 3; }
      if (pres.includes("C") && slots.includes(2)) { slots.splice(slots.indexOf(2), 1); atrib.C = 2; }
      let resto = pres.filter((id) => !atrib[id]); const k = resto.length ? (w + d) % resto.length : 0;
      resto = resto.slice(k).concat(resto.slice(0, k)); slots.sort();
      resto.forEach((id, i) => (atrib[id] = slots[i] || 1));
      pres.forEach((id) => { const [a, b] = ONDAS[atrib[id]]; cel[id][d] = a + "–" + b + "h"; });
    }
    const presentes = DIAS.map((_, d) => (fechDia[d] || (tipo === "trans" && d < 2) ? null : ids.filter((id) => cel[id][d] !== "FOLGA" && cel[id][d] !== "regime atual").length));
    return { tipo, datas, fechDia, folga, cel, presentes };
  }

  /** Quantas pessoas ficam na loja em cada hora cheia (10..15) de um dia útil — para validar o almoço. */
  function naLojaPorHora(res, d) {
    const ids = Object.keys(res.cel).filter((id) => /h$/.test(res.cel[id][d] || "") && res.cel[id][d] !== "8–14h");
    const todos = Object.keys(res.cel).filter((id) => res.cel[id][d] && !["FOLGA", "FECHADO", "regime atual"].includes(res.cel[id][d]));
    const out = {};
    for (let h = 10; h < 16; h++) out[h] = todos.length - ids.filter((id) => { const [a, b] = res.cel[id][d].replace("h", "").split("–").map(Number); return a <= h && h < b; }).length;
    return out;
  }

  /** Minutos trabalhados na semana: dia útil = 8h líquidas (8–18h − 2h de almoço); sábado 8–14h = 5h45 (6h − 15 min de intervalo). */
  function minutos(res, id) { return res.cel[id].reduce((t, c) => t + (c === "8–14h" ? 345 : /^\d+–\d+h$/.test(c || "") ? 480 : 0), 0); }
  const hm = (min) => Math.floor(min / 60) + "h" + (min % 60 ? String(min % 60).padStart(2, "0") : "");
  /** Média de minutos por semana ao longo de um ciclo completo (sem feriados, sem trocas). */
  function mediaCiclo(loja) {
    const cfg = LOJAS[loja], n = cfg.V.length, tot = {}; ordem(cfg).forEach((id) => (tot[id] = 0));
    for (let i = 0; i < n; i++) { const r = semana(loja, addDias(CICLO0, 7 * i), { fechados: new Set() }); Object.keys(tot).forEach((id) => (tot[id] += minutos(r, id))); }
    Object.keys(tot).forEach((id) => (tot[id] = Math.round(tot[id] / n))); return tot;
  }
  const api = { LIMITE_MIN, minutos, hm, mediaCiclo, DIAS, LOJAS, FECHADOS_PADRAO, TRANSICAO, CICLO0, ONDAS, pessoas, ordem, semana, naLojaPorHora, segundaDe, addDias, semanasEntre };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Escala5x2 = api;
})(typeof window !== "undefined" ? window : globalThis);
