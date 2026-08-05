#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// conferencia_supabase.mjs — grava no histórico do painel a conciliação que o
// robô fez sozinho, para o Athila poder abrir e investigar sem refazer upload.
//
// ⚠️ CIFRADO, SEMPRE. O payload tem valores e NOME DE CLIENTE, e o repositório /
// Supabase são acessíveis com a chave anon. Cifra aqui com a senha do painel
// (Keychain `amgomes-caixa`), exatamente o mesmo envelope que o navegador usa:
// AES-256-GCM, PBKDF2-SHA256 com 200.000 iterações, tag de autenticação
// concatenada no fim do ciphertext (é assim que o WebCrypto do painel espera
// receber — separar a tag faz o `decifrarTexto` do app falhar sem explicar).
//
// Em claro sobem só loja, período e nome dos arquivos, que é o que a tela do
// histórico precisa para listar.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const SUPA_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPA_TAB = "conferencia_caixa_conciliacoes";
// Chave anon: é pública por natureza (vai no HTML publicado). O que protege o
// dado é a senha do painel, não ela.
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const ITERS = 200000;   // tem que ser igual ao do build/painel, senão não decifra

function senhaPainel() {
  try {
    return execFileSync("/usr/bin/security",
      ["find-generic-password", "-s", "amgomes-caixa", "-w"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("não achei a senha do painel no Keychain (serviço amgomes-caixa).");
  }
}

function cifrar(texto, senha) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(senha, salt, ITERS, 32, "sha256");
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return {
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    iters: ITERS,
    payload: Buffer.concat([ct, c.getAuthTag()]).toString("base64"),
  };
}

const periodoDe = (alvo) => {
  const ps = [alvo.cartao, alvo.pix].filter(Boolean);
  if (!ps.length) return null;
  return { ini: ps.map(p => p.ini).sort()[0], fim: ps.map(p => p.fim).sort().slice(-1)[0] };
};

// `alvo` é o objeto devolvido por conciliar() do conciliar_headless.mjs.
export async function salvar(alvo, { teste = false } = {}) {
  const per = periodoDe(alvo);
  if (!per) return { ok: false, motivo: "sem período reconhecível (nenhuma forma conciliada)" };
  if (teste) return { ok: false, motivo: "modo teste — não gravado" };

  // Mesmo formato que o painel grava, para o histórico dele abrir sem adaptação.
  const conteudo = JSON.stringify({
    versao: 1,
    loja: alvo.loja,
    cartao: alvo.cartao || null,
    pix: alvo.pix || null,
    conta: alvo.conta || null,
    arquivos: alvo.arquivos,          // inclui o CSV bruto, para reprocessar depois
  });

  const corpo = {
    loja: alvo.loja,
    periodo_ini: per.ini,
    periodo_fim: per.fim,
    arquivos: (alvo.arquivos || []).map(a => ({ nome: a.nome, tipo: a.tipo, imp: a.imp || null })),
    ...cifrar(conteudo, senhaPainel()),
  };

  const r = await fetch(
    SUPA_URL + "/rest/v1/" + SUPA_TAB + "?on_conflict=loja,periodo_ini,periodo_fim&select=id",
    {
      method: "POST",
      headers: {
        apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(corpo),
    });

  if (!r.ok) return { ok: false, motivo: "Supabase respondeu " + r.status + ": " + (await r.text()).slice(0, 160) };
  let id = null;
  try { const [row] = await r.json(); id = row?.id ?? null; } catch {}
  return { ok: true, id, periodo: per, kb: Math.round(corpo.payload.length / 1024) };
}
