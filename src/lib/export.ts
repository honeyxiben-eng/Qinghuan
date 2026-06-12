import * as XLSX from 'xlsx'
export function exportXLSX(filename:string,headers:string[],rows:(string|number|null)[][]){
  const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet([headers,...rows])
  XLSX.utils.book_append_sheet(wb,ws,'Sheet1');XLSX.writeFile(wb,new Date().toISOString().slice(0,10)+'_'+filename+'.xlsx')
}
