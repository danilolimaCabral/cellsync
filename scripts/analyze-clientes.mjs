import XLSX from 'xlsx';

const workbook = XLSX.readFile('/home/ubuntu/upload/ClientesTrue.xlsx');
console.log('Sheets:', workbook.SheetNames);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Headers:', data[0]);
console.log('Total rows:', data.length);
console.log('Sample rows:');
for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
  console.log(`Row ${i}:`, data[i]);
}
