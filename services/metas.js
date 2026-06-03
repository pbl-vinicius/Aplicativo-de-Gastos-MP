/**
 * services/metas.js
 * Persistência das metas de gastos no Google Sheets (aba "Metas", colunas A:B).
 * Isso garante que as metas sobrevivam a redeploys no Railway.
 *
 * Pré-requisitos na planilha:
 *   1. Criar uma aba chamada "Metas" na planilha Google Sheets.
 *   2. A conta de serviço precisa ter acesso de Editor na planilha
 *      (não apenas Viewer) para permitir escrita.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const METAS_RANGE = 'Metas!A1:B200';
const CACHE_PATH = path.join(__dirname, '../data/metas.json');

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function lerCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { return {}; }
}

function salvarCache(metas) {
  try { fs.writeFileSync(CACHE_PATH, JSON.stringify(metas, null, 2), 'utf8'); } catch {}
}

async function lerDoSheets() {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: METAS_RANGE,
    });
    const rows = res.data.values || [];
    const metas = {};
    rows.forEach(([cat, val]) => {
      if (cat && val) {
        const v = parseFloat(val);
        if (v > 0) metas[cat] = v;
      }
    });
    salvarCache(metas);
    return metas;
  } catch {
    return lerCache();
  }
}

async function salvarNoSheets(metas) {
  const values = Object.entries(metas).map(([cat, val]) => [cat, val]);
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: METAS_RANGE,
    });
    if (values.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Metas!A1',
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    }
    salvarCache(metas);
  } catch (err) {
    console.error('[metas] Erro ao salvar no Sheets:', err.message);
    salvarCache(metas);
  }
}

async function getMetas() {
  return lerDoSheets();
}

async function setMeta(categoria, valor) {
  const metas = await lerDoSheets();
  if (valor > 0) {
    metas[categoria] = valor;
  } else {
    delete metas[categoria];
  }
  await salvarNoSheets(metas);
  return metas;
}

async function deleteMeta(categoria) {
  const metas = await lerDoSheets();
  delete metas[categoria];
  await salvarNoSheets(metas);
  return metas;
}

module.exports = { getMetas, setMeta, deleteMeta };
