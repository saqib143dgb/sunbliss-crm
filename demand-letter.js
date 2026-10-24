/* The demand preview and PDF share this measured, paginated reference layout. */
function demandFinancials(ctx){
 const stages=ctx.paymentSchedule||[];
 const fee=t=>/dld|admin|eres|knowledge/i.test(t.payment_type||t.stage_name||t.stageLabel||'')||stages.some(s=>String(s.id)===String(t.payment_schedule_id||t.scheduleId)&&/dld|admin|eres|knowledge/i.test(s.stage_name||''));
 const payments=(ctx.transactions||[]).filter(t=>Number(t.amount)>0&&String(t.accounts_confirmation_status||'confirmed').toLowerCase()==='confirmed');
 const cents=n=>Math.round((Number(n)||0)*100);
 const total=cents(ctx.account?.total??ctx.unit?.total_price);
 const received=payments.filter(t=>!fee(t)).reduce((n,t)=>n+cents(t.amount),0);
 const credit=(ctx.account?.creditNotes||[]).filter(n=>!fee(n)&&!['pending','cancelled','void','draft'].includes(String(n.status||'issued').toLowerCase())).reduce((n,t)=>n+cents(t.amount),0);
 return {total:total/100,received:received/100,balance:Math.max(0,total-received-credit)/100,payments};
}
function demandModel(){
 const stage=selectedStage(),v=values(),finance=demandFinancials(crmContext);
 return {customer:v.customer,address:receiptCustomerDetails().address,unit:v.unit,
 project:crmContext.unit.project_name||crmContext.demandProjectName,
 location:crmContext.demandProjectLocation,date:v.date,dueDate:stage.dueDate,
 rows:stage.items.map(r=>({...r,account:demandPaymentAccounts([r])})),amount:stage.amount,
 ...finance,words:amountWords(stage.amount)};
}
function demandScene(model,measure){
 const pages=[[]],W=595.28,H=841.89,left=60,right=545,width=right-left,contentTop=160,contentBottom=760;
 let page=pages[0],y=230;
 const date=d=>{const parts=String(d||'').slice(0,10).split('-');return parts.length===3?parts[2]+'-'+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(parts[1])-1]+'-'+parts[0]:'-';};
 const money=n=>Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 const cash=n=>'AED '+money(n)+'/-';
 const normal=s=>String(s??'').replace(/[\u2010-\u2015]/g,'-').replace(/\u00a0/g,' ');
 function wrap(text,max,size,bold){const lines=[];for(const para of normal(text).split('\n')){let row='';for(const word of para.split(/\s+/)){if(!word)continue;const next=row?row+' '+word:word;if(measure(next,size,bold)<=max){row=next;continue;}if(row)lines.push(row);row='';for(const char of word){if(row&&measure(row+char,size,bold)>max){lines.push(row);row='';}row+=char;}}lines.push(row);}return lines;}
 function add(text,x,at,size=10.5,bold=false,align='left'){text=normal(text);page.push({text,x:align==='center'?x-measure(text,size,bold)/2:align==='right'?x-measure(text,size,bold):x,y:at,size,bold,width:measure(text,size,bold)});}
 function next(){page=[];pages.push(page);y=contentTop;}
 function ensure(h){if(y+h>contentBottom)next();}
 function para(text,{bold=false,size=10.5,gap=11,align='left',indent=0}={}){const lines=wrap(text,width-indent,size,bold);for(const line of lines){ensure(size*1.25);add(line,align==='center'?(left+right)/2:left+indent,y,size,bold,align);y+=size*1.25;}y+=gap;}
 function line(x,a,x2,b){page.push({line:[x,a,x2,b]});}
 function table(heads,rows,widths,{size=10,accountColumn=-1}={}){
  const ws=widths.map(w=>w*width),leading=size*1.2;
  function draw(cells,header=false){const lines=cells.map((c,i)=>wrap(c,ws[i]-10,size,header));const h=Math.max(...lines.map(a=>a.length))*leading+12;
   if(h+(header?0:Math.max(...heads.map((c,i)=>wrap(c,ws[i]-10,size,true).length))*leading+12)>contentBottom-contentTop)throw Error('The account details are too long for the demand letter. Review the project payment instructions.');
   if(y+h>contentBottom){next();if(!header)draw(heads,true);}
   let x=left;const top=y;cells.forEach((c,i)=>{line(x,top,x+ws[i],top);line(x,top,x,top+h);line(x,top+h,x+ws[i],top+h);const isAccount=!header&&i===accountColumn;const at=top+(h-lines[i].length*leading)/2+size;lines[i].forEach((t,j)=>add(t,isAccount?x+5:x+ws[i]/2,at+j*leading,size,header,isAccount?'left':'center'));x+=ws[i];});line(right,top,right,top+h);y+=h;
  }
  draw(heads,true);rows.forEach(r=>draw(r));y+=12;
 }
 add('DEMAND LETTER',W/2,164,12.3,true,'center');const titleWidth=measure('DEMAND LETTER',12.3,true);line(W/2-titleWidth/2,166,W/2+titleWidth/2,166);
 add(date(model.date),right,213,10.5,false,'right');
 para('To,');para(model.customer.toUpperCase(),{bold:true});if(model.address&&model.address!=='-')para(model.address.toUpperCase(),{bold:true});
 para('Ref: Flat No. '+model.unit+', '+model.project+' by Purvanchal Real Estate Developers, '+model.location+'.',{bold:true});
 para('Subject: Demand for Payment of Due Amount',{bold:true});para('Dear '+model.customer.toUpperCase()+',');
 para('As per the payment schedule outlined in our Booking Form / Sale and Purchase Agreement, we hereby request you to settle '+model.rows.map(r=>r.label).join(' and ')+'.');
 para('The total amount of '+cash(model.amount)+' is payable on or before '+date(model.dueDate)+', in accordance with the specified schedule.',{bold:true});
 para('Below is the payment breakdown for your reference:');
 const installments=model.rows.filter(r=>r.kind!=='dld'),fees=model.rows.filter(r=>r.kind==='dld');
 const heads=['Total Unit Value','Amount Received'],vals=[cash(model.total),cash(model.received)];
 if(installments.length){heads.push('Amount Due\n'+installments.map(r=>r.label).join(' + '));vals.push(cash(installments.reduce((n,r)=>n+Number(r.amount),0)));}
 if(fees.length){heads.push('DLD 4% + Admin Fees + ERES + Knowledge Fee');vals.push(cash(fees.reduce((n,r)=>n+Number(r.amount),0)));}
 heads.push('Balance');vals.push(cash(model.balance));table(heads,[vals],heads.map(()=>1/heads.length),{size:9.5});
 para('Payment Received to Date: -');
 if(!model.payments.length)para('No Accounts-confirmed payments recorded.',{indent:14});
 for(const tx of model.payments)para('• '+cash(tx.amount)+' paid on '+date(tx.payment_date)+' ('+(tx.payment_type||'Payment')+')',{indent:14,gap:2,size:10});
 y+=8;para('Amount Due with Payment Account Information',{bold:true});para('Please make the payment via cheque or net banking as follows:');
 for(const r of model.rows)para('• For '+r.label+' of '+cash(r.amount)+': '+(r.kind==='dld'?'Developer Account':'Escrow Account'),{indent:14,gap:2,size:10});
 next();
 table(['S.No','Description','Amount (AED)','Payable To','Account Details'],model.rows.map((r,i)=>[String(i+1),r.label,money(r.amount),r.kind==='dld'?'Developer Account':'Escrow Account',r.account]).concat([['','Total Amount Due',money(model.amount),'-','-']]),[.07,.23,.14,.13,.43],{size:9.5,accountColumn:4});
 para('We kindly request you to remit the above-mentioned amount of '+cash(model.amount)+' - '+model.words+'.',{bold:true});
 if(fees.length)para('Important: Please note that the DLD 4% charges and admin fee must be paid into the Developer Account only, not the escrow account.',{bold:true});
 para('Please note that timely payment of the due instalment is an essential condition of our Booking Form / Sale and Purchase Agreement, and any delay in payment will attract interest charges as specified in the contract.');
 para('We greatly appreciate your prompt attention to this matter, as it will help ensure the timely completion of the project and a smooth process for all parties involved. Should you have any questions or require further information, please do not hesitate to contact us.');
 para('Thank you for your cooperation.',{align:'center',gap:35});
 ensure(55);para('Imran Alam Khan (Manager & Authorised Signatory)\nFor & On behalf of\nPurvanchal Real Estate Developers LLC',{bold:true,gap:0});
 return pages;
}
async function demandPrepared(){
 const pdf=await PDFLib.PDFDocument.create(),regular=await pdf.embedFont(PDFLib.StandardFonts.Helvetica),bold=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
 const model=demandModel(),pages=demandScene(model,(t,s,b)=>(b?bold:regular).widthOfTextAtSize(t,s));return {pdf,regular,bold,model,pages};
}
let demandPreviewRevision=0;
async function renderDemand(){
 const revision=++demandPreviewRevision,letter=$('letter');letter.className='paper demand-pages';letter.style.backgroundImage='none';
 try{const {pages}=await demandPrepared();if(revision!==demandPreviewRevision)return;
 letter.innerHTML=pages.map((items,i)=>'<svg class="demand-page" viewBox="0 0 595.28 841.89" role="img" aria-label="Demand letter page '+(i+1)+' of '+pages.length+'"><rect width="595.28" height="841.89" fill="white"/><image href="'+COMPANY_LETTERHEAD_PREVIEW+'" width="595.28" height="841.89"/>'+items.map(item=>item.line?'<line x1="'+item.line[0]+'" y1="'+item.line[1]+'" x2="'+item.line[2]+'" y2="'+item.line[3]+'" stroke="black" stroke-width=".5"/>':'<text x="'+item.x+'" y="'+item.y+'" font-size="'+item.size+'" font-weight="'+(item.bold?'bold':'normal')+'" font-family="Arial,Helvetica,sans-serif" textLength="'+item.width+'" lengthAdjust="spacingAndGlyphs" fill="black">'+escapeHtml(item.text)+'</text>').join('')+(crmContext.testMode?'<text x="100" y="420" font-size="36" fill="#a97921" opacity=".3">TEST ONLY - NOT VALID</text>':'')+'</svg>').join('');
 }catch(error){if(revision===demandPreviewRevision){letter.textContent=error.message;$('notice').textContent=error.message;$('generate').disabled=true;}}
}
async function makeDemandPdf(){
 const {pdf,regular,bold,pages,model}=await demandPrepared();
 const [letterhead]=await pdf.embedPdf(COMPANY_LETTERHEAD_PDF,[0]);
 for(const [i,items] of pages.entries()){const p=pdf.addPage([595.28,841.89]);p.drawPage(letterhead,{x:0,y:0,width:595.28,height:841.89});for(const item of items){if(item.line)p.drawLine({start:{x:item.line[0],y:841.89-item.line[1]},end:{x:item.line[2],y:841.89-item.line[3]},thickness:.5,color:PDFLib.rgb(0,0,0)});else p.drawText(item.text,{x:item.x,y:841.89-item.y,size:item.size,font:item.bold?bold:regular,color:PDFLib.rgb(0,0,0)});}}
 pdf.setTitle('Demand Letter - '+model.unit);pdf.setAuthor('Purvanchal Real Estate Developers LLC');return new Blob([await pdf.save()],{type:'application/pdf'});
}
