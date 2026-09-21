(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SunblissPaymentReportExport=factory();})(typeof window!=='undefined'?window:this,function(){
'use strict';

const EXPORT_PAID_TOLERANCE=7000;

function buildWorkbook(ExcelJS,entries,meta){
  const wb=new ExcelJS.Workbook();
  wb.creator='Sunbliss Residences';
  wb.created=new Date();
  wb.calcProperties.fullCalcOnLoad=true;
  wb.calcProperties.forceFullCalc=true;

  const C={
    navy:'FF16232F',
    navy2:'FF21384D',
    ink:'FF17212B',
    muted:'FF6B7280',
    line:'FFD9E0E8',
    soft:'FFF4F7FA',
    band:'FFF9FBFC',
    white:'FFFFFFFF',
    greenFill:'FFEAF6EE',
    green:'FF247A49',
    amberFill:'FFFFF4DF',
    amber:'FF9A6514',
    red:'FFB42318'
  };
  const end=5+entries.length;

  function sum(fn){return Math.round(entries.reduce((s,e)=>s+(Number(fn(e))||0),0)*100)/100;}
  function fill(cell,color){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:color}};}
  function edge(cell){
    cell.border={
      top:{style:'thin',color:{argb:C.line}},
      left:{style:'thin',color:{argb:C.line}},
      bottom:{style:'thin',color:{argb:C.line}},
      right:{style:'thin',color:{argb:C.line}}
    };
  }
  function money(cell){cell.numFmt='#,##0.00';}
  function formula(cell,expr,result,fmt){cell.value={formula:expr,result:result};if(fmt)cell.numFmt=fmt;}
  function excelDate(v){
    if(!v)return '';
    if(v instanceof Date&&!isNaN(v.getTime()))return v;
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v).slice(0,10));
    return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):v;
  }
  function exportStatus(e){
    const remaining=Math.max(0,Number(e&&e.schedule&&e.schedule.constructionBalance)||0);
    return remaining<=EXPORT_PAID_TOLERANCE?'Completed':'Pending';
  }
  function exportOpenCount(e){
    return exportStatus(e)==='Completed'?0:(Number(e&&e.schedule&&e.schedule.constructionOpenCount)||0);
  }

  const dash=wb.addWorksheet('Dashboard',{
    properties:{tabColor:{argb:C.navy},defaultRowHeight:22},
    views:[{showGridLines:false,zoomScale:90}]
  });
  dash.columns=[{width:20},{width:20},{width:20},{width:20},{width:20},{width:20},{width:20},{width:20}];

  dash.mergeCells('A1:H1');
  dash.getCell('A1').value='SUNBLISS RESIDENCES — PAYMENT DASHBOARD';
  dash.getCell('A1').font={name:'Aptos Display',bold:true,size:18,color:{argb:C.white}};
  fill(dash.getCell('A1'),C.navy);
  dash.getCell('A1').alignment={vertical:'middle',horizontal:'left'};
  dash.getRow(1).height=34;

  dash.mergeCells('A2:H2');
  dash.getCell('A2').value='Management Summary  |  Report date: '+meta.date;
  dash.getCell('A2').font={name:'Aptos',bold:true,size:10,color:{argb:C.muted}};
  dash.getCell('A2').alignment={vertical:'middle',horizontal:'left'};
  dash.getRow(2).height=22;

  function section(row,title){
    dash.mergeCells(row,1,row,8);
    const c=dash.getCell(row,1);
    c.value=title;
    c.font={name:'Aptos',bold:true,size:11,color:{argb:C.white}};
    fill(c,C.navy2);
    c.alignment={vertical:'middle',horizontal:'left',indent:1};
    dash.getRow(row).height=24;
  }
  function card(labelRange,valueRange,label,valueFormula,result,highlight,countOnly){
    dash.mergeCells(labelRange);
    dash.mergeCells(valueRange);
    const lc=dash.getCell(labelRange.split(':')[0]);
    const vc=dash.getCell(valueRange.split(':')[0]);

    lc.value=label;
    lc.font={name:'Aptos',bold:true,size:9,color:{argb:C.ink}};
    fill(lc,C.soft);
    lc.alignment={horizontal:'center',vertical:'middle',wrapText:true};
    edge(lc);

    formula(vc,valueFormula,result,countOnly?'0':'#,##0.00');
    vc.font={name:'Aptos Display',bold:true,size:countOnly?18:16,color:{argb:highlight?C.green:C.ink}};
    fill(vc,highlight?C.greenFill:C.white);
    vc.alignment={horizontal:'center',vertical:'middle'};
    edge(vc);
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

  [5,10,15].forEach(r=>dash.getRow(r).height=31);
  [6,7,11,12,16,17].forEach(r=>dash.getRow(r).height=27);
  dash.pageSetup={
    orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:1,
    margins:{left:0.3,right:0.3,top:0.4,bottom:0.4,header:0.2,footer:0.2}
  };
  dash.printArea='A1:H17';

  const details=wb.addWorksheet('Details',{
    properties:{tabColor:{argb:C.navy2},defaultRowHeight:21},
    views:[{state:'frozen',xSplit:2,ySplit:5,showGridLines:false,zoomScale:85}]
  });
  details.columns=[
    {width:13},{width:30},{width:15},{width:16},{width:20},{width:19},{width:24},{width:20},{width:23},{width:27},
    {width:27},{width:25},{width:30},{width:30},{width:17},{width:24},{width:20},{width:23},{width:23}
  ];

  details.mergeCells('A1:S1');
  details.getCell('A1').value='SUNBLISS RESIDENCES — PAYMENT DETAILS';
  details.getCell('A1').font={name:'Aptos Display',bold:true,size:17,color:{argb:C.white}};
  fill(details.getCell('A1'),C.navy);
  details.getCell('A1').alignment={vertical:'middle',horizontal:'left'};
  details.getRow(1).height=31;

  details.mergeCells('A2:S2');
  details.getCell('A2').value='Report date: '+meta.date+'  |  Status rule in this export: pre-handover balance of AED 7,000 or less = Completed';
  details.getCell('A2').font={name:'Aptos',bold:true,size:9.5,color:{argb:C.ink}};
  details.getCell('A2').alignment={vertical:'middle',horizontal:'left'};
  details.getRow(2).height=21;

  details.mergeCells('A3:S3');
  details.getCell('A3').value='CRM filters: '+(meta.filters||'All customers');
  details.getCell('A3').font={name:'Aptos',size:9,color:{argb:C.muted}};
  details.getCell('A3').alignment={vertical:'middle',horizontal:'left'};
  details.getRow(3).height=20;

  details.addRow([]);
  const headers=[
    'Unit','Customer','Booking Date','Payment Plan','Pre-Handover Payment Status',
    'Total Sold Value (AED)','Total Collected (AED) — Excl. DLD + Admin','Total Remaining (AED)',
    'Total Pre-Handover Value (AED)','Total Collected Pre-Handover Value (AED)','Total Remaining Pre-Handover Value (AED)',
    'Total DLD + Admin Fees Value (AED)','Total Collected DLD + Admin Fees Value (AED)','Total Remaining DLD + Admin Fees Value (AED)',
    'Received % So Far','Pre-Handover Balance Installment','Last Pre-Handover Due','Overdue Pre-Handover (AED)','Upcoming Pre-Handover (AED)'
  ];
  details.addRow(headers);
  const header=details.getRow(5);
  header.height=48;
  header.eachCell(c=>{
    c.font={name:'Aptos',bold:true,size:9.5,color:{argb:C.white}};
    fill(c,C.navy2);
    c.alignment={wrapText:true,vertical:'middle',horizontal:'center'};
    edge(c);
  });

  for(const e of entries){
    const s=e.schedule||{};
    const status=exportStatus(e);
    const row=details.addRow([
      e.unitNo,e.customerName,excelDate(e.bookingDate),s.planLabel,status,e.price,e.cash,e.balance,s.constructionAmount,
      s.constructionCash!=null?s.constructionCash:s.constructionSettled,s.constructionBalance,e.feeAmount||0,e.feeCash||0,e.feeBalance||0,
      e.price?e.cash/e.price:0,exportOpenCount(e),excelDate(s.lastConstructionDue),e.overdue,e.upcoming
    ]);

    row.height=23;
    const isBand=((row.number-6)%2)===1;
    row.eachCell((c,i)=>{
      c.font={name:'Aptos',size:10,color:{argb:C.ink}};
      c.alignment={vertical:'middle',horizontal:(i>=6&&i<=16)||i>=18?'right':'left',wrapText:i===2||i===5};
      c.border={bottom:{style:'hair',color:{argb:C.line}}};
      if(isBand)fill(c,C.band);
      if((i>=6&&i<=14)||i===18||i===19)money(c);
      if(i===15)c.numFmt='0.00%';
      if(i===3||i===17){c.numFmt='dd mmm yyyy';c.alignment={vertical:'middle',horizontal:'center'};}
    });

    const statusCell=row.getCell(5);
    statusCell.font={name:'Aptos',bold:true,size:10,color:{argb:status==='Completed'?C.green:C.amber}};
    fill(statusCell,status==='Completed'?C.greenFill:C.amberFill);
    statusCell.alignment={vertical:'middle',horizontal:'center'};

    [7,10,13].forEach(i=>{
      row.getCell(i).font={name:'Aptos',bold:true,size:10,color:{argb:C.green}};
    });
    [8,11,14,18].forEach(i=>{
      const cell=row.getCell(i);
      if(Number(cell.value)>0)cell.font={name:'Aptos',bold:false,size:10,color:{argb:C.red}};
    });
  }

  details.autoFilter={from:{row:5,column:1},to:{row:end,column:19}};
  details.pageSetup={
    orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,
    printTitlesRow:'1:5',
    margins:{left:0.25,right:0.25,top:0.4,bottom:0.4,header:0.2,footer:0.2}
  };
  details.printArea=`A1:S${end}`;

  return wb;
}

return {buildWorkbook,EXPORT_PAID_TOLERANCE};
});
