(function(){
  'use strict';
  if(window.__sunblissTransactionRecordOrderInstalled)return;
  window.__sunblissTransactionRecordOrderInstalled=true;

  function dayKey(value){
    if(!value)return '';
    if(value instanceof Date && !isNaN(value.getTime())){
      var y=value.getFullYear();
      var m=String(value.getMonth()+1).padStart(2,'0');
      var d=String(value.getDate()).padStart(2,'0');
      return y+'-'+m+'-'+d;
    }
    var s=String(value);
    var match=s.match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : s;
  }

  function sortRecordedOrder(){
    if(!window.state || !Array.isArray(state.recent))return;
    state.recent.sort(function(a,b){
      var aDay=dayKey(a&&a.date);
      var bDay=dayKey(b&&b.date);
      if(aDay!==bDay)return aDay>bDay ? -1 : 1;
      return Number(a&&a.id||0)-Number(b&&b.id||0);
    });
  }

  function install(){
    if(typeof window.loadFromSupabase!=='function'){
      setTimeout(install,50);
      return;
    }
    if(window.loadFromSupabase.__sunblissRecordOrderWrapped){
      sortRecordedOrder();
      return;
    }
    var previous=window.loadFromSupabase;
    var wrapped=async function(){
      var result=await previous.apply(this,arguments);
      sortRecordedOrder();
      return result;
    };
    wrapped.__sunblissRecordOrderWrapped=true;
    window.loadFromSupabase=wrapped;
    sortRecordedOrder();
  }

  install();
})();
