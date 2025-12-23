const XLSX = require('xlsx');

const workbook = XLSX.readFile('Actuals.xlsx');
console.log('Sheet Names:', workbook.SheetNames);

const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});

console.log('\nFirst 15 rows:');
data.slice(0, 15).forEach((row, i) => {
  console.log(`Row ${i}:`, JSON.stringify(row));
});

console.log('\n\nTotal rows:', data.length);
