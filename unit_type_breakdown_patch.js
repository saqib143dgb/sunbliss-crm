(function(){
  'use strict';
  if(window.__sunblissUnitTypeBreakdownInstalled)return;
  window.__sunblissUnitTypeBreakdownInstalled=true;

  var units=[],hasLoaded=false,loading=null,lastFetch=0,error='';
  var expanded=false,expandedType='',expandedStatus='all',selectedProject='';
  var preferredTypes=['1BR','1BR+STORE','2BR','2BR+MAID','2BR+STORE','3BR','3BR+MAID','3BR+STORE'];
  var sectionId='sunblissUnitTypeBreakdown';
  function str(value){return value==null?'':String(value);}
  function norm(value){return str(value).trim().toUpperCase().replace(/\s*\+\s*/g,'+').replace(/\s+/g,' ');}
  function esc(value){return str(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function availability(unit){
    var status=norm(unit.availability_status||unit.status);
    if(status==='SOLD'||status==='AVAILABLE'||status==='RESERVED'||status==='BLOCKED')return status.toLowerCase();
    return status.toLowerCase()||'unknown';
  }
  function allProjects(){
    return Array.from(new Set(units.map(function(u){return str(u.project_name).trim()||'Sunbliss Residences';}))).sort();
  }
  function visibleUnits(){
    return units.filter(function(u){return (str(u.project_name).trim()||'Sunbliss Residences')===selectedProject;});
  }
  function typeNames(rows){
    var names=new Set();
    rows.forEach(function(u){names.add(norm(u.unit_type)||'NOT SPECIFIED');});
    return Array.from(names).sort(function(a,b){
      var ai=preferredTypes.indexOf(a),bi=preferredTypes.indexOf(b);
      if(ai!==-1&&bi!==-1)return ai-bi;
      if(ai!==-1)return -1;
      if(bi!==-1)return 1;
      return a.localeCompare(b);
    });
  }
  function ensureProject(){
    var projects=allProjects();
    if(projects.indexOf(selectedProject)>=0)return;
    selectedProject=projects.indexOf('Sunbliss Residences')>=0?'Sunbliss Residences':(projects[0]||'Sunbliss Residences');
  }
  var style=document.createElement('style');
  style.id='sunblissUnitTypeBreakdownStyle';
  style.textContent=".utb-panel{margin:9px 0 13px;border:1px solid var(--paper-line);border-radius:13px;background:var(--paper);padding:0;box-shadow:0 1px 2px rgba(15,26,38,.025);color:var(--ink);font-family:Inter,CRMInter,sans-serif;overflow:hidden;}\n.utb-head{display:flex;align-items:center;gap:9px;width:100%;box-sizing:border-box;padding:12px 13px;border:0;background:transparent;color:var(--ink);text-align:left;cursor:pointer;font:inherit;}\n.utb-head:focus-visible,.utb-count:focus-visible,.utb-unit:focus-visible{outline:2px solid var(--gold-deep);outline-offset:-2px;}\n.utb-head-main{flex:1;min-width:0;display:grid;gap:2px;}\n.utb-title{font-size:13px;font-weight:700;line-height:1.3;color:var(--ink);}\n.utb-subtitle{font-size:10.5px;line-height:1.3;color:var(--muted);}\n.utb-head-summary{font-size:11px;white-space:nowrap;color:var(--muted);font-weight:600;font-variant-numeric:tabular-nums;}\n.utb-chevron{display:inline-block;width:7px;height:7px;flex:none;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);transition:transform .16s ease;margin:0 3px 4px 2px;color:var(--ink);}\n.utb-head[aria-expanded=\"true\"] .utb-chevron{transform:rotate(225deg);margin-top:5px;margin-bottom:0;}\n.utb-body{padding:0 13px 12px;border-top:1px solid var(--paper-line);}\n.utb-project{margin:9px 0;display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--muted);}\n.utb-project select{min-width:0;max-width:220px;min-height:30px;border:1px solid var(--paper-line);border-radius:7px;background:var(--paper);color:var(--ink);font:500 11px Inter,CRMInter,sans-serif;padding:4px 7px;}\n.utb-table{width:100%;border-collapse:collapse;table-layout:fixed;font-variant-numeric:tabular-nums;}\n.utb-table th{font-size:10.5px;font-weight:600;color:var(--muted);padding:10px 2px 7px;white-space:nowrap;text-align:right;}\n.utb-table th:first-child,.utb-table td:first-child{text-align:left;width:40%;}\n.utb-table td{font-size:12px;text-align:right;padding:8px 2px;border-top:1px solid var(--paper-line);color:var(--ink);vertical-align:middle;}\n.utb-table .utb-type{font-weight:650;overflow-wrap:anywhere;line-height:1.4;}\n.utb-count{background:transparent;border:0;border-radius:5px;min-width:27px;min-height:30px;padding:3px 4px;cursor:pointer;color:inherit;font:650 12px Inter,CRMInter,sans-serif;font-variant-numeric:tabular-nums;}\n.utb-count:not(:disabled):hover,.utb-count[aria-expanded=\"true\"]{background:var(--paper-dim);}\n.utb-count:disabled{opacity:.55;cursor:default;}\n.utb-count.available{color:var(--sage-deep,#337653);}\n.utb-total td{font-weight:750;background:var(--paper-dim);border-top:1px solid var(--paper-line);}\n.utb-detail-row td{background:var(--paper-dim);padding:10px!important;text-align:left!important;}\n.utb-detail-heading{font-size:11px;font-weight:700;color:var(--ink);margin-bottom:8px;}\n.utb-numbers{display:flex;flex-wrap:wrap;gap:5px;}\n.utb-unit{display:inline-flex;gap:5px;align-items:center;background:var(--paper);border:1px solid var(--paper-line);padding:6px 8px;border-radius:7px;font-size:10.5px;font-weight:600;color:var(--ink);}\n.utb-unit small{color:var(--muted);font-size:9px;font-weight:500;}\n.utb-state{margin:0;padding:12px 3px;font-size:11.5px;color:var(--muted);}\n.utb-error{color:var(--rust);}\n.utb-retry{border:1px solid var(--paper-line);background:var(--paper-dim);border-radius:7px;padding:6px 9px;font-size:11px;color:var(--ink);cursor:pointer;}\n.utb-foot{margin-top:8px;font-size:10px;color:var(--muted);}\n@media(max-width:420px){.utb-head{padding:10px 11px}.utb-body{padding:0 10px 10px}.utb-table th{font-size:9.4px}.utb-table td{font-size:11px;padding:6px 1px}.utb-count{font-size:11px;min-width:26px}.utb-title{font-size:12.5px}.utb-head-summary{font-size:10px;}}\n@media(prefers-reduced-motion:reduce){.utb-chevron{transition:none;}}";
  document.head.appendChild(style);

  function ensureSection(){
    if(!window.state||state.view!=='list')return null;
    var controls=document.querySelector('#main .controls');
    if(!controls)return null;
    var section=document.getElementById(sectionId);
    if(!section){
      section=document.createElement('section');
      section.id=sectionId;section.className='utb-panel';
      section.setAttribute('aria-label','Unit type breakdown');
    }
    var target=controls.querySelector('.inventory-status-bar')||controls.querySelector('.units-action-toolbar');
    if(target&&section.previousElementSibling!==target)target.insertAdjacentElement('afterend',section);
    else if(!section.isConnected)controls.appendChild(section);
    return section;
  }
  function rowsForProject(){
    return visibleUnits().filter(function(u){var s=availability(u);return s==='sold'||s==='available';});
  }
  function counts(rows,type){
    var subset=type==='ALL'?rows:rows.filter(function(u){return (norm(u.unit_type)||'NOT SPECIFIED')===type;});
    return {all:subset.length,sold:subset.filter(function(u){return availability(u)==='sold';}).length,
      available:subset.filter(function(u){return availability(u)==='available';}).length};
  }
  function countButton(type,status,count){
    return '<button type="button" class="utb-count'+(status==='available'?' available':'')+
      '" data-utb-count="'+esc(type)+'" data-utb-scope="'+status+'" aria-label="'+
      esc('Show '+count+' '+(status==='all'?'total':status)+' '+(type==='ALL'?'units':type+' units'))+
      '" aria-expanded="'+(expandedType===type&&expandedStatus===status)+'"'+(count===0?' disabled':'')+
      '>'+count+'</button>';
  }
  function detailRow(type,status,rows){
    if(expandedType!==type)return '';
    var matches=rows.filter(function(u){return (type==='ALL'||(norm(u.unit_type)||'NOT SPECIFIED')===type)&&
      (status==='all'||availability(u)===status);}).sort(function(a,b){return str(a.unit_no).localeCompare(str(b.unit_no),undefined,{numeric:true});});
    return '<tr class="utb-detail-row"><td colspan="4"><div class="utb-detail-heading">'+
      esc(type==='ALL'?'All units':type)+' · '+matches.length+' '+(status==='all'?'total':status)+' units</div>'+
      '<div class="utb-numbers">'+matches.map(function(u){return '<span class="utb-unit">'+esc(u.unit_no||'Unnumbered')+
      '<small>'+esc(availability(u))+'</small></span>';}).join('')+'</div></td></tr>';
  }
  function render(){
    var section=ensureSection();if(!section)return;
    ensureProject();
    var projects=allProjects(),rows=rowsForProject(),total=counts(rows,'ALL'),names=typeNames(rows);
    if(expandedType&&expandedType!=='ALL'&&names.indexOf(expandedType)<0)expandedType='';
    var title='<span class="utb-head-main"><span class="utb-title">Unit Type Breakdown</span>'+
      '<span class="utb-subtitle">'+(error?'Inventory temporarily unavailable':!hasLoaded?'Loading inventory…':
      total.all+' active '+(total.all===1?'unit':'units')+' · '+names.length+' unit '+(names.length===1?'type':'types'))+'</span></span>'+
      '<span class="utb-chevron" aria-hidden="true"></span>';
    var body='';
    if(expanded){
      var projectSelector=projects.length>1?'<label class="utb-project">Project <select data-utb-project aria-label="Select inventory project">'+
        projects.map(function(p){return '<option value="'+esc(p)+'"'+(p===selectedProject?' selected':'')+'>'+esc(p)+'</option>';}).join('')+
        '</select></label>':'';
      var rowsHtml=names.map(function(t){
        var cnt=counts(rows,t);
        var tr='<tr><td class="utb-type">'+esc(t)+'</td>'+
          '<td>'+countButton(t,'all',cnt.all)+'</td>'+
          '<td>'+countButton(t,'sold',cnt.sold)+'</td>'+
          '<td>'+countButton(t,'available',cnt.available)+'</td></tr>';
        return tr+(expandedType===t?detailRow(t,expandedStatus,rows):'');
      }).join('');
      var sum='<tr class="utb-total"><td>TOTAL</td><td>'+countButton('ALL','all',total.all)+'</td>'+
        '<td>'+countButton('ALL','sold',total.sold)+'</td><td>'+countButton('ALL','available',total.available)+'</td></tr>';
      var table='<table class="utb-table"><thead><tr><th scope="col">Unit Type</th><th scope="col">Total</th>'+
        '<th scope="col">Sold</th><th scope="col">Available</th></tr></thead><tbody>'+rowsHtml+sum+
        (expandedType==='ALL'?detailRow('ALL',expandedStatus,rows):'')+'</tbody></table>';
      var content=error?'<div class="utb-state utb-error">'+esc(error)+' <button type="button" class="utb-retry" data-utb-retry>Retry</button></div>':
        !hasLoaded?'<div class="utb-state">Loading unit inventory…</div>':
        projectSelector+(rows.length?table:'<div class="utb-state">No active units found for this project.</div>')+
        '<div class="utb-foot">Tap a number to view the corresponding unit numbers.</div>';
      body='<div class="utb-body" id="utbBreakdownContent">'+content+'</div>';
    }
    section.innerHTML='<button type="button" class="utb-head" data-utb-toggle aria-expanded="'+expanded+
      '" aria-controls="utbBreakdownContent">'+title+'</button>'+body;
  }
  function load(force){
    if(loading)return loading;
    if(hasLoaded&&!force&&Date.now()-lastFetch<20000)return Promise.resolve(units);
    if(!window.sb){error='Inventory connection is not available.';render();return Promise.resolve([]);}
    error='';
    loading=window.sb.from('units')
      .select('id,unit_no,unit_type,project_name,availability_status,status')
      .order('unit_no',{ascending:true}).limit(5000)
      .then(function(result){
        if(result.error)throw result.error;
        units=Array.isArray(result.data)?result.data:[];
        hasLoaded=true;lastFetch=Date.now();error='';
        ensureProject();return units;
      }).catch(function(err){
        console.error('Unit type breakdown could not load',err);
        error='Unable to load unit types. Please select Refresh to retry.';
        return units;
      }).finally(function(){loading=null;render();});
    render();
    return loading;
  }
  function show(){
    if(!window.state||state.view!=='list')return;
    if(!ensureSection())return;
    render();load(false);
  }
  function wrapRender(name){
    var original=window[name];if(typeof original!=='function')return;
    window[name]=function(){
      var result=original.apply(this,arguments);
      show();return result;
    };
  }
  wrapRender('renderList');
  wrapRender('renderMain');
  if(typeof window.loadFromSupabase==='function'){
    var originalLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){
      var result=await originalLoad.apply(this,arguments);
      hasLoaded=false;lastFetch=0;
      if(window.state&&state.view==='list')load(true);
      return result;
    };
  }
  document.addEventListener('click',function(event){
    var target=event.target&&event.target.closest&&event.target.closest('#'+sectionId);
    if(!target)return;
    var button=event.target.closest('[data-utb-toggle],[data-utb-count],[data-utb-retry]');
    if(!button)return;
    event.preventDefault();event.stopPropagation();
    if(button.hasAttribute('data-utb-toggle')){
      expanded=!expanded;
      if(!expanded){expandedType='';expandedStatus='all';}
      render();
      if(expanded)load(false);
    }else if(button.hasAttribute('data-utb-count')){
      var t=button.getAttribute('data-utb-count'),s=button.getAttribute('data-utb-scope');
      if(expandedType===t&&expandedStatus===s){expandedType='';expandedStatus='all';}
      else{expandedType=t;expandedStatus=s;}
      render();
      if(Date.now()-lastFetch>60000)load(true);
    }else if(button.hasAttribute('data-utb-retry')){
      hasLoaded=false;load(true);
    }
  });
  document.addEventListener('change',function(event){
    var select=event.target;if(!select||!select.closest||!select.closest('#'+sectionId))return;
    if(select.matches('[data-utb-project]')){
      selectedProject=select.value;expandedType='';expandedStatus='all';render();
    }
  });
  window.addEventListener('pageshow',show);
  show();
})();
