const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Activity plan example.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);
console.log('\n');

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== Sheet: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Print first 20 rows
  data.slice(0, 20).forEach((row, index) => {
    console.log(`Row ${index}:`, JSON.stringify(row));
  });
});
