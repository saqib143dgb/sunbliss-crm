(function(){
'use strict';
if(window.__sunblissMutationObserverGuardInstalled)return;
window.__sunblissMutationObserverGuardInstalled=true;

var NativeMutationObserver=window.MutationObserver;
if(typeof NativeMutationObserver!=='function')return;

/*
  CRM-wide MutationObserver safety layer.

  All observers created after this script share ONE browser-frame queue. This prevents
  independent CRM patches from all executing expensive mutation callbacks in the same
  microtask cascade. Records are preserved and delivered in batches; only callback
  timing is controlled.
*/
var queue=[];
var queueSet=typeof Set==='function'?new Set():null;
var framePending=false;
var MAX_CALLBACKS_PER_FRAME=12;
var FRAME_BUDGET_MS=7;

function now(){return window.performance&&performance.now?performance.now():Date.now();}
function hasJob(job){return queueSet?queueSet.has(job):queue.indexOf(job)!==-1;}
function addJob(job){if(hasJob(job))return;if(queueSet)queueSet.add(job);queue.push(job);scheduleFrame();}
function removeJob(job){if(queueSet)queueSet.delete(job);}
function scheduleFrame(){
  if(framePending)return;
  framePending=true;
  if(typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(drain);
  else window.setTimeout(drain,16);
}
function drain(){
  framePending=false;
  var started=now(),count=0;
  while(queue.length&&count<MAX_CALLBACKS_PER_FRAME&&now()-started<FRAME_BUDGET_MS){
    var job=queue.shift();removeJob(job);count++;
    try{job();}catch(err){window.setTimeout(function(){throw err;},0);}
  }
  if(queue.length)scheduleFrame();
}

function SafeMutationObserver(callback){
  if(typeof callback!=='function')throw new TypeError("Failed to construct 'MutationObserver': callback is not a function");

  var pending=[];
  var running=false;
  var queued=false;
  var nativeObserver;
  var burstStart=0;
  var burstRuns=0;
  var cooldownTimer=0;

  function enqueue(){
    if(queued)return;
    queued=true;
    var t=now();
    if(!burstStart||t-burstStart>1000){burstStart=t;burstRuns=0;}

    /* A continuously self-triggering observer is slowed independently. Normal UI
       observers never hit these thresholds. */
    var delay=burstRuns>=24?160:burstRuns>=12?64:0;
    if(delay){
      if(cooldownTimer)return;
      cooldownTimer=window.setTimeout(function(){cooldownTimer=0;addJob(flush);},delay);
    }else addJob(flush);
  }

  function flush(){
    queued=false;
    if(running||!pending.length){if(pending.length)enqueue();return;}
    var records=pending.splice(0,pending.length);
    running=true;
    var t=now();
    if(!burstStart||t-burstStart>1000){burstStart=t;burstRuns=0;}
    burstRuns++;
    try{callback(records,nativeObserver);}finally{running=false;}
    if(pending.length)enqueue();
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
window.__sunblissMutationObserverQueueInfo=function(){return {pendingObservers:queue.length,framePending:framePending,maxCallbacksPerFrame:MAX_CALLBACKS_PER_FRAME,frameBudgetMs:FRAME_BUDGET_MS};};
window.MutationObserver=SafeMutationObserver;
})();
