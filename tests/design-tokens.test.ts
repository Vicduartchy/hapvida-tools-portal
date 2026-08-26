import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Garante que as cores de marca PRIMÁRIAS (azul, vermelho, laranja, amarelo,
 * preto, branco) definidas em design/tokens.css não divergem entre as
 * ferramentas HTML do Hub — o tipo de drift que causou, por exemplo,
 * --cinza-bg/--cinza-borda ficarem diferentes entre ferramentas ao longo
 * do tempo por causa de copy-paste manual entre arquivos.
 *
 * Tokens secundários (cinza-bg, cinza-borda, cinza-texto, sombra) não são
 * cobertos aqui de propósito: hoje eles já variam legitimamente entre
 * ferramentas e alinhar isso é uma decisão de QA visual, não de
 * arquitetura — ver design/tokens.css para o motivo.
 */

const FERRAMENTAS_DIR = path.resolve(
  process.cwd(),
  "client/public/ferramentas",
);

function parseCssVars(cssText: string): Record<string, string> {
  const rootMatch = cssText.match(/:root\s*\{([^}]*)\}/s);
  if (!rootMatch) return {};
  const vars: Record<string, string> = {};
  const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = varRegex.exec(rootMatch[1])) !== null) {
    vars[m[1]] = m[2].trim().toLowerCase();
  }
  return vars;
}

const canonical = parseCssVars(
  readFileSync(path.resolve(process.cwd(), "design/tokens.css"), "utf-8"),
);

const CORE_TOKENS = [
  "azul",
  "azul-escuro",
  "vermelho",
  "laranja",
  "amarelo",
  "branco",
  "preto",
];

const ferramentas = readdirSync(FERRAMENTAS_DIR).filter((f) =>
  f.endsWith(".html"),
);

describe("design tokens: paleta de marca primária consistente entre ferramentas", () => {
  it("design/tokens.css define todos os tokens primários esperados", () => {
    for (const token of CORE_TOKENS) {
      expect(canonical[token], `token --${token} ausente em design/tokens.css`).toBeDefined();
    }
  });

  it.each(ferramentas)("%s usa a mesma paleta primária canônica", (file) => {
    const html = readFileSync(path.join(FERRAMENTAS_DIR, file), "utf-8");
    const vars = parseCssVars(html);

    if (Object.keys(vars).length === 0) {
      // Ferramenta sem bloco :root próprio (ex: portal de navegação) — pula.
      return;
    }

    for (const token of CORE_TOKENS) {
      if (vars[token] === undefined) continue; // token não usado nessa ferramenta
      expect(
        vars[token],
        `--${token} em ${file} (${vars[token]}) diverge do canônico (${canonical[token]})`,
      ).toBe(canonical[token]);
    }
  });
});
