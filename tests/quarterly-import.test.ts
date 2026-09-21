import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

function createImporter() {
  const sheets: Record<string, unknown> = {};
  const context: Record<string, unknown> = {
    console,
    window: null,
    localStorage: null,
    dispatchEvent: () => undefined,
    CustomEvent: class CustomEvent {},
    XLSX: {
      read: () => ({ SheetNames: Object.keys(sheets), Sheets: sheets }),
      utils: { sheet_to_json: (sheet: any) => sheet.rows },
    },
  };
  context.window = context;
  runInNewContext(readFileSync("client/public/shared/data/quarterly-import.js", "utf8"), context);
  return { importer: (context as any).HACQuarterlyImport, sheets };
}

describe("quarterly import contract", () => {
  it("reads the operational portfolio sheet and deduplicates by LECOM", () => {
    const { importer, sheets } = createImporter();
    sheets.Portfólio = {
      rows: [
        ["Relatório semanal"],
        ["INICIATIVA", "LECOM", "TÍTULO", "SQUAD ATUALIZADA", "HORAS"],
        ["Projeto", "1001", "Projeto A", "Squad A", "120"],
        ["Projeto", "1001", "Projeto A duplicado", "Squad A", "240"],
        ["Projeto", "1002", "Projeto B", "Squad B", "80"],
      ],
    };

    const parsed = importer.parseWorkbook(new Uint8Array([1]), "portfolio");

    expect(parsed.sheetName).toBe("Portfólio");
    expect(parsed.rawRows).toBe(3);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.duplicateRows).toBe(1);
    expect(parsed.rows[0].lecom).toBe("1001");
    expect(parsed.rows[0].horas).toBe(120);
  });

  it("uses LECOM rather than the internal ID column in improvements", () => {
    const { importer, sheets } = createImporter();
    sheets["Melhorias 3T2026"] = {
      rows: [
        ["ID", "LECOM", "TÍTULO", "STATUS", "SQUAD"],
        ["row-1", "2001", "Melhoria A", "03.Desenvolvimento", "Squad A"],
        ["row-2", "2002", "Melhoria B", "04.Homologação", "Squad B"],
      ],
    };

    const parsed = importer.parseWorkbook(new Uint8Array([1]), "improvements");

    expect(parsed.sheetName).toBe("Melhorias 3T2026");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows.map((row: any) => row.lecom)).toEqual(["2001", "2002"]);
    expect(parsed.rows[0].id).not.toContain("row-1");
  });
});
