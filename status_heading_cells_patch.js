(function(){
  'use strict';
  if(document.getElementById('sunblissStatusHeadingCellsStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissStatusHeadingCellsStyle';
  style.textContent=[
    '@media(max-width:1023px){',
      '.overview .section-label:has(+ .pipeline #btnSpaSigned),',
      '.overview .section-label:has(+ .pipeline #btnOqoodCompleted),',
      '.overview .section-label:has(+ .pipeline #btnFurnished){',
        'display:flex;align-items:center;gap:9px;',
        'min-height:44px;',
        'margin:22px 0 10px;',
        'padding:0 14px;',
        'border:1px solid var(--paper-line);',
        'border-radius:12px;',
        'background:linear-gradient(180deg,rgba(235,227,206,.74),rgba(246,241,228,.94));',
        'box-shadow:0 2px 7px rgba(15,26,38,.035);',
        'color:var(--ink);',
        'font-family:IBM Plex Mono,monospace;',
        'font-size:10px;',
        'font-weight:600;',
        'line-height:1.2;',
        'letter-spacing:.065em;',
        'text-transform:uppercase;',
      '}',
      '.overview .section-label:has(+ .pipeline #btnSpaSigned)::before,',
      '.overview .section-label:has(+ .pipeline #btnOqoodCompleted)::before,',
      '.overview .section-label:has(+ .pipeline #btnFurnished)::before{',
        'content:"";display:block;flex:0 0 17px;width:17px;height:17px;',
        'background-repeat:no-repeat;background-position:center;background-size:17px 17px;',
        'opacity:.82;',
      '}',
      '.overview .section-label:has(+ .pipeline #btnSpaSigned)::before{',
        'background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2316232F%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 2h8l4 4v16H6z%27/%3E%3Cpath d=%27M14 2v5h5M9 11h6M9 15h5%27/%3E%3C/svg%3E");',
      '}',
      '.overview .section-label:has(+ .pipeline #btnOqoodCompleted)::before{',
        'background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2316232F%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 2h8l4 4v16H6z%27/%3E%3Cpath d=%27M14 2v5h5M9 11h6%27/%3E%3Cpath d=%27m9.5 16 1.5 1.5 3.5-3.5%27/%3E%3C/svg%3E");',
      '}',
      '.overview .section-label:has(+ .pipeline #btnFurnished)::before{',
        'background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2316232F%27 stroke-width=%271.8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M3 11.5 12 4l9 7.5%27/%3E%3Cpath d=%27M5.5 10.5V21h13V10.5%27/%3E%3Cpath d=%27M9 21v-6h6v6%27/%3E%3C/svg%3E");',
      '}',
    '}'
  ].join('');
  document.head.appendChild(style);
})();
