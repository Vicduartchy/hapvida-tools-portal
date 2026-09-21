(function (global) {
  'use strict';

  const STORAGE_KEY = 'hac_resources_monthly_v1';
  const EMBEDDED_SOURCE = 'embedded';
  const IMPORTED_SOURCE = 'imported';
  let embeddedSnapshot = null;
  let currentMeta = { source: EMBEDDED_SOURCE, fileName: 'Base embutida', importedAt: null, rowCount: 0, sheetName: '', format: 'embedded' };

  const FIELD_ALIASES = {
    squad: [
      'squad', 'nome da squad', 'squad conforme azure devops', 'team project',
      'teamproject', 'equipe', 'time', 'projeto', 'project name', 'squad name'
    ],
    colaborador: [
      'colaborador', 'nome do colaborador', 'nome completo', 'nome', 'recurso',
      'recurso nome', 'recurso (nome)', 'funcionario', 'funcionário', 'employee',
      'assigned to', 'assignedto', 'pessoa'
    ],
    funcao: [
      'funcao', 'função', 'funcao na squad', 'função na squad', 'cargo', 'role',
      'perfil', 'tipo de recurso', 'job title'
    ],
    compartilhado: [
      'compartilhado', 'recurso compartilhado', 'recurso compartilhado?',
      'compartilhado entre squads', 'compartilhado entre squads?', 'alocacao',
      'alocação', 'tipo de alocacao', 'tipo de alocação', 'dedicado ou compartilhado'
    ],
    gerente_ti: [
      'gerente ti', 'gerente de ti', 'gestor direto', 'gestor direto ', 'gerente',
      'gestor', 'manager', 'ti manager'
    ],
    diretor: ['diretor', 'director'],
    diretoria: ['diretoria', 'diretoria responsavel', 'diretoria responsável', 'department'],
    area: ['area', 'área', 'unidade', 'organizacao', 'organização'],
    gerente: ['gerente'],
    gerente_executivo: ['gerente executivo']
  };

  function clean(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function key(value) {
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function headerKey(value) {
    return key(value).replace(/\s+/g, '');
  }

  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function isPlaceholder(value) {
    const normalized = key(value);
    if (!normalized) return true;
    return normalized === 'n a' || normalized === 'na' || normalized === '-' || normalized === '—' ||
      normalized === 'desligada' || /^squad\s+n\s*a(?:\s|$)/.test(normalized);
  }

  function normalizeSquadValue(value) {
    let result = clean(value);
    if (/^squad\s*:/i.test(result)) result = clean(result.replace(/^squad\s*:/i, ''));
    if (isPlaceholder(result) || /^n\s*\/\s*a\s*\(/i.test(result)) return '';
    return result;
  }

  function isAreaLabel(value) {
    return /^(assistencial|backoffice|digital|ia|insights|operadora|ti|corporativo|financeiro)$/i.test(clean(value));
  }

  function valueFor(row, headers, field) {
    const aliases = FIELD_ALIASES[field].map(headerKey);
    for (const header of headers) {
      if (aliases.includes(headerKey(header))) return row[header];
    }
    return '';
  }

  function normalizeShared(value) {
    const normalized = key(value);
    if (!normalized) return 'Não';
    if (['sim', 's', 'yes', 'y', 'true', 'compartilhado'].includes(normalized)) return 'Sim';
    if (['nao', 'n', 'no', 'false', 'dedicado'].includes(normalized)) return 'Não';
    return clean(value);
  }

  function buildResourceRow(raw, squad, overrides) {
    const sourceDiretoria = clean(valueFor(raw, Object.keys(raw), 'diretoria'));
    const row = {
      squad: normalizeSquadValue(squad),
      colaborador: clean(valueFor(raw, Object.keys(raw), 'colaborador')),
      funcao: clean(valueFor(raw, Object.keys(raw), 'funcao')) || 'Não informado',
      compartilhado: normalizeShared(valueFor(raw, Object.keys(raw), 'compartilhado')),
      gerente_ti: clean(valueFor(raw, Object.keys(raw), 'gerente_ti')),
      diretor: clean(valueFor(raw, Object.keys(raw), 'diretor')) || (sourceDiretoria && !isAreaLabel(sourceDiretoria) ? sourceDiretoria : ''),
      diretoria: clean(valueFor(raw, Object.keys(raw), 'area')) || (isAreaLabel(sourceDiretoria) ? sourceDiretoria : ''),
      diretoria_fonte: sourceDiretoria,
      gerente: clean(valueFor(raw, Object.keys(raw), 'gerente')),
      gerente_executivo: clean(valueFor(raw, Object.keys(raw), 'gerente_executivo'))
    };
    Object.assign(row, overrides || {});
    return row;
  }

  function finalizeRows(rows) {
    const output = [];
    const seen = new Map();
    for (const row of rows) {
      row.squad = normalizeSquadValue(row.squad);
      row.colaborador = clean(row.colaborador);
      if (!row.squad || !row.colaborador) continue;
      const identity = [row.squad, row.colaborador, row.funcao]
        .map(key)
        .join('|');
      if (seen.has(identity)) {
        const existing = seen.get(identity);
        if (!existing.sm_responsavel && row.sm_responsavel) existing.sm_responsavel = row.sm_responsavel;
        continue;
      }
      const finalRow = Object.assign({}, row, { id: 'res-import-' + hash(identity) });
      seen.set(identity, finalRow);
      output.push(finalRow);
    }
    if (!output.length) throw new Error('Não encontrei vínculos válidos entre Colaborador/Nome e Squad.');
    return output;
  }

  function normalizeRows(rawRows) {
    if (!Array.isArray(rawRows)) throw new Error('A planilha não contém linhas em formato reconhecível.');
    return finalizeRows(rawRows.map((raw) => {
      if (!raw || typeof raw !== 'object') return {};
      return buildResourceRow(raw, valueFor(raw, Object.keys(raw), 'squad'));
    }));
  }

  function extractLabel(value, label) {
    const text = String(value || '').replace(/\r/g, ' ').replace(/\n/g, ' | ');
    const regex = new RegExp(label + '\\s*:\\s*([\\s\\S]*?)(?=\\s*(?:SQUAD|GESTOR DIRETO)\\s*:|$)', 'i');
    const match = text.match(regex);
    return match ? clean(match[1]) : '';
  }

  function parseAdjustment(raw, knownSquadKeys) {
    const headers = Object.keys(raw);
    const sourceSquad = normalizeSquadValue(raw[headers.find((h) => headerKey(h) === 'squad')] || '');
    const beforeRaw = clean(raw[headers.find((h) => headerKey(h) === 'antes')] || '');
    const afterRaw = clean(raw[headers.find((h) => headerKey(h) === 'depois')] || '');
    const beforeLabeled = normalizeSquadValue(extractLabel(beforeRaw, 'SQUAD'));
    const afterLabeled = normalizeSquadValue(extractLabel(afterRaw, 'SQUAD'));
    const beforePure = normalizeSquadValue(beforeRaw);
    const afterPure = normalizeSquadValue(afterRaw);
    const beforeSquad = beforeLabeled || (knownSquadKeys.has(key(beforePure)) ? beforePure : '');
    const afterSquad = afterLabeled || (knownSquadKeys.has(key(afterPure)) ? afterPure : '');
    const looksLikeSquad = (value) => /^(assistencial|backoffice|digital|ia|insights|operadora|ti)\s*[-–]/i.test(clean(value));
    const hasSquadDirective = !!afterLabeled || /^squad\s*:/i.test(afterRaw) || (!!afterPure && (knownSquadKeys.has(key(afterPure)) || looksLikeSquad(afterPure)));
    const manager = extractLabel(afterRaw, 'GESTOR DIRETO') ||
      (!hasSquadDirective && afterPure && !knownSquadKeys.has(key(afterPure)) && !isPlaceholder(afterPure) ? afterPure : '');
    const sm = clean(raw[headers.find((h) => headerKey(h) === 'smresponsavel')] || '');
    return {
      sourceSquad,
      beforeSquad,
      afterSquad,
      hasSquadDirective,
      manager,
      smResponsavel: isPlaceholder(sm) ? '' : sm
    };
  }

  function normalizeBaseSetRows(rawRows, adjustmentRows) {
    if (!Array.isArray(rawRows) || !rawRows.length) throw new Error('A aba BASE_SET.26 não possui linhas de dados.');
    const headers = Object.keys(rawRows[0]);
    const squadHeaders = headers.filter((header) => /^squad\s*[1-6]$/i.test(clean(header)));
    if (!squadHeaders.length) throw new Error('A aba BASE_SET.26 não possui as colunas SQUAD 1 a SQUAD 6.');
    const knownSquadKeys = new Set();
    for (const raw of rawRows) {
      for (const header of squadHeaders) {
        const squad = normalizeSquadValue(raw[header]);
        if (squad) knownSquadKeys.add(key(squad));
      }
    }

    const adjustmentsByPerson = new Map();
    for (const raw of adjustmentRows || []) {
      const collaborator = clean(valueFor(raw, Object.keys(raw), 'colaborador'));
      if (!collaborator) continue;
      const parsed = parseAdjustment(raw, knownSquadKeys);
      const list = adjustmentsByPerson.get(key(collaborator)) || [];
      list.push(parsed);
      adjustmentsByPerson.set(key(collaborator), list);
    }

    const assignmentsByPerson = new Map();
    for (const raw of rawRows) {
      const collaborator = clean(valueFor(raw, headers, 'colaborador'));
      if (!collaborator) continue;
      const personKey = key(collaborator);
      const assignments = assignmentsByPerson.get(personKey) || [];
      for (const header of squadHeaders) {
        const squad = normalizeSquadValue(raw[header]);
        if (!squad) continue;
        assignments.push({ raw, squad, sm_responsavel: '' });
      }
      if (!assignments.length) {
        assignments.push({ raw, squad: '', sm_responsavel: '' });
      }
      assignmentsByPerson.set(personKey, assignments);
    }

    const output = [];
    for (const [personKey, assignments] of assignmentsByPerson.entries()) {
      const adjustments = adjustmentsByPerson.get(personKey) || [];
      const working = assignments.map((assignment) => Object.assign({}, assignment));
      for (const adjustment of adjustments) {
        const targetKey = key(adjustment.sourceSquad || adjustment.beforeSquad);
        let matched = false;
        if (adjustment.hasSquadDirective) {
          for (let i = working.length - 1; i >= 0; i -= 1) {
            if (targetKey && key(working[i].squad) !== targetKey) continue;
            if (!targetKey && working[i].squad) continue;
            matched = true;
            if (adjustment.afterSquad) working[i].squad = adjustment.afterSquad;
            else working.splice(i, 1);
          }
          if (!matched && adjustment.afterSquad) {
            const template = working.find((assignment) => assignment.raw) || assignments[0];
            if (template) working.push({ raw: template.raw, squad: adjustment.afterSquad, sm_responsavel: '' });
          }
        }
        for (const assignment of working) {
          if (targetKey && key(assignment.squad) !== targetKey && key(assignment.squad) !== key(adjustment.afterSquad)) continue;
          if (adjustment.manager) assignment.managerOverride = adjustment.manager;
          if (adjustment.smResponsavel) assignment.sm_responsavel = adjustment.smResponsavel;
        }
      }
      for (const assignment of working) {
        if (!assignment.squad) continue;
        const overrides = {};
        if (assignment.managerOverride) overrides.gerente_ti = assignment.managerOverride;
        if (assignment.sm_responsavel) overrides.sm_responsavel = assignment.sm_responsavel;
        output.push(buildResourceRow(assignment.raw, assignment.squad, overrides));
      }
    }
    return finalizeRows(output);
  }

  function readTable(sheet) {
    const matrix = global.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    let headerIndex = -1;
    for (let i = 0; i < matrix.length; i += 1) {
      const headers = matrix[i].map(headerKey);
      if (headers.includes('colaborador') && (headers.includes('squad') || headers.includes('squad1'))) {
        headerIndex = i;
        break;
      }
    }
    if (headerIndex < 0) return null;
    const headers = matrix[headerIndex].map((value) => clean(value));
    const rows = matrix.slice(headerIndex + 1).map((values) => {
      const row = {};
      headers.forEach((header, index) => { if (header) row[header] = values[index] === undefined ? '' : values[index]; });
      return row;
    });
    return { headers, rows, headerIndex };
  }

  function readAdjustmentTable(sheet) {
    if (!sheet) return [];
    const matrix = global.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    const headerIndex = matrix.findIndex((row) => {
      const headers = row.map(headerKey);
      return headers.includes('colaborador') && headers.includes('antes') && headers.includes('depois');
    });
    if (headerIndex < 0) return [];
    const headers = matrix[headerIndex].map((value) => clean(value));
    return matrix.slice(headerIndex + 1).map((values) => {
      const row = {};
      headers.forEach((header, index) => { if (header) row[header] = values[index] === undefined ? '' : values[index]; });
      return row;
    });
  }

  function parseWorkbook(arrayBuffer) {
    if (!global.XLSX) throw new Error('O leitor de planilhas não foi carregado. Recarregue a página e tente novamente.');
    const workbook = global.XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const structured = [];
    for (const sheetName of workbook.SheetNames || []) {
      const table = readTable(workbook.Sheets[sheetName]);
      if (!table) continue;
      const hasMultiSquad = table.headers.some((header) => /^squad\s*[1-6]$/i.test(clean(header)));
      if (!hasMultiSquad) continue;
      const adjustments = readAdjustmentTable(workbook.Sheets.AJUSTE);
      const rows = normalizeBaseSetRows(table.rows, adjustments);
      structured.push({
        sheetName,
        rows,
        format: 'BASE_SET.26',
        adjustmentRows: adjustments.length,
        ignoredRows: Math.max(0, table.rows.length - rows.length)
      });
    }
    if (structured.length) {
      structured.sort((a, b) => b.rows.length - a.rows.length);
      return structured[0];
    }

    const candidates = [];
    for (const sheetName of workbook.SheetNames || []) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows = global.XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      try {
        const rows = normalizeRows(rawRows);
        candidates.push({ sheetName, rows, ignoredRows: Math.max(0, rawRows.length - rows.length), format: 'generic' });
      } catch (error) {
        // Abas auxiliares sem Squad/Colaborador não entram na seleção.
      }
    }
    if (!candidates.length) throw new Error('Nenhuma aba possui colunas compatíveis com a base de recursos.');
    candidates.sort((a, b) => b.rows.length - a.rows.length);
    return candidates[0];
  }

  function resourceIdentity(row) {
    return [row.squad, row.colaborador, row.funcao].map(key).join('|');
  }

  function diffRows(previousRows, nextRows) {
    const previous = new Map((previousRows || []).map((row) => [resourceIdentity(row), row]));
    const next = new Map((nextRows || []).map((row) => [resourceIdentity(row), row]));
    let unchanged = 0;
    let changed = 0;
    for (const [identity, row] of next) {
      const old = previous.get(identity);
      if (!old) continue;
      const fields = ['squad', 'colaborador', 'funcao', 'compartilhado', 'gerente_ti', 'diretor', 'diretoria'];
      if (fields.every((field) => clean(old[field]) === clean(row[field]))) unchanged += 1;
      else changed += 1;
    }
    return {
      added: [...next.keys()].filter((identity) => !previous.has(identity)).length,
      removed: [...previous.keys()].filter((identity) => !next.has(identity)).length,
      unchanged,
      changed
    };
  }

  function cloneRows(rows) {
    return (rows || []).map((row) => Object.assign({}, row));
  }

  function getLocalStorage() {
    try { return global.localStorage; } catch (error) { return null; }
  }

  function updateBadges() {
    const dataBadge = document.getElementById('dataSummaryBadge');
    if (dataBadge && typeof RESOURCES_RAW !== 'undefined') {
      dataBadge.textContent = (typeof SM_VIEW !== 'undefined' ? SM_VIEW.length : 0) + ' SMs · ' +
        (typeof UNIFIED !== 'undefined' ? UNIFIED.length : 0) + ' squads · ' +
        RESOURCES_RAW.length + ' recursos · ' + (typeof ALL_BOARDS !== 'undefined' ? ALL_BOARDS.length : 0) + ' boards';
    }
    const resourceBadge = document.getElementById('resourcesDataBadge');
    if (resourceBadge && typeof RESOURCES_RAW !== 'undefined') {
      if (currentMeta.source === IMPORTED_SOURCE) {
        resourceBadge.textContent = 'Recursos: ' + RESOURCES_RAW.length + ' · ' + (currentMeta.fileName || 'base mensal');
        resourceBadge.title = 'Base ' + (currentMeta.format || 'mensal') + ' carregada neste navegador em ' + formatDate(currentMeta.importedAt);
      } else {
        resourceBadge.textContent = 'Recursos: base embutida · ' + RESOURCES_RAW.length;
        resourceBadge.title = 'Usando a base de recursos publicada no portal.';
      }
    }
  }

  function formatDate(value) {
    if (!value) return 'data desconhecida';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'data desconhecida';
    return date.toLocaleString('pt-BR');
  }

  function showStatus(message, type) {
    const el = document.getElementById('resourcesImportStatus');
    if (!el) return;
    el.className = 'importbanner ' + (type || 'ok');
    el.style.display = 'block';
    el.innerHTML = message;
  }

  function clearResourceOverrides() {
    if (typeof MANUAL_OVERRIDES === 'undefined') return;
    MANUAL_OVERRIDES.resources = {};
    MANUAL_OVERRIDES.deletedResourceIds = [];
    if (typeof saveOverrides === 'function') saveOverrides();
  }

  function rebuildAfterChange() {
    if (typeof buildUnified === 'function') buildUnified();
    if (typeof buildSMView === 'function') buildSMView();
    if (typeof rebuildAndRender === 'function') rebuildAndRender();
    updateBadges();
  }

  function setCurrentMeta(meta) {
    currentMeta = Object.assign({ source: EMBEDDED_SOURCE, fileName: 'Base embutida', importedAt: null, rowCount: 0, sheetName: '', format: 'embedded' }, meta || {});
    updateBadges();
  }

  function persist(rows, meta) {
    const storage = getLocalStorage();
    if (!storage) throw new Error('O navegador bloqueou o armazenamento local; a base seria perdida ao recarregar.');
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, rows, meta }));
  }

  function applyImportedRows(rows, meta, diff) {
    persist(rows, meta);
    RESOURCES_RAW = cloneRows(rows);
    setCurrentMeta(meta);
    clearResourceOverrides();
    rebuildAfterChange();
    const adjustmentText = meta.adjustmentRows ? ' Foram lidas ' + meta.adjustmentRows + ' linhas da aba AJUSTE.' : '';
    showStatus('<b>Base mensal carregada.</b> ' + rows.length + ' vínculos únicos em <b>' + (meta.fileName || 'planilha') + '</b> (' + (meta.sheetName || 'aba selecionada') + '). ' +
      'Diferença em relação à base anterior: <b>+' + diff.added + ' novos</b>, <b>−' + diff.removed + ' removidos</b> e <b>' + diff.changed + ' alterados</b>.' + adjustmentText + ' ' +
      'A base fica salva neste navegador até você escolher outra ou restaurar a base publicada.', 'ok');
  }

  function loadPersisted() {
    if (typeof RESOURCES_RAW === 'undefined') return;
    if (!embeddedSnapshot) embeddedSnapshot = cloneRows(RESOURCES_RAW);
    const storage = getLocalStorage();
    if (!storage) {
      setCurrentMeta({ source: EMBEDDED_SOURCE, rowCount: RESOURCES_RAW.length });
      return;
    }
    try {
      const saved = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      if (saved && Array.isArray(saved.rows) && saved.rows.length) {
        RESOURCES_RAW = normalizeRows(saved.rows);
        setCurrentMeta(Object.assign({}, saved.meta, { source: IMPORTED_SOURCE, rowCount: RESOURCES_RAW.length }));
      } else {
        setCurrentMeta({ source: EMBEDDED_SOURCE, rowCount: RESOURCES_RAW.length });
      }
    } catch (error) {
      console.warn('Não consegui carregar a base mensal salva:', error);
      setCurrentMeta({ source: EMBEDDED_SOURCE, rowCount: RESOURCES_RAW.length });
    }
  }

  function restoreEmbedded() {
    if (!embeddedSnapshot || !embeddedSnapshot.length) return;
    const storage = getLocalStorage();
    if (storage) storage.removeItem(STORAGE_KEY);
    RESOURCES_RAW = cloneRows(embeddedSnapshot);
    setCurrentMeta({ source: EMBEDDED_SOURCE, rowCount: RESOURCES_RAW.length });
    clearResourceOverrides();
    rebuildAfterChange();
    showStatus('<b>Base publicada restaurada.</b> A ferramenta voltou a usar os dados embutidos no portal (' + RESOURCES_RAW.length + ' recursos).', 'ok');
  }

  async function importFile(file) {
    if (!file) return;
    try {
      const parsed = parseWorkbook(await file.arrayBuffer());
      const diff = diffRows(typeof RESOURCES_RAW !== 'undefined' ? RESOURCES_RAW : [], parsed.rows);
      const meta = {
        source: IMPORTED_SOURCE,
        fileName: file.name,
        importedAt: new Date().toISOString(),
        rowCount: parsed.rows.length,
        sheetName: parsed.sheetName,
        ignoredRows: parsed.ignoredRows,
        format: parsed.format || 'generic',
        adjustmentRows: parsed.adjustmentRows || 0
      };
      applyImportedRows(parsed.rows, meta, diff);
    } catch (error) {
      console.error(error);
      showStatus('<b>Não consegui importar a planilha.</b> ' + clean(error.message || error) + ' Nenhuma alteração foi aplicada.', 'error');
    }
  }

  function bindUI() {
    const input = document.getElementById('resourcesUploadInput');
    const importButton = document.getElementById('btnImportResources');
    const resetButton = document.getElementById('btnResetResources');
    if (importButton && input && !importButton.dataset.wired) {
      importButton.dataset.wired = '1';
      importButton.addEventListener('click', () => input.click());
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        input.value = '';
        importFile(file);
      });
    }
    if (resetButton && !resetButton.dataset.wired) {
      resetButton.dataset.wired = '1';
      resetButton.addEventListener('click', () => {
        if (confirm('Restaurar a base de recursos publicada? A base mensal salva neste navegador será removida.')) restoreEmbedded();
      });
    }
    updateBadges();
  }

  global.HACResourcesImport = {
    STORAGE_KEY,
    normalizeRows,
    normalizeBaseSetRows,
    parseWorkbook,
    diffRows,
    resourceIdentity,
    formatDate,
    loadPersisted,
    restoreEmbedded,
    importFile,
    getMeta: () => Object.assign({}, currentMeta)
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindUI);
  else bindUI();
})(window);
