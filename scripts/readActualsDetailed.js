const XLSX = require('xlsx');

const workbook = XLSX.readFile('Actuals.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});

console.log('=== HEADER ROWS ===');
console.log('\nRow 3 (Dates):');
const dates = data[3];
dates.forEach((val, i) => {
  if (val && val !== '') console.log(`  Col ${i}: ${val}`);
});

console.log('\nRow 4 (Column Headers):');
const headers = data[4];
headers.slice(0, 20).forEach((val, i) => {
  console.log(`  Col ${i}: ${val}`);
});

console.log('\n\n=== DATA ROWS (Markets and Mediums) ===');
for (let i = 5; i < Math.min(20, data.length); i++) {
  const row = data[i];
  if (row[0] || row[1]) {
    console.log(`\nRow ${i}: Market="${row[0]}", Medium="${row[1]}"`);
    console.log(`  Rate Card: ${row[2]}, Discount: ${row[3]}, After Discount: ${row[4]}, Nett Nett: ${row[5]}`);
  }
}
