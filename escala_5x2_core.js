/* Escala 5x2 — lógica pura (sem DOM), usada pela página escala_5x2.html e testada em node.
 * Pessoas são identificadas por id (G=gerente, C=caixa, V0..V3=vendedoras) para que renomear não quebre trocas. */
(function (root) {
  const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  // gOff/cOff/slots = índice do dia de folga (0=Seg … 5=Sáb). slots[i] é a folga da vendedora i na semana 0 do ciclo;
  // a cada semana o vetor gira (vendedora i pega slots[(i+w) % n]).
  const LOJAS = {
    L1: { abre8: true, nome: "L1 · Casa da Beleza Altamira", gerenteVende: true, G: "Tatiane", C: "Marines", V: ["Rayra Luana", "Bárbara Sabrina", "Sofia de Oliveira"], gOff: 1, cOff: 2, slots: [0, 3, 5] },
    L3: { abre8: true, nome: "L3 · Casa da Beleza Itaituba", gerenteVende: true, G: "Ana Mira", C: "Irislene", V: ["Gisele Pauleane", "Raimunda Erlita", "Vendedora 3 (confirmar)", "Vendedora 4 (confirmar)"], gOff: 2, cOff: 0, slots: [1, 3, 5, 5] },
    L4: { abre8: true, nome: "L4 · MissBeleza Altamira", gerenteVende: false, G: "Alessandra", C: "Bia", V: ["Bruna Figueiró", "Debora Emily", "Josilene", "Ronald Lima"], gOff: 1, cOff: 2, slots: [0, 3, 4, 5] },
    L5: { abre8: false, nome: "L5 · MissBeleza Santarém", gerenteVende: false, G: "Rose", C: "Diego", V: ["Karina Paiva", "Rayssa Elis", "Rosiene Silva", "Joyce Rafaela"], gOff: 1, cOff: 3, slots: [0, 0, 2, 2] },
  };
  const FECHADOS_PADRAO = ["2026-12-25", "2027-01-01"];
  const TRANSICAO = "2026-12-14"; // segunda da semana em que começa o 5x2 (quarta 16/12)
  const CICLO0 = "2027-01-04"; // segunda da 1ª semana do ciclo normal
  const LIMITE_MIN = 42 * 60; // teto semanal vigente: 42h até dez/2027 (a regra seguinte deve ser confirmada)
  // Turnos: 2 pessoas abrem às 8h (8–17h) nas lojas com abre8; as demais entram às 9h (9–18h). Almoço de 1h, escalonado às 12/13/14/15h.
  // Quem entra às 8h tem de almoçar até 14h e quem entra às 9h até 15h (máx. 6h seguidas). Ninguém almoça das 10h às 12h (pico).
  const ALMOCO_HORAS = [12, 13, 14, 15];
  const TAMH = { 6: [1, 1, 2, 2], 5: [1, 1, 1, 2], 4: [1, 1, 1, 1], 3: [1, 1, 1, 0], 2: [1, 1, 0, 0], 1: [1, 0, 0, 0], 0: [0, 0, 0, 0] };
  const ONDAS = ALMOCO_HORAS;

  const d0 = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
  const addDias = (isoStr, n) => iso(d0(isoStr) + n * 864e5);
  const segundaDe = (isoStr) => { const dow = new Date(d0(isoStr)).getUTCDay(); return addDias(isoStr, dow === 0 ? 1 : -(dow - 1)); };
  const semanasEntre = (a, b) => Math.round((d0(b) - d0(a)) / (7 * 864e5));

  function pessoas(cfg) { return [["G", cfg.G, "Gerente"], ["C", cfg.C, "Caixa"], ...cfg.V.map((v, i) => ["V" + i, v, "Vendedora"])]; }
  const ordem = (cfg) => pessoas(cfg).map((p) => p[0]);

  /** Quem abre às 8h: o caixa (abre o caixa) — ou o gerente se o caixa folga — mais 1 vendedora em rodízio; o gerente fecha. */
  function escolherCedo(pres, rot) {
    const cedo = pres.includes("C") ? ["C"] : pres.includes("G") ? ["G"] : [];
    let vs = pres.filter((id) => /^V/.test(id)); if (vs.length) { const k = ((rot % vs.length) + vs.length) % vs.length; vs = vs.slice(k).concat(vs.slice(0, k)); }
    for (const v of vs) if (cedo.length < 2) cedo.push(v);
    if (cedo.length < 2 && pres.includes("G") && !cedo.includes("G")) cedo.push("G");
    return cedo;
  }

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
      const cedo = cfg.abre8 ? escolherCedo(pres, w + d) : [];
      if (d === 5) { pres.forEach((id) => (cel[id][d] = (cedo.includes(id) ? 8 : 9) + "–14h")); continue; }
      const t = TAMH[Math.min(pres.length, 6)], slots = [];
      ALMOCO_HORAS.forEach((h, i) => slots.push(...Array(t[i]).fill(h)));
      const atrib = {}, pega = (pref) => { for (const h of pref) { const i = slots.indexOf(h); if (i >= 0) { slots.splice(i, 1); return h; } } return slots.length ? slots.shift() : 13; };
      if (pres.includes("G")) atrib.G = pega([14, 15, 13, 12]);
      if (pres.includes("C")) atrib.C = pega([13, 12, 14, 15]);
      let resto = pres.filter((id) => !atrib[id]); const k = resto.length ? (w + d) % resto.length : 0;
      resto = resto.slice(k).concat(resto.slice(0, k));
      resto.filter((id) => cedo.includes(id)).forEach((id) => (atrib[id] = pega([12, 13, 14])));
      resto.filter((id) => !cedo.includes(id)).forEach((id) => (atrib[id] = pega([14, 13, 12, 15])));
      pres.forEach((id) => { const a = cedo.includes(id) ? 8 : 9; cel[id][d] = a + "–" + (a + 9) + "h · " + atrib[id] + "–" + (atrib[id] + 1) + "h"; });
    }
    const presentes = DIAS.map((_, d) => (fechDia[d] || (tipo === "trans" && d < 2) ? null : ids.filter((id) => cel[id][d] !== "FOLGA" && cel[id][d] !== "regime atual").length));
    return { tipo, datas, fechDia, folga, cel, presentes };
  }

  const PAT = /^(\d+)–(\d+)h(?: · (\d+)–(\d+)h)?$/;
  /** Quantas pessoas ficam na loja em cada hora cheia (8..17) de um dia — considera turno e almoço. */
  function naLojaPorHora(res, d) {
    const out = {};
    for (let h = 8; h < 18; h++) out[h] = Object.keys(res.cel).filter((id) => { const m = PAT.exec(res.cel[id][d] || ""); if (!m) return false;
      const dentro = +m[1] <= h && h < +m[2], almoco = m[3] && +m[3] <= h && h < +m[4]; return dentro && !almoco; }).length;
    return out;
  }
  /** Horas com gente de menos: precisa de 2 na abertura (8h) e no fechamento (17h) e de 3 entre 9h e 16h. */
  function alertas(res, d) {
    const nl = naLojaPorHora(res, d), ab = Object.values(nl).some((x, i) => i === 0 && x > 0), faltas = [];
    for (let h = 8; h < 18; h++) { if (h === 8 && !ab) continue; const min = h === 8 || h === 17 ? 2 : 3; if (nl[h] < min) faltas.push({ hora: h, n: nl[h] }); }
    return faltas;
  }

  /** Minutos trabalhados na semana: dia útil = 8h líquidas (9h de turno − 1h de almoço); sábado = turno − 15 min de intervalo (8–14h = 5h45; 9–14h = 4h45). */
  function minutos(res, id) { return res.cel[id].reduce((t, c) => { const m = PAT.exec(c || ""); if (!m) return t; return t + (m[3] ? 480 : (+m[2] - +m[1]) * 60 - 15); }, 0); }
  const hm = (min) => Math.floor(min / 60) + "h" + (min % 60 ? String(min % 60).padStart(2, "0") : "");
  /** Média de minutos por semana ao longo de um ciclo completo (sem feriados, sem trocas). */
  function mediaCiclo(loja) {
    const cfg = LOJAS[loja], n = cfg.V.length, tot = {}; ordem(cfg).forEach((id) => (tot[id] = 0));
    for (let i = 0; i < n; i++) { const r = semana(loja, addDias(CICLO0, 7 * i), { fechados: new Set() }); Object.keys(tot).forEach((id) => (tot[id] += minutos(r, id))); }
    Object.keys(tot).forEach((id) => (tot[id] = Math.round(tot[id] / n))); return tot;
  }
  const api = { LIMITE_MIN, minutos, hm, mediaCiclo, DIAS, LOJAS, FECHADOS_PADRAO, TRANSICAO, CICLO0, ONDAS, ALMOCO_HORAS, alertas, pessoas, ordem, semana, naLojaPorHora, segundaDe, addDias, semanasEntre };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Escala5x2 = api;
})(typeof window !== "undefined" ? window : globalThis);
