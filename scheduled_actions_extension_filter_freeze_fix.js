(function(){
'use strict';
if(window.__sunblissScheduledExtensionFilterFreezeFix)return;
window.__sunblissScheduledExtensionFilterFreezeFix=true;

/*
  Keep Extensions stable on iPhone without allowing the extension module to trap
  the Scheduled Actions dropdown on Extensions.
*/

var userNonExtensionFilter=null;

function installOverviewHtmlGuard(){
  if(!window.HTMLDivElement||!window.Element)return;
  var proto=window.HTMLDivElement.prototype;
  if(proto.__sunblissExtInnerHtmlGuard)return;
  var nativeDesc=Object.getOwnPropertyDescriptor(window.Element.prototype,'innerHTML');
  if(!nativeDesc||typeof nativeDesc.get!=='function'||typeof nativeDesc.set!=='function')return;

  Object.defineProperty(proto,'innerHTML',{
    configurable:true,
    enumerable:nativeDesc.enumerable,
    get:function(){return nativeDesc.get.call(this);},
    set:function(value){
      if(this&&this.id==='scheduledOverviewList'){
        var next=value==null?'':String(value);
        var probe=document.createElement('div');
        nativeDesc.set.call(probe,next);
        var normalized=nativeDesc.get.call(probe);
        if(nativeDesc.get.call(this)===normalized)return;
      }
      nativeDesc.set.call(this,value);
    }
  });
  proto.__sunblissExtInnerHtmlGuard=true;
}

function installExtensionStateTextGuard(){
  if(!window.HTMLSpanElement||!window.Node)return;
  var proto=window.HTMLSpanElement.prototype;
  if(proto.__sunblissExtTextGuard)return;
  var nativeDesc=Object.getOwnPropertyDescriptor(window.Node.prototype,'textContent');
  if(!nativeDesc||typeof nativeDesc.get!=='function'||typeof nativeDesc.set!=='function')return;

  Object.defineProperty(proto,'textContent',{
    configurable:true,
    enumerable:nativeDesc.enumerable,
    get:function(){return nativeDesc.get.call(this);},
    set:function(value){
      var next=value==null?'':String(value);
      if(this&&this.classList&&this.classList.contains('scheduled-task-state')&&this.classList.contains('ext')&&nativeDesc.get.call(this)===next)return;
      nativeDesc.set.call(this,value);
    }
  });
  proto.__sunblissExtTextGuard=true;
}

function installFilterExitGuard(){
  if(!window.HTMLSelectElement)return;
  var proto=window.HTMLSelectElement.prototype;
  if(proto.__sunblissExtValueGuard)return;
  var nativeDesc=Object.getOwnPropertyDescriptor(proto,'value');
  if(!nativeDesc||typeof nativeDesc.get!=='function'||typeof nativeDesc.set!=='function')return;

  Object.defineProperty(proto,'value',{
    configurable:true,
    enumerable:nativeDesc.enumerable,
    get:function(){return nativeDesc.get.call(this);},
    set:function(value){
      var next=value==null?'':String(value);
      if(this&&this.id==='scheduledOverviewFilter'&&userNonExtensionFilter&&next==='extensions'){
        return;
      }
      nativeDesc.set.call(this,value);
    }
  });
  proto.__sunblissExtValueGuard=true;

  document.addEventListener('change',function(event){
    var select=event&&event.target;
    if(!select||select.id!=='scheduledOverviewFilter')return;
    var chosen=nativeDesc.get.call(select);
    if(chosen==='extensions'){
      userNonExtensionFilter=null;
    }else if(chosen){
      userNonExtensionFilter=chosen;
    }
  },true);
}

installOverviewHtmlGuard();
installExtensionStateTextGuard();
installFilterExitGuard();
})();