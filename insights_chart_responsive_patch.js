(function(){
  'use strict';

  var style = document.createElement('style');
  style.id = 'insightsSalesChartResponsiveStyle';
  style.textContent = '.insights-sales-chart{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;overflow:hidden!important;}';
  document.head.appendChild(style);

  function fitInsightsSalesChart(){
    document.querySelectorAll('.overview .section-label').forEach(function(label){
      var text = (label.textContent || '').trim().toLowerCase();
      if (text.indexOf('monthly sales value') !== 0) return;

      var svg = label.nextElementSibling;
      if (!svg || !svg.tagName || svg.tagName.toLowerCase() !== 'svg') return;

      svg.classList.add('insights-sales-chart');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    });
  }

  fitInsightsSalesChart();

  var main = document.getElementById('main');
  if (main && window.MutationObserver){
    new MutationObserver(fitInsightsSalesChart).observe(main, { childList: true, subtree: true });
  }
})();
