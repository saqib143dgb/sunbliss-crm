(function(){
'use strict';
if(window.__sunblissDemandReferenceMatch)return;
window.__sunblissDemandReferenceMatch=true;

const FRAME_SELECTOR='iframe[src*="welcome-letter.html"]';
const BANK={
  name:'Bank of Baroda',
  holder:'Sunbliss Residences by Purvanchal Real Estate Developers',
  address1:'Deira Dubai, Deira Branch, P.O. Box 5107, Kuwait Building,',
  address2:'Plot No. 45, Bur Dubai, UAE',
  account:'90030200025144',
  iban:'AE370110090030200025144',
  swift:'BARBAEADDEI'
};

function install(frame,attempt){
  attempt=attempt||0;
  try{
    const w=frame.contentWindow,d=frame.contentDocument;
    if(!w||!d)return;
    const stageInput=d.getElementById('stage');
    if(!stageInput||!w.PDFLib?.PDFDocument||typeof w.makeDocumentPdf!=='function'||typeof w.drawHeader!=='function'||typeof w.drawFooter!=='function'){
      if(attempt<80)setTimeout(()=>install(frame,attempt+1),75);
      return;
    }
    if(d.documentElement.dataset.crmDemandReferenceExact==='1')return;
    d.documentElement.dataset.crmDemandReferenceExact='1';

    const accountDetails=d.getElementById('accountDetails');
    if(accountDetails){
      accountDetails.required=false;
      const label=accountDetails.closest('label');
      if(label)label.style.display='none';
    }

    const original=w.makeDocumentPdf;
    const patched=async function(){
      if(!d.getElementById('stage'))return original.apply(this,arguments);
      return buildDemandPdf(w,d);
    };
    patched.__crmReferenceScalePatched=true;
    patched.__crmReferenceScale=1;
    patched.__crmDemandReferenceExact=true;
    w.makeDocumentPdf=patched;
  }catch(_e){
    if(attempt<80)setTimeout(()=>install(frame,attempt+1),75);
  }
}

async function buildDemandPdf(w,d){
  const {PDFDocument,StandardFonts,rgb}=w.PDFLib;
  const pdf=await PDFDocument.create();
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  let ctx={};
  try{ctx=w.eval('crmContext')||{}}catch(_e){}
  let calc={};
  try{calc=typeof w.calculateContext==='function'?(w.calculateContext()||{}):{}}catch(_e){}
  let values={};
  try{values=typeof w.values==='function'?(w.values()||{}):{}}catch(_e){}
  const selected=d.getElementById('stage');
  let stage=null;
  try{stage=typeof w.selectedStage==='function'?w.selectedStage():null}catch(_e){}
  if(!stage&&ctx.stages&&selected&&selected.value!=='')stage=ctx.stages[Number(selected.value)]||null;

  const customer=String(values.customer||ctx.customer?.name||'Customer').trim();
  const address=String(d.getElementById('address')?.value||ctx.customer?.address||'').trim();
  const unit=String(values.unit||ctx.customer?.unit||'').trim();
  const total=num(calc.total ?? ctx.customer?.total);
  const received=num(calc.cashReceived ?? calc.received ?? ctx.customer?.received);
  const due=num(d.getElementById('demandAmount')?.value ?? stage?.due);
  const balance=Math.max(0,num(calc.outstanding ?? (total-received)));
  const letterDate=fmtDate(d.getElementById('date')?.value||ctx.generatedAt||new Date());
  const dueDate=fmtDate(d.getElementById('dueDate')?.value||stage?.revisedDueDate||stage?.dueDate||'');
  const meta=stageMeta(stage?.label||selected?.selectedOptions?.[0]?.textContent||'Installment');
  const transactions=Array.isArray(ctx.transactions)?ctx.transactions.filter(t=>num(t?.amount)>0):[];

  const page1=pdf.addPage([595,842]);
  await w.drawHeader(pdf,page1,bold,font);
  w.drawFooter(page1,font);
  drawPageOne(page1,font,bold,rgb,{customer,address,unit,total,received,due,balance,letterDate,dueDate,meta,transactions});

  const page2=pdf.addPage([595,842]);
  await w.drawHeader(pdf,page2,bold,font);
  w.drawFooter(page2,font);
  drawPageTwo(page2,font,bold,rgb,{due,meta});

  return new w.Blob([await pdf.save()],{type:'application/pdf'});
}

function drawPageOne(page,font,bold,rgb,data){
  const black=rgb(0.05,0.05,0.05), x=52;
  const title='DEMAND LETTER';
  const tw=bold.widthOfTextAtSize(title,14);
  page.drawText(title,{x:(595-tw)/2,y:697,size:14,font:bold,color:black});
  page.drawLine({start:{x:(595-tw)/2,y:695},end:{x:(595+tw)/2,y:695},thickness:.8,color:black});
  drawRight(page,data.letterDate,543,648,10,font,black);

  page.drawText('To,',{x,y:627,size:10,font,color:black});
  page.drawText(data.customer,{x,y:607,size:10,font:bold,color:black});
  if(data.address)drawWrapped(page,data.address,x,587,491,10,12,font,black);

  const ref='Ref: Flat No. '+data.unit+', Sunbliss Residences by Purvanchal Real Estate Developers, Plot No.: AFRA014, Al Furjan, Jebel Ali First, Dubai.';
  const refBottom=drawWrapped(page,ref,x,557,491,9.4,12,bold,black);
  page.drawText('Subject: Demand for Payment of Due Amount',{x,y:refBottom-10,size:10,font:bold,color:black});

  let y=refBottom-33;
  page.drawText('Dear '+data.customer+',',{x,y,size:10,font,color:black});
  y-=22;
  y=drawWrapped(page,'We are pleased to inform you that the construction work is in full swing, and we are making significant progress on-site. For your reference, we have attached the latest photographs showcasing the current updates of the project.',x,y,491,9.25,12,font,black)-9;
  y=drawRichWrapped(page,[
    {text:'As per the payment schedule outlined in our Booking Form /Sale and Purchase Agreement, we hereby request you to settle the ',font},
    {text:data.meta.wordLabel,font:bold},
    {text:' .',font}
  ],x,y,491,9.25,12,black)-10;
  y=drawRichWrapped(page,[
    {text:'The total amount of ',font},
    {text:money(data.due)+' payable on or before '+data.dueDate,font:bold},
    {text:', in accordance with the specified schedule.',font}
  ],x,y,491,9.25,12,black)-11;
  page.drawText('Below is the payment breakdown for your reference:',{x,y,size:9.5,font,color:black});
  y-=13;

  const tableTop=y;
  drawBreakdownTable(page,font,bold,rgb,52,tableTop,420,data);
  y=tableTop-54-18;
  page.drawText('Payment Received to Date: -',{x,y,size:9.5,font,color:black});
  y-=17;
  const tx=data.transactions.length?data.transactions:[{amount:data.received,payment_date:'',payment_type:'Payment Received'}];
  const maxRows=Math.min(tx.length,6);
  for(let i=0;i<maxRows;i++){
    const t=tx[i];
    const label=String(t.payment_type||t.type||'Payment').trim();
    const date=fmtDate(t.payment_date||t.date||'');
    const line='•  '+money(num(t.amount))+' paid'+(date?' on '+date:'')+' ('+label+')';
    drawWrapped(page,line,70,y,460,9.1,12,font,black);
    y-=14;
  }
  if(tx.length>maxRows){
    page.drawText('•  Additional received payments are recorded in the CRM ledger.',{x:70,y,size:8.6,font,color:black});
    y-=14;
  }
  y-=4;
  page.drawText('Amount Due with Payment Account Information',{x,y,size:9.6,font:bold,color:black});
  y-=20;
  page.drawText('Please make the payment via cheque or net banking as follows:',{x,y,size:9.4,font,color:black});
  y-=20;
  page.drawText('•  For the '+data.meta.numericLabel+' of '+money(data.due)+': Escrow Account',{x:70,y,size:9.4,font,color:black});
}

function drawBreakdownTable(page,font,bold,rgb,x,top,width,data){
  const black=rgb(0.05,0.05,0.05);
  const cols=[104,105,105,106];
  const headH=34,rowH=20;
  page.drawRectangle({x,y:top-headH-rowH,width,height:headH+rowH,borderWidth:.8,borderColor:black});
  let cx=x;
  for(let i=1;i<cols.length;i++){cx+=cols[i-1];page.drawLine({start:{x:cx,y:top},end:{x:cx,y:top-headH-rowH},thickness:.65,color:black});}
  page.drawLine({start:{x,y:top-headH},end:{x:x+width,y:top-headH},thickness:.65,color:black});
  const heads=['Total Unit Value','Amount Received','Amount Due '+data.meta.wordLabel,'Balance'];
  const vals=[money(data.total),money(data.received),money(data.due),money(data.balance)];
  cx=x;
  heads.forEach((h,i)=>{drawCenteredWrapped(page,h,cx,top-10,cols[i],8.2,9.2,font,black);drawCentered(page,vals[i],cx,top-headH-14,cols[i],8.8,font,black);cx+=cols[i];});
}

function drawPageTwo(page,font,bold,rgb,data){
  const black=rgb(0.05,0.05,0.05), x=52, width=420;
  const top=695, headerH=31, mainH=104, totalH=28;
  const cols=[26,57,59,48,230];
  const bottom=top-headerH-mainH-totalH;
  page.drawRectangle({x,y:bottom,width,height:headerH+mainH+totalH,borderWidth:.75,borderColor:black});
  let cx=x;
  for(let i=1;i<cols.length;i++){cx+=cols[i-1];page.drawLine({start:{x:cx,y:top},end:{x:cx,y:bottom},thickness:.6,color:black});}
  page.drawLine({start:{x,y:top-headerH},end:{x:x+width,y:top-headerH},thickness:.6,color:black});
  page.drawLine({start:{x,y:top-headerH-mainH},end:{x:x+width,y:top-headerH-mainH},thickness:.6,color:black});

  const heads=['S.No','Description','Amount(AED)','Payable\nTo','Account Details'];
  cx=x;
  heads.forEach((h,i)=>{drawCenteredWrapped(page,h,cx,top-10,cols[i],8.4,9.2,font,black);cx+=cols[i];});
  cx=x;
  drawCentered(page,'1',cx,top-headerH-mainH/2+1,cols[0],8.8,font,black);cx+=cols[0];
  drawCenteredWrapped(page,data.meta.numericLabel,cx,top-headerH-44,cols[1],8.8,10,font,black);cx+=cols[1];
  drawCentered(page,plainNumber(data.due),cx,top-headerH-mainH/2+1,cols[2],8.8,bold,black);cx+=cols[2];
  drawCenteredWrapped(page,'Escrow\nAccount',cx,top-headerH-45,cols[3],8.8,10,font,black);cx+=cols[3];
  drawAccountDetails(page,font,bold,black,cx+4,top-headerH-11,cols[4]-8);

  const totalY=bottom+9;
  drawCenteredWrapped(page,'Total\nAmount Due',x+cols[0],bottom+19,cols[1],8.5,9,bold,black);
  drawCentered(page,plainNumber(data.due),x+cols[0]+cols[1],totalY,cols[2],8.8,bold,black);
  drawCentered(page,'-',x+cols[0]+cols[1]+cols[2],totalY,cols[3],8.8,font,black);
  drawCentered(page,'-',x+cols[0]+cols[1]+cols[2]+cols[3],totalY,cols[4],8.8,font,black);

  let y=bottom-30;
  y=drawRichWrapped(page,[
    {text:'We kindly request you to remit the above-mentioned amount of '+money(data.due)+' ',font:bold},
    {text:amountWords(data.due)+' Dirhams Only.',font:bold}
  ],x,y,491,9.2,11,black)-14;
  y=drawWrapped(page,'Please note that timely payment of the due installment is an essential condition of our Booking Form /Sale and Purchase agreement, and any delay in payment will attract interest charges as specified in the contract.',x,y,491,9.25,12,font,black)-12;
  y=drawWrapped(page,'We greatly appreciate your prompt attention to this matter, as it will help ensure the timely completion of the project and a smooth process for all parties involved. Should you have any questions or require further information, please do not hesitate to contact us.',x,y,491,9.25,12,font,black)-12;
  const thanks='Thank you for your cooperation.';
  const thankW=font.widthOfTextAtSize(thanks,9.4);
  page.drawText(thanks,{x:(595-thankW)/2,y,size:9.4,font,color:black});

  const sigY=Math.max(104,y-55);
  page.drawText('Imran Alam Khan (Manager & Authorised Signatory)',{x,y:sigY,size:9.4,font:bold,color:black});
  page.drawText('For & On behalf of',{x,y:sigY-12,size:9.4,font:bold,color:black});
  page.drawText('Purvanchal Real Estate Developers LLC',{x,y:sigY-24,size:9.4,font:bold,color:black});
}

function drawAccountDetails(page,font,bold,color,x,y,width){
  const lines=[
    ['Escrow Account Details:',bold],
    ['Bank Name: '+BANK.name,bold],
    ['Account Holder: '+BANK.holder,font],
    ['Bank Address:',bold],
    [BANK.address1,font],
    [BANK.address2,font],
    ['Account Number: '+BANK.account,font],
    ['IBAN: '+BANK.iban,font],
    ['SWIFT Code: '+BANK.swift,font]
  ];
  for(const [text,f] of lines){
    const next=drawWrapped(page,text,x,y,width,7.9,8.7,f,color);
    y=next-0.3;
  }
}

function drawWrapped(page,text,x,y,maxWidth,size,lineHeight,font,color){
  const lines=wrap(String(text||''),font,size,maxWidth);
  for(const line of lines){page.drawText(line,{x,y,size,font,color});y-=lineHeight;}
  return y;
}

function drawRichWrapped(page,runs,x,y,maxWidth,size,lineHeight,color){
  const tokens=[];
  runs.forEach(run=>String(run.text||'').split(/(\s+)/).filter(Boolean).forEach(text=>tokens.push({text,font:run.font})));
  let line=[],lineW=0;
  function flush(){
    let cx=x;
    for(const token of line){if(!/^\s+$/.test(token.text)){page.drawText(token.text,{x:cx,y,size,font:token.font,color});}cx+=token.font.widthOfTextAtSize(token.text,size);}
    line=[];lineW=0;y-=lineHeight;
  }
  for(const token of tokens){
    const tokenW=token.font.widthOfTextAtSize(token.text,size);
    if(line.length&&lineW+tokenW>maxWidth&&!/^\s+$/.test(token.text)){flush();if(/^\s+$/.test(token.text))continue;}
    line.push(token);lineW+=tokenW;
  }
  if(line.length)flush();
  return y;
}

function wrap(text,font,size,maxWidth){
  if(String(text).includes('\n'))return String(text).split('\n').flatMap(part=>wrap(part,font,size,maxWidth));
  const words=String(text||'').trim().split(/\s+/);if(!words[0])return [''];
  const lines=[];let line='';
  for(const word of words){const test=line?line+' '+word:word;if(font.widthOfTextAtSize(test,size)<=maxWidth||!line)line=test;else{lines.push(line);line=word;}}
  if(line)lines.push(line);return lines;
}
function drawCentered(page,text,x,y,width,size,font,color){const tw=font.widthOfTextAtSize(String(text),size);page.drawText(String(text),{x:x+(width-tw)/2,y,size,font,color});}
function drawCenteredWrapped(page,text,x,y,width,size,lineHeight,font,color){const lines=String(text).split('\n').flatMap(t=>wrap(t,font,size,width-6));for(const line of lines){drawCentered(page,line,x,y,width,size,font,color);y-=lineHeight;}return y;}
function drawRight(page,text,right,y,size,font,color){const tw=font.widthOfTextAtSize(String(text),size);page.drawText(String(text),{x:right-tw,y,size,font,color});}
function num(v){const n=Number(String(v??0).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
function plainNumber(v){return num(v).toLocaleString('en-US',{minimumFractionDigits:Number.isInteger(num(v))?0:2,maximumFractionDigits:2});}
function money(v){return 'AED '+plainNumber(v)+'/-';}
function fmtDate(v){
  if(!v)return '';
  let dt;
  if(v instanceof Date)dt=v;else if(/^\d{4}-\d{2}-\d{2}/.test(String(v))){const s=String(v).slice(0,10).split('-');dt=new Date(Number(s[0]),Number(s[1])-1,Number(s[2]));}else dt=new Date(v);
  if(!dt||Number.isNaN(dt.getTime()))return String(v);
  const m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return String(dt.getDate()).padStart(2,'0')+'-'+m[dt.getMonth()]+'-'+dt.getFullYear();
}
function stageMeta(label){
  label=String(label||'Installment').replace(/instalment/ig,'Installment').replace(/\s+/g,' ').trim();
  const nums={1:['First','1st'],2:['Second','2nd'],3:['Third','3rd'],4:['Fourth','4th'],5:['Fifth','5th'],6:['Sixth','6th'],7:['Seventh','7th'],8:['Eighth','8th'],9:['Ninth','9th'],10:['Tenth','10th'],11:['Eleventh','11th'],12:['Twelfth','12th']};
  let n=null;
  const digit=label.match(/\b(\d+)(?:st|nd|rd|th)?\b/i);
  if(digit)n=Number(digit[1]);
  if(!n){for(const [k,v] of Object.entries(nums)){if(new RegExp('\\b'+v[0]+'\\b','i').test(label)){n=Number(k);break;}}}
  if(/\bfinal\b/i.test(label))return {wordLabel:'Final Installment',numericLabel:'Final Instalment'};
  if(n&&nums[n])return {wordLabel:nums[n][0]+' Installment',numericLabel:nums[n][1]+' Instalment'};
  const cleaned=label.replace(/\([^)]*\)/g,'').replace(/\s*[-–—]\s*\d+(?:\.\d+)?\s*%.*$/,'').trim();
  return {wordLabel:cleaned||'Installment',numericLabel:(cleaned||'Installment').replace(/Installment/ig,'Instalment')};
}
function amountWords(v){
  let n=Math.round(Math.abs(num(v)));
  if(n===0)return 'Zero';
  const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function under1000(x){const out=[];if(x>=100){out.push(ones[Math.floor(x/100)]+' Hundred');x%=100;}if(x>=20){out.push(tens[Math.floor(x/10)]+(x%10?'-'+ones[x%10]:''));}else if(x>0)out.push(ones[x]);return out.join(' ');}
  const groups=[[1000000000,'Billion'],[1000000,'Million'],[1000,'Thousand'],[1,'']];const out=[];
  for(const [scale,name] of groups){if(n>=scale){const part=Math.floor(n/scale);out.push(under1000(part)+(name?' '+name:''));n%=scale;}}
  return out.join(' ').trim();
}

function scan(){document.querySelectorAll(FRAME_SELECTOR).forEach(frame=>install(frame,0));}
const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',scan,{once:true});
scan();
})();
