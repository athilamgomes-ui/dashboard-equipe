/**
 * cliente8_ranking.mjs — helper compartilhado.
 *
 * Consulta o faturamento de UM cliente (padrão cód 8 "R MAURA DE FREITAS")
 * para UMA empresa × período via Faturamento → Ranking de Clientes
 * (relatorio_ranking.asp). É o filtro REAL por cliente, usado para EXCLUIR
 * vendas entre lojas (uma loja comprando da outra) do total de vendas.
 *
 * Mesma trilha do coleta_cliente8.mjs (premiação), extraída para reuso pelos
 * coletores de faturamento do dashboard de vendas.
 *
 * rankingCliente(page, emp, di, df, cod="8") → { valor, qtde, vendas } (números, 0 se não houver)
 * Lança em caso de falha de navegação — o chamador deve tratar como não-fatal
 * (subtrair 0 e logar) para nunca derrubar o pipeline por causa disso.
 */
const URL_RANKING = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_ranking.asp";
const num = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0;

export async function rankingCliente(page, emp, di, df, cod = "8") {
  await page.goto(URL_RANKING, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#empresas_10", { state: "attached", timeout: 15000 });
  await page.evaluate(({ emp, di, df }) => {
    document.querySelectorAll('input[id^="empresas_"]').forEach((c) => (c.checked = false));
    const e = document.getElementById("empresas_" + emp); if (e) e.checked = true;
    document.getElementById("data1").value = di;
    document.getElementById("data2").value = df;
    const lim = document.getElementById("limite"); if (lim) lim.value = lim.options[0].value; // 'todos'
    const ps = [...document.querySelectorAll('input[name="produtos_servicos"]')]; if (ps.length) ps[ps.length - 1].checked = true; // Ambos
  }, { emp, di, df });
  await Promise.all([
    page.waitForNavigation({ timeout: 30000 }).catch(() => null),
    page.evaluate(() => document.forms.Form1.submit()),
  ]);
  await page.waitForTimeout(1200);
  const r = await page.evaluate((cod) => {
    for (const tr of document.querySelectorAll("table tr")) {
      const c = [...tr.querySelectorAll("td")].map((x) => x.textContent.trim());
      if (c.length >= 4 && new RegExp("^" + cod + "\\s*-").test(c[1] || "")) {
        return { valor: c[2], qtde: c[3], vendas: c[4] };
      }
    }
    return null;
  }, cod);
  return r ? { valor: num(r.valor), qtde: num(r.qtde), vendas: num(r.vendas) } : { valor: 0, qtde: 0, vendas: 0 };
}
