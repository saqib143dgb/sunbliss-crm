(function(){
  'use strict';

  var style = document.createElement('style');
  style.id = 'insightsSalesChartResponsiveStyle';
  style.textContent = [
    '.insights-sales-chart{display:block!important;height:auto!important;overflow:hidden!important;}',
    '@media(max-width:640px){',
      '#app,main{max-width:100vw!important;overflow-x:hidden!important;}',
      '.overview{min-width:0!important;max-width:100%!important;overflow-x:hidden!important;}',
      '.overview>.section-label+svg[width="520"]{display:block!important;width:calc(100vw - 36px)!important;max-width:calc(100vw - 36px)!important;height:auto!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  function fitInsightsSalesChart(){
    document.querySelectorAll('.overview .section-label').forEach(function(label){
      var text = (label.textContent || '').trim().toLowerCase();
      if (text.indexOf('monthly sales value') !== 0) return;

      var svg = label.nextElementSibling;
      if (!svg || !svg.tagName || svg.tagName.toLowerCase() !== 'svg') return;

      svg.classList.add('insights-sales-chart');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      var overview = label.closest('.overview');
      if (!overview) return;

      var overviewStyle = window.getComputedStyle ? window.getComputedStyle(overview) : null;
      var padLeft = overviewStyle ? parseFloat(overviewStyle.paddingLeft) || 0 : 18;
      var padRight = overviewStyle ? parseFloat(overviewStyle.paddingRight) || 0 : 18;
      var panelWidth = Math.max(0, overview.clientWidth - padLeft - padRight);
      var viewportWidth = Math.max(0, (document.documentElement && document.documentElement.clientWidth) || window.innerWidth || panelWidth);
      var mobileWidth = Math.max(0, viewportWidth - 36);
      var targetWidth = Math.min(520, panelWidth || 520, mobileWidth || 520);

      if (targetWidth > 0){
        svg.style.setProperty('width', targetWidth + 'px', 'important');
        svg.style.setProperty('max-width', targetWidth + 'px', 'important');
        svg.style.setProperty('height', 'auto', 'important');
      }
    });
  }

  fitInsightsSalesChart();

  var main = document.getElementById('main');
  if (main && window.MutationObserver){
    new MutationObserver(fitInsightsSalesChart).observe(main, { childList: true, subtree: true });
  }
  window.addEventListener('resize', fitInsightsSalesChart);
  window.addEventListener('orientationchange', function(){ setTimeout(fitInsightsSalesChart, 80); });
})();
