(function(){
'use strict';
if(window.__sunblissDemandReferenceMatchV2)return;
window.__sunblissDemandReferenceMatchV2=true;

const FRAME_SELECTOR='iframe[src*="welcome-letter.html"]';
const PAGE_W=595,PAGE_H=842;
const BODY_X=34,BODY_RIGHT=562,BODY_W=528;
const SIZE=10.5,LINE=12;
const BANK={
  name:'Bank of Baroda',
  holder:'Sunbliss Residences by Purvanchal Real Estate Developers',
  address1:'Deira Dubai, Deira Branch, P.O. Box 5107, Kuwait Building,',
  address2:'Plot No. 45, Bur Dubai, UAE',
  account:'90030200025144',
  iban:'AE370110090030200025144',
  swift:'BARBAEADDEI'
};
const y=t=>PAGE_H-t;

function bankDetailsText(){
  return [
    'Escrow Account Details:',
    'Bank Name: '+BANK.name,
    'Account Holder: '+BANK.holder,
    'Bank Address: '+BANK.address1+' '+BANK.address2,
    'Account Number: '+BANK.account,
    'IBAN: '+BANK.iban,
    'SWIFT Code: '+BANK.swift
  ].join('\n');
}

function install(frame,attempt=0){
  try{
    const w=frame.contentWindow,d=frame.contentDocument;
    if(!w||!d)return;
    const stageInput=d.getElementById('stage');
    if(!stageInput||!w.PDFLib?.PDFDocument||typeof w.makeDocumentPdf!=='function'||typeof w.drawHeader!=='function'||typeof w.drawFooter!=='function'){
      if(attempt<100)setTimeout(()=>install(frame,attempt+1),75);
      return;
    }
    if(d.documentElement.dataset.crmDemandMasterReference==='1')return;
    d.documentElement.dataset.crmDemandMasterReference='1';

    const accountDetails=d.getElementById('accountDetails');
    if(accountDetails){
      accountDetails.required=false;
      accountDetails.value=bankDetailsText();
      const label=accountDetails.closest('label');
      if(label)label.style.display='none';
    }

    const original=w.makeDocumentPdf;
    const patched=async function(){
      if(!d.getElementById('stage'))return original.apply(this,arguments);
      try{
        return await buildDemandPdf(w,d);
      }catch(err){
        console.error('[Sunbliss CRM] Exact Demand Letter renderer failed; using safe native renderer.',err);
        return original.apply(this,arguments);
      }
    };
    patched.__crmReferenceScalePatched=true;
    patched.__crmReferenceScale=1;
    patched.__crmDemandReferenceExact=true;
    patched.__crmDemandMasterReference=true;
    patched.__crmSafeFallback=true;
    w.makeDocumentPdf=patched;
  }catch(_e){
    if(attempt<100)setTimeout(()=>install(frame,attempt+1),75);
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
  const account=ctx.account||{};

  const selected=d.getElementById('stage');
  let stage=null;
  try{stage=typeof w.selectedStage==='function'?w.selectedStage():null}catch(_e){}
  if(!stage&&Array.isArray(account.stages)&&selected&&selected.value!=='')stage=account.stages[Number(selected.value)]||null;

  const customer=String(values.customer||ctx.customer?.customer_name||ctx.customer?.name||'Customer').trim();
  const address=String(d.getElementById('address')?.value||account.info?.address||ctx.customer?.address||'').trim();
  const unit=String(values.unit||ctx.unit?.unit_no||ctx.customer?.unit||'').trim();
  const total=num(calc.total ?? account.total ?? ctx.customer?.total ?? ctx.customer?.unitValue);
  const received=num(calc.cashReceived ?? calc.received ?? account.cashReceived ?? account.received ?? ctx.customer?.received);
  const due=num(d.getElementById('demandAmount')?.value ?? stage?.due);
  const balance=Math.max(0,num(calc.outstanding ?? account.outstanding ?? (total-received)));
  const letterDate=fmtDate(d.getElementById('date')?.value||ctx.generatedAt||new Date());
  const dueDate=fmtDate(d.getElementById('dueDate')?.value||stage?.revisedDueDate||stage?.dueDate||'');
  const meta=stageMeta(stage?.label||selected?.selectedOptions?.[0]?.textContent||'Instalment');
  const transactions=normalizeTransactions(Array.isArray(ctx.transactions)?ctx.transactions:[]);
  const data={customer,address,unit,total,received,due,balance,letterDate,dueDate,meta,transactions};

  const page1=pdf.addPage([PAGE_W,PAGE_H]);
  await w.drawHeader(pdf,page1,font,bold);
  w.drawFooter(page1,bold);
  drawPageOne(page1,font,bold,rgb,data);

  const page2=pdf.addPage([PAGE_W,PAGE_H]);
  await w.drawHeader(pdf,page2,font,bold);
  w.drawFooter(page2,bold);
  drawPageTwo(page2,font,bold,rgb,data);

  return new w.Blob([await pdf.save()],{type:'application/pdf'});
}

function drawPageOne(page,font,bold,rgb,d){
  const black=rgb(0.03,0.03,0.03);

  // Master-reference coordinates taken directly from the uploaded 2-page demand draft.
  drawCentered(page,'DEMAND LETTER',0,y(164.25),PAGE_W,12.28,bold,black);
  page.drawLine({start:{x:250.75,y:y(165.75)},end:{x:345.25,y:y(165.75)},thickness:.75,color:black});
  drawRight(page,d.letterDate,561.9,y(214.5),SIZE,font,black);

  drawTextFit(page,'To,',BODY_X,y(237),BODY_W,SIZE,font,black);
  drawTextFit(page,d.customer,BODY_X,y(259.5),BODY_W,SIZE,bold,black,9);
  drawTextFit(page,d.address,BODY_X,y(282),BODY_W,SIZE,bold,black,8.7);

  const ref='Ref: Flat No. '+d.unit+', Sunbliss Residences by Purvanchal Real Estate Developers, Plot No.: AFRA014, Al Furjan, Jebel Ali First, Dubai.';
  drawWrappedFixed(page,ref,BODY_X,y(304.5),BODY_W,SIZE,LINE,bold,black,2);
  page.drawText('Subject: Demand for Payment of Due Amount',{x:BODY_X,y:y(339),size:SIZE,font:bold,color:black});
  drawTextFit(page,'Dear '+d.customer+',',BODY_X,y(361.5),BODY_W,SIZE,font,black,9);

  page.drawText('We are pleased to inform you that the construction work is in full swing, and we are making significant progress',{x:BODY_X,y:y(384),size:SIZE,font,color:black});
  page.drawText('on-site. For your reference, we have attached the latest photographs showcasing the current updates of the',{x:BODY_X,y:y(396),size:SIZE,font,color:black});
  page.drawText('project.',{x:BODY_X,y:y(408),size:SIZE,font,color:black});

  page.drawText('As per the payment schedule outlined in our Booking Form /Sale and Purchase Agreement, we hereby request you',{x:BODY_X,y:y(430.5),size:SIZE,font,color:black});
  drawRichLine(page,[
    {text:'to settle the ',font},
    {text:d.meta.wordLabel,font:bold},
    {text:' .',font}
  ],BODY_X,y(442.5),SIZE,black);

  drawRichFitLine(page,[
    {text:'The total amount of ',font},
    {text:money(d.due)+' ',font:bold},
    {text:'payable on or before ',font},
    {text:d.dueDate,font:bold},
    {text:', in accordance with the specified schedule.',font}
  ],BODY_X,y(465),BODY_W,SIZE,black,9.1);

  page.drawText('Below is the payment breakdown for your reference:',{x:BODY_X,y:y(487.5),size:SIZE,font,color:black});
  drawBreakdownTable(page,font,bold,black,d);

  page.drawText('Payment Received to Date: -',{x:BODY_X,y:y(581.25),size:SIZE,font,color:black});
  drawPayments(page,font,black,d.transactions,d.received);

  page.drawText('Amount Due with Payment Account Information',{x:BODY_X,y:y(674.25),size:SIZE,font:bold,color:black});
  page.drawText('Please make the payment via cheque or net banking as follows:',{x:BODY_X,y:y(696.75),size:SIZE,font,color:black});
  drawBullet(page,54.25,y(716.25),black);
  drawRichFitLine(page,[
    {text:'For the '+d.meta.numericLabel+' of ',font},
    {text:money(d.due)+': Escrow Account',font:bold}
  ],64,y(719.25),498,SIZE,black,9);
}

function drawBreakdownTable(page,font,bold,black,d){
  const xs=[34,166,298,430,562];
  const top=y(504.75),mid=y(539.25),bottom=y(561);
  drawGrid(page,xs,[top,mid,bottom],black,.75);

  drawCentered(page,'Total Unit Value',xs[0],y(525.75),xs[1]-xs[0],SIZE,font,black);
  drawCentered(page,'Amount Received',xs[1],y(525.75),xs[2]-xs[1],SIZE,font,black);
  drawCentered(page,'Amount Due '+d.meta.wordOnly,xs[2],y(519.75),xs[3]-xs[2],SIZE,font,black);
  drawCentered(page,'Instalment',xs[2],y(531.75),xs[3]-xs[2],SIZE,font,black);
  drawCentered(page,'Balance',xs[3],y(525.75),xs[4]-xs[3],SIZE,font,black);

  drawCenteredFit(page,money(d.total),xs[0],y(553.5),xs[1]-xs[0],SIZE,font,black,8.8);
  drawCenteredFit(page,money(d.received),xs[1],y(553.5),xs[2]-xs[1],SIZE,font,black,8.8);
  drawCenteredFit(page,money(d.due),xs[2],y(553.5),xs[3]-xs[2],SIZE,font,black,8.8);
  drawCenteredFit(page,money(d.balance),xs[3],y(553.5),xs[4]-xs[3],SIZE,font,black,8.8);
}

function drawPayments(page,font,black,transactions,received){
  let list=transactions.filter(t=>t.amount>0);
  if(!list.length&&received>0)list=[{amount:received,date:'',label:'Payment Received',rank:50}];
  const maxRows=7;
  list=list.slice(0,maxRows);
  const compact=list.length>5;
  const size=compact?9.4:SIZE;
  const step=compact?10.2:12;
  let topBaseline=603.75;
  list.forEach((t,i)=>{
    const by=topBaseline+i*step;
    drawBullet(page,54.25,y(by-3.5),black,compact?1.2:1.5);
    const text=money(t.amount)+' paid'+(t.date?' on '+t.date:'')+' ('+t.label+')';
    drawTextFit(page,text,64,y(by),498,size,font,black,8.4);
  });
}

function drawPageTwo(page,font,bold,rgb,d){
  const black=rgb(0.03,0.03,0.03);
  const xs=[34,67,138.25,212.5,272.5,562];
  const ys=[y(162),y(196.5),y(326.25),y(360)];
  drawGrid(page,xs,ys,black,.75);

  // Header row
  drawCentered(page,'S.No',xs[0],y(183),xs[1]-xs[0],SIZE,font,black);
  drawCentered(page,'Description',xs[1],y(183),xs[2]-xs[1],SIZE,font,black);
  drawCentered(page,'Amount(AED)',xs[2],y(183),xs[3]-xs[2],SIZE,font,black);
  drawCentered(page,'Payable',xs[3],y(177),xs[4]-xs[3],SIZE,font,black);
  drawCentered(page,'To',xs[3],y(189),xs[4]-xs[3],SIZE,font,black);
  drawCentered(page,'Account Details',xs[4],y(183),xs[5]-xs[4],SIZE,font,black);

  // Main row
  drawCentered(page,'1',xs[0],y(264.75),xs[1]-xs[0],SIZE,font,black);
  drawCentered(page,d.meta.ordinal,xs[1],y(258.75),xs[2]-xs[1],SIZE,font,black);
  drawCentered(page,'Instalment',xs[1],y(270.75),xs[2]-xs[1],SIZE,font,black);
  drawCenteredFit(page,plainNumber(d.due),xs[2],y(264.75),xs[3]-xs[2],SIZE,font,black,8.8);
  drawCentered(page,'Escrow',xs[3],y(258.75),xs[4]-xs[3],SIZE,font,black);
  drawCentered(page,'Account',xs[3],y(270.75),xs[4]-xs[3],SIZE,font,black);

  const accountX=277;
  page.drawText('Escrow Account Details:',{x:accountX,y:y(210.75),size:SIZE,font:bold,color:black});
  page.drawText('Bank Name: '+BANK.name,{x:accountX,y:y(222.75),size:SIZE,font,color:black});
  drawTextFit(page,'Account Holder: '+BANK.holder,accountX,y(234.75),280,SIZE,font,black,9.5);
  page.drawText('Estate Developers',{x:accountX,y:y(246.75),size:SIZE,font,color:black});
  page.drawText('Bank Address:',{x:accountX,y:y(258.75),size:SIZE,font,color:black});
  drawTextFit(page,BANK.address1,accountX,y(270.75),280,SIZE,font,black,9.5);
  page.drawText(BANK.address2,{x:accountX,y:y(282.75),size:SIZE,font,color:black});
  page.drawText('Account Number: '+BANK.account,{x:accountX,y:y(294.75),size:SIZE,font,color:black});
  page.drawText('IBAN: '+BANK.iban,{x:accountX,y:y(306.75),size:SIZE,font,color:black});
  page.drawText('SWIFT Code: '+BANK.swift,{x:accountX,y:y(318.75),size:SIZE,font,color:black});

  // Total row
  drawCentered(page,'Total',xs[1],y(340.5),xs[2]-xs[1],SIZE,bold,black);
  drawCentered(page,'Amount Due',xs[1],y(352.5),xs[2]-xs[1],SIZE,bold,black);
  drawCenteredFit(page,plainNumber(d.due),xs[2],y(346.5),xs[3]-xs[2],SIZE,bold,black,8.8);
  drawCentered(page,'-',xs[3],y(346.5),xs[4]-xs[3],SIZE,font,black);
  drawCentered(page,'-',xs[4],y(346.5),xs[5]-xs[4],SIZE,font,black);

  const request='We kindly request you to remit the above-mentioned amount of '+money(d.due)+' '+amountWordsMoney(d.due)+'.';
  drawWrappedAt(page,request,BODY_X,y(392.25),BODY_W,SIZE,LINE,bold,black,2);

  const p2='Please note that timely payment of the due instalment is an essential condition of our Booking Form /Sale and Purchase agreement, and any delay in payment will attract interest charges as specified in the contract.';
  drawWrappedAt(page,p2,BODY_X,y(426.75),BODY_W,SIZE,LINE,font,black,2);

  const p3='We greatly appreciate your prompt attention to this matter, as it will help ensure the timely completion of the project and a smooth process for all parties involved. Should you have any questions or require further information, please do not hesitate to contact us.';
  drawWrappedAt(page,p3,BODY_X,y(461.25),BODY_W,SIZE,LINE,font,black,3);

  drawCentered(page,'Thank you for your cooperation.',0,y(507.75),PAGE_W,SIZE,font,black);
  page.drawText('Imran Alam Khan (Manager & Authorised Signatory)',{x:BODY_X,y:y(557.25),size:SIZE,font:bold,color:black});
  page.drawText('For & On behalf of',{x:BODY_X,y:y(569.25),size:SIZE,font:bold,color:black});
  page.drawText('Purvanchal Real Estate Developers LLC',{x:BODY_X,y:y(581.25),size:SIZE,font:bold,color:black});
}

function normalizeTransactions(rows){
  return rows.map((t,i)=>{
    const raw=String(t.payment_type||t.type||t.towards||t.label||t.stage_label||t.stage||'Payment').trim();
    const label=normalizePaymentLabel(raw);
    const amount=num(t.amount ?? t.paid_amount ?? t.value ?? t.received);
    const date=fmtDate(t.payment_date||t.date||t.transaction_date||t.received_date||t.paid_date||'');
    return {amount,date,label,rank:paymentRank(label,raw,i)};
  }).filter(t=>t.amount>0).sort((a,b)=>a.rank-b.rank);
}
function normalizePaymentLabel(raw){
  let s=String(raw||'Payment').replace(/installment/ig,'Instalment').replace(/instalment/ig,'Instalment').trim();
  if(/pre\s*reg|registration\s*fee|dld/i.test(s))return 'pre reg Amount';
  if(/booking|down\s*payment|reservation/i.test(s))return 'Booking Amount';
  const m=s.match(/(\d+)(?:st|nd|rd|th)?\s*Instalment/i);
  if(m)return ordinal(Number(m[1]))+' Instalment';
  const wordNum={first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,eleventh:11,twelfth:12};
  for(const [w,n] of Object.entries(wordNum))if(new RegExp('\\b'+w+'\\b','i').test(s)&&/Instalment/i.test(s))return ordinal(n)+' Instalment';
  return s;
}
function paymentRank(label,raw,i){
  const m=label.match(/^(\d+)(?:st|nd|rd|th)\s+Instalment/i);if(m)return Number(m[1]);
  if(/booking/i.test(label))return 100;
  if(/pre\s*reg/i.test(label))return 110;
  return 50+i/100;
}

function stageMeta(label){
  const s=String(label||'Instalment').replace(/installment/ig,'Instalment').replace(/\s+/g,' ').trim();
  if(/\bfinal\b/i.test(s))return {wordLabel:'Final Instalment',wordOnly:'Final',numericLabel:'Final Instalment',ordinal:'Final'};
  let n=null;
  const dm=s.match(/\b(\d+)(?:st|nd|rd|th)?\b/i);if(dm)n=Number(dm[1]);
  if(!n){const names=['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'];for(let i=1;i<names.length;i++){if(new RegExp('\\b'+names[i]+'\\b','i').test(s)){n=i;break;}}}
  if(n){const w=wordOrdinal(n);return {wordLabel:w+' Instalment',wordOnly:w,numericLabel:ordinal(n)+' Instalment',ordinal:ordinal(n)};}
  const clean=s.replace(/\([^)]*\)/g,'').replace(/\s*[-–—]\s*\d+(?:\.\d+)?\s*%.*$/,'').trim();
  return {wordLabel:clean||'Instalment',wordOnly:(clean||'Instalment').replace(/\s*Instalment$/i,''),numericLabel:clean||'Instalment',ordinal:(clean||'Instalment').replace(/\s*Instalment$/i,'')};
}

function drawGrid(page,xs,ys,color,thickness){
  const top=Math.max.apply(null,ys),bottom=Math.min.apply(null,ys);
  xs.forEach(x=>page.drawLine({start:{x,y:bottom},end:{x,y:top},thickness,color}));
  ys.forEach(yy=>page.drawLine({start:{x:xs[0],y:yy},end:{x:xs[xs.length-1],y:yy},thickness,color}));
}
function drawBullet(page,x,yy,color,r=1.5){page.drawCircle({x,y:yy,size:r,color});}
function drawCentered(page,text,x,yy,width,size,font,color){const t=String(text);const w=font.widthOfTextAtSize(t,size);page.drawText(t,{x:x+(width-w)/2,y:yy,size,font,color});}
function drawCenteredFit(page,text,x,yy,width,size,font,color,min=8.5){const s=fitSize(String(text),font,size,width-4,min);drawCentered(page,text,x,yy,width,s,font,color);}
function drawRight(page,text,right,yy,size,font,color){const t=String(text);page.drawText(t,{x:right-font.widthOfTextAtSize(t,size),y:yy,size,font,color});}
function drawTextFit(page,text,x,yy,width,size,font,color,min=8.5){const t=String(text||'');const s=fitSize(t,font,size,width,min);page.drawText(t,{x,y:yy,size:s,font,color});}
function fitSize(text,font,start,width,min){let s=start;while(s>min&&font.widthOfTextAtSize(text,s)>width)s-=.1;return Math.max(min,s);}
function drawRichLine(page,runs,x,yy,size,color){let cx=x;runs.forEach(r=>{const t=String(r.text||'');page.drawText(t,{x:cx,y:yy,size,font:r.font,color});cx+=r.font.widthOfTextAtSize(t,size);});}
function drawRichFitLine(page,runs,x,yy,width,size,color,min=8.5){let s=size;const measure=ss=>runs.reduce((n,r)=>n+r.font.widthOfTextAtSize(String(r.text||''),ss),0);while(s>min&&measure(s)>width)s-=.1;drawRichLine(page,runs,x,yy,s,color);}
function drawWrappedFixed(page,text,x,startY,width,size,lineHeight,font,color,maxLines){let lines=wrap(text,font,size,width);if(lines.length>maxLines){let s=size;while(s>8.5&&wrap(text,font,s,width).length>maxLines)s-=.1;size=s;lines=wrap(text,font,size,width);}lines.slice(0,maxLines).forEach((line,i)=>page.drawText(line,{x,y:startY-i*lineHeight,size,font,color}));}
function drawWrappedAt(page,text,x,startY,width,size,lineHeight,font,color,maxLines){let lines=wrap(text,font,size,width);if(lines.length>maxLines){let s=size;while(s>8.5&&wrap(text,font,s,width).length>maxLines)s-=.1;size=s;lines=wrap(text,font,size,width);}lines.slice(0,maxLines).forEach((line,i)=>page.drawText(line,{x,y:startY-i*lineHeight,size,font,color}));}
function wrap(text,font,size,width){const words=String(text||'').trim().split(/\s+/);if(!words[0])return [''];const out=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(!line||font.widthOfTextAtSize(test,size)<=width)line=test;else{out.push(line);line=word;}}if(line)out.push(line);return out;}

function num(v){const n=Number(String(v??0).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
function plainNumber(v){return num(v).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});}
function money(v){return 'AED '+plainNumber(v)+'/-';}
function fmtDate(v){
  if(!v)return '';
  let dt;
  if(v instanceof Date)dt=v;else if(/^\d{4}-\d{2}-\d{2}/.test(String(v))){const p=String(v).slice(0,10).split('-');dt=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));}else dt=new Date(v);
  if(!dt||Number.isNaN(dt.getTime()))return String(v);
  const m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return String(dt.getDate()).padStart(2,'0')+'-'+m[dt.getMonth()]+'-'+dt.getFullYear();
}
function ordinal(n){n=Math.max(0,Math.trunc(Number(n)||0));const mod100=n%100;if(mod100>=11&&mod100<=13)return n+'th';switch(n%10){case 1:return n+'st';case 2:return n+'nd';case 3:return n+'rd';default:return n+'th';}}
function wordOrdinal(n){const a=['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'];return a[n]||ordinal(n);}
function wordsInteger(n){
  n=Math.max(0,Math.floor(n));if(n===0)return 'Zero';
  const one=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const under1000=x=>{let out=[];if(x>=100){out.push(one[Math.floor(x/100)]+' Hundred');x%=100;}if(x>=20){out.push(tens[Math.floor(x/10)]+(x%10?'-'+one[x%10]:''));}else if(x>0)out.push(one[x]);return out.join(' ');};
  const groups=[[1000000000,'Billion'],[1000000,'Million'],[1000,'Thousand'],[1,'']];let out=[];
  for(const [scale,name] of groups){if(n>=scale){const part=Math.floor(n/scale);out.push(under1000(part)+(name?' '+name:''));n%=scale;}}
  return out.join(' ').trim();
}
function amountWordsMoney(v){
  const amount=Math.round(Math.abs(num(v))*100)/100;
  const dirhams=Math.floor(amount+1e-9);
  const fils=Math.round((amount-dirhams)*100);
  let out=wordsInteger(dirhams)+' Dirhams';
  if(fils>0)out+=' and '+wordsInteger(fils)+' Fils';
  return out+' Only';
}

function scan(){document.querySelectorAll(FRAME_SELECTOR).forEach(frame=>install(frame,0));}
const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',scan,{once:true});
scan();
})();