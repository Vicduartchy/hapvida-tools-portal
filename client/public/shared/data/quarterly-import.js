(function (global) {
  'use strict';

  const STORAGE_KEY = 'hac_quarterly_sources_v1';
  const SOURCE_LABELS = {
    portfolio: 'Portfólio de projetos',
    improvements: 'Melhorias'
  };
  const state = {
    portfolio: [],
    improvements: [],
    meta: {
      portfolio: { source: 'empty', fileName: '', importedAt: null, sheetName: '', rawRows: 0, uniqueRows: 0, duplicateRows: 0, format: '' },
      improvements: { source: 'empty', fileName: '', importedAt: null, sheetName: '', rawRows: 0, uniqueRows: 0, duplicateRows: 0, format: '' }
    }
  };

  function clean(value) {
    if (value === null || value === undefined) return '';
    if (Object.prototype.toString.call(value) === '[object Date]') return value.toISOString().slice(0, 10);
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function key(value) {
    return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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

  function numeric(value) {
    const text = clean(value).replace(/\./g, '').replace(',', '.');
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function findHeaderRow(matrix, required) {
    const wanted = required.map(headerKey);
    for (let i = 0; i < matrix.length; i += 1) {
      const headers = matrix[i].map(headerKey);
      if (wanted.every((field) => headers.includes(field))) return i;
    }
    return -1;
  }

  function sheetRows(sheet, required) {
    const matrix = global.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    const headerIndex = findHeaderRow(matrix, required);
    if (headerIndex < 0) return null;
    const headers = matrix[headerIndex].map(clean);
    const rows = matrix.slice(headerIndex + 1).map((values) => {
      const row = {};
      headers.forEach((header, index) => {
        if (header) row[header] = values[index] === undefined ? '' : values[index];
      });
      return row;
    }).filter((row) => Object.values(row).some((value) => clean(value)));
    return { headerIndex, rows };
  }

  function valueFor(row, field) {
    const aliases = {
      lecom: ['lecom', 'id lecom'],
      title: ['titulo', 'título', 'nome da melhoria', 'nome do projeto'],
      squad: ['squad atualizada', 'nome squad azure', 'squad azure', 'squad'],
      squadAzure: ['squad azure', 'nome squad azure', 'squad'],
      squadId: ['id squad azure', 'id squad azdo'],
      smPmo: ['sm pmo', 'sm/pmo'],
      status: ['status do projeto', 'status'],
      statusResumo: ['status resumido'],
      phase: ['fase do projeto'],
      macroStage: ['etapa macro automatico', 'etapa macro'],
      hours: ['horas'],
      size: ['tamanho'],
      vp: ['vp solicitante', 'vp'],
      area: ['area executora', 'área executora'],
      commitment: ['compromisso'],
      startPlan: ['data de inicio plan', 'data de início plan'],
      endPlan: ['data de termino plan', 'data de término plan'],
      endReal: ['data de termino real', 'data de término real'],
      prioritizedQuarter: ['trimestre priorizado', 'priorizacao', 'priorização'],
      bcg: ['projeto bcg sim ou nao', 'projeto bcg sim ou não'],
      gerenteTI: ['gerente ti'],
      diretoriaTI: ['diretoria ti'],
      planned: ['p prevista', 'p. prevista'],
      realized: ['p realizada', 'p. realizada'],
      delivery: ['entrega']
    };
    const desired = (aliases[field] || []).map(headerKey);
    for (const header of Object.keys(row)) {
      if (desired.includes(headerKey(header))) return row[header];
    }
    return '';
  }

  function normalizeProject(raw) {
    return {
      id: 'project-' + hash([valueFor(raw, 'lecom'), valueFor(raw, 'title'), valueFor(raw, 'squad')].map(key).join('|')),
      type: 'project',
      lecom: clean(valueFor(raw, 'lecom')),
      titulo: clean(valueFor(raw, 'title')),
      squad: clean(valueFor(raw, 'squad')),
      squadAzure: clean(valueFor(raw, 'squadAzure')),
      squadId: clean(valueFor(raw, 'squadId')),
      smPmo: clean(valueFor(raw, 'smPmo')),
      status: clean(valueFor(raw, 'status')),
      statusResumo: clean(valueFor(raw, 'statusResumo')),
      fase: clean(valueFor(raw, 'phase')),
      etapa: clean(valueFor(raw, 'macroStage')),
      horas: numeric(valueFor(raw, 'hours')),
      tamanho: clean(valueFor(raw, 'size')),
      vp: clean(valueFor(raw, 'vp')),
      areaExecutora: clean(valueFor(raw, 'area')),
      compromisso: clean(valueFor(raw, 'commitment')),
      inicioPlan: clean(valueFor(raw, 'startPlan')),
      fimPlan: clean(valueFor(raw, 'endPlan')),
      fimReal: clean(valueFor(raw, 'endReal')),
      trimestre: clean(valueFor(raw, 'prioritizedQuarter')),
      bcg: clean(valueFor(raw, 'bcg'))
    };
  }

  function normalizeImprovement(raw) {
    return {
      id: 'improvement-' + hash([valueFor(raw, 'lecom'), valueFor(raw, 'title'), valueFor(raw, 'squad')].map(key).join('|')),
      type: 'improvement',
      lecom: clean(valueFor(raw, 'lecom')),
      titulo: clean(valueFor(raw, 'title')),
      squad: clean(valueFor(raw, 'squad')),
      squadAzure: clean(valueFor(raw, 'squadAzure')),
      squadId: clean(valueFor(raw, 'squadId')),
      gerenteTI: clean(valueFor(raw, 'gerenteTI')),
      diretoriaTI: clean(valueFor(raw, 'diretoriaTI')),
      status: clean(valueFor(raw, 'status')),
      horas: numeric(valueFor(raw, 'hours')),
      tamanho: clean(valueFor(raw, 'size')),
      vp: clean(valueFor(raw, 'vp')),
      prevista: clean(valueFor(raw, 'planned')),
      realizada: clean(valueFor(raw, 'realized')),
      entrega: clean(valueFor(raw, 'delivery')),
      trimestre: clean(valueFor(raw, 'prioritizedQuarter')),
      bcg: clean(valueFor(raw, 'bcg'))
    };
  }

  function completeness(row) {
    return Object.values(row).filter((value) => clean(value)).length;
  }

  function dedupe(rows) {
    const byKey = new Map();
    let duplicateRows = 0;
    for (const row of rows) {
      const identity = key(row.lecom) || key(row.titulo + '|' + row.squad);
      if (!identity) continue;
      const previous = byKey.get(identity);
      if (!previous) {
        byKey.set(identity, row);
      } else {
        duplicateRows += 1;
        if (completeness(row) > completeness(previous)) byKey.set(identity, row);
      }
    }
    return { rows: [...byKey.values()], duplicateRows };
  }

  function parseWorkbook(arrayBuffer, type) {
    if (!global.XLSX) throw new Error('O leitor de planilhas não foi carregado.');
    const workbook = global.XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const candidates = type === 'portfolio'
      ? [['Portfólio', ['INICIATIVA', 'LECOM', 'TÍTULO']], ['Portfolio', ['INICIATIVA', 'LECOM', 'TÍTULO']]]
      : [['Melhorias 3T2026', ['LECOM', 'TÍTULO', 'STATUS']], ['Melhorias', ['LECOM', 'TÍTULO', 'STATUS']]];
    let selected = null;
    for (const [sheetName, required] of candidates) {
      if (!workbook.Sheets[sheetName]) continue;
      const result = sheetRows(workbook.Sheets[sheetName], required);
      if (result) { selected = { sheetName, result }; break; }
    }
    if (!selected) {
      for (const sheetName of workbook.SheetNames || []) {
        const result = sheetRows(workbook.Sheets[sheetName], type === 'portfolio' ? ['LECOM', 'TÍTULO'] : ['LECOM', 'TÍTULO', 'STATUS']);
        if (result) { selected = { sheetName, result }; break; }
      }
    }
    if (!selected) throw new Error('Não encontrei uma aba operacional compatível para ' + SOURCE_LABELS[type] + '.');
    const rawRows = selected.result.rows;
    const normalized = rawRows.map(type === 'portfolio' ? normalizeProject : normalizeImprovement).filter((row) => row.lecom || row.titulo);
    const unique = dedupe(normalized);
    return {
      rows: unique.rows,
      sheetName: selected.sheetName,
      rawRows: normalized.length,
      duplicateRows: unique.duplicateRows,
      format: type === 'portfolio' ? 'portfolio' : 'improvements'
    };
  }

  function storage() {
    try { return global.localStorage; } catch (error) { return null; }
  }

  function persist() {
    const store = storage();
    if (!store) return;
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 1, portfolio: state.portfolio, improvements: state.improvements, meta: state.meta }));
  }

  function loadPersisted() {
    const store = storage();
    if (!store) return;
    try {
      const saved = JSON.parse(store.getItem(STORAGE_KEY) || 'null');
      if (!saved) return;
      if (Array.isArray(saved.portfolio)) state.portfolio = saved.portfolio;
      if (Array.isArray(saved.improvements)) state.improvements = saved.improvements;
      if (saved.meta) state.meta = Object.assign(state.meta, saved.meta);
    } catch (error) {
      console.warn('Não foi possível carregar as bases trimestrais salvas:', error);
    }
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR');
  }

  function apply(type, parsed, file) {
    state[type] = parsed.rows;
    state.meta[type] = {
      source: 'imported',
      fileName: file.name,
      importedAt: new Date().toISOString(),
      sheetName: parsed.sheetName,
      rawRows: parsed.rawRows,
      uniqueRows: parsed.rows.length,
      duplicateRows: parsed.duplicateRows,
      format: parsed.format
    };
    persist();
    global.dispatchEvent(new CustomEvent('hac-quarterly-change', { detail: { type } }));
  }

  async function importFile(type, file) {
    if (!file) return;
    try {
      const parsed = parseWorkbook(await file.arrayBuffer(), type);
      apply(type, parsed, file);
    } catch (error) {
      console.error(error);
      global.dispatchEvent(new CustomEvent('hac-quarterly-error', { detail: { type, message: clean(error.message || error) } }));
    }
  }

  function reset(type) {
    const store = storage();
    state[type] = [];
    state.meta[type] = { source: 'empty', fileName: '', importedAt: null, sheetName: '', rawRows: 0, uniqueRows: 0, duplicateRows: 0, format: '' };
    if (store) persist();
    global.dispatchEvent(new CustomEvent('hac-quarterly-change', { detail: { type } }));
  }

  function bindUI() {
    ['portfolio', 'improvements'].forEach((type) => {
      const input = document.getElementById(type + 'UploadInput');
      const button = document.getElementById('btnImport' + (type === 'portfolio' ? 'Portfolio' : 'Improvements'));
      const resetButton = document.getElementById('btnReset' + (type === 'portfolio' ? 'Portfolio' : 'Improvements'));
      if (input && button && !button.dataset.wired) {
        button.dataset.wired = '1';
        button.addEventListener('click', () => input.click());
        input.addEventListener('change', () => {
          const file = input.files && input.files[0];
          input.value = '';
          importFile(type, file);
        });
      }
      if (resetButton && !resetButton.dataset.wired) {
        resetButton.dataset.wired = '1';
        resetButton.addEventListener('click', () => {
          if (confirm('Remover a base de ' + SOURCE_LABELS[type] + ' salva neste navegador?')) reset(type);
        });
      }
    });
  }

  global.HACQuarterlyImport = {
    STORAGE_KEY,
    SOURCE_LABELS,
    state,
    loadPersisted,
    bindUI,
    importFile,
    reset,
    parseWorkbook,
    getRows: (type) => state[type].slice(),
    getMeta: (type) => Object.assign({}, state.meta[type]),
    formatDate
  };
})(window);
