(function(){
  'use strict';

  if (window.__sunblissSearchFocusInstalled || typeof window.renderList !== 'function') return;

  var originalRenderList = window.renderList;

  function prepareDockSearch(input){
    if (!input || window.__sunblissDockSearchOpen !== true) return;
    var search = input.closest ? input.closest('.search') : null;
    if (!search) return;
    // The pill-only search is normally hidden inside Units. When live filtering
    // rebuilds the list, make the replacement search visible before restoring
    // focus so mobile browsers do not dismiss the keyboard after one letter.
    search.classList.add('dock-search-surface','dock-search-open');
  }

  window.renderList = function(){
    var active = document.activeElement;
    var restoreSearchFocus = !!(active && active.id === 'searchInput');
    var selectionStart = restoreSearchFocus && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    var selectionEnd = restoreSearchFocus && typeof active.selectionEnd === 'number' ? active.selectionEnd : null;

    var result = originalRenderList.apply(this, arguments);

    if (restoreSearchFocus){
      var input = document.getElementById('searchInput');
      if (input){
        prepareDockSearch(input);

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
