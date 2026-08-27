#!/usr/bin/env python3
"""
lista_consertos.py — a lista de conserto do estoque, UMA POR LOJA, marca → produto → o que fazer.

Pedido do Athila em 27/08/2026, depois de o método dele (Registro de Inventário agrupado por
marca) revelar que 30,4% do valor do estoque da L1 é custo errado.

COMO CADA CONSERTO É DECIDIDO — três evidências, nessa ordem de força:

 1. QUANTIDADE NO NOME DO PRODUTO. "KISS NAVALHA (72 UN)", "TOALHA ... 250", "40UN/FD".
    É a mais forte porque foi alguém escrevendo o que vem na embalagem.
 2. COMPROU × VENDEU desde 2023 (entradas_desde.json). Comprar 3 e vender 339 só é possível
    se cada "unidade" comprada for um pacote. Serve para ESTIMAR o tamanho do pacote quando o
    nome não diz, e para CONFIRMAR quando diz.
 3. CUSTO ÷ PACOTE contra o PREÇO. Se o custo unitário implícito cabe abaixo do preço com
    margem plausível, a história fecha. Se não cabe, o caso vai para "conferir a nota".

O que NÃO é fator de conversão cai em duas outras caixas:
 · custo corrompido  — custo sem relação com nada e quantidades de compra normais (ex.: 12408,
   custo R$ 50.515,63 com a nota dizendo R$ 48,73). Conserto = só o custo médio.
 · saldo sem origem  — tem peça e nenhuma compra desde 2023. Não se conserta com custo: conta-se.

Uso: python3 lista_consertos.py [--dir ..]
Saída: CONSERTOS_L1.md, CONSERTOS_L3.md, CONSERTOS_L4.md, CONSERTOS_L5.md
"""
import json
import os
import re
import sys
from collections import defaultdict

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
D = os.path.join(DIR, "dados_estoque")
LOJAS = ("L1", "L3", "L4", "L5")
NOME_LOJA = {"L1": "Casa da Beleza Altamira", "L3": "Casa da Beleza Itaituba",
             "L4": "MissBeleza Altamira", "L5": "MissBeleza Santarém"}

# Custos já confirmados lendo a nota de entrada no ERP (27/08/2026).
CONFIRMADO = {
    "12408": ("custo", 48.73, "NF 60160/1 de 28/02/25 — 12,00 UN a R$ 48,73 (SAFIRA)"),
    "49391": ("fator", None, "NF 47266/1 — 2,00 UN a R$ 210,00 (ERS)"),
    "11043": ("fator", None, "NF 47266/1 — 3,00 UN a R$ 232,00 (ERS)"),
    "17704": ("fator", None, "NF 47266/1 — 2,00 UN a R$ 196,00 (ERS)"),
    "60951": ("fator", None, "NF 47266/1 — 2,00 UN a R$ 210,00 (ERS)"),
    "49396": ("fator", None, "NF 47266/1 — 3,00 UN a R$ 188,00 (ERS)"),
    "49392": ("fator", None, "NF 47266/1 — 3,00 UN a R$ 164,00 (ERS)"),
    "49393": ("fator", None, "NF 32238/1 — 5,00 UN a R$ 254,80 (ERS)"),
    "17665": ("fator", None, "NF 647502/1 — **1,00 CX** a R$ 71,75 (SANTA CLARA)"),
    "204099": ("fator", None, "NF 553874/1 — 1,00 UN a R$ 253,87 (IMBECOR)"),
    "204098": ("fator", None, "NF 553874/1 — 1,00 UN a R$ 253,87 (IMBECOR)"),
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
    """Inteiro com ponto de milhar pt-BR. Existe porque aplicar .replace(",", ".") na FRASE
    inteira (o que eu fazia antes) trocava também a vírgula que separa as palavras:
    'comprou 3, vendeu 339' virava 'comprou 3. vendeu 339'."""
    return f"{int(round(v)):,d}".replace(",", ".")


def qtd_no_nome(desc):
    for rx, fmt in PACOTE:
        m = rx.search(desc or "")
        if m:
            n = int(m.group(1))
            if 2 <= n <= 5000:
                return n, fmt.format(n)
    return None, None


def decidir(cod, desc, cus, pre, ent, ven, mesma_loja=True):
    """→ dict(tipo, acao, evidencia, custo_novo, pacote)

    mesma_loja=False quando o histórico veio de OUTRA loja (mesmo código). Nesse caso a razão
    comprou×vendeu continua valendo como prova de embalagem (o cadastro é do grupo), mas a regra
    "sem compra desde 2023" NÃO vale — não comprar na L4 não diz nada sobre a L3.
    """
    conf = CONFIRMADO.get(cod)
    n_nome, origem_nome = qtd_no_nome(desc)
    razao = (ven / ent) if (ent and ent > 0 and ven) else None

    # ── custo corrompido confirmado na nota ────────────────────────────────
    if conf and conf[0] == "custo":
        novo = conf[1]
        return dict(tipo="custo corrompido", custo_novo=novo, pacote=None,
                    evidencia=f"✅ conferido: {conf[2]}",
                    acao=f"Corrigir o **custo médio** de R$ {brl(cus)} para **R$ {brl(novo)}**. "
                         f"Não mexer no preço (R$ {brl(pre)} está certo) nem no saldo.")

    # ── fator de conversão ─────────────────────────────────────────────────
    n = n_nome or (round(razao) if razao and razao >= 5 else None)
    if n and n >= 2:
        unit = cus / n
        ev = []
        if origem_nome:
            ev.append(origem_nome)
        if razao and razao >= 5:
            ev.append(f"comprou {inte(ent)}, vendeu {inte(ven)} (razão {inte(razao)}x)")
        if conf:
            ev.append(f"✅ {conf[2]}")
        # De onde veio o número do pacote muda o quanto dá para confiar nele.
        estimado = n_nome is None
        if unit <= pre:
            margem = (pre / unit - 1) * 100 if unit else 0
            if estimado:
                acao = (f"Cadastrar fator de conversão. Pelo histórico o pacote tem **~{inte(n)} peças** "
                        f"(estimativa: comprou {inte(ent)}, vendeu {inte(ven)}) — **confirmar o número exato "
                        f"na nota ou na embalagem antes de gravar**. Com {inte(n)}, o custo unitário cai de "
                        f"R$ {brl(cus)} para R$ {brl(unit)}, margem de {inte(margem)}% sobre R$ {brl(pre)}.")
            else:
                acao = (f"Cadastrar **fator de conversão = {inte(n)}** (está no nome do produto). "
                        f"O custo unitário cai de R$ {brl(cus)} para **R$ {brl(unit)}** — margem de "
                        f"{inte(margem)}% sobre o preço de R$ {brl(pre)}.")
            return dict(tipo="fator de conversão" if not estimado else "fator de conversão (qtd estimada)",
                        custo_novo=unit, pacote=n, evidencia=" · ".join(ev) or "—", acao=acao)
        extra = ""
        if pre < 1:
            extra = (f" ⚠️ E o preço de R$ {brl(pre)} também não se sustenta — conferir os dois, "
                     f"custo e preço.")
        return dict(tipo="fator a confirmar", custo_novo=None, pacote=n,
                    evidencia=" · ".join(ev) or "—",
                    acao=f"Parece embalagem de {inte(n)}, mas R$ {brl(cus)} ÷ {inte(n)} = R$ {brl(unit)}, "
                         f"que ainda passa do preço de R$ {brl(pre)}. **Abrir a nota** e ver a unidade.{extra}")

    # ── saldo sem origem ───────────────────────────────────────────────────
    if mesma_loja and ent is not None and ent == 0:
        return dict(tipo="saldo sem origem", custo_novo=None, pacote=None,
                    evidencia="nenhuma entrada desde 01/01/2023",
                    acao="**Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — "
                         "não se conserta mexendo em custo.")

    # ── custo corrompido (sem nota lida) ───────────────────────────────────
    if pre > 0 and cus / pre > 300:
        return dict(tipo="custo corrompido", custo_novo=None, pacote=None,
                    evidencia=f"custo é {inte(cus/pre)}x o preço",
                    acao=f"**Corrigir o custo médio** pelo valor da última nota de entrada. "
                         f"O preço (R$ {brl(pre)}) provavelmente está certo.")

    if EMBALAGEM.search(desc or ""):
        m = EMBALAGEM.search(desc).group(1).upper()
        return dict(tipo="fator a confirmar", custo_novo=None, pacote=None,
                    evidencia=f"o nome diz '{m}' mas não diz quantas peças",
                    acao=f"**Abrir a nota** e descobrir quantas peças vêm no {m}. Provável fator de conversão.")

    if pre < 1:
        return dict(tipo="preço a conferir", custo_novo=None, pacote=None,
                    evidencia=f"preço de R$ {brl(pre)} com custo de R$ {brl(cus)}",
                    acao="**Conferir o preço** — pode ser o preço que está errado, não o custo.")

    return dict(tipo="conferir a nota", custo_novo=None, pacote=None,
                evidencia=f"custo {brl(cus/pre,1)}x o preço",
                acao="**Abrir a última nota de entrada** e comparar unidade, quantidade e valor.")


def main():
    snap = json.load(open(os.path.join(D, "snapshot.json"), encoding="utf-8"))["lojas"]
    marcas = snap["L1"]["marca"]
    try:
        ent = json.load(open(os.path.join(D, "entradas_desde.json"), encoding="utf-8"))["lojas"]
    except FileNotFoundError:
        ent = {}

    resumo = {}
    for L in LOJAS:
        achados = []
        for cod, p in snap[L]["prods"].items():
            cus, pre, sal = p.get("cus") or 0, p.get("pre") or 0, p.get("sal") or 0
            if sal <= 0 or not (cus > 0 and pre > 0 and cus > pre * 3):
                continue
            ev = (ent.get(L) or {}).get(cod)
            de_onde = L
            if not ev:
                # Sem histórico nesta loja? Usa o do MESMO código em outra loja.
                # É legítimo: o cadastro do produto (e portanto o fator de conversão) é do GRUPO,
                # não da empresa — o custo médio vem idêntico nas 4 lojas no snapshot. O que a
                # outra loja prova sobre "1 unidade comprada = 1 pacote" vale para esta também.
                for outra in LOJAS:
                    alt = (ent.get(outra) or {}).get(cod)
                    if alt and (alt[0] or alt[1]):
                        ev, de_onde = alt, outra
                        break
            e_, v_ = (ev[0], ev[1]) if ev else (None, None)
            d = decidir(cod, p["d"], cus, pre, e_, v_, mesma_loja=(de_onde == L))
            if ev and de_onde != L:
                d["evidencia"] += f" _(histórico da {de_onde} — mesmo código, cadastro é do grupo)_"
            d.update(cod=cod, desc=p["d"], marca=marcas.get(cod, "SEM MARCA"),
                     cus=cus, pre=pre, sal=sal, inflado=cus * sal,
                     economia=(cus - d["custo_novo"]) * sal if d["custo_novo"] is not None else None)
            achados.append(d)

        achados.sort(key=lambda x: -x["inflado"])
        porMarca = defaultdict(list)
        for a in achados:
            porMarca[a["marca"]].append(a)
        ordem = sorted(porMarca.items(), key=lambda kv: -sum(x["inflado"] for x in kv[1]))

        total = sum(a["inflado"] for a in achados)
        porTipo = defaultdict(lambda: [0, 0.0])
        for a in achados:
            porTipo[a["tipo"]][0] += 1
            porTipo[a["tipo"]][1] += a["inflado"]

        P = []
        w = P.append
        w(f"# Consertos de estoque — {L} · {NOME_LOJA[L]}")
        w("")
        w(f"**{len(achados)} produtos · R$ {brl(total)} de valor que o sistema mostra e não existe.**")
        w("")
        w("Critério: custo médio maior que 3x o preço de venda, com saldo nesta loja. Margem apertada")
        w("acontece; vender a menos de um terço do custo, não — isso é dado errado, não negócio ruim.")
        w("")
        w("Fonte: snapshot do pipeline de estoque (26/08) + histórico de compra/venda desde 2023.")
        w("Onde aparece ✅, o custo foi conferido lendo a nota de entrada no ERP.")
        w("")
        w("## Resumo do que fazer")
        w("")
        w("| Tipo de conserto | Produtos | Valor envolvido | Quem resolve |")
        w("|---|---:|---:|---|")
        QUEM = {
            "fator de conversão": "quem dá entrada de NF (cadastro do produto)",
            "fator a confirmar": "abrir a nota primeiro",
            "custo corrompido": "ajuste de custo no ERP",
            "saldo sem origem": "contagem física na loja",
            "preço a conferir": "quem define preço",
            "conferir a nota": "abrir a nota primeiro",
        }
        for t, (n, r) in sorted(porTipo.items(), key=lambda x: -x[1][1]):
            w(f"| {t} | {n} | R$ {brl(r)} | {QUEM.get(t,'—')} |")
        w("")
        w("> **A ordem importa:** corrigir o fator de conversão ANTES do custo. Se corrigir só o")
        w("> custo, a próxima nota daquele produto reintroduz o erro, porque a entrada continua")
        w("> lançando pacote como peça.")
        w("")
        w("---")
        w("")
        for marca, itens in ordem:
            sub = sum(x["inflado"] for x in itens)
            w(f"## {marca}")
            w("")
            w(f"_{len(itens)} produto(s) · R$ {brl(sub)}_")
            w("")
            for a in itens:
                w(f"### {a['cod']} — {a['desc']}")
                w("")
                w(f"- Custo no ERP: **R$ {brl(a['cus'])}** · preço de venda: R$ {brl(a['pre'])} · "
                  f"saldo: {brl(a['sal'],0)} un · valor inflado: **R$ {brl(a['inflado'])}**")
                w(f"- Evidência: {a['evidencia']}")
                w(f"- **Conserto:** {a['acao']}")
                if a["economia"]:
                    w(f"- Efeito: o estoque desta loja reduz R$ {brl(a['economia'])} (correção, não perda)")
                w("")
            w("")
        open(os.path.join(DIR, f"CONSERTOS_{L}.md"), "w", encoding="utf-8").write("\n".join(P) + "\n")
        resumo[L] = (len(achados), total, dict(porTipo))
        print(f"CONSERTOS_{L}.md → {len(achados)} produtos · R$ {brl(total)}")

    tot = defaultdict(lambda: [0, 0.0])
    for L, (n, t, pt) in resumo.items():
        for k, (a, b) in pt.items():
            tot[k][0] += a
            tot[k][1] += b

    # ── índice consolidado ────────────────────────────────────────────────
    I = []
    w = I.append
    w("# Consertos de estoque — as 4 lojas")
    w("")
    w("Uma lista por loja, organizada **marca → produto → o que fazer**. Cada lista é autônoma:")
    w("dá para mandar a da loja para quem trabalha nela sem precisar do resto.")
    w("")
    w("| Loja | | Produtos | Valor que não existe | Lista |")
    w("|---|---|---:|---:|---|")
    for L in LOJAS:
        n, t, _ = resumo[L]
        w(f"| **{L}** | {NOME_LOJA[L]} | {n} | R$ {brl(t)} | [CONSERTOS_{L}.md](CONSERTOS_{L}.md) |")
    w(f"| | **Total** | **{sum(n for n,_,_ in resumo.values())}** | **R$ {brl(sum(t for _,t,_ in resumo.values()))}** | |")
    w("")
    w("## Por tipo de conserto (as 4 lojas)")
    w("")
    w("| Tipo | Produtos | Valor | O que significa |")
    w("|---|---:|---:|---|")
    SIG = {
        "fator de conversão": "a quantidade da embalagem está no nome do produto — é só cadastrar",
        "fator de conversão (qtd estimada)": "é embalagem, mas o número exato precisa sair da nota antes de gravar",
        "fator a confirmar": "cheira a embalagem e a conta não fecha — abrir a nota",
        "custo corrompido": "custo sem relação com nada; quantidades de compra normais",
        "saldo sem origem": "tem peça e nenhuma compra desde 2023 — não é custo, é contagem",
        "preço a conferir": "pode ser o preço que está errado, não o custo",
        "conferir a nota": "sem evidência suficiente aqui — precisa abrir a nota",
    }
    for k, (a, b) in sorted(tot.items(), key=lambda x: -x[1][1]):
        w(f"| {k} | {a} | R$ {brl(b)} | {SIG.get(k,'—')} |")
    w("")
    w("## A ordem de fazer")
    w("")
    w("1. **Fator de conversão primeiro.** Se corrigir só o custo, a próxima nota daquele produto")
    w("   reintroduz o erro — a entrada continua lançando pacote como peça.")
    w("2. **Depois o custo médio** dos que ficaram (custo corrompido).")
    w("3. **Contagem por último**, para os de saldo sem origem — e aí já com o custo certo,")
    w("   senão conta-se duas vezes.")
    w("")
    w("> O valor do estoque cai conforme os consertos entram. Isso aparece no balanço e **é")
    w("> correção de um número que nunca existiu, não perda** — mas o contador precisa saber antes.")
    w("")
    open(os.path.join(DIR, "CONSERTOS.md"), "w", encoding="utf-8").write("\n".join(I) + "\n")
    print("CONSERTOS.md (índice)")

    print()
    print("por tipo:")
    for k, (a, b) in sorted(tot.items(), key=lambda x: -x[1][1]):
        print(f"  {k:<34} {a:>5} produtos  R$ {brl(b)}")
    print(f"\nTOTAL 4 lojas: R$ {brl(sum(t for _, t, _ in resumo.values()))}")


if __name__ == "__main__":
    main()
