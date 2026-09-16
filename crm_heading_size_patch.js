(function(){
  'use strict';
  if(document.getElementById('sunblissCrmHeadingSizeStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissCrmHeadingSizeStyle';
  style.textContent=`
    #app main h1,
    #app main h2,
    #app main h3,
    #app main h4,
    #app main h5,
    #app main h6,
    #app main .title,
    #app .page-title,
    #app .section-title,
    #app .panel-title,
    #app .card-title,
    #app .detail-title,
    #app .overview-title,
    #app .insights-title,
    #app .report-title,
    #app .editor-title,
    #app .modal-title{
      zoom:.94;
    }
    #app .d-name{font-size:20.5px!important;}
    @media(max-width:420px){
      #app .d-name{font-size:18.5px!important;}
    }
  `;
  document.head.appendChild(style);

  /*
   * Approved global section-title structure:
   * keep every existing title/subtitle string untouched, but physically attach
   * each .section-label to the content it describes. This creates the single
   * classic framed section shown in the approved reference instead of a loose
   * rounded title bar floating above its content.
   */
  function isProtectedKpi(label){
    return !!label.closest('.stat-hero,.kpi-card,.kpi-tile,.summary-card,.summary-tile');
  }

  function frameSection(label){
    if(!label || !label.parentElement) return;
    if(label.closest('.sbx-section-frame') || isProtectedKpi(label)) return;

    var parent=label.parentElement;
    var nodes=[];
    var cursor=label.nextSibling;

    while(cursor){
      if(cursor.nodeType===1 && cursor.classList && cursor.classList.contains('section-label')) break;
      nodes.push(cursor);
      cursor=cursor.nextSibling;
    }

    /* A label with no actual section content stays untouched. */
    var hasContent=nodes.some(function(node){
      return node.nodeType===1 || (node.nodeType===3 && String(node.textContent||'').trim());
    });
    if(!hasContent) return;

    var frame=document.createElement('section');
    frame.className='sbx-section-frame';
    frame.setAttribute('data-sbx-linked-section','');

    var body=document.createElement('div');
    body.className='sbx-section-body';

    parent.insertBefore(frame,label);
    frame.appendChild(label);
    frame.appendChild(body);
    nodes.forEach(function(node){ body.appendChild(node); });
  }

  var scheduled=false;
  function applyLinkedSectionTitles(){
    scheduled=false;
    var main=document.querySelector('#app main#main') || document.querySelector('#app main');
    if(!main) return;
    Array.prototype.slice.call(main.querySelectorAll('.section-label')).forEach(frameSection);
  }

  function scheduleApply(){
    if(scheduled) return;
    scheduled=true;
    if(window.requestAnimationFrame) requestAnimationFrame(applyLinkedSectionTitles);
    else setTimeout(applyLinkedSectionTitles,0);
  }

  scheduleApply();

  var root=document.getElementById('app') || document.body;
  if(root && window.MutationObserver){
    new MutationObserver(function(mutations){
      var needsApply=mutations.some(function(m){
        if(m.type!=='childList' || !m.addedNodes || !m.addedNodes.length) return false;
        return Array.prototype.some.call(m.addedNodes,function(node){
          if(node.nodeType!==1) return false;
          return (node.matches && node.matches('.section-label')) ||
                 (node.querySelector && node.querySelector('.section-label'));
        });
      });
      if(needsApply) scheduleApply();
    }).observe(root,{childList:true,subtree:true});
  }
})();
