#!/usr/bin/env python3
"""
anomalias_custo.py — acha e CLASSIFICA os produtos com custo errado nas 4 lojas.

MÉTODO (27/08/2026). O Athila descobriu o caminho manual no ERP:
    Suprimentos → Relatórios → Registro de Inventário → agrupar por marca → sintético
    → acha a marca anômala → roda de novo analítico só nela → acha o produto.
Este script faz o mesmo de uma vez para as 4 lojas, usando o snapshot que o pipeline de
estoque já coleta (custo médio + preço de tabela dos ~56 mil produtos). O relatório do ERP
continua servindo de CONFERÊNCIA: para o produto 12408 os dois deram R$ 50.515,63, idêntico.

REGRA DE DETECÇÃO: custo médio > 3x o preço de venda. Vender abaixo do custo acontece; vender
a menos de um terço do custo, não. É um critério conservador de propósito — a ideia é não
inundar a lista com margem apertada legítima.

AS TRÊS CAUSAS (que é o que o Athila precisa separar para saber o que corrigir):

 1. FATOR DE CONVERSÃO — o mais comum. A nota traz CAIXA/FARDO/PACOTE e quem deu entrada
    lançou como se fosse 1 peça. O custo fica o do pacote inteiro e o preço fica o da peça.
    Assinatura: a quantidade do pacote está NO NOME do produto ("(72 UN)", "C/250", "CX").
    Prova: custo ÷ quantidade-do-pacote dá uma margem normal contra o preço.
    Ex.: KISS NY NAVALHA (72 UN) → custo 243,72 ÷ 72 = 3,38 · preço 6,90 · margem 104%.

 2. CUSTO MÉDIO CORROMPIDO — o custo explode para um valor sem relação com nada.
    Mecanismo conhecido: o custo médio é recalculado como valor÷quantidade; quando o saldo
    está NEGATIVO e quase anula a entrada, o denominador vai a quase zero e o custo estoura.
    Foi o efeito colateral do balanço de junho/2026 (que zerou negativos).
    Ex.: 12408 MASCARA MATIZADOR COBRE AMEND → custo 50.515,63 com a nota dizendo 48,73.

 3. PREÇO DE VENDA ERRADO — o custo está certo e quem está fora é o preço (centavos num
    produto que não é de centavos). Aparece junto com a causa 1 e precisa de olho humano.

Uso: python3 anomalias_custo.py [--loja L1] [--md saida.md]
"""
import json
import os
import re
import sys

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dados_estoque")
LOJAS = ("L1", "L3", "L4", "L5")

# Quantidade de peças por embalagem, quando o próprio nome do produto revela.
# Ordem importa: os padrões mais específicos primeiro.
PACOTE = [
    re.compile(r"\((\d{2,4})\s*UN\)", re.I),         # "(72 UN)"
    re.compile(r"\bC/\s*(\d{2,4})\b", re.I),          # "POTE C/250", "C/48"
    re.compile(r"\bCX\s*(\d{2,4})\b", re.I),          # "CX 100"
    re.compile(r"\b(\d{2,4})\s*CX\b", re.I),          # "490CX"
    re.compile(r"\bPCT\s*C?/?\s*(\d{2,4})\b", re.I),  # "PCT 12"
    re.compile(r"\bC(\d{2,4})\b"),                    # "C48"
    re.compile(r"\b(\d{2,4})\s*UN\b", re.I),          # "40UN" (sem parênteses)
    re.compile(r"\b(\d{1,3})\s*PACKS?\b", re.I),      # "5PACKS"
    re.compile(r"\b(\d{2,4})\s*$"),                    # número solto no fim: "TOALHA ... 250"
]

# Palavras que denunciam EMBALAGEM mesmo sem dizer a quantidade. Não dá para calcular o custo
# unitário nesses, mas já muda a pergunta: "quantas peças vêm nisso?" em vez de "por que o custo
# está alto?". FD=fardo, CX=caixa, PCT=pacote.
EMBALAGEM = re.compile(r"\b(FD|FARDO|CX|CAIXA|PCT|PACOTE|POTE|ROLO|BOLA|DISPLAY|KIT)\b", re.I)


def brl(v, dec=2):
    if v is None:
        return "—"
    return f"{v:,.{dec}f}".replace(",", "\x00").replace(".", ",").replace("\x00", ".")


def qtd_embalagem(desc: str):
    """Quantas peças o nome do produto diz que a embalagem tem (None se não diz)."""
    for p in PACOTE:
        m = p.search(desc or "")
        if m:
            n = int(m.group(1))
            if 2 <= n <= 5000:
                return n
    return None


def classificar(cus, pre, desc):
    """→ (causa, detalhe). Ver as três causas no cabeçalho."""
    n = qtd_embalagem(desc)
    if n:
        unit = cus / n
        # O custo unitário implícito tem que caber abaixo do preço para fechar a história.
        if unit <= pre:
            margem = (pre / unit - 1) * 100 if unit else 0
            return ("fator de conversão",
                    f"embalagem de {n} → custo real R$ {brl(unit)}/un · margem {margem:,.0f}%".replace(",", "."))
        return ("fator de conversão?", f"nome diz {n} un, mas {brl(cus)}÷{n} = {brl(unit)} ainda passa do preço")
    if pre > 0 and cus / pre > 300:
        return ("custo corrompido", f"custo é {cus/pre:,.0f}x o preço — sem relação com nada".replace(",", "."))
    m = EMBALAGEM.search(desc or "")
    if m:
        return ("embalagem sem quantidade",
                f"o nome diz '{m.group(1).upper()}' mas não diz quantas peças — conferir a nota")
    if pre < 1:
        return ("preço suspeito", f"preço de R$ {brl(pre)} num produto de custo R$ {brl(cus)}")
    return ("a investigar", f"custo {cus/pre:,.1f}x o preço".replace(",", "."))


def main():
    snap = json.load(open(os.path.join(BASE, "snapshot.json"), encoding="utf-8"))["lojas"]
    marca = snap["L1"]["marca"]
    so = None
    if "--loja" in sys.argv:
        so = sys.argv[sys.argv.index("--loja") + 1].upper()

    achados = {}
    for L in LOJAS:
        for cod, p in snap[L]["prods"].items():
            cus, pre, sal = p.get("cus") or 0, p.get("pre") or 0, p.get("sal") or 0
            if cus > 0 and pre > 0 and cus > pre * 3:
                a = achados.setdefault(cod, dict(cod=cod, desc=p["d"], cus=cus, pre=pre,
                                                 marca=marca.get(cod, "—"), sal={}))
                a["sal"][L] = sal

    for cod, v in achados.items():
        v["causa"], v["detalhe"] = classificar(v["cus"], v["pre"], v["desc"])
        v["pecas"] = sum(x for x in v["sal"].values() if x > 0)
        v["inflado"] = v["cus"] * v["pecas"]
        if so:
            v["pecas_loja"] = max(v["sal"].get(so, 0), 0)
            v["inflado_loja"] = v["cus"] * v["pecas_loja"]

    chave = "inflado_loja" if so else "inflado"
    lista = sorted((x for x in achados.values() if x.get(chave, 0) > 0), key=lambda y: -y[chave])

    porCausa = {}
    for v in lista:
        c = porCausa.setdefault(v["causa"], dict(n=0, r=0.0))
        c["n"] += 1
        c["r"] += v[chave]

    linhas = []
    P = linhas.append
    alvo = so or "as 4 lojas"
    P(f"# Custos errados no estoque — {alvo}")
    P("")
    P("Critério: **custo médio maior que 3x o preço de venda**. Vender com margem apertada")
    P("acontece; vender a menos de um terço do custo, não — então isso é dado errado, não negócio ruim.")
    P("")
    P(f"Fonte: snapshot do pipeline de estoque (coleta de 26/08). Conferido contra o Registro de")
    P("Inventário do ERP: para o produto 12408 as duas fontes deram R$ 50.515,63, idêntico.")
    P("")
    P(f"**{len(lista)} produtos · R$ {brl(sum(v[chave] for v in lista))} de valor que não existe.**")
    P("")
    P("## Por causa provável")
    P("")
    P("| Causa | Produtos | Valor inflado | O que corrigir |")
    P("|---|---:|---:|---|")
    COMO = {
        "fator de conversão": "o fator no cadastro **e** relançar/ajustar o custo da entrada",
        "fator de conversão?": "conferir a nota — o nome sugere embalagem, mas a conta não fecha",
        "custo corrompido": "só o **custo médio**, pelo valor da última nota de entrada",
        "preço suspeito": "conferir se o errado é o preço, não o custo",
        "a investigar": "abrir a nota de entrada e decidir",
    }
    for causa, c in sorted(porCausa.items(), key=lambda x: -x[1]["r"]):
        P(f"| {causa} | {c['n']} | R$ {brl(c['r'])} | {COMO.get(causa,'—')} |")
    P("")
    P("## Produtos, do maior valor inflado para o menor")
    P("")
    P("| # | Código | Produto | Marca | Custo | Preço | Peças | Valor inflado | Causa provável | Evidência |")
    P("|---:|---|---|---|---:|---:|---:|---:|---|---|")
    for i, v in enumerate(lista[:120], 1):
        P(f"| {i} | {v['cod']} | {v['desc'][:40]} | {v['marca'][:18]} | {brl(v['cus'])} "
          f"| {brl(v['pre'])} | {int(v['pecas_loja' if so else 'pecas'])} | {brl(v[chave])} "
          f"| {v['causa']} | {v['detalhe']} |")
    P("")
    if len(lista) > 120:
        P(f"_(mostrando os 120 maiores de {len(lista)}; o resto está no JSON ao lado)_")
    texto = "\n".join(linhas) + "\n"

    if "--md" in sys.argv:
        dest = sys.argv[sys.argv.index("--md") + 1]
        open(dest, "w", encoding="utf-8").write(texto)
        json.dump({k: v for k, v in achados.items()},
                  open(dest.replace(".md", ".json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print(f"gravado: {dest}")
    else:
        print(texto)

    for causa, c in sorted(porCausa.items(), key=lambda x: -x[1]["r"]):
        print(f"  {causa:<22} {c['n']:>5} produtos   R$ {brl(c['r'])}")


if __name__ == "__main__":
    main()
