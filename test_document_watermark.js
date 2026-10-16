(function(){
'use strict';
var test=false;try{test=!!(parent.__crmTestMode&&parent.__crmTestMode.active);}catch(_e){}
window.__crmDocumentIsTest=test;
window.__crmStampTestPdf=async function(pdf){if(!test)return;var font=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);pdf.getPages().forEach(function(p){p.drawText('TEST ONLY - NOT VALID',{x:20,y:p.getHeight()-18,size:10,font:font,color:PDFLib.rgb(.65,.35,.08)});p.drawText('TEST ONLY',{x:p.getWidth()*.18,y:p.getHeight()*.43,size:48,font:font,color:PDFLib.rgb(.7,.5,.2),opacity:.14,rotate:PDFLib.degrees(30)});});pdf.setTitle('TEST ONLY - '+(pdf.getTitle()||'CRM Document'));};
window.__crmStampTestBlob=async function(blob){if(!test)return blob;var pdf=await PDFLib.PDFDocument.load(await blob.arrayBuffer());await window.__crmStampTestPdf(pdf);return new Blob([await pdf.save()],{type:'application/pdf'});};
if(test){document.documentElement.dataset.crmMode='test';var s=document.createElement('style');s.id='crmTestDocumentStyles';s.textContent='.paper{position:relative}.paper:after{content:"TEST ONLY — NOT VALID";position:absolute;top:40%;left:6%;right:6%;text-align:center;font:bold 28px system-ui;transform:rotate(-25deg);color:#a97921;opacity:.25;pointer-events:none;z-index:999}body:before{content:"TEST DOCUMENT — NOT FOR CUSTOMER USE";display:block;text-align:center;padding:8px;background:#fff1ca;color:#6b4a12;font:bold 12px system-ui}';document.head.appendChild(s);}
})();
