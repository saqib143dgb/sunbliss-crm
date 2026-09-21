(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SunblissPaymentReportExport=factory();})(typeof window!=='undefined'?window:this,function(){
'use strict';

function buildWorkbook(ExcelJS,entries,meta){
  const wb=new ExcelJS.Workbook();
  wb.creator='Sunbliss Residences';
  wb.created=new Date();
  wb.calcProperties.fullCalcOnLoad=true;
  wb.calcProperties.forceFullCalc=true;

  const navy='FF16232F', ink='FF142235', muted='FF667085', line='FFD8DEE8';
  const soft='FFF5F7FA', green='FFEAF6EE', greenText='FF287A4B', white='FFFFFFFF';
  const end=5+entries.length;

  function sum(fn){return Math.round(entries.reduce((s,e)=>s+(Number(fn(e))||0),0)*100)/100;}
  function money(cell){cell.numFmt='#,##0.00';}
  function formula(cell,expr,result,fmt){cell.value={formula:expr,result:result};if(fmt)cell.numFmt=fmt;}
  function fill(cell,color){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:color}};}
  function border(cell){cell.border={top:{style:'thin',color:{argb:line}},left:{style:'thin',color:{argb:line}},bottom:{style:'thin',color:{argb:line}},right:{style:'thin',color:{argb:line}}};}

  const dash=wb.addWorksheet('Dashboard',{views:[{showGridLines:false}]});
  dash.columns=[{width:20},{width:20},{width:20},{width:20},{width:20},{width:20},{width:20},{width:20}];
  dash.mergeCells('A1:H1');dash.getCell('A1').value='SUNBLISS RESIDENCES — PAYMENT DASHBOARD';
  dash.getCell('A1').font={bold:true,size:19,color:{argb:white}};fill(dash.getCell('A1'),navy);dash.getCell('A1').alignment={vertical:'middle'};dash.getRow(1).height=34;
  dash.mergeCells('A2:H2');dash.getCell('A2').value='Report date: '+meta.date;
  dash.getCell('A2').font={bold:true,size:10,color:{argb:muted}};dash.getRow(2).height=22;

  function section(row,title){
    dash.mergeCells(row,1,row,8);
    const c=dash.getCell(row,1);c.value=title;c.font={bold:true,size:12,color:{argb:white}};fill(c,navy);c.alignment={vertical:'middle'};
    dash.getRow(row).height=24;
  }
  function card(labelRange,valueRange,label,valueFormula,result,highlight,countOnly){
    dash.mergeCells(labelRange);dash.mergeCells(valueRange);
    const lc=dash.getCell(labelRange.split(':')[0]),vc=dash.getCell(valueRange.split(':')[0]);
    lc.value=label;lc.font={bold:true,size:9,color:{argb:ink}};fill(lc,soft);lc.alignment={horizontal:'center',vertical:'middle',wrapText:true};border(lc);
    formula(vc,valueFormula,result,countOnly?'0':'#,##0.00');
    vc.font={bold:true,size:countOnly?18:17,color:{argb:highlight?greenText:ink}};
    fill(vc,highlight?green:white);vc.alignment={horizontal:'center',vertical:'middle'};border(vc);
  }

  section(4,'TOTAL UNITS VALUE');
  card('A5:B5','A6:B7','TOTAL CUSTOMERS',`SUBTOTAL(103,Details!A6:A${end})`,entries.length,false,true);
  card('C5:D5','C6:D7','TOTAL SOLD VALUE (AED)',`SUBTOTAL(109,Details!F6:F${end})`,sum(e=>e.price),false,false);
  card('E5:F5','E6:F7','TOTAL COLLECTED (AED) — WITHOUT DLD + ADMIN FEES',`SUBTOTAL(109,Details!G6:G${end})`,sum(e=>e.cash),true,false);
  card('G5:H5','G6:H7','TOTAL REMAINING (AED)',`SUBTOTAL(109,Details!H6:H${end})`,sum(e=>e.balance),false,false);

  section(9,'TOTAL PRE-HANDOVER VALUE');
  card('A10:B10','A11:B12','TOTAL PRE-HANDOVER VALUE (AED)',`SUBTOTAL(109,Details!I6:I${end})`,sum(e=>e.schedule&&e.schedule.constructionAmount),false,false);
  card('D10:E10','D11:E12','TOTAL COLLECTED PRE-HANDOVER VALUE (AED)',`SUBTOTAL(109,Details!J6:J${end})`,sum(e=>e.schedule&&(e.schedule.constructionCash!=null?e.schedule.constructionCash:e.schedule.constructionSettled)),true,false);
  card('G10:H10','G11:H12','TOTAL REMAINING PRE-HANDOVER VALUE (AED)',`SUBTOTAL(109,Details!K6:K${end})`,sum(e=>e.schedule&&e.schedule.constructionBalance),false,false);

  section(14,'TOTAL DLD + ADMIN FEES VALUE');
  card('A15:B15','A16:B17','TOTAL DLD + ADMIN FEES VALUE (AED)',`SUBTOTAL(109,Details!L6:L${end})`,sum(e=>e.feeAmount),false,false);
  card('D15:E15','D16:E17','TOTAL COLLECTED DLD + ADMIN FEES VALUE (AED)',`SUBTOTAL(109,Details!M6:M${end})`,sum(e=>e.feeCash),true,false);
  card('G15:H15','G16:H17','TOTAL REMAINING DLD + ADMIN FEES VALUE (AED)',`SUBTOTAL(109,Details!N6:N${end})`,sum(e=>e.feeBalance),false,false);

  [5,10,15].forEach(r=>dash.getRow(r).height=32);
  [6,7,11,12,16,17].forEach(r=>dash.getRow(r).height=28);
  dash.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:1};

  const details=wb.addWorksheet('Details',{views:[{state:'frozen',xSplit:2,ySplit:5,showGridLines:false}]});
  details.columns=[
    {width:13},{width:31},{width:15},{width:31},{width:31},{width:18},{width:23},{width:20},{width:22},{width:25},
    {width:25},{width:24},{width:29},{width:30},{width:17},{width:23},{width:20},{width:22},{width:22}
  ];
  details.mergeCells('A1:S1');details.getCell('A1').value='SUNBLISS RESIDENCES — PAYMENT DETAILS';
  details.getCell('A1').font={bold:true,size:17,color:{argb:white}};fill(details.getCell('A1'),navy);details.getCell('A1').alignment={vertical:'middle'};details.getRow(1).height=30;
  details.mergeCells('A2:S2');details.getCell('A2').value='Report date: '+meta.date+' (Asia/Dubai)';
  details.getCell('A2').font={bold:true,size:10,color:{argb:ink}};
  details.mergeCells('A3:S3');details.getCell('A3').value='CRM filters: '+(meta.filters||'All customers');
  details.getCell('A3').font={size:9,color:{argb:muted}};
  details.addRow([]);
  const headers=['Unit','Customer','Booking Date','Payment Plan','Pre-Handover Payment Status','Total Sold Value (AED)','Total Collected (AED) — Excl. DLD + Admin','Total Remaining (AED)','Total Pre-Handover Value (AED)','Total Collected Pre-Handover Value (AED)','Total Remaining Pre-Handover Value (AED)','Total DLD + Admin Fees Value (AED)','Total Collected DLD + Admin Fees Value (AED)','Total Remaining DLD + Admin Fees Value (AED)','Received % So Far','Pre-Handover Balance Installment','Last Pre-Handover Due','Overdue Pre-Handover (AED)','Upcoming Pre-Handover (AED)'];
  details.addRow(headers);
  const header=details.getRow(5);header.height=44;
  header.eachCell(c=>{c.font={bold:true,size:10,color:{argb:white}};fill(c,navy);c.alignment={wrapText:true,vertical:'middle',horizontal:'center'};border(c);});

  for(const e of entries){
    const s=e.schedule||{};
    const row=details.addRow([
      e.unitNo,e.customerName,e.bookingDate,s.planLabel,s.completionLabel,e.price,e.cash,e.balance,s.constructionAmount,
      s.constructionCash!=null?s.constructionCash:s.constructionSettled,s.constructionBalance,e.feeAmount||0,e.feeCash||0,e.feeBalance||0,
      e.price?e.cash/e.price:0,s.constructionOpenCount,s.lastConstructionDue,e.overdue,e.upcoming
    ]);
    row.height=21;
    row.eachCell((c,i)=>{
      border(c);
      if((i>=6&&i<=14)||i===18||i===19)money(c);
      if(i===15)c.numFmt='0.00%';
      c.alignment={vertical:'middle',wrapText:i===2||i===5};
    });
  }
  details.autoFilter={from:{row:5,column:1},to:{row:end,column:19}};
  details.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:5'};
  return wb;
}
return {buildWorkbook};
});
