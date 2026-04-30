// debug_excel.js - Vérifier la structure du fichier Excel
const XLSX = require('xlsx');

const reportPath = process.argv[2];
const workbook = XLSX.readFile(reportPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir en JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log(`Total lignes: ${data.length}\n`);

// Afficher les 150 premières lignes
for (let i = 0; i < Math.min(150, data.length); i++) {
    const row = data[i];
    if (row && (row[0] || row[1])) {
        console.log(`Ligne ${i + 1}: [${row[0]}] | [${row[1]}]`);
    }
}
