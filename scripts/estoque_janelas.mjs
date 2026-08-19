/**
 * estoque_janelas.mjs — decomposição da janela [data do balanço → hoje] em pedaços mensais.
 *
 * O relatório de saldo aceita UMA janela por execução, e cada produto tem a data do SEU balanço.
 * Em vez de uma execução por produto, a janela é quebrada em:
 *   [data → fim do mês da data] + cada mês cheio até o mês passado + [1º do mês corrente → hoje]
 * Os pedaços que terminam antes do mês corrente são IMUTÁVEIS (cache permanente);
 * só o pedaço do mês corrente é recoletado a cada execução.
 *
 * Coletor e build usam ESTA função — se as duas decomposições divergirem, a soma mente.
 */
const pad = n => String(n).padStart(2, "0");
export const mesDe = s => s.slice(0, 7);
export const fimDoMes = s => { const [y, m] = s.split("-").map(Number); const d = new Date(y, m, 0); return `${y}-${pad(m)}-${pad(d.getDate())}`; };
export const proxMes = s => { let [y, m] = s.split("-").map(Number); m++; if (m > 12) { m = 1; y++; } return `${y}-${pad(m)}`; };

/** Pedaços [{ini,fim,volatil}] que cobrem exatamente [dataBalanco, hoje]. */
export function pecasJanela(dataBalanco, isoHoje) {
  const mesCorrente = mesDe(isoHoje);
  if (dataBalanco > isoHoje) return [];
  if (mesDe(dataBalanco) === mesCorrente) return [{ ini: dataBalanco, fim: isoHoje, volatil: true }];
  const out = [{ ini: dataBalanco, fim: fimDoMes(dataBalanco), volatil: false }];
  let m = proxMes(dataBalanco);
  while (m < mesCorrente) { out.push({ ini: `${m}-01`, fim: fimDoMes(`${m}-01`), volatil: false }); m = proxMes(`${m}-01`); }
  out.push({ ini: `${mesCorrente}-01`, fim: isoHoje, volatil: true });
  return out;
}
