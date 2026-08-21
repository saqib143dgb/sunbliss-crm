(function(){
  'use strict';

  if (window.__sunblissSearchFocusInstalled || typeof window.renderList !== 'function') return;

  var originalRenderList = window.renderList;

  window.renderList = function(){
    var active = document.activeElement;
    var restoreSearchFocus = !!(active && active.id === 'searchInput');
    var selectionStart = restoreSearchFocus && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    var selectionEnd = restoreSearchFocus && typeof active.selectionEnd === 'number' ? active.selectionEnd : null;

    var result = originalRenderList.apply(this, arguments);

    if (restoreSearchFocus){
      var input = document.getElementById('searchInput');
      if (input){
        try {
          input.focus({ preventScroll: true });
        } catch (e) {
          input.focus();
        }

        if (selectionStart !== null && typeof input.setSelectionRange === 'function'){
          var max = input.value.length;
          var start = Math.min(selectionStart, max);
          var end = Math.min(selectionEnd === null ? start : selectionEnd, max);
          try { input.setSelectionRange(start, end); } catch (e) {}
        }
      }
    }

    return result;
  };

  window.__sunblissSearchFocusInstalled = true;
})();
