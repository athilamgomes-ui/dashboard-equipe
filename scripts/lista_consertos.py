#!/usr/bin/env python3
"""
lista_consertos.py — a lista de conserto do estoque, UMA POR LOJA: marca → produto → o que fazer.
Responde duas perguntas na mesma folha:
   (A) que produto está com CUSTO/PREÇO/FATOR errado, e qual é o conserto
   (B) que MARCA ainda existe na loja de verdade, e qual é só saldo fantasma

⚠️ ERRO CORRIGIDO EM 27/08/2026 — LEIA ANTES DE MEXER NA FONTE DE CUSTO.
A primeira versão usava a coluna "Custo Médio" do relatório de saldo (o que o pipeline de
estoque coleta no snapshot). ESSA COLUNA NÃO É O CUSTO QUE VALORIZA O ESTOQUE. O Athila abriu
vários códigos da lista e achou tudo certo — estava certo mesmo. Conferido:

    ALGODAO CARD HID NATHY 25G (11043)   Custo Médio R$ 204,16   ×   Registro de Inventário R$ 1,16
    BABY FD ALGODAO NATHYBABY  (17704)   Custo Médio R$ 172,48   ×   Registro de Inventário R$ 1,96

Em 7.278 dos 14.111 produtos com saldo da L1 os dois campos DIVERGEM. O certo é o
"Custo Icms Unit." do Registro de Inventário (Suprimentos → Relatórios → Registro de
Inventário), que é o que o Athila usa e o que valoriza o estoque. Trocar a fonte derrubou a
lista da L1 de 454 produtos / R$ 316.344 para 173 / R$ 122.603.
O SALDO, esse sim, bate nas duas fontes — e o PREÇO DE TABELA do snapshot também
(conferido contra a Lista de Preços do ERP no produto 18514).

COMO CADA CONSERTO É DECIDIDO — três evidências, em ordem de força:
 1. QUANTIDADE NO NOME DO PRODUTO ("(72 UN)", "C/250", "40UN/FD"): alguém escreveu o que vem
    na embalagem. É a mais forte.
 2. COMPROU × VENDEU desde 2023: comprar 3 e vender 339 só é possível se cada "unidade"
    comprada for um pacote. Estima o tamanho quando o nome não diz.
 3. CUSTO ÷ PACOTE contra o PREÇO: se o custo unitário implícito cabe abaixo do preço com
    margem plausível, a história fecha; se não cabe, vai para "abrir a nota".

CLASSIFICAÇÃO DE MARCA (parte B), com ent/ven desde 01/01/2023:
    fantasma  — saldo, 0 entrada e 0 venda: quase certamente não existe na loja (ex.: Tracta L1)
    morta     — não compra e o saldo dá mais de 3 anos de venda no ritmo atual (Tracta L4)
    saindo    — não compra mas ainda gira
    encalhada — compra, mas o saldo dá mais de 3 anos
    ativa     — compra e gira

Uso: python3 lista_consertos.py
Entradas: dados_estoque/inv_analitico_<loja>.json (Registro de Inventário analítico),
          snapshot.json (preço e marca), entradas_desde.json (ent/ven desde 2023)
Saída:    CONSERTOS.md + CONSERTOS_<loja>.md
"""
import json
import os
import re
from collections import defaultdict

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
D = os.path.join(DIR, "dados_estoque")
LOJAS = ("L1", "L3", "L4", "L5")
NOME_LOJA = {"L1": "Casa da Beleza Altamira", "L3": "Casa da Beleza Itaituba",
             "L4": "MissBeleza Altamira", "L5": "MissBeleza Santarém"}
ANOS = 3.65   # 01/01/2023 → 27/08/2026

CONFIRMADO = {
    "12408": ("custo", 48.73, "NF 60160/1 de 28/02/25 — 12,00 UN a R$ 48,73 (SAFIRA). "
                              "As irmãs custam R$ 26,94 / 37,46 / 28,66 e o preço R$ 67,90 está certo."),
}

PACOTE = [
    (re.compile(r"\((\d{2,4})\s*UN\)", re.I), "no nome: ({} UN)"),
    (re.compile(r"\b(\d{2,4})\s*UN\s*/\s*(?:FD|CX|PCT)\b", re.I), "no nome: {}UN por fardo"),
    (re.compile(r"\bC/\s*(\d{2,4})\b", re.I), "no nome: C/{}"),
    (re.compile(r"\bCX\s*(\d{2,4})\b", re.I), "no nome: CX {}"),
    (re.compile(r"\bPCT\s*C?/?\s*(\d{2,4})\b", re.I), "no nome: PCT {}"),
    (re.compile(r"\b(\d{2,4})\s*UN\b", re.I), "no nome: {} UN"),
]
EMBALAGEM = re.compile(r"\b(FD|FARDO|CX|CAIXA|PCT|PACOTE|POTE|ROLO|DISPLAY)\b", re.I)


def brl(v, dec=2):
    if v is None:
        return "—"
    return f"{v:,.{dec}f}".replace(",", "\x00").replace(".", ",").replace("\x00", ".")


def inte(v):
    return f"{int(round(v)):,d}".replace(",", ".")


def qtd_no_nome(desc):
    for rx, fmt in PACOTE:
        m = rx.search(desc or "")
        if m:
            n = int(m.group(1))
            if 2 <= n <= 5000:
                return n, fmt.format(n)
    return None, None


def decidir(cod, desc, cus, pre, ent, ven):
    conf = CONFIRMADO.get(cod)
    n_nome, origem_nome = qtd_no_nome(desc)
    razao = (ven / ent) if (ent and ent > 0 and ven) else None

    if conf and conf[0] == "custo":
        return dict(tipo="custo corrompido", custo_novo=conf[1], evidencia=f"✅ conferido: {conf[2]}",
                    acao=f"Corrigir o **custo médio** de R$ {brl(cus)} para **R$ {brl(conf[1])}**. "
                         f"Não mexer no preço nem no saldo.")

    n = n_nome or (round(razao) if razao and razao >= 5 else None)
    if n and n >= 2:
        unit = cus / n
        ev = [x for x in (origem_nome,
                          f"comprou {inte(ent)}, vendeu {inte(ven)} (razão {inte(razao)}x)"
                          if razao and razao >= 5 else None) if x]
        if unit <= pre:
            margem = (pre / unit - 1) * 100 if unit else 0
            if n_nome:
                acao = (f"Cadastrar **fator de conversão = {inte(n)}** (a quantidade está no nome). "
                        f"O custo unitário cai de R$ {brl(cus)} para **R$ {brl(unit)}** — margem de "
                        f"{inte(margem)}% sobre o preço de R$ {brl(pre)}.")
                tipo = "fator de conversão"
            else:
                acao = (f"Cadastrar fator de conversão. Pelo histórico o pacote tem **~{inte(n)} peças** — "
                        f"**confirmar na nota antes de gravar**. Com {inte(n)}, o custo cai de "
                        f"R$ {brl(cus)} para R$ {brl(unit)}, margem de {inte(margem)}% sobre R$ {brl(pre)}.")
                tipo = "fator de conversão (qtd estimada)"
            return dict(tipo=tipo, custo_novo=unit, evidencia=" · ".join(ev) or "—", acao=acao)
        extra = (f" ⚠️ E o preço de R$ {brl(pre)} também não se sustenta — conferir os dois."
                 if pre < 1 else "")
        return dict(tipo="fator a confirmar", custo_novo=None, evidencia=" · ".join(ev) or "—",
                    acao=f"Parece embalagem de {inte(n)}, mas R$ {brl(cus)} ÷ {inte(n)} = R$ {brl(unit)}, "
                         f"que ainda passa do preço de R$ {brl(pre)}. **Abrir a nota** e ver a unidade.{extra}")

    if ent is not None and ent == 0 and (ven or 0) == 0:
        return dict(tipo="sem movimento", custo_novo=None,
                    evidencia="0 entrada e 0 venda desde 01/01/2023",
                    acao="**Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — "
                         "provavelmente não existe na loja. Ver a parte B.")

    if pre > 0 and cus / pre > 300:
        return dict(tipo="custo corrompido", custo_novo=None, evidencia=f"custo é {inte(cus/pre)}x o preço",
                    acao=f"**Corrigir o custo médio** pelo valor da última nota. O preço "
                         f"(R$ {brl(pre)}) provavelmente está certo.")

    m = EMBALAGEM.search(desc or "")
    if m:
        return dict(tipo="fator a confirmar", custo_novo=None,
                    evidencia=f"o nome diz '{m.group(1).upper()}' mas não diz quantas peças",
                    acao=f"**Abrir a nota** e ver quantas peças vêm no {m.group(1).upper()}.")

    if pre < 1:
        return dict(tipo="preço a conferir", custo_novo=None,
                    evidencia=f"preço de R$ {brl(pre)} com custo de R$ {brl(cus)}",
                    acao="**Conferir o preço** — pode ser o preço que está errado, não o custo.")

    return dict(tipo="conferir a nota", custo_novo=None, evidencia=f"custo {brl(cus/pre,1)}x o preço",
                acao="**Abrir a última nota de entrada** e comparar unidade, quantidade e valor.")


def classe_marca(a):
    if a["ent"] == 0 and a["ven"] == 0:
        return "fantasma"
    giro = a["ven"] / ANOS
    anos = a["sal"] / giro if giro > 0 else 999
    if a["ent"] == 0:
        return "morta" if anos > 3 else "saindo"
    return "encalhada" if anos > 3 else "ativa"


ROT_MARCA = {
    "fantasma": ("FANTASMA", "saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja"),
    "morta": ("MORTA", "não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual"),
    "saindo": ("SAINDO", "não se compra mais, mas ainda gira"),
    "encalhada": ("ENCALHADA", "ainda se compra, mas o saldo dá mais de 3 anos"),
    "ativa": ("ATIVA", "compra e gira"),
}

QUEM = {"fator de conversão": "quem dá entrada de NF (cadastro)",
        "fator de conversão (qtd estimada)": "confirmar a quantidade, depois cadastrar",
        "fator a confirmar": "abrir a nota primeiro",
        "custo corrompido": "ajuste de custo no ERP",
        "sem movimento": "contagem física (ver parte B)",
        "preço a conferir": "quem define preço",
        "conferir a nota": "abrir a nota primeiro"}


def main():
    snap = json.load(open(os.path.join(D, "snapshot.json"), encoding="utf-8"))["lojas"]
    marcas = snap["L1"]["marca"]
    ent = json.load(open(os.path.join(D, "entradas_desde.json"), encoding="utf-8"))["lojas"]

    resumo = {}
    for L in LOJAS:
        f = os.path.join(D, f"inv_analitico_{L}.json")
        if not os.path.exists(f):
            print(f"{L}: falta inv_analitico_{L}.json — rode: node scripts/inventario_marca.mjs {L} --analitico")
            continue
        inv = {x["cod"]: x for x in json.load(open(f, encoding="utf-8"))["produtos"]}

        # ── parte A: consertos ────────────────────────────────────────────
        achados = []
        for cod, x in inv.items():
            cus, sal = x["custo_unit"] or 0, x["saldo"] or 0
            if sal <= 0 or cus <= 0:
                continue
            pre = (snap[L]["prods"].get(cod) or {}).get("pre") or 0
            if not (pre > 0 and cus > pre * 3):
                continue
            mv = (ent.get(L) or {}).get(cod)
            d = decidir(cod, x["desc"], cus, pre, mv[0] if mv else 0, mv[1] if mv else 0)
            d.update(cod=cod, desc=x["desc"], marca=marcas.get(cod, "SEM MARCA"),
                     cus=cus, pre=pre, sal=sal, inflado=cus * sal,
                     economia=(cus - d["custo_novo"]) * sal if d["custo_novo"] is not None else None)
            achados.append(d)
        achados.sort(key=lambda y: -y["inflado"])

        # ── parte B: a marca existe? ──────────────────────────────────────
        agg = defaultdict(lambda: dict(prod=0, sal=0, ent=0, ven=0, valor=0.0))
        for cod, x in inv.items():
            sal = x["saldo"] or 0
            if sal <= 0:
                continue
            a = agg[marcas.get(cod, "SEM MARCA")]
            a["prod"] += 1
            a["sal"] += sal
            a["valor"] += (x["custo_unit"] or 0) * sal
            mv = (ent.get(L) or {}).get(cod)
            if mv:
                a["ent"] += mv[0]
                a["ven"] += mv[1]
        for m, a in agg.items():
            a["classe"] = classe_marca(a)

        total = sum(a["inflado"] for a in achados)
        porTipo = defaultdict(lambda: [0, 0.0])
        for a in achados:
            porTipo[a["tipo"]][0] += 1
            porTipo[a["tipo"]][1] += a["inflado"]
        porClasse = defaultdict(lambda: [0, 0, 0.0])
        for m, a in agg.items():
            c = porClasse[a["classe"]]
            c[0] += 1
            c[1] += a["sal"]
            c[2] += a["valor"]

        P = []
        w = P.append
        w(f"# Estoque {L} · {NOME_LOJA[L]}")
        w("")
        w("Fonte: **Registro de Inventário** do ERP (Suprimentos → Relatórios → Registro de Inventário),")
        w("puxado em 27/08/2026 — é o relatório que valoriza o estoque, o mesmo que você usa.")
        w("")
        w(f"Estoque declarado: **{inte(sum(a['sal'] for a in agg.values()))} peças · "
          f"R$ {brl(sum(a['valor'] for a in agg.values()))}** em {len(agg)} marcas.")
        w("")
        w("---")
        w("")
        w("# Parte A — produtos com custo errado")
        w("")
        w(f"**{len(achados)} produtos · R$ {brl(total)}** de valor que o sistema mostra e não existe.")
        w("")
        w("Critério: custo maior que 3x o preço de venda. Margem apertada acontece; vender a menos")
        w("de um terço do custo, não.")
        w("")
        if achados:
            w("| Tipo de conserto | Produtos | Valor | Quem resolve |")
            w("|---|---:|---:|---|")
            for t, (n, r) in sorted(porTipo.items(), key=lambda x: -x[1][1]):
                w(f"| {t} | {n} | R$ {brl(r)} | {QUEM.get(t,'—')} |")
            w("")
            w("> **A ordem importa:** fator de conversão antes do custo. Corrigindo só o custo, a")
            w("> próxima nota reintroduz o erro — a entrada continua lançando pacote como peça.")
            w("")
            porMarca = defaultdict(list)
            for a in achados:
                porMarca[a["marca"]].append(a)
            for m, itens in sorted(porMarca.items(), key=lambda kv: -sum(x["inflado"] for x in kv[1])):
                cl = ROT_MARCA[agg[m]["classe"]][0] if m in agg else "—"
                w(f"## {m}  ·  _{cl}_")
                w("")
                for a in itens:
                    w(f"### {a['cod']} — {a['desc']}")
                    w("")
                    w(f"- Custo no inventário: **R$ {brl(a['cus'])}** · preço: R$ {brl(a['pre'])} · "
                      f"saldo: {inte(a['sal'])} un · inflado: **R$ {brl(a['inflado'])}**")
                    w(f"- Evidência: {a['evidencia']}")
                    w(f"- **Conserto:** {a['acao']}")
                    if a["economia"]:
                        w(f"- Efeito: o estoque reduz R$ {brl(a['economia'])} (correção, não perda)")
                    w("")
        else:
            w("_Nenhum produto passou do critério nesta loja._")
        w("")
        w("---")
        w("")
        w("# Parte B — que marcas ainda existem na loja")
        w("")
        w("Medido por entrada e venda desde 01/01/2023. Marca com saldo e nenhum movimento em três")
        w("anos e meio quase certamente não está na prateleira — é saldo que ficou no sistema.")
        w("")
        w("| Situação | Marcas | Peças | Valor | O que significa |")
        w("|---|---:|---:|---:|---|")
        for k in ("fantasma", "morta", "saindo", "encalhada", "ativa"):
            if k in porClasse:
                n, s, v = porClasse[k]
                w(f"| **{ROT_MARCA[k][0]}** | {n} | {inte(s)} | R$ {brl(v)} | {ROT_MARCA[k][1]} |")
        w("")
        for k in ("fantasma", "morta"):
            lst = sorted(((m, a) for m, a in agg.items() if a["classe"] == k), key=lambda x: -x[1]["valor"])
            if not lst:
                continue
            w(f"## {ROT_MARCA[k][0]} — {ROT_MARCA[k][1]}")
            w("")
            w("| Marca | Produtos | Peças | Valor | Entrou | Vendeu |")
            w("|---|---:|---:|---:|---:|---:|")
            for m, a in lst:
                w(f"| {m} | {a['prod']} | {inte(a['sal'])} | R$ {brl(a['valor'])} | "
                  f"{inte(a['ent'])} | {inte(a['ven'])} |")
            w("")
        open(os.path.join(DIR, f"CONSERTOS_{L}.md"), "w", encoding="utf-8").write("\n".join(P) + "\n")
        resumo[L] = dict(n=len(achados), total=total, tipos=dict(porTipo), classes=dict(porClasse),
                         pecas=sum(a["sal"] for a in agg.values()),
                         valor=sum(a["valor"] for a in agg.values()))
        print(f"CONSERTOS_{L}.md → {len(achados)} consertos (R$ {brl(total)}) · "
              f"{porClasse['fantasma'][0]} marcas fantasma, {porClasse['morta'][0]} mortas")

    if not resumo:
        return
    I = []
    w = I.append
    w("# Estoque — as 4 lojas")
    w("")
    w("Fonte: **Registro de Inventário** do ERP, puxado em 27/08/2026.")
    w("")
    w("| Loja | | Peças | Valor no ERP | Consertos de custo | Marcas fantasma + mortas |")
    w("|---|---|---:|---:|---:|---:|")
    for L, r in resumo.items():
        f = r["classes"].get("fantasma", [0, 0, 0])[0] + r["classes"].get("morta", [0, 0, 0])[0]
        fv = r["classes"].get("fantasma", [0, 0, 0.0])[2] + r["classes"].get("morta", [0, 0, 0.0])[2]
        w(f"| **{L}** | {NOME_LOJA[L]} | {inte(r['pecas'])} | R$ {brl(r['valor'])} | "
          f"{r['n']} (R$ {brl(r['total'])}) | {f} (R$ {brl(fv)}) |")
    w("")
    w("## Onde está o dinheiro parado")
    w("")
    tot = defaultdict(lambda: [0, 0, 0.0])
    for r in resumo.values():
        for k, (n, s, v) in r["classes"].items():
            tot[k][0] += n
            tot[k][1] += s
            tot[k][2] += v
    w("| Situação | Marcas | Peças | Valor |")
    w("|---|---:|---:|---:|")
    for k in ("fantasma", "morta", "saindo", "encalhada", "ativa"):
        if k in tot:
            n, s, v = tot[k]
            w(f"| **{ROT_MARCA[k][0]}** — {ROT_MARCA[k][1]} | {n} | {inte(s)} | R$ {brl(v)} |")
    w("")
    w("_A mesma marca conta em mais de uma loja: as somas são por loja, não de marcas distintas._")
    w("")
    open(os.path.join(DIR, "CONSERTOS.md"), "w", encoding="utf-8").write("\n".join(I) + "\n")
    print("CONSERTOS.md (índice)")


if __name__ == "__main__":
    main()
