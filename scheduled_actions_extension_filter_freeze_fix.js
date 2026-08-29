(function(){
'use strict';
if(window.__sunblissScheduledExtensionFilterFreezeFix)return;
window.__sunblissScheduledExtensionFilterFreezeFix=true;

/*
  Root cause of the iPhone freeze:
  PaymentExtensionsCore observes #app for child-list changes and re-renders after
  those changes. In the Extensions view, its own render path can write the exact
  same list/state text back into the DOM. Some browser serializations make the
  incoming HTML string differ from element.innerHTML even when the rendered DOM
  is identical, so that write creates another mutation, which triggers another
  render, and the cycle repeats.

  Do not add another observer or another renderer here. Instead, make the two
  self-triggering writes idempotent. Real changes still go through normally.
*/

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

installOverviewHtmlGuard();
installExtensionStateTextGuard();
})();