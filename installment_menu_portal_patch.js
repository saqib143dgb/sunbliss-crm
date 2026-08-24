(function(){
  'use strict';
  if (window.__sunblissInstallmentMenuPortalInstalled) return;
  window.__sunblissInstallmentMenuPortalInstalled = true;

  function positionMenu(menu,button){
    if (!menu || !button) return;
    var rect=button.getBoundingClientRect();
    menu.style.position='fixed';
    menu.style.zIndex='3000';
    menu.style.right='auto';
    menu.style.top='0';
    menu.style.left='0';
    var width=menu.offsetWidth || 150;
    var height=menu.offsetHeight || 44;
    var left=Math.max(8,Math.min(window.innerWidth-width-8,rect.right-width));
    var top=rect.bottom+5;
    if (top+height>window.innerHeight-8) top=Math.max(8,rect.top-height-5);
    menu.style.left=left+'px';
    menu.style.top=top+'px';
  }

  function portalMenus(){
    document.querySelectorAll('.stage-card .installment-menu-pop').forEach(function(menu){
      var card=menu.closest('.stage-card');
      var button=card && card.querySelector('.installment-menu-btn');
      if (!button) return;
      document.body.appendChild(menu);
      positionMenu(menu,button);
    });
  }

  function closeMenus(){
    document.querySelectorAll('body > .installment-menu-pop').forEach(function(menu){ menu.remove(); });
  }

  var observer=new MutationObserver(portalMenus);
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',closeMenus);
  window.addEventListener('scroll',closeMenus,true);
  portalMenus();
})();
