(function(){
  'use strict';

  if (window.__sunblissCancelUnitHangFixInstalled) return;
  window.__sunblissCancelUnitHangFixInstalled = true;

  var pendingCancellation = null;

  function text(value){ return value == null ? '' : String(value); }

  function applyCancelledState(pending){
    if (!pending || !window.state) return;

    var unitId = text(pending.unitId);
    var data = pending.data || {};
    var args = pending.args || {};
    var active = Array.isArray(state.dues) ? state.dues : [];
    var index = -1;

    for (var i = 0; i < active.length; i++) {
      if (text(active[i] && active[i].sno) === unitId) {
        index = i;
        break;
      }
    }

    if (index >= 0) {
      var source = active[index];
      var cancelled = Object.assign({}, source);
      cancelled.received = Number(data.amount_paid !== undefined ? data.amount_paid : source.received) || 0;
      cancelled.status = 'Cancelled';
      cancelled.cancelArchiveId = data.cancelled_unit_id || null;
      cancelled.cancelMeta = {
        unit_id: Number(pending.unitId),
        amount_paid: cancelled.received,
        cancellation_date: args.p_cancellation_date || null,
        cancellation_type: args.p_cancellation_type || null,
        cancellation_reason: args.p_cancellation_reason || null,
        settlement_type: args.p_settlement_type || null,
        refund_amount: Number(data.refund_amount !== undefined ? data.refund_amount : args.p_refund_amount) || 0,
        forfeited_amount: Number(data.forfeited_amount !== undefined ? data.forfeited_amount : args.p_forfeited_amount) || 0,
        remarks: args.p_remarks || null
      };

      active.splice(index, 1);
      if (!Array.isArray(state.cancelled)) state.cancelled = [];

      var existing = -1;
      for (var j = 0; j < state.cancelled.length; j++) {
        if (text(state.cancelled[j] && state.cancelled[j].sno) === unitId) {
          existing = j;
          break;
        }
      }
      if (existing >= 0) state.cancelled[existing] = cancelled;
      else state.cancelled.push(cancelled);
    }

    var archive = window.__sunblissCancelledUnitArchive;
    if (archive) {
      archive.loaded = false;
      archive.loading = null;
      archive.records = [];
      archive.byId = {};
      archive.version = Number(archive.version || 0) + 1;
    }
  }

  function installRpcWrapper(){
    if (!window.sb || typeof sb.rpc !== 'function' || sb.rpc.__sunblissCancelHangWrapped) return false;
    var originalRpc = sb.rpc.bind(sb);

    function wrappedRpc(name,args,options){
      var result = originalRpc(name,args,options);
      if (name !== 'crm_cancel_unit' || !result || typeof result.then !== 'function') return result;

      return result.then(function(response){
        if (response && !response.error) {
          pendingCancellation = {
            unitId: args && args.p_unit_id,
            args: args || {},
            data: response.data || {}
          };
        }
        return response;
      });
    }

    wrappedRpc.__sunblissCancelHangWrapped = true;
    wrappedRpc.__sunblissOriginal = originalRpc;
    sb.rpc = wrappedRpc;
    return true;
  }

  function installLoadWrapper(){
    if (typeof window.loadFromSupabase !== 'function' || window.loadFromSupabase.__sunblissCancelHangWrapped) return false;
    var originalLoad = window.loadFromSupabase;

    async function wrappedLoad(){
      if (pendingCancellation) {
        var pending = pendingCancellation;
        pendingCancellation = null;
        applyCancelledState(pending);
        return;
      }
      return originalLoad.apply(this,arguments);
    }

    wrappedLoad.__sunblissCancelHangWrapped = true;
    wrappedLoad.__sunblissOriginal = originalLoad;
    window.loadFromSupabase = wrappedLoad;
    return true;
  }

  function softenMobileAutofocus(){
    var button = document.getElementById('actionCancelUnit');
    if (!button || button.dataset.cancelHangFixBound === '1') return;
    button.dataset.cancelHangFixBound = '1';
    button.addEventListener('click',function(){
      setTimeout(function(){
        var reason = document.getElementById('cuReason');
        if (reason && document.activeElement === reason && typeof reason.blur === 'function') reason.blur();
      },0);
    });
  }

  function install(){
    var rpcReady = installRpcWrapper();
    var loadReady = installLoadWrapper();
    softenMobileAutofocus();

    if (!rpcReady || !loadReady) setTimeout(install,60);
  }

  if (typeof window.renderDetail === 'function' && !window.renderDetail.__sunblissCancelHangRenderWrapped) {
    var originalRenderDetail = window.renderDetail;
    function wrappedRenderDetail(){
      var out = originalRenderDetail.apply(this,arguments);
      softenMobileAutofocus();
      return out;
    }
    wrappedRenderDetail.__sunblissCancelHangRenderWrapped = true;
    wrappedRenderDetail.__sunblissOriginal = originalRenderDetail;
    window.renderDetail = wrappedRenderDetail;
  }

  install();
})();
