import XLSX from 'xlsx';

const files = [
  'C:/Users/yashg/Downloads/Leave register Jan 26.xlsx',
  "C:/Users/yashg/Downloads/Payroll Compliance data sheet for January'26.xlsx",
  'C:/Users/yashg/Downloads/January 2026_Standard Template for Data sharing_Findem.xlsx',
];

for (const f of files) {
  try {
    const wb = XLSX.readFile(f, { cellDates: true });
    console.log('\n===', f.split('/').pop(), '===');
    console.log('Sheets:', wb.SheetNames);
    const sn = wb.SheetNames[0];
    const ws = wb.Sheets[sn];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    for (let r = 0; r < Math.min(12, data.length); r++) {
      const row = data[r] || [];
      console.log('R' + r, JSON.stringify(row.slice(0, 35)));
    }
  } catch (e) {
    console.log('ERR', f, e.message);
  }
}
