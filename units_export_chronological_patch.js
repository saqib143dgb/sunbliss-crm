(function(){
  'use strict';

  if(window.__sunblissUnitsExportChronologicalInstalled)return;
  window.__sunblissUnitsExportChronologicalInstalled=true;

  var salesIndexPromise=null;

  function text(v){return v==null?'':String(v);}
  function norm(v){return text(v).trim().toUpperCase().replace(/\s+/g,' ');}
  function nice(v){return typeof window.titleCase==='function'?window.titleCase(text(v)):text(v);}
  function dateValue(v){
    var s=text(v).trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
    var d=new Date(s+'T00:00:00');
    return isNaN(d.getTime())?null:d;
  }
  function money(v){
    var n=Number(v);
    return isFinite(n)?Math.round(n*100)/100:0;
  }
  function isVoidedTransaction(t){
    return /(bounce|bounced|refund|refunded|revers|void|deleted|uncleared\s*pdc|credit\s*note|carry\s*forward)/i.test([
      t&&t.payment_type,t&&t.payment_reference,t&&t.remarks
    ].join(' '));
  }
  function isOtherCash(t){
    return /(dld|admin|penalt|late\s*fee|late\s*charge|other\s*fee)/i.test(text(t&&t.payment_type));
  }
  function pairKey(unitId,customerId){return text(unitId)+'|'+text(customerId);}
  function fallbackKey(unitNo,customerName){return norm(unitNo)+'|'+norm(customerName);}

  async function loadSalesIndex(){
    if(salesIndexPromise)return salesIndexPromise;
    salesIndexPromise=(async function(){
      if(!window.sb)return {byPair:{},byFallback:{},cashByUnit:{}};
      var results=await Promise.all([
        sb.from('sales').select('id,unit_id,customer_id,booking_date,commercial_sale_price,commercial_non_cash_settlement').order('booking_date',{ascending:true}).order('id',{ascending:true}),
        sb.from('units').select('id,unit_no'),
        sb.from('customers').select('id,customer_name'),
        sb.from('payment_transactions').select('unit_id,amount,payment_type,payment_reference,remarks')
      ]);
      results.forEach(function(r){if(r.error)throw r.error;});
      var units={},customers={},byPair={},byFallback={},cashByUnit={};
      (results[1].data||[]).forEach(function(u){units[text(u.id)]=u.unit_no||'';});
      (results[2].data||[]).forEach(function(c){customers[text(c.id)]=c.customer_name||'';});
      (results[0].data||[]).forEach(function(s){
        var entry={
          id:Number(s.id)||0,
          unitId:s.unit_id,
          bookingDate:s.booking_date||'',
          commercialSalePrice:money(s.commercial_sale_price),
          nonCashSettlement:money(s.commercial_non_cash_settlement)
        };
        var pk=pairKey(s.unit_id,s.customer_id);
        if(!byPair[pk] || (entry.bookingDate&&(!byPair[pk].bookingDate||entry.bookingDate<byPair[pk].bookingDate)))byPair[pk]=entry;
        var fk=fallbackKey(units[text(s.unit_id)]||'',customers[text(s.customer_id)]||'');
        if(fk!=='|' && (!byFallback[fk] || (entry.bookingDate&&(!byFallback[fk].bookingDate||entry.bookingDate<byFallback[fk].bookingDate))))byFallback[fk]=entry;
      });
      (results[3].data||[]).forEach(function(t){
        if(isVoidedTransaction(t))return;
        var key=text(t.unit_id),amount=money(t.amount);
        if(amount<=0)return;
        if(!cashByUnit[key])cashByUnit[key]={property:0,other:0};
        if(isOtherCash(t))cashByUnit[key].other=money(cashByUnit[key].other+amount);
        else cashByUnit[key].property=money(cashByUnit[key].property+amount);
      });
      return {byPair:byPair,byFallback:byFallback,cashByUnit:cashByUnit};
    })().catch(function(err){salesIndexPromise=null;throw err;});
    return salesIndexPromise;
  }

  function saleForCustomer(c,index){
    var uid=c&&(c.unitId||c.dbUnitId),cid=c&&(c.customerId||c.dbCustomerId);
    var hit=index.byPair[pairKey(uid,cid)];
    if(hit)return hit;
    return index.byFallback[fallbackKey(c&&c.unit,c&&c.name)]||{id:0,unitId:null,bookingDate:'',commercialSalePrice:0,nonCashSettlement:0};
  }

  async function exportChronological(rows){
    if(!window.ExcelJS)throw new Error('Spreadsheet library did not load — check your connection and try again.');
    var index=await loadSalesIndex();
    var ordered=(rows||[]).map(function(item,originalIndex){
      var c=item&&item.c?item.c:item;
      return {item:item,c:c,sale:saleForCustomer(c,index),originalIndex:originalIndex};
    }).sort(function(a,b){
      var ad=a.sale.bookingDate||'9999-12-31',bd=b.sale.bookingDate||'9999-12-31';
      if(ad!==bd)return ad.localeCompare(bd);
      if((a.sale.id||0)!==(b.sale.id||0))return (a.sale.id||0)-(b.sale.id||0);
      var an=norm(a.c&&a.c.name),bn=norm(b.c&&b.c.name);
      if(an!==bn)return an.localeCompare(bn);
      return a.originalIndex-b.originalIndex;
    });

    var wb=new ExcelJS.Workbook;
    wb.creator=(window.state&&state.branding&&state.branding.name)||'Sunbliss Residences';
    wb.created=new Date;
    var ws=wb.addWorksheet('Units',{views:[{state:'frozen',ySplit:1}]});
    ws.columns=[
      {header:'Booking Date',key:'bookingDate',width:15},
      {header:'Unit',key:'unit',width:12},
      {header:'Customer',key:'customer',width:30},
      {header:'Actual Property Price (AED)',key:'commercialPrice',width:25},
      {header:'Property Cash Received (AED)',key:'propertyCash',width:27},
      {header:'Received Amount %',key:'receivedPercentage',width:19},
      {header:'DLD/Admin Cash Received (AED)',key:'otherCash',width:28},
      {header:'Actual Property Outstanding (AED)',key:'propertyOutstanding',width:30},
      {header:'SPA',key:'spa',width:14},
      {header:'OQOOD',key:'oqood',width:14},
      {header:'Furnishing',key:'furniture',width:18}
    ];
    ws.autoFilter={from:{row:1,column:1},to:{row:1,column:11}};
    var header=ws.getRow(1);header.height=20;header.eachCell(function(cell){
      cell.font={bold:true,color:{argb:'FFEDE6D6'},size:11};
      cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF16232F'}};
      cell.alignment={vertical:'middle'};
      cell.border={bottom:{style:'medium',color:{argb:'FF16232F'}}};
    });

    ordered.forEach(function(entry){
      var c=entry.c||{},cash=index.cashByUnit[text(entry.sale.unitId)]||{property:0,other:0};
      var commercialPrice=entry.sale.commercialSalePrice>0?entry.sale.commercialSalePrice:money(c.total);
      var receivedPercentage=commercialPrice>0?cash.property/commercialPrice:0;
      var propertyOutstanding=Math.max(0,money(commercialPrice-cash.property-entry.sale.nonCashSettlement));
      var hasOutstanding=propertyOutstanding>0.01;
      var spa=(c.spa||'').toLowerCase()==='signed';
      var oqood=(c.oqood||'').toLowerCase()==='completed';
      var furnishing=c.info&&c.info.furnishingType?c.info.furnishingType:(c.furniture&&c.furniture.toLowerCase()==='signed'?'Fully Furnished':'Semi Furnished');
      var furnished=furnishing==='Fully Furnished';
      var bookingDate=dateValue(entry.sale.bookingDate);
      var row=ws.addRow({
        bookingDate:bookingDate||'',
        unit:c.unit||'',
        customer:nice(c.name),
        commercialPrice:commercialPrice,
        propertyCash:cash.property,
        receivedPercentage:receivedPercentage,
        otherCash:cash.other,
        propertyOutstanding:propertyOutstanding,
        spa:c.spa||'Not Started',
        oqood:c.oqood||'Not Completed',
        furniture:furnishing
      });
      if(bookingDate)row.getCell('bookingDate').numFmt='dd mmm yyyy';
      ['commercialPrice','propertyCash','otherCash','propertyOutstanding'].forEach(function(key){row.getCell(key).numFmt='#,##0.00';});
      row.getCell('receivedPercentage').numFmt='0.0%';
      row.getCell('propertyOutstanding').font={bold:true,color:{argb:hasOutstanding?'FFAE3B2B':'FF3F7A57'}};
      row.getCell('spa').font={color:{argb:spa?'FF3F7A57':'FF9C5A12'}};
      row.getCell('oqood').font={color:{argb:oqood?'FF3F7A57':'FF9C5A12'}};
      row.getCell('furniture').font={color:{argb:furnished?'FF3F7A57':'FF736C5C'}};
      row.eachCell(function(cell){cell.border={bottom:{style:'thin',color:{argb:'FFDCD2B6'}}};});
    });

    var buffer=await wb.xlsx.writeBuffer();
    var blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var stamp=new Date().toISOString().slice(0,10);
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='Sunbliss-Units-'+stamp+'.xlsx';document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(function(){URL.revokeObjectURL(url);},30000);
  }

  window.exportFilteredList=exportChronological;
})();
