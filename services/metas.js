/**
 * services/metas.js
 * Persistência das metas de gastos em arquivo JSON local.
 * Compartilhado entre todos os dispositivos que acessam o servidor.
 */

const fs = require('fs');
const path = require('path');

const METAS_PATH = path.join(__dirname, '../data/metas.json');

function lerMetas() {
  try {
    return JSON.parse(fs.readFileSync(METAS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function salvarMetas(metas) {
  fs.writeFileSync(METAS_PATH, JSON.stringify(metas, null, 2), 'utf8');
}

function getMetas() {
  return lerMetas();
}

function setMeta(categoria, valor) {
  const metas = lerMetas();
  if (valor > 0) {
    metas[categoria] = valor;
  } else {
    delete metas[categoria];
  }
  salvarMetas(metas);
  return metas;
}

function deleteMeta(categoria) {
  const metas = lerMetas();
  delete metas[categoria];
  salvarMetas(metas);
  return metas;
}

module.exports = { getMetas, setMeta, deleteMeta };
