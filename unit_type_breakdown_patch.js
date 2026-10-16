(function(){
  'use strict';
  if(window.__sunblissUnitTypeBreakdownInstalled)return;
  window.__sunblissUnitTypeBreakdownInstalled=true;

  var units=[],hasLoaded=false,loading=null,lastFetch=0,error='';
  var selectedStatus='all',selectedType='all',selectedProject='',expandedType='';
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
    var names=new Set(preferredTypes);
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
  style.textContent=[
    '.utb-panel{margin:11px 0 12px;border:1px solid var(--paper-line);border-radius:13px;background:var(--paper);padding:13px;box-shadow:0 1px 2px rgba(15,26,38,.035);color:var(--ink);font-family:Inter,CRMInter,sans-serif;}',
    '.utb-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}',
    '.utb-title{font-size:13px;font-weight:700;letter-spacing:0;line-height:1.3;margin:0;color:var(--ink);}',
    '.utb-subtitle{font-size:10.5px;color:var(--muted);margin-top:2px;}',
    '.utb-refresh{border:1px solid var(--paper-line);background:var(--paper-dim);color:var(--ink);border-radius:8px;padding:7px 10px;font-size:10.5px;font-weight:600;cursor:pointer;white-space:nowrap;}',
    '.utb-tools{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:9px;margin-bottom:12px;}',
    '.utb-segment{display:flex;gap:3px;background:var(--paper-dim);padding:3px;border:1px solid var(--paper-line);border-radius:10px;}',
    '.utb-segment button{border:0;border-radius:7px;background:transparent;color:var(--muted);padding:8px 13px;font-size:11px;font-weight:600;cursor:pointer;}',
    '.utb-segment button[aria-pressed="true"]{background:var(--ink);color:var(--paper);}',
    '.utb-selects{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;}',
    '.utb-select-label{display:grid;gap:4px;font-size:10px;font-weight:600;color:var(--muted);}',
    '.utb-select-label select{min-width:145px;max-width:210px;min-height:34px;padding:6px 26px 6px 9px;border:1px solid var(--paper-line);background:var(--paper);color:var(--ink);border-radius:8px;font-size:11.5px;font-family:inherit;}',
    '.utb-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}',
    '.utb-type{width:100%;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper-dim);color:var(--ink);padding:10px 11px;display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;cursor:pointer;min-width:0;}',
    '.utb-type[aria-expanded="true"]{border-color:var(--gold-deep);background:var(--paper);}',
    '.utb-type-name{font-size:12px;font-weight:700;display:block;}',
    '.utb-type-meta{font-size:10px;color:var(--muted);display:block;margin-top:4px;}',
    '.utb-type-count{font-size:19px;line-height:1;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums;}',
    '.utb-total-line{font-size:10.5px;color:var(--muted);display:flex;justify-content:space-between;gap:8px;margin-top:11px;}',
    '.utb-detail{background:var(--paper-dim);border:1px solid var(--paper-line);border-radius:10px;padding:11px;margin-top:10px;}',
    '.utb-detail-heading{font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:9px;}',
    '.utb-numbers{display:flex;flex-wrap:wrap;gap:6px;}',
    '.utb-unit{display:inline-flex;gap:5px;align-items:center;background:var(--paper);border:1px solid var(--paper-line);padding:7px 9px;border-radius:7px;font-size:11px;font-weight:600;color:var(--ink);}',
    '.utb-unit small{color:var(--muted);font-size:9px;font-weight:500;}',
    '.utb-state{padding:12px 3px;font-size:11.5px;color:var(--muted);}',
    '.utb-error{color:var(--rust);}',
    '@media(max-width:620px){.utb-list{grid-template-columns:1fr}.utb-tools{align-items:stretch;flex-direction:column}.utb-selects{width:100%}.utb-select-label{flex:1;min-width:0}.utb-select-label select{max-width:none;width:100%}.utb-segment{align-self:flex-start}.utb-panel{padding:11px}.utb-type-count{font-size:18px}}'
  ].join('');
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
  function render(){
    var section=ensureSection();if(!section)return;
    ensureProject();
    var projectRows=visibleUnits();
    var types=typeNames(projectRows);
    if(types.indexOf(selectedType)<0)selectedType='all';
    var selectedRows=projectRows.filter(function(u){return selectedStatus==='all'||availability(u)===selectedStatus;});
    var totals={all:projectRows.length,sold:0,available:0};
    projectRows.forEach(function(u){var status=availability(u);if(status==='sold'||status==='available')totals[status]++;});
    var projects=allProjects();
    var projectSelector=projects.length>1?'<label class="utb-select-label">Project<select data-utb-project>'+projects.map(function(p){return '<option value="'+esc(p)+'"'+(p===selectedProject?' selected':'')+'>'+esc(p)+'</option>';}).join('')+'</select></label>':'';
    var typeSelector='<label class="utb-select-label">Unit type<select data-utb-type><option value="all">All unit types</option>'+types.map(function(t){return '<option value="'+esc(t)+'"'+(t===selectedType?' selected':'')+'>'+esc(t)+'</option>';}).join('')+'</select></label>';
    var segment=['all','sold','available'].map(function(s){
      return '<button type="button" data-utb-status="'+s+'" aria-pressed="'+(s===selectedStatus)+'">'+s.charAt(0).toUpperCase()+s.slice(1)+'</button>';
    }).join('');
    var cards=types.filter(function(t){return selectedType==='all'||t===selectedType;}).map(function(t){
      var typed=projectRows.filter(function(u){return (norm(u.unit_type)||'NOT SPECIFIED')===t;});
      var scoped=typed.filter(function(u){return selectedStatus==='all'||availability(u)===selectedStatus;});
      var sold=typed.filter(function(u){return availability(u)==='sold';}).length;
      var available=typed.filter(function(u){return availability(u)==='available';}).length;
      var info=selectedStatus==='all'?sold+' sold · '+available+' available':scoped.length+' '+selectedStatus;
      return '<button type="button" class="utb-type" data-utb-open="'+esc(t)+'" aria-expanded="'+(expandedType===t)+'" aria-label="'+esc(t+', '+scoped.length+' units, view unit numbers')+'"><span><span class="utb-type-name">'+esc(t)+'</span><span class="utb-type-meta">'+esc(info)+'</span></span><strong class="utb-type-count">'+scoped.length+'</strong></button>';
    }).join('');
    var detail='';
    if(expandedType&&(selectedType==='all'||selectedType===expandedType)){
      var matches=selectedRows.filter(function(u){return (norm(u.unit_type)||'NOT SPECIFIED')===expandedType;}).sort(function(a,b){return str(a.unit_no).localeCompare(str(b.unit_no),undefined,{numeric:true});});
      detail='<div class="utb-detail" aria-live="polite"><div class="utb-detail-heading">'+esc(expandedType)+' · '+matches.length+' '+(selectedStatus==='all'?'total':selectedStatus)+' units</div><div class="utb-numbers">'+(matches.length?matches.map(function(u){return '<span class="utb-unit">'+esc(u.unit_no||'Unnumbered')+'<small>'+esc(availability(u))+'</small></span>';}).join(''):'<span class="utb-state">No units in this category.</span>')+'</div></div>';
    }
    var body=error?'<p class="utb-state utb-error">'+esc(error)+'</p>':!hasLoaded?'<p class="utb-state">Loading unit inventory…</p>':'<div class="utb-list">'+cards+'</div>'+detail+'<div class="utb-total-line"><span>'+selectedRows.length+' units · '+(selectedStatus==='all'?'all statuses':selectedStatus)+'</span><span>Read-only · Supabase inventory</span></div>';
    section.innerHTML='<div class="utb-head"><div><h3 class="utb-title">Unit Type Breakdown</h3><div class="utb-subtitle">Select a count to see the unit numbers</div></div><button class="utb-refresh" data-utb-refresh type="button"'+(loading?' disabled':'')+'>Refresh</button></div><div class="utb-tools"><div class="utb-segment" role="group" aria-label="Unit availability">'+segment+'</div><div class="utb-selects">'+projectSelector+typeSelector+'</div></div>'+body;
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
    var button=event.target.closest('[data-utb-status],[data-utb-open],[data-utb-refresh]');
    if(!button)return;
    event.preventDefault();event.stopPropagation();
    if(button.hasAttribute('data-utb-status')){
      selectedStatus=button.getAttribute('data-utb-status');expandedType='';render();
    }else if(button.hasAttribute('data-utb-open')){
      var t=button.getAttribute('data-utb-open');
      expandedType=expandedType===t?'':t;render();
    }else if(button.hasAttribute('data-utb-refresh')){
      hasLoaded=false;load(true);
    }
  });
  document.addEventListener('change',function(event){
    var select=event.target;if(!select||!select.closest||!select.closest('#'+sectionId))return;
    if(select.matches('[data-utb-type]')){selectedType=select.value;expandedType='';render();}
    if(select.matches('[data-utb-project]')){selectedProject=select.value;selectedType='all';expandedType='';render();}
  });
  window.addEventListener('pageshow',show);
  show();
})();
