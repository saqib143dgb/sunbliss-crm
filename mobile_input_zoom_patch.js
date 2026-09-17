(function(){
  'use strict';

  if (window.__sunblissMobileInputZoomGuardInstalled) return;
  window.__sunblissMobileInputZoomGuardInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissMobileInputZoomGuardStyle';
  style.textContent = [
    'html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}',
    '@media(max-width:900px){',
      'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([type="hidden"]),select,textarea,[contenteditable="true"]{font-size:16px!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);
})();

/* Generated-document PDF safety guard.
   The reference-scaling patch enlarges the completed A4 page by 15%, which
   pushes the original letterhead outside the MediaBox and clips the edges.
   Neutralize only that post-generation page scale so the supplied letterhead
   and the generated body remain inside the original A4 page bounds. */
(function(){
  'use strict';
  if (window.__sunblissPdfNoClipGuardInstalled) return;
  window.__sunblissPdfNoClipGuardInstalled = true;

  function install(frame, attempt){
    attempt = attempt || 0;
    try{
      var w = frame && frame.contentWindow;
      if (!w || typeof w.makeDocumentPdf !== 'function' || !w.PDFLib || !w.PDFLib.PDFDocument){
        if (attempt < 30) setTimeout(function(){ install(frame, attempt + 1); }, 50);
        return;
      }
      var scaled = w.makeDocumentPdf;
      if (!scaled.__crmReferenceScalePatched){
        if (attempt < 30) setTimeout(function(){ install(frame, attempt + 1); }, 50);
        return;
      }
      if (scaled.__crmNoClipPatched) return;
      var referenceScale = Number(scaled.__crmReferenceScale) || 1;
      if (!(referenceScale > 1)) return;

      var safe = async function(){
        var blob = await scaled.apply(this, arguments);
        if (!blob || typeof blob.arrayBuffer !== 'function') return blob;
        var pdf = await w.PDFLib.PDFDocument.load(await blob.arrayBuffer());
        var inverse = 1 / referenceScale;
        pdf.getPages().forEach(function(page){
          var size = page.getSize();
          var width = Number(size.width), height = Number(size.height);
          if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
          var x = (width - width * inverse) / 2;
          var y = (height - height * inverse) / 2;
          page.scaleContent(inverse, inverse);
          page.translateContent(x, y);
        });
        return new w.Blob([await pdf.save()], {type:'application/pdf'});
      };
      safe.__crmNoClipPatched = true;
      safe.__crmReferenceScalePatched = true;
      safe.__crmReferenceScale = 1;
      w.makeDocumentPdf = safe;
    }catch(_e){}
  }

  function watchFrame(frame){
    if (!frame || frame.dataset.pdfNoClipWatch === '1') return;
    frame.dataset.pdfNoClipWatch = '1';
    frame.addEventListener('load', function(){ setTimeout(function(){ install(frame, 0); }, 0); });
    setTimeout(function(){ install(frame, 0); }, 0);
  }

  function scan(){
    var frames = document.querySelectorAll('#crmDocumentDialog iframe');
    for (var i = 0; i < frames.length; i++) watchFrame(frames[i]);
  }

  new MutationObserver(scan).observe(document.documentElement, {childList:true, subtree:true});
  scan();
})();
