import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { JSDOM } from "jsdom";

const read = (file: string) => readFileSync(`client/public/shared/data/${file}`, "utf-8");

function boot(url: string, prep?: (win: any) => void) {
  const dom = new JSDOM('<!doctype html><html><body><input id="busca"></body></html>', { url, runScripts: "outside-only" });
  prep?.(dom.window);
  vm.runInContext(read("hub-squads.js"), dom.getInternalVMContext());
  vm.runInContext(read("hub-core.js"), dom.getInternalVMContext());
  return dom.window as any;
}

describe("hub-core: escopo entre ferramentas e limpeza de resíduos", () => {
  it("lê ?squad=, ?sm= e ?diretoria= da URL", () => {
    const win = boot("http://localhost/x.html?sm=Ana%20Souza&squad=Digital%20-%20Salesforce");
    expect(win.HubCore.readScope()).toEqual({ sm: "Ana Souza", squad: "Digital - Salesforce", diretoria: "" });
  });

  it("preenche a busca com o escopo (squad tem prioridade sobre SM) e dispara input", async () => {
    const win = boot("http://localhost/x.html?sm=Ana&squad=Squad%20Alfa");
    let disparos = 0;
    win.document.getElementById("busca").addEventListener("input", () => disparos++);
    expect(win.HubCore.applyScopeToSearch("busca")).toBe("Squad Alfa");
    await new Promise((r) => setTimeout(r, 450));
    expect(win.document.getElementById("busca").value).toBe("Squad Alfa");
    expect(disparos).toBe(1);
  });

  it("não mexe na busca quando a URL não traz escopo", () => {
    const win = boot("http://localhost/x.html");
    expect(win.HubCore.applyScopeToSearch("busca")).toBe("");
    expect(win.document.getElementById("busca").value).toBe("");
  });

  it("remove as chaves antigas de mapeamento de SM por ferramenta", () => {
    const win = boot("http://localhost/x.html", (w) => {
      w.localStorage.setItem("hac_horasbranco_smmapping_v1", "{}");
      w.localStorage.setItem("hapvida_aging_smmapping_meta_v1", "{}");
      w.localStorage.setItem("outra_chave", "ok");
    });
    expect(win.localStorage.getItem("hac_horasbranco_smmapping_v1")).toBeNull();
    expect(win.localStorage.getItem("hapvida_aging_smmapping_meta_v1")).toBeNull();
    expect(win.localStorage.getItem("outra_chave")).toBe("ok");
  });
});

describe("hub-core: classificação Produto x Operação", () => {
  function bootTipo() {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", runScripts: "outside-only" });
    for (const f of ["hub-squads.js", "squad-tipo.js", "hub-core.js"]) vm.runInContext(read(f), dom.getInternalVMContext());
    return dom.window as any;
  }

  it("lista oficial tem 100 Produto e 43 Operação, sem nome repetido entre as listas", () => {
    const { SQUAD_TIPO } = bootTipo();
    expect(SQUAD_TIPO["Produto"]).toHaveLength(100);
    expect(SQUAD_TIPO["Operação"]).toHaveLength(43);
    const todos = [...SQUAD_TIPO["Produto"], ...SQUAD_TIPO["Operação"]];
    expect(new Set(todos).size).toBe(143);
  });

  it("todo nome da lista acha squad no hub (alias conta) e ativas ficam classificadas", () => {
    const win = bootTipo();
    const resumo = win.HubCore.tipoResumo();
    expect(resumo.semCorrespondencia).toEqual([]);
    expect(resumo["Produto"].ativas).toBe(100);
    // 43 nomes, mas TI - Arquitetura - QA 2.0 é alias de TI - Governança de QA no hub: 42 squads distintas
    expect(resumo["Operação"].ativas).toBe(42);
    expect(win.HubCore.tipoOf("Operadora - Odonto")).toBe("Produto");
    expect(win.HubCore.tipoOf("TI - Datacenter")).toBe("Operação");
    expect(win.HubCore.tipoOf("TI - Arquitetura - QA 2.0")).toBe("Operação");
    expect(win.HubCore.tipoOf("Squad inexistente")).toBe("");
  });

  it("expõe o tipo no mapeamento consumido pelas ferramentas", () => {
    const win = bootTipo();
    expect(win.HubCore.getSmSquadMapping()["Operadora - Odonto"].tipo).toBe("Produto");
  });
});
