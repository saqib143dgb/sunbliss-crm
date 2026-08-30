(function(){
'use strict';
if(window.__sunblissMutationObserverGuardInstalled)return;
window.__sunblissMutationObserverGuardInstalled=true;

var NativeMutationObserver=window.MutationObserver;
if(typeof NativeMutationObserver!=='function')return;

/*
  CRM-wide MutationObserver safety layer.

  Keep observer callbacks coalesced, but deliver them in a microtask so DOM decorators
  settle before the browser paints. The previous frame/cooldown queue could postpone
  broad observers for tens or hundreds of milliseconds, which made enhancements appear
  after the base UI and looked like flicker on mobile Safari.
*/
var queue=[];
var queueSet=typeof Set==='function'?new Set():null;
var drainPending=false;

function hasJob(job){return queueSet?queueSet.has(job):queue.indexOf(job)!==-1;}
function addJob(job){
  if(hasJob(job))return;
  if(queueSet)queueSet.add(job);
  queue.push(job);
  scheduleDrain();
}
function removeJob(job){if(queueSet)queueSet.delete(job);}
function scheduleDrain(){
  if(drainPending)return;
  drainPending=true;
  if(typeof window.queueMicrotask==='function')window.queueMicrotask(drain);
  else if(typeof Promise==='function')Promise.resolve().then(drain);
  else window.setTimeout(drain,0);
}
function drain(){
  drainPending=false;
  if(!queue.length)return;
  var jobs=queue.splice(0,queue.length);
  for(var i=0;i<jobs.length;i++)removeJob(jobs[i]);
  for(var j=0;j<jobs.length;j++){
    try{jobs[j]();}catch(err){window.setTimeout(function(e){return function(){throw e;};}(err),0);}
  }
  if(queue.length)scheduleDrain();
}

function SafeMutationObserver(callback){
  if(typeof callback!=='function')throw new TypeError("Failed to construct 'MutationObserver': callback is not a function");

  var pending=[];
  var queued=false;
  var running=false;
  var nativeObserver;

  function flush(){
    queued=false;
    if(running||!pending.length){if(pending.length)enqueue();return;}
    var records=pending.splice(0,pending.length);
    running=true;
    try{callback(records,nativeObserver);}finally{running=false;}
    if(pending.length)enqueue();
  }

  function enqueue(){
    if(queued)return;
    queued=true;
    addJob(flush);
  }

  nativeObserver=new NativeMutationObserver(function(records){
    if(records&&records.length){
      for(var i=0;i<records.length;i++)pending.push(records[i]);
      if(pending.length>2000)pending.splice(0,pending.length-2000);
    }
    enqueue();
  });

  return nativeObserver;
}

SafeMutationObserver.prototype=NativeMutationObserver.prototype;
try{Object.setPrototypeOf(SafeMutationObserver,NativeMutationObserver);}catch(e){}
try{Object.defineProperty(SafeMutationObserver,'name',{value:'MutationObserver'});}catch(e){}

window.__sunblissNativeMutationObserver=NativeMutationObserver;
window.__sunblissMutationObserverQueueInfo=function(){
  return {pendingObservers:queue.length,drainPending:drainPending,mode:'microtask'};
};
window.MutationObserver=SafeMutationObserver;
})();
