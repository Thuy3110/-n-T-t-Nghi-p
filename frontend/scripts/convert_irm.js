// Convert Excel I,R,M matrix to JSON
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const excelPath = path.resolve(__dirname, '../public/data/irm.xlsx');
const jsonPath = path.resolve(__dirname, '../public/data/irm.json');
try {
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { defval: null });
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Converted I,R,M Excel to JSON:', jsonPath);
} catch (e) {
  console.error('Error converting I,R,M:', e);
  process.exit(1);
}

