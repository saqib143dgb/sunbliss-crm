(function(){
  'use strict';
  if(window.__sunblissMobileStatusCardsInstalled)return;
  window.__sunblissMobileStatusCardsInstalled=true;

  var MQ='(max-width:1023px)';
  var raf=0;

  function mobile(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth<1024;}
  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function norm(v){return clean(v).toLowerCase();}

  var ICONS={
    signed:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l4 4v16H6zM14 2v5h5M9 11h5M9 15h3"/><circle cx="16.5" cy="17" r="3.5"/><path d="m15 17 1 1 2-2"/></svg>',
    drafted:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l4 4v16H6zM14 2v5h5M9 11h6M9 15h4"/><path d="m14.5 18.5 4-4 1.5 1.5-4 4-2 .5z"/></svg>',
    notstarted:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l4 4v16H6zM14 2v5h5M9 11h6M9 15h4"/><circle cx="17" cy="17" r="3.4"/><path d="m15.8 15.8 2.4 2.4M18.2 15.8l-2.4 2.4"/></svg>',
    completed:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l4 4v16H6zM14 2v5h5M9 11h5M9 15h3"/><circle cx="16.5" cy="17" r="3.5"/><path d="m15 17 1 1 2-2"/></svg>',
    pending:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l4 4v16H6zM14 2v5h5M9 11h6M9 15h4"/><circle cx="17" cy="17" r="3.4"/><path d="M17 15.4V17l1 1"/></svg>',
    furnished:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M4 12h16a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2zM5 19v2M19 19v2"/></svg>'
  };

  function sectionInfo(title){
    var t=norm(title);
    if(t==='spa status')return{type:'spa',title:'SPA STATUS'};
    if(t==='oqood status')return{type:'oqood',title:'OQOOD STATUS'};
    if(t==='furniture status'||t==='furnishing type')return{type:'furnishing',title:'FURNISHING TYPE'};
    return null;
  }

  function cardInfo(section,label,index){
    var l=norm(label);
    if(section==='spa'){
      if(l==='signed'||index===0)return{tone:'good',icon:'signed',label:'Signed'};
      if(l==='drafted'||index===1)return{tone:'warn',icon:'drafted',label:'Drafted'};
      return{tone:'neutral',icon:'notstarted',label:'Not started'};
    }
    if(section==='oqood'){
      if(l==='completed'||index===0)return{tone:'good',icon:'completed',label:'Completed'};
      if(l==='pending'||index===1)return{tone:'warn',icon:'pending',label:'Pending'};
      return{tone:'neutral',icon:'notstarted',label:'Not started'};
    }
    if(l==='fully furnished'||l==='furnished'||index===0)return{tone:'good',icon:'furnished',label:'Fully Furnished'};
    return{tone:'neutral',icon:'furnished',label:'Semi Furnished'};
  }

  function decorate(){
    raf=0;
    if(!mobile())return;
    var overview=document.querySelector('.overview');
    if(!overview)return;

    overview.querySelectorAll('.section-label').forEach(function(sectionLabel){
      var info=sectionInfo(sectionLabel.textContent);
      if(!info)return;
      if(clean(sectionLabel.textContent)!==info.title)sectionLabel.textContent=info.title;
      sectionLabel.classList.add('sbx-status-section-label');
      sectionLabel.setAttribute('data-sbx-status-section',info.type);

      var pipeline=sectionLabel.nextElementSibling;
      if(!pipeline||!pipeline.classList.contains('pipeline'))return;
      pipeline.classList.add('sbx-status-pipeline');
      pipeline.setAttribute('data-sbx-status-section',info.type);
      pipeline.classList.toggle('sbx-status-two',info.type==='furnishing');

      pipeline.querySelectorAll('.pill-stat').forEach(function(card,index){
        var original=card.querySelector('.pill-stat-lbl');
        if(!original)return;
        var cfg=cardInfo(info.type,original.textContent,index);
        if(clean(original.textContent)!==cfg.label)original.textContent=cfg.label;
        card.classList.add('sbx-status-card');
        card.setAttribute('data-sbx-tone',cfg.tone);

        var head=card.querySelector('.sbx-status-card-head');
        if(!head){
          head=document.createElement('div');
          head.className='sbx-status-card-head';
          head.innerHTML='<span class="sbx-status-icon" aria-hidden="true"></span><span class="sbx-status-head-label"></span>';
          card.insertBefore(head,card.firstChild);
        }
        var icon=head.querySelector('.sbx-status-icon');
        if(icon&&icon.getAttribute('data-icon')!==cfg.icon){
          icon.setAttribute('data-icon',cfg.icon);
          icon.innerHTML=ICONS[cfg.icon]||ICONS.notstarted;
        }
        var headLabel=head.querySelector('.sbx-status-head-label');
        if(headLabel&&clean(headLabel.textContent)!==cfg.label)headLabel.textContent=cfg.label;
      });
    });
  }

  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(decorate);
  }

  function install(){
    schedule();
    var target=document.getElementById('main')||document.body;
    if(window.MutationObserver&&target){
      new MutationObserver(schedule).observe(target,{childList:true,subtree:true});
    }
    window.addEventListener('resize',schedule,{passive:true});
  }

  var style=document.createElement('style');
  style.id='sunblissMobileStatusCardsStyle';
  style.textContent=[
    '@media(max-width:1023px){',
      '.overview .section-label.sbx-status-section-label{display:flex!important;align-items:center!important;gap:12px!important;margin:24px 4px 12px!important;font:500 10.5px/1 IBM Plex Mono,monospace!important;letter-spacing:.14em!important;color:#6f695d!important;white-space:nowrap!important;}',
      '.overview .section-label.sbx-status-section-label:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,rgba(143,106,30,.34),rgba(220,210,182,.72));}',
      '.overview .pipeline.sbx-status-pipeline{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;margin:0 0 20px!important;align-items:stretch!important;}',
      '.overview .pipeline.sbx-status-pipeline.sbx-status-two{grid-template-columns:repeat(2,minmax(0,1fr))!important;}',
      '.overview .pipeline.sbx-status-pipeline .pill-stat.sbx-status-card{min-width:0!important;min-height:112px!important;margin:0!important;padding:0 0 13px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;background:#fbf8ef!important;border:1px solid rgba(203,187,147,.72)!important;border-radius:14px!important;box-shadow:0 2px 8px rgba(22,35,47,.035)!important;text-align:left!important;}',
      '.overview .pipeline.sbx-status-pipeline .pill-stat.sbx-status-card.clickable:hover,.overview .pipeline.sbx-status-pipeline .pill-stat.sbx-status-card.clickable:active{background:#fbf8ef!important;transform:none!important;}',
      '.overview .sbx-status-card-head{min-height:46px;display:flex;align-items:center;gap:10px;padding:5px 10px 5px 7px;box-sizing:border-box;}',
      '.overview .sbx-status-card[data-sbx-tone="good"] .sbx-status-card-head{background:linear-gradient(100deg,rgba(211,225,204,.86),rgba(231,236,221,.63));}',
      '.overview .sbx-status-card[data-sbx-tone="warn"] .sbx-status-card-head{background:linear-gradient(100deg,rgba(239,225,197,.88),rgba(246,235,216,.64));}',
      '.overview .sbx-status-card[data-sbx-tone="neutral"] .sbx-status-card-head{background:linear-gradient(100deg,rgba(224,220,213,.88),rgba(238,233,224,.66));}',
      '.overview .sbx-status-icon{align-self:stretch;display:flex;align-items:center;justify-content:flex-start;flex:0 0 42px;width:42px;padding-right:8px;border-right:1px solid rgba(115,108,92,.24);box-sizing:border-box;}',
      '.overview .sbx-status-card[data-sbx-tone="good"] .sbx-status-icon{color:#2f7854;}',
      '.overview .sbx-status-card[data-sbx-tone="warn"] .sbx-status-icon{color:#a9600d;}',
      '.overview .sbx-status-card[data-sbx-tone="neutral"] .sbx-status-icon{color:#5f5a52;}',
      '.overview .sbx-status-icon svg{width:30px;height:30px;padding:5px;border-radius:50%;background:rgba(255,255,255,.46);fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;box-sizing:border-box;}',
      '.overview .sbx-status-head-label{min-width:0;font:500 9.5px/1.15 IBM Plex Mono,monospace;letter-spacing:.075em;text-transform:uppercase;color:#625f56;white-space:normal;}',
      '.overview .pipeline.sbx-status-pipeline .pill-stat-num{margin:15px 13px 0!important;font:600 19px/1 Fraunces,serif!important;color:var(--ink)!important;display:block!important;}',
      '.overview .pipeline.sbx-status-pipeline .pill-dot{display:none!important;}',
      '.overview .pipeline.sbx-status-pipeline .pill-stat-lbl{display:none!important;}',
      '.overview .pipeline.sbx-status-pipeline.sbx-status-two .pill-stat.sbx-status-card{min-height:112px!important;}',
      '.overview .pipeline.sbx-status-pipeline.sbx-status-two .sbx-status-head-label{font-size:9.5px;}',
      '@media(max-width:374px){.overview .pipeline.sbx-status-pipeline{gap:6px!important}.overview .sbx-status-card-head{padding-left:6px!important;padding-right:7px!important;gap:7px!important}.overview .sbx-status-icon{flex-basis:36px;width:36px;padding-right:6px}.overview .sbx-status-icon svg{width:27px;height:27px}.overview .sbx-status-head-label{font-size:8.5px}.overview .pipeline.sbx-status-pipeline .pill-stat-num{font-size:19px!important;margin-left:11px!important}}',
    '}'
  ].join('');
  document.head.appendChild(style);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
