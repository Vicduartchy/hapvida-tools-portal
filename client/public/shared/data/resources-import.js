(function (global) {
  'use strict';

  const STORAGE_KEY = 'hac_resources_monthly_v1';
  const EMBEDDED_SOURCE = 'embedded';
  const IMPORTED_SOURCE = 'imported';
  let embeddedSnapshot = null;
  let currentMeta = { source: EMBEDDED_SOURCE, fileName: 'Base embutida', importedAt: null, rowCount: 0, sheetName: '' };

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
      'gerente ti', 'gerente de ti', 'gerente', 'gestor', 'manager', 'ti manager'
    ],
    diretor: ['diretor', 'director'],
    diretoria: ['diretoria', 'diretoria responsavel', 'diretoria responsável', 'area', 'área', 'department']
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

  function normalizeRows(rawRows) {
    if (!Array.isArray(rawRows)) throw new Error('A planilha não contém linhas em formato reconhecível.');
    const rows = [];
    const occurrences = Object.create(null);
    for (const raw of rawRows) {
      if (!raw || typeof raw !== 'object') continue;
      const headers = Object.keys(raw);
      const squad = clean(valueFor(raw, headers, 'squad'));
      const colaborador = clean(valueFor(raw, headers, 'colaborador'));
      if (!squad && !colaborador) continue;
      if (!squad || !colaborador) continue;
      const row = {
        squad,
        colaborador,
        funcao: clean(valueFor(raw, headers, 'funcao')) || 'Não informado',
        compartilhado: normalizeShared(valueFor(raw, headers, 'compartilhado')),
        gerente_ti: clean(valueFor(raw, headers, 'gerente_ti')),
        diretor: clean(valueFor(raw, headers, 'diretor')),
        diretoria: clean(valueFor(raw, headers, 'diretoria'))
      };
      const identity = [row.squad, row.colaborador, row.funcao, row.gerente_ti, row.diretor, row.diretoria]
        .map(key)
        .join('|');
      occurrences[identity] = (occurrences[identity] || 0) + 1;
      row.id = 'res-import-' + hash(identity + '|' + occurrences[identity]);
      rows.push(row);
    }
    if (!rows.length) {
      throw new Error('Não encontrei linhas com as colunas obrigatórias Squad e Colaborador/Nome.');
    }
    return rows;
  }

  function parseWorkbook(arrayBuffer) {
    if (!global.XLSX) throw new Error('O leitor de planilhas não foi carregado. Recarregue a página e tente novamente.');
    const workbook = global.XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const candidates = [];
    for (const sheetName of workbook.SheetNames || []) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows = global.XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      try {
        const rows = normalizeRows(rawRows);
        candidates.push({ sheetName, rows, ignoredRows: Math.max(0, rawRows.length - rows.length) });
      } catch (error) {
        // Planilhas podem trazer abas de apoio; somente abas com dados compatíveis entram na seleção.
      }
    }
    if (!candidates.length) throw new Error('Nenhuma aba possui as colunas obrigatórias Squad e Colaborador/Nome.');
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
        resourceBadge.title = 'Base mensal carregada neste navegador em ' + formatDate(currentMeta.importedAt);
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
    currentMeta = Object.assign({ source: EMBEDDED_SOURCE, fileName: 'Base embutida', importedAt: null, rowCount: 0, sheetName: '' }, meta || {});
    updateBadges();
  }

  function persist(rows, meta) {
    const storage = getLocalStorage();
    if (!storage) throw new Error('O navegador bloqueou o armazenamento local; a base seria perdida ao recarregar.');
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, rows, meta }));
  }

  function applyImportedRows(rows, meta, diff) {
    persist(rows, meta);
    RESOURCES_RAW = cloneRows(rows);
    setCurrentMeta(meta);
    clearResourceOverrides();
    rebuildAfterChange();
    showStatus('<b>Base mensal carregada.</b> ' + rows.length + ' recursos em <b>' + (meta.fileName || 'planilha') + '</b>. ' +
      'Diferença em relação à base anterior: <b>+' + diff.added + ' novos</b>, <b>−' + diff.removed + ' removidos</b> e <b>' + diff.changed + ' alterados</b>. ' +
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
        ignoredRows: parsed.ignoredRows
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
