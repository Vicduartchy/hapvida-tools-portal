import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { JSDOM } from "jsdom";

/**
 * Carrega o script de aplicação (não-vendor) de uma ferramenta HTML single-file
 * dentro de um sandbox jsdom, para testar a lógica interna sem modificar o
 * arquivo original entregue (que deve continuar 100% offline / single-file).
 *
 * NUNCA escreve de volta no arquivo — só lê o texto, roda numa cópia em memória.
 *
 * @param relativeHtmlPath caminho relativo a client/public/ferramentas/
 * @param scriptIndex índice do bloco <script> (sem src) que contém a lógica
 *   da aplicação (normalmente o último, depois dos vendors tipo Chart.js/SheetJS)
 * @param exportSnippet trecho JS injetado só na cópia em memória, expondo o
 *   necessário em globalThis.__test__ para o teste inspecionar — nunca é
 *   escrito no HTML real.
 */
export function loadToolScript(
  relativeHtmlPath: string,
  scriptIndex: number,
  exportSnippet: string,
) {
  const htmlPath = path.resolve(
    process.cwd(),
    "client/public/ferramentas",
    relativeHtmlPath,
  );
  const html = readFileSync(htmlPath, "utf-8");

  const scriptRegex = /<script(?:(?![^>]*\bsrc=)[^>])*>([\s\S]*?)<\/script>/g;
  const scripts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }

  if (!scripts[scriptIndex]) {
    throw new Error(
      `Bloco <script> índice ${scriptIndex} não encontrado em ${relativeHtmlPath} (encontrados: ${scripts.length})`,
    );
  }

  let appScript = scripts[scriptIndex];

  // Na cópia de teste, substitui o registro real do DOMContentLoaded (que
  // dispararia init() e falharia por falta de DOM completo) pelo snippet
  // de captura, mutando __capture__ — setado diretamente no objeto de
  // contexto, já que globalThis/this não resolvem de forma confiável
  // dentro do modo estrito de uma IIFE rodando em vm.createContext.
  const marker = "document.addEventListener('DOMContentLoaded', init);";
  if (!appScript.includes(marker)) {
    throw new Error(
      `Marcador de init não encontrado em ${relativeHtmlPath} — ajuste o helper se a estrutura do script mudou.`,
    );
  }
  appScript = appScript.replace(
    marker,
    `(function(){ ${exportSnippet} })();`,
  );

  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const context = dom.window as unknown as vm.Context;
  vm.createContext(context);
  (context as any).__capture__ = {};
  vm.runInContext(appScript, context);

  return (context as any).__capture__;
}
