(function(){
'use strict';
if(window.__sunblissDesktopDeepPageShellInstalled)return;
window.__sunblissDesktopDeepPageShellInstalled=true;

function isDesktop(){return window.matchMedia?window.matchMedia('(min-width:1024px)').matches:window.innerWidth>=1024}
function sync(){
  if(!document.body)return;
  var deep=isDesktop()&&(
    (window.state&&state.view==='detail')||
    document.body.classList.contains('sunbliss-back-dock-mode')
  );
  document.body.classList.toggle('sunbliss-desktop-deep-page',!!deep);
}
function ensureStyle(){
  if(document.getElementById('sunblissDesktopDeepPageShellStyles'))return;
  var s=document.createElement('style');
  s.id='sunblissDesktopDeepPageShellStyles';
  s.textContent=`
@media(min-width:1024px){
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page #sbRefSidebar{
    display:none!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page #app{
    padding-left:0!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page main#main{
    width:100%!important;
    max-width:none!important;
    margin-left:0!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page .topbar.sunbliss-professional-header{
    width:100%!important;
    max-width:none!important;
  }
}
`;
  document.head.appendChild(s);
}
function queue(){requestAnimationFrame(sync)}

ensureStyle();
sync();

var bodyObserver=new MutationObserver(function(mutations){
  for(var i=0;i<mutations.length;i++){
    var m=mutations[i];
    if(m.type==='attributes'||m.addedNodes.length||m.removedNodes.length){queue();break}
  }
});
bodyObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

['render','renderMain','renderOverview','renderInsights','renderList','renderDetail'].forEach(function(name){
  var original=window[name];
  if(typeof original!=='function'||original.__sunblissDeepShellWrapped)return;
  var wrapped=function(){
    var out=original.apply(this,arguments);
    queue();
    return out;
  };
  wrapped.__sunblissDeepShellWrapped=true;
  wrapped.__sunblissOriginal=original;
  window[name]=wrapped;
});

document.addEventListener('sunbliss:navigation-restored',queue);
window.addEventListener('resize',queue,{passive:true});
window.addEventListener('pageshow',queue,{passive:true});
})();