(function(){
  'use strict';
  if(document.getElementById('sunblissCrmHeadingSizeStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissCrmHeadingSizeStyle';
  style.textContent=`
    #app main h1,
    #app main h2,
    #app main h3,
    #app main h4,
    #app main h5,
    #app main h6,
    #app main .title,
    #app .page-title,
    #app .section-title,
    #app .panel-title,
    #app .card-title,
    #app .detail-title,
    #app .overview-title,
    #app .insights-title,
    #app .report-title,
    #app .editor-title,
    #app .modal-title{
      zoom:.94;
    }
    #app .d-name{font-size:20.5px!important;}
    @media(max-width:420px){
      #app .d-name{font-size:18.5px!important;}
    }
  `;
  document.head.appendChild(style);
})();
