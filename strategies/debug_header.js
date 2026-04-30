// debug_header.js - Voir l'en-tête complet
const XLSX = require('xlsx');

const reportPath = process.argv[2];
const workbook = XLSX.readFile(reportPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

// Trouver et afficher l'en-tête du carnet d'ordres (ligne 122)
console.log('En-tête du carnet d\'ordres (ligne 122):');
const headerRow = data[121]; // Index 121 = ligne 122

if (headerRow) {
    headerRow.forEach((col, idx) => {
        if (col) {
            const letter = String.fromCharCode(65 + idx); // A=65
            console.log(`  Colonne ${letter} (${idx}): ${col}`);
        }
    });
}

console.log('\n\nPremier ordre (ligne 123):');
const firstOrder = data[122];
if (firstOrder) {
    firstOrder.forEach((col, idx) => {
        if (col !== undefined && col !== '') {
            const letter = String.fromCharCode(65 + idx);
            console.log(`  ${letter}: ${col}`);
        }
    });
}
