(function(){
  'use strict';
  if(window.__sunblissScheduledActionsOverviewStyleInstalled)return;
  window.__sunblissScheduledActionsOverviewStyleInstalled=true;

  var nextCache={task:null,loadedAt:0,loading:null};
  var mainObserver=null,overviewObserver=null,observedOverview=null;

  function safe(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function todayIso(){var d=new Date();d.setHours(0,0,0,0);var m=d.getMonth()+1,day=d.getDate();return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);}
  function formatShortDate(value){if(!value)return'';var d=new Date(String(value).slice(0,10)+'T00:00:00');if(isNaN(d.getTime()))return String(value);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});}
  function customerForUnit(unitId){if(!window.state||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return Number(c&&c.sno)===Number(unitId);})||null;}
  function openCustomer(unitId){var c=customerForUnit(unitId);if(!c)return;if(typeof window.goToDetail==='function'){window.goToDetail(c.unit,c.sno,'overview');return;}if(!window.state)return;state.selectedUnit=c.unit+'::'+c.sno;state.detailFrom='overview';state.view='detail';if(typeof window.renderMain==='function')window.renderMain();}

  function ensureStyles(){
    if(document.getElementById('scheduledActionsOverviewDistinctStyles'))return;
    var s=document.createElement('style');
    s.id='scheduledActionsOverviewDistinctStyles';
    s.textContent=[
      '#scheduledActionsOverview{position:relative!important;margin:28px 0 8px!important;padding:0 13px 13px!important;border:1px solid var(--paper-line)!important;border-radius:16px!important;background:var(--paper,#F6F1E4)!important;box-shadow:0 8px 24px rgba(15,26,38,.055)!important;overflow:hidden!important}',
      '#scheduledActionsOverview:before{content:"";display:block;height:4px;margin:0 -13px;background:var(--gold-deep,#A27C35)}',
      '#scheduledActionsOverview .scheduled-overview-head{margin:0 -13px 12px!important;padding:14px 13px 13px!important;background:var(--paper-dim,#EEE7D8)!important;border-bottom:1px solid var(--paper-line)!important;align-items:center!important}',
      '#scheduledActionsOverview .scheduled-overview-head .section-label{font-family:Inter,Arial,sans-serif!important;font-size:14px!important;line-height:1.25!important;font-weight:750!important;letter-spacing:.01em!important;text-transform:none!important;color:var(--ink)!important}',
      '#scheduledActionsOverview .scheduled-overview-head .section-label:after{content:none!important;display:none!important}',
      '#scheduledActionsOverview .scheduled-overview-select{min-width:134px!important;max-width:164px!important;padding:8px 34px 8px 12px!important;border:1px solid rgba(162,124,53,.68)!important;border-radius:999px!important;-webkit-appearance:none!important;appearance:none!important;cursor:pointer!important;background-color:var(--paper,#F6F1E4)!important;background-image:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath d=%22M1 1.5 6 6.5 11 1.5%22 fill=%22none%22 stroke=%22%23A27C35%22 stroke-width=%221.6%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 12px center!important;background-size:12px 8px!important;box-shadow:0 2px 7px rgba(15,26,38,.07),inset 0 1px 0 rgba(255,255,255,.5)!important;font-size:10.5px!important}',
      '#scheduledActionsOverview .scheduled-overview-list{border-top:0!important;display:grid!important;gap:8px!important}',
      '#scheduledActionsOverview .scheduled-overview-row{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important;padding:11px 11px 11px 13px!important;border:1px solid var(--paper-line)!important;border-radius:11px!important;background:var(--paper-dim,#EEE7D8)!important}',
      '#scheduledActionsOverview .scheduled-overview-row:before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--slate,#586679)}',
      '#scheduledActionsOverview .scheduled-overview-unit{font-size:9px!important;color:var(--gold-deep,#A27C35)!important}',
      '#scheduledActionsOverview .scheduled-overview-title{font-size:12.5px!important;font-weight:700!important;margin-top:3px!important}',
      '#scheduledActionsOverview .scheduled-overview-meta{margin-top:5px!important;font-size:10.3px!important;line-height:1.45!important}',
      '#scheduledActionsOverview .scheduled-overview-done{min-height:38px!important;padding:8px 10px!important;border-radius:9px!important;background:var(--paper,#F6F1E4)!important}',
      '#scheduledActionsOverview .scheduled-empty{margin:0!important;padding:18px 12px!important;border:1px dashed var(--paper-line)!important;border-radius:11px!important;background:var(--paper-dim,#EEE7D8)!important;text-align:center!important;font-size:11.5px!important}',
      '#scheduledActionsOverview.scheduled-overview-empty-mode{padding-bottom:8px!important}',
      '#scheduledActionsOverview.scheduled-overview-empty-mode .scheduled-overview-head{margin-bottom:7px!important;padding-top:10px!important;padding-bottom:10px!important}',
      '#scheduledActionsOverview .scheduled-empty.scheduled-empty-compact{min-height:44px!important;padding:8px 11px!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(250px,auto)!important;align-items:center!important;gap:14px!important;text-align:left!important}',
      '#scheduledActionsOverview .scheduled-empty-clear{min-width:0;display:flex;align-items:baseline;gap:8px;white-space:nowrap}',
      '#scheduledActionsOverview .scheduled-empty-clear strong{font:650 11px/1.25 Inter,Arial,sans-serif;color:var(--ink)}',
      '#scheduledActionsOverview .scheduled-empty-clear span{font:500 10px/1.25 Inter,Arial,sans-serif;color:var(--muted)}',
      '#scheduledActionsOverview .scheduled-empty-next{min-width:0;max-width:540px;margin:0!important;padding:5px 0 5px 12px!important;border:0!important;border-left:1px solid var(--paper-line)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;grid-template-areas:"kicker title" "kicker meta"!important;column-gap:10px!important;row-gap:2px!important;text-align:left!important;cursor:pointer!important;color:inherit!important}',
      '#scheduledActionsOverview .scheduled-empty-next-kicker{grid-area:kicker;align-self:center;font:700 8.5px/1.2 "IBM Plex Mono",monospace;text-transform:uppercase;letter-spacing:.04em;color:var(--gold-deep,#A27C35);white-space:nowrap}',
      '#scheduledActionsOverview .scheduled-empty-next-title{grid-area:title;min-width:0;font:650 10.5px/1.2 Inter,Arial,sans-serif;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#scheduledActionsOverview .scheduled-empty-next-meta{grid-area:meta;min-width:0;font:500 9px/1.2 Inter,Arial,sans-serif;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#scheduledActionsOverview .scheduled-empty-next:focus-visible{outline:2px solid rgba(162,124,53,.35)!important;outline-offset:2px!important}',
      '@media(max-width:760px){#scheduledActionsOverview .scheduled-empty.scheduled-empty-compact{grid-template-columns:1fr!important;gap:7px!important}#scheduledActionsOverview .scheduled-empty-next{max-width:none!important;padding:7px 0 0!important;border-left:0!important;border-top:1px solid var(--paper-line)!important}#scheduledActionsOverview .scheduled-empty-clear{white-space:normal;flex-wrap:wrap}}',
      '@media(max-width:520px){#scheduledActionsOverview{margin-top:24px!important;padding-left:10px!important;padding-right:10px!important}#scheduledActionsOverview:before{margin-left:-10px!important;margin-right:-10px!important}#scheduledActionsOverview .scheduled-overview-head{margin-left:-10px!important;margin-right:-10px!important;padding-left:10px!important;padding-right:10px!important;gap:8px!important}#scheduledActionsOverview .scheduled-overview-head .section-label{font-size:13.5px!important}#scheduledActionsOverview .scheduled-overview-select{min-width:126px!important;max-width:145px!important}#scheduledActionsOverview .scheduled-overview-row{grid-template-columns:1fr!important;padding:11px 10px 10px 12px!important}#scheduledActionsOverview .scheduled-overview-done{width:100%!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function loadNextUpcoming(){
    if(!window.sb)return Promise.resolve(null);
    if(nextCache.loading)return nextCache.loading;
    if(Date.now()-nextCache.loadedAt<15000)return Promise.resolve(nextCache.task);
    nextCache.loading=sb.from('scheduled_actions')
      .select('id,unit_id,action_label,due_date,priority,status')
      .eq('status','pending')
      .gt('due_date',todayIso())
      .order('due_date',{ascending:true})
      .order('id',{ascending:true})
      .limit(1)
      .then(function(result){
        nextCache.loading=null;
        nextCache.loadedAt=Date.now();
        nextCache.task=result&&result.data&&result.data[0]?result.data[0]:null;
        return nextCache.task;
      }).catch(function(){nextCache.loading=null;nextCache.loadedAt=Date.now();nextCache.task=null;return null;});
    return nextCache.loading;
  }

  function nextButtonHtml(task){
    var c=customerForUnit(task.unit_id),unit=c&&c.unit?c.unit:'Unit '+task.unit_id,name=c&&c.name?c.name:'Customer';
    return '<button type="button" class="scheduled-empty-next" data-open-unit="'+safe(task.unit_id)+'"><span class="scheduled-empty-next-kicker">Next · '+safe(formatShortDate(task.due_date))+'</span><span class="scheduled-empty-next-title">'+safe(task.action_label||'Follow-up')+'</span><span class="scheduled-empty-next-meta">'+safe(unit)+' · '+safe(name)+'</span></button>';
  }

  function bindNext(section){
    var next=section&&section.querySelector('.scheduled-empty-next[data-open-unit]');
    if(!next)return;
    next.onclick=function(e){e.preventDefault();openCustomer(next.getAttribute('data-open-unit'));};
  }

  function genericEmptyCopy(filter){
    if(filter==='tomorrow')return '<div class="scheduled-empty-clear"><strong>No actions tomorrow</strong><span>Nothing is scheduled for tomorrow.</span></div>';
    if(filter==='overdue')return '<div class="scheduled-empty-clear"><strong>No overdue actions</strong><span>Your overdue queue is clear.</span></div>';
    if(filter==='upcoming')return '<div class="scheduled-empty-clear"><strong>No upcoming actions</strong><span>Nothing is scheduled ahead.</span></div>';
    if(filter==='completed')return '<div class="scheduled-empty-clear"><strong>No completed actions</strong><span>No completed items in this view.</span></div>';
    return '<div class="scheduled-empty-clear"><strong>No actions</strong><span>No items in this view.</span></div>';
  }

  function enhanceEmptyState(){
    var section=document.getElementById('scheduledActionsOverview');
    if(!section)return;
    var host=document.getElementById('scheduledOverviewList'),select=document.getElementById('scheduledOverviewFilter');
    if(!host||!select)return;
    if(!select.dataset.compactEmptyBound){
      select.dataset.compactEmptyBound='1';
      select.addEventListener('change',function(){window.setTimeout(enhanceEmptyState,0);});
    }
    if(host.querySelector('.scheduled-overview-row')){
      section.classList.remove('scheduled-overview-empty-mode');
      return;
    }
    var empty=host.querySelector('.scheduled-empty');
    if(!empty)return;
    section.classList.add('scheduled-overview-empty-mode');
    empty.classList.add('scheduled-empty-compact');
    var filter=select.value||'today';
    if(filter!=='today'){
      empty.innerHTML=genericEmptyCopy(filter);
      return;
    }
    empty.innerHTML='<div class="scheduled-empty-clear"><strong>No actions today</strong><span>Your schedule is clear.</span></div><div class="scheduled-empty-clear" data-next-placeholder="1"><span>Checking next action…</span></div>';
    loadNextUpcoming().then(function(task){
      var currentSection=document.getElementById('scheduledActionsOverview'),currentHost=document.getElementById('scheduledOverviewList'),currentSelect=document.getElementById('scheduledOverviewFilter');
      if(!currentSection||!currentHost||!currentSelect||currentSelect.value!=='today'||currentHost.querySelector('.scheduled-overview-row'))return;
      var currentEmpty=currentHost.querySelector('.scheduled-empty');if(!currentEmpty)return;
      currentEmpty.innerHTML='<div class="scheduled-empty-clear"><strong>No actions today</strong><span>Your schedule is clear.</span></div>'+(task?nextButtonHtml(task):'<div class="scheduled-empty-clear"><span>No upcoming scheduled actions.</span></div>');
      bindNext(currentSection);
    });
  }

  function attachOverviewObserver(){
    var overview=document.querySelector('.overview');
    if(overview===observedOverview){enhanceEmptyState();return;}
    if(overviewObserver){overviewObserver.disconnect();overviewObserver=null;}
    observedOverview=overview||null;
    if(!overview)return;
    overviewObserver=new MutationObserver(function(){window.setTimeout(enhanceEmptyState,0);});
    overviewObserver.observe(overview,{childList:true,subtree:false});
    enhanceEmptyState();
  }

  function installObservers(){
    attachOverviewObserver();
    var main=document.getElementById('main')||document.querySelector('main');
    if(main&&!mainObserver){
      mainObserver=new MutationObserver(function(){attachOverviewObserver();});
      mainObserver.observe(main,{childList:true,subtree:false});
    }
    [80,260,700,1400,2600].forEach(function(delay){window.setTimeout(attachOverviewObserver,delay);});
    window.addEventListener('pageshow',function(){nextCache.loadedAt=0;attachOverviewObserver();});
    window.addEventListener('focus',function(){attachOverviewObserver();});
  }

  ensureStyles();
  installObservers();
})();
