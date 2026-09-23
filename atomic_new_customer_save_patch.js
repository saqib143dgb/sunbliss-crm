(function(){
  'use strict';

  if (window.__sunblissAtomicNewCustomerSaveInstalled) return;
  window.__sunblissAtomicNewCustomerSaveInstalled = true;

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function val(id){ var el=document.getElementById(id); return el ? text(el.value).trim() : ''; }
  function num(value){ var s=text(value).trim(); if(!s) return null; var n=Number(s); return isFinite(n)?n:null; }
  function money(value){ return Math.round((Number(value)||0)*100)/100; }
  function normalizeSource(value){
    var v=text(value).trim().toLowerCase();
    if(v==='broker') return 'Broker';
    if(v==='direct') return 'Direct';
    if(v==='individual buyer'||v==='individual') return 'Individual Buyer';
    return '';
  }
  function validFurnishing(value){ return value==='Fully Furnished'||value==='Semi Furnished'; }

  function stageRows(){
    var rows=[];
    if(typeof window.STAGES==='undefined'||!Array.isArray(window.STAGES)) return rows;
    window.STAGES.forEach(function(stage){
      var amount=val('ncAmt_'+stage.code);
      var due=num(amount);
      if(due===null||due<=0) return;
      var name=(window.STAGE_CODE_TO_NAME&&window.STAGE_CODE_TO_NAME[stage.code])||stage.label||stage.code;
      rows.push({
        code:stage.code,
        final:!!stage.final||stage.code==='FIN',
        stage_name:name,
        due_amount:money(due),
        due_date:val('ncDate_'+stage.code)||null
      });
    });
    return rows;
  }

  function captureDraft(){
    var source=normalizeSource(val('ncSource'));
    var brokeragePct=source==='Broker'?val('ncBrokeragePct'):(source==='Individual Buyer'?val('ncVoucherPct'):'');
    var draft={
      name:val('ncName'), phone:val('ncPhone'), email:val('ncEmail'), nationality:val('ncNationality'),
      designation:val('ncDesignation'), dob:val('ncDob'), passport:val('ncPassport'), eid:val('ncEid'),
      address:val('ncAddress'), permanentAddress:val('ncPermanentAddress'), coApplicant:val('ncCoApplicant'),
      unitNo:val('ncUnitNo'), unitType:val('ncUnitType'), floor:val('ncFloor'), area:val('ncArea'),
      pricePerSqft:val('ncPricePerSqft'), totalPrice:val('ncTotalPrice'), bookingDate:val('ncBookingDate'),
      bookingAmount:val('ncBookingAmount'), bookingPaymentDate:val('ncBookingPaymentDate'), soldBy:val('ncSoldBy'), source:source,
      brokerName:val('ncBrokerName'), brokerCompany:val('ncBrokerCompany'), brokeragePct:brokeragePct,
      incentiveType:source==='Individual Buyer'?val('ncIncentiveType'):''
    };
    if(typeof window.STAGES!=='undefined'&&Array.isArray(window.STAGES)){
      window.STAGES.forEach(function(stage){
        draft['stageAmt_'+stage.code]=val('ncAmt_'+stage.code);
        draft['stageDate_'+stage.code]=val('ncDate_'+stage.code);
      });
    }
    return draft;
  }

  function preserveAndShowError(message,fieldId){
    if(window.state){
      state.newCustomerFormValues=captureDraft();
      state.newCustomerFormSaving=false;
      state.newCustomerFormError=message;
    }
    if(typeof window.renderNewCustomer==='function') window.renderNewCustomer();
    setTimeout(function(){
      var target=(fieldId&&document.getElementById(fieldId))||document.querySelector('.brand-error')||document.getElementById('ncSave');
      if(target&&target.scrollIntoView) target.scrollIntoView({behavior:'smooth',block:'center'});
      if(fieldId){
        var field=document.getElementById(fieldId);
        if(field&&typeof field.focus==='function') setTimeout(function(){ try{field.focus({preventScroll:true});}catch(_e){field.focus();} },250);
      }
    },40);
  }

  function selectedAvailableUnit(unitNo){
    var list=window.state&&Array.isArray(state.__newCustomerAvailableUnits)?state.__newCustomerAvailableUnits:[];
    return list.find(function(row){ return text(row&&row.unit_no).trim()===text(unitNo).trim(); })||null;
  }

  async function atomicSave(){
    if(!window.state||!window.sb) return;
    var draft=captureDraft();
    state.newCustomerFormValues=draft;

    var furnishing=val('ncFurnishingType')||text(state.__newCustomerFurnishingType).trim();
    var source=normalizeSource(draft.source);
    var total=num(draft.totalPrice);
    var bookingAmount=num(draft.bookingAmount);
    var unit=selectedAvailableUnit(draft.unitNo);
    var brokeragePct=null;
    var incentiveType=null;
    var individualSource=val('ncIndividualSourceName')||text(state.__smartNcIndividualName).trim();

    if(!draft.name) return preserveAndShowError('Enter the customer’s name.','ncName');
    if(!draft.unitNo) return preserveAndShowError('Select an available unit.','ncUnitNo');
    if(!unit) return preserveAndShowError('Select an available unit from the list.','ncUnitNo');
    if(total===null||total<=0) return preserveAndShowError('Enter a valid total price.','ncTotalPrice');
    if(!source) return preserveAndShowError('Choose Broker, Direct or Individual Buyer as the sales channel.','ncSource');
    if(!validFurnishing(furnishing)) return preserveAndShowError('Choose Fully Furnished or Semi Furnished.','ncFurnishingType');

    if(!draft.email && draft.nationality && draft.nationality.indexOf('@')!==-1){
      return preserveAndShowError('The email address appears to be entered in Nationality. Move it to the Email field.','ncNationality');
    }
    if(draft.email && (draft.email.indexOf('@')<=0 || draft.email.lastIndexOf('.')<draft.email.indexOf('@')+2)){
      return preserveAndShowError('Enter a valid email address.','ncEmail');
    }
    if(bookingAmount!==null&&bookingAmount>0&&!draft.bookingPaymentDate){
      return preserveAndShowError('Choose the booking payment date.','ncBookingPaymentDate');
    }

    if(source==='Broker'){
      if(!draft.brokerName) return preserveAndShowError('Enter the broker name.','ncBrokerName');
      brokeragePct=num(draft.brokeragePct);
      if(brokeragePct===null||brokeragePct<=0||brokeragePct>100){
        return preserveAndShowError('Enter a valid brokerage percentage between 0 and 100.','ncBrokeragePct');
      }
    }else if(source==='Individual Buyer'){
      incentiveType=draft.incentiveType;
      if(incentiveType!=='Credit Voucher'&&incentiveType!=='Referral Voucher'){
        return preserveAndShowError('Choose Credit Voucher or Referral Voucher for the individual buyer.','ncIncentiveType');
      }
      brokeragePct=num(draft.brokeragePct);
      if(brokeragePct===null||brokeragePct<=0||brokeragePct>100){
        return preserveAndShowError('Enter a valid voucher percentage between 0 and 100.','ncVoucherPct');
      }
    }

    var schedule=stageRows();
    var propertyInstallments=0;
    schedule.forEach(function(row){
      if(row.code==='DLD'||row.final) return;
      propertyInstallments+=Number(row.due_amount)||0;
    });
    if(propertyInstallments>total+0.01){
      return preserveAndShowError('Other installments exceed Total Price. Reduce an installment before saving.','ncTotalPrice');
    }

    var brokerageAmount=(brokeragePct!==null&&brokeragePct>0)?money(total*brokeragePct/100):null;
    var payload={
      customer_name:draft.name,
      phone:draft.phone||null,
      email:draft.email||null,
      nationality:draft.nationality||null,
      designation:draft.designation||null,
      date_of_birth:draft.dob||null,
      passport_no:draft.passport||null,
      eid_no:draft.eid||null,
      address:draft.address||null,
      permanent_address:draft.permanentAddress||null,
      co_applicant:draft.coApplicant||null,
      unit_id:unit.id,
      unit_no:draft.unitNo,
      unit_type:draft.unitType||unit.unit_type||null,
      floor:draft.floor||unit.floor||null,
      area:draft.area||unit.area||unit.unit_area_sqft||null,
      price_per_sqft:draft.pricePerSqft||null,
      total_price:money(total),
      booking_date:draft.bookingDate||null,
      booking_amount:bookingAmount!==null&&bookingAmount>0?money(bookingAmount):null,
      booking_payment_date:bookingAmount!==null&&bookingAmount>0?(draft.bookingPaymentDate||null):null,
      sold_by:draft.soldBy||null,
      source:source,
      broker_name:source==='Broker'?(draft.brokerName||null):null,
      broker_company:source==='Broker'?(draft.brokerCompany||null):null,
      brokerage_percentage:brokeragePct,
      brokerage_amount:brokerageAmount,
      incentive_type:source==='Individual Buyer'?incentiveType:null,
      individual_source_name:source==='Individual Buyer'?(individualSource||null):null,
      furnishing_type:furnishing,
      schedule:schedule.map(function(row){ return {stage_name:row.stage_name,due_amount:row.due_amount,due_date:row.due_date}; })
    };

    state.newCustomerFormSaving=true;
    state.newCustomerFormError=null;
    if(typeof window.renderNewCustomer==='function') window.renderNewCustomer();

    try{
      var result=await sb.rpc('create_customer_sale_atomic',{payload:payload});
      if(result.error) throw result.error;
      var created=result.data||{};
      var unitId=Number(created.unit_id||unit.id);

      state.newCustomerFormValues=null;
      state.newCustomerFormSaving=false;
      state.newCustomerFormError=null;
      state.__newCustomerAvailableUnits=null;
      state.__newCustomerAvailableUnitsPromise=null;
      state.__newCustomerSelectedUnitId=null;
      state.__newCustomerFurnishingType='';
      state.__smartNcPct={};
      state.__smartNcVisible=[];
      state.__smartNcIndividualName='';

      if(typeof window.loadFromSupabase==='function') await window.loadFromSupabase();
      if(typeof window.goToDetail==='function'){
        window.goToDetail(draft.unitNo,unitId,'list');
      }else{
        state.selectedUnit=draft.unitNo+'::'+unitId;
        state.detailFrom='list';
        state.view='detail';
        if(typeof window.renderMain==='function') window.renderMain();
        window.scrollTo(0,0);
      }
    }catch(err){
      preserveAndShowError(err&&err.message?err.message:'Could not create that customer.');
    }
  }

  function install(){
    if(!window.state||!window.sb||typeof window.renderNewCustomer!=='function'){
      setTimeout(install,50);
      return;
    }
    window.saveNewCustomer=atomicSave;
  }

  install();
})();