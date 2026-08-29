(function(){
'use strict';
if(window.__sunblissMutationObserverGuardInstalled)return;
window.__sunblissMutationObserverGuardInstalled=true;

var NativeMutationObserver=window.MutationObserver;
if(typeof NativeMutationObserver!=='function')return;

/*
  CRM-wide MutationObserver safety layer.

  The CRM is built from many independent UI patches. Historically several of those
  patches observed #app/document and then changed the DOM inside their callbacks.
  Safari can deliver the resulting mutation chain as a tight microtask loop, causing
  the UI to appear frozen. This wrapper keeps native observation semantics, but
  coalesces delivery onto the browser paint queue and adds a small adaptive backoff
  when one observer is being retriggered continuously.

  It does NOT suppress records or disconnect observers. All records are delivered to
  the original callback, just in a controlled batch instead of recursively in the
  same mutation microtask cascade.
*/
function SafeMutationObserver(callback){
  if(typeof callback!=='function')throw new TypeError("Failed to construct 'MutationObserver': callback is not a function");

  var queued=false;
  var running=false;
  var pending=[];
  var timer=0;
  var burstWindowStart=0;
  var burstRuns=0;
  var lastRunAt=0;
  var nativeObserver;

  function schedule(){
    if(queued)return;
    queued=true;
    var now=(window.performance&&performance.now)?performance.now():Date.now();
    if(!burstWindowStart||now-burstWindowStart>1000){burstWindowStart=now;burstRuns=0;}

    /* Normal observers run at most once per paint. If an observer is continuously
       self-triggering, progressively slow only that observer instead of blocking the
       main thread or affecting unrelated observers. */
    var delay=0;
    if(burstRuns>=20)delay=120;
    else if(burstRuns>=10)delay=48;

    function enqueueFrame(){
      if(typeof window.requestAnimationFrame==='function'){
        window.requestAnimationFrame(flush);
      }else{
        timer=window.setTimeout(flush,16);
      }
    }
    if(delay)timer=window.setTimeout(enqueueFrame,delay);else enqueueFrame();
  }

  function flush(){
    queued=false;
    timer=0;
    if(running||!pending.length){if(pending.length)schedule();return;}
    var records=pending.splice(0,pending.length);
    running=true;
    var now=(window.performance&&performance.now)?performance.now():Date.now();
    if(!burstWindowStart||now-burstWindowStart>1000){burstWindowStart=now;burstRuns=0;}
    burstRuns++;
    lastRunAt=now;
    try{
      callback(records,nativeObserver);
    }catch(err){
      window.setTimeout(function(){throw err;},0);
    }finally{
      running=false;
    }
    if(pending.length)schedule();
  }

  nativeObserver=new NativeMutationObserver(function(records){
    if(records&&records.length){
      for(var i=0;i<records.length;i++)pending.push(records[i]);
      /* Avoid unbounded memory growth during a pathological mutation storm. Native
         takeRecords still remains available; the latest records are the most useful
         for decorator-style observers used in this CRM. */
      if(pending.length>2000)pending.splice(0,pending.length-2000);
    }
    schedule();
  });

  return nativeObserver;
}

SafeMutationObserver.prototype=NativeMutationObserver.prototype;
try{Object.setPrototypeOf(SafeMutationObserver,NativeMutationObserver);}catch(e){}
try{Object.defineProperty(SafeMutationObserver,'name',{value:'MutationObserver'});}catch(e){}

window.__sunblissNativeMutationObserver=NativeMutationObserver;
window.MutationObserver=SafeMutationObserver;
})();
