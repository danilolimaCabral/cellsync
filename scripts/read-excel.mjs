import XLSX from 'xlsx';

const workbook1 = XLSX.readFile('/home/ubuntu/upload/Produtos.xlsx');
const workbook2 = XLSX.readFile('/home/ubuntu/upload/RelatóriodoEstoque.xlsx');

console.log('=== Produtos.xlsx ===');
console.log('Sheets:', workbook1.SheetNames);
const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
const data1 = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
console.log('Headers:', data1[0]);
console.log('Total rows:', data1.length);
console.log('Sample row:', data1[1]);

console.log('\n=== RelatóriodoEstoque.xlsx ===');
console.log('Sheets:', workbook2.SheetNames);
const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
console.log('Headers:', data2[0]);
console.log('Total rows:', data2.length);
console.log('Sample row:', data2[1]);
