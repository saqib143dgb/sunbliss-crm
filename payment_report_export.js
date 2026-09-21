(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SunblissPaymentReportExport=factory();})(typeof window!=='undefined'?window:this,function(){
'use strict';
function buildWorkbook(ExcelJS,entries,meta){
  const wb=new ExcelJS.Workbook();wb.creator='Sunbliss Residences';wb.created=new Date();wb.calcProperties.fullCalcOnLoad=true;
  function sheet(name,headers,widths){const w=wb.addWorksheet(name,{views:[{state:'frozen',xSplit:2,ySplit:7}]});
    w.columns=headers.map((h,i)=>({width:widths?.[i]||23}));
    w.addRow([name+' — AED']);w.addRow(['Report date: '+meta.date+' (Asia/Dubai)']);w.addRow(['Filters: '+meta.filters]);
    w.addRow(['Property payments only. DLD, admin fees and penalties excluded.']);
    w.addRow(['Pending: unpaid above AED 0.01. Upcoming amounts are not overdue.']);
    w.addRow(['Read-only snapshot. Approved unissued adjustments and rounding are disclosed on Reconciliation.']);
    w.addRow(headers);w.autoFilter={from:{row:7,column:1},to:{row:7,column:headers.length}};
    for(let i=1;i<=6;i++){w.mergeCells(i,1,i,headers.length);w.getRow(i).height=i===1?28:25;w.getCell(i,1).alignment={wrapText:true,vertical:'middle'};}
    w.getRow(1).font={bold:true,size:16};w.getRow(7).height=42;
    w.getRow(7).eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF16232F'}};c.alignment={wrapText:true,vertical:'middle'};});
    w.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};return w;
  }
  function totals(w,cols){const end=w.rowCount,row=w.addRow(['TOTAL']);row.font={bold:true};if(end<8)return;for(const col of cols){const letter=w.getColumn(col).letter;let value=0;for(let r=8;r<=end;r++){const v=w.getCell(r,col).value;value+=typeof v==='number'?v:v?.result||0;}row.getCell(col).value={formula:`SUM(${letter}8:${letter}${end})`,result:Math.round(value*100)/100};}}
  function format(w,pcts=[],ints=[]){for(let r=8;r<=w.rowCount;r++){const row=w.getRow(r);row.eachCell((c,i)=>{if(typeof c.value==='number'||c.value?.formula)c.numFmt=pcts.includes(i)?'0.00%':ints.includes(i)?'0':'#,##0.00';c.border={bottom:{style:'hair',color:{argb:'FFDCD2B6'}}};});}}
  const w=sheet('Payment Plan Progress',['Unit','Customer','Payment Plan','Pre-Handover Status','Agreed Price','Net Pre-Handover Required','Cash Received','Cash Received %','Additional Non-Cash Settlement','Pre-Handover Balance','Open Pre-Handover Installments','Final Balance','Total Balance','Overdue Pre-Handover','Upcoming Pre-Handover','Undated Pre-Handover','Last Pre-Handover Due','Customer Credit'],[12,32,15,36]);
  const q=sheet('Reconciliation',['Unit','Customer','SPA Price','Agreed Price','Approved Price Discount','Cash Received','Additional Non-Cash Settlement','Issued Property Credits','Approved Adjustments Not Issued','Rounding / Price Uplift','Total Balance','Customer Credit','Difference (must be zero)','Review Notes'],[12,32]);
  const z=sheet('Installment Detail',['Unit','Customer','Installment','Original Due Date','Revised Due Date','Collection Due Date','Gross Due','Cash Received','Issued Credit','Approved Adjustment Not Issued','Rounding / Price Uplift','Excess Payment Applied','Net Due','Balance','Status'],[12,32,30]);
  for(const e of entries){const s=e.schedule,n=w.rowCount+1;w.addRow([e.unitNo,e.customerName,s.planLabel,s.completionLabel,e.price,s.constructionAmount,e.cash,{formula:`IFERROR(G${n}/E${n},0)`,result:e.price?e.cash/e.price:0},e.nonCashSettlement,s.constructionBalance,s.constructionOpenCount,s.finalBalance,{formula:`J${n}+L${n}`,result:e.balance},e.overdue,e.upcoming,e.undated,s.lastConstructionDue,e.customerCredit]);
    const i=q.rowCount+1;q.addRow([e.unitNo,e.customerName,e.spaPrice,e.price,e.approvedDiscount,e.cash,e.nonCashSettlement,e.issuedCredits,e.pendingAdjustment,e.roundingAdjustment,e.balance,e.customerCredit,{formula:`D${i}-F${i}-G${i}-K${i}+L${i}`,result:e.reconciliation},e.notes.join(' ')||'Reconciled']);
    for(const r of e.rows)z.addRow([e.unitNo,e.customerName,r.stage,r.originalDate,r.dueDate,r.collectionDate,r.gross,r.cash,r.issued,r.adjustment,r.rounding,r.carry,r.net,r.remaining,r.status]);
  }
  totals(w,[5,6,7,9,10,11,12,13,14,15,16,18]);totals(q,[3,4,5,6,7,8,9,10,11,12,13]);totals(z,[7,8,9,10,11,12,13,14]);format(w,[8],[11]);format(q);format(z);
  return wb;
}
return {buildWorkbook};
});
