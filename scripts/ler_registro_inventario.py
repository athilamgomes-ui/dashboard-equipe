#!/usr/bin/env python3
"""
ler_registro_inventario.py — lê o "Registro de Inventário" exportado do Microvix.

POR QUE EXISTE (27/08/2026): o Athila descobriu um caminho muito mais rápido de achar
anomalia de custo/ICMS/saldo do que varrer o catálogo inteiro:
    Suprimentos → Relatórios → Registro de Inventário
    → agrupar por MARCA, ordem por REFERÊNCIA, UMA empresa, SINTÉTICO → Gerar
Isso devolve saldo e custo total POR MARCA. Onde tiver anomalia, roda de novo só naquela
marca em ANALÍTICO, ordem por NOME DO PRODUTO, e aí aparece produto a produto.

DOIS CUIDADOS que já queimaram antes e estão resolvidos aqui:
 1) O arquivo tem extensão .xls mas é HTML. pandas.read_html desalinha as colunas e come
    as vírgulas decimais ("135,66" vira 13566). Por isso o parser é célula a célula.
 2) ENCODING MISTO. A maior parte dos nomes vem em UTF-8 correto (BRAÉ, CAPIM LIMÃO), mas
    parte foi gravada em MacRoman e lida como cp1252: ƒ=É, ò=Ú, å=Â, «=´.
    O reparo (cp1252→mac_roman) conserta esses e ESTRAGA os que já estavam certos
    (BRAÉ → BRA…). Por isso só é aplicado quando o resultado fica melhor.

Uso:  python3 ler_registro_inventario.py <arquivo.xls> [--json saida.json]
"""
import re
import sys
import json
import unicodedata

# Caracteres que um nome de marca em português pode legitimamente ter.
OK = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
         " -_.,'/&()+ºª°ÀÁÂÃÄÇÉÊËÍÎÓÔÕÖÚÜÑàáâãäçéêëíîóôõöúüñ")


def repara_nome(s: str) -> str:
    """Conserta o mojibake MacRoman→cp1252, mas só quando o resultado melhora."""
    if all(c in OK for c in s):
        return s                                   # já está limpo, não mexer
    try:
        alt = s.encode("cp1252", "strict").decode("mac_roman", "strict")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s
    ruins_antes = sum(c not in OK for c in s)
    ruins_depois = sum(c not in OK for c in alt)
    return alt if ruins_depois < ruins_antes else s


def num(v: str):
    """'2.706,99' → 2706.99 ; '' → None. Formato pt-BR: ponto=milhar, vírgula=decimal."""
    v = (v or "").strip().replace("&nbsp;", "").replace("\xa0", "")
    if not v:
        return None
    neg = v.startswith("-") or (v.startswith("(") and v.endswith(")"))
    v = v.strip("-()")
    v = v.replace(".", "").replace(",", ".")
    try:
        n = float(v)
    except ValueError:
        return None
    return -n if neg else n


TAG = re.compile(r"<[^>]+>")
CELULA = re.compile(r"<td\b[^>]*>(.*?)</td>", re.S | re.I)
LINHA = re.compile(r"<tr\b[^>]*>(.*?)</tr>", re.S | re.I)


def texto(html: str) -> str:
    t = TAG.sub("", html)
    t = t.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    return re.sub(r"\s+", " ", t).strip()


COMENTARIO = re.compile(r"<!--.*?-->", re.S)


def ler(caminho: str):
    html = open(caminho, encoding="utf-8", errors="replace").read()
    # ⚠️ O relatório traz uma coluna DESATIVADA dentro de comentário HTML:
    #     <!--<TD width="5%">&nbsp;</TD>-->
    # Sem tirar os comentários, o regex de <td> a conta e TODAS as colunas andam uma casa
    # (o saldo cai na coluna do custo e o custo some). Foi o que fez o total da L1 dar R$ 724.
    html = COMENTARIO.sub("", html)
    linhas = []
    for tr in LINHA.findall(html):
        cels = [texto(c) for c in CELULA.findall(tr)]
        if len(cels) >= 9:
            linhas.append(cels[:9])
    return linhas


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    caminho = sys.argv[1]
    linhas = ler(caminho)

    marcas, produtos = [], []
    for c in linhas:
        cod, desc, ref, emp, und, cst, saldo, cunit, subtotal = c
        if desc in ("Descrição", "") or "Descri" in desc and not cod:
            pass
        # linha de MARCA (sintético): código vazio, descrição no formato "<num>-<NOME>"
        m = re.match(r"^(\d+)\s*-\s*(.+)$", desc)
        if not cod and m:
            marcas.append(dict(
                cod_marca=m.group(1), marca=repara_nome(m.group(2).strip()),
                saldo=num(saldo), custo_total=num(subtotal),
            ))
        elif cod and cod.isdigit():
            produtos.append(dict(
                cod=cod, desc=repara_nome(desc), ref=ref, emp=emp, und=und, cst=cst,
                saldo=num(saldo), custo_unit=num(cunit), custo_total=num(subtotal),
            ))

    modo = "ANALÍTICO" if produtos else "SINTÉTICO"
    print(f"arquivo : {caminho}")
    print(f"modo    : {modo}  ({len(marcas)} marcas, {len(produtos)} produtos)")

    if "--json" in sys.argv:
        saida = sys.argv[sys.argv.index("--json") + 1]
        json.dump(dict(modo=modo, marcas=marcas, produtos=produtos),
                  open(saida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"gravado : {saida}")
    return marcas, produtos


if __name__ == "__main__":
    main()
