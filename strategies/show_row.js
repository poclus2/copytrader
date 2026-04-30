// show_row.js
const XLSX = require('xlsx');
const wb = XLSX.readFile(process.argv[2]);
const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

console.log('Ligne 123 (premier ordre):');
const row = data[122];
for (let i = 0; i < 20; i++) {
    if (row[i] !== undefined && row[i] !== '') {
        console.log(`  ${String.fromCharCode(65 + i)}: ${row[i]}`);
    }
}
