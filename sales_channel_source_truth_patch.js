(function(){
  'use strict';

  if (window.__sunblissSalesChannelSourceTruthInstalled) return;
  window.__sunblissSalesChannelSourceTruthInstalled = true;

  function clean(value){
    return String(value == null ? '' : value).trim();
  }

  function sourceKey(customer){
    var info = customer && customer.info;
    return clean(info && info.source).toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' ');
  }

  function isPlaceholder(value){
    var text = clean(value).toLowerCase();
    return !text || text === 'n/a' || text === 'na' || /^-+$/.test(text);
  }

  function isBrokerCustomer(customer){
    var info = customer && customer.info;
    if (!info) return false;

    var source = sourceKey(customer);
    if (source === 'broker' || source === 'cp' || source === 'channel partner') return true;
    if (source === 'direct') return false;

    return !isPlaceholder(info.brokerName) || !isPlaceholder(info.brokerCompany);
  }

  function normalizedPerson(value){
    if (typeof window.normPersonName === 'function') return window.normPersonName(value || '');
    return clean(value).toLowerCase().replace(/\s+/g,' ');
  }

  function normalizedCompany(value){
    if (typeof window.normName === 'function') return window.normName(value || '');
    return clean(value).toLowerCase().replace(/\s+/g,' ');
  }

  function displayName(value){
    if (typeof window.titleCase === 'function') return window.titleCase(value || '');
    return clean(value).toLowerCase().replace(/\b\w/g,function(letter){return letter.toUpperCase();});
  }

  window.__sunblissIsBrokerCustomer = isBrokerCustomer;

  window.brokerPerformance = function(){
    var brokerGroups = {};
    var directCount = 0;
    var directValue = 0;
    var brokerCount = 0;
    var brokerValue = 0;
    var hasInfo = false;
    var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];

    dues.forEach(function(customer){
      var info = customer && customer.info;
      if (info && (clean(info.source) || clean(info.brokerName) || clean(info.brokerCompany))) hasInfo = true;

      if (!isBrokerCustomer(customer)){
        directCount++;
        directValue += Number(customer && customer.total || 0);
        return;
      }

      brokerCount++;
      brokerValue += Number(customer && customer.total || 0);

      var brokerName = !isPlaceholder(info && info.brokerName)
        ? clean(info.brokerName)
        : (!isPlaceholder(info && info.brokerCompany) ? clean(info.brokerCompany) : 'Unassigned Broker');
      var company = !isPlaceholder(info && info.brokerCompany) ? clean(info.brokerCompany) : '';
      var key = normalizedPerson(brokerName) + '|' + normalizedCompany(company);

      if (!brokerGroups[key]){
        brokerGroups[key] = {
          name: displayName(brokerName),
          company: company,
          units: 0,
          value: 0,
          received: 0
        };
      }

      brokerGroups[key].units++;
      brokerGroups[key].value += Number(customer && customer.total || 0);
      brokerGroups[key].received += Number(customer && customer.received || 0);
    });

    var brokers = Object.keys(brokerGroups).map(function(key){
      var broker = brokerGroups[key];
      broker.pct = broker.value > 0 ? Math.round(broker.received / broker.value * 1000) / 10 : 0;
      return broker;
    }).sort(function(left,right){
      return right.value - left.value;
    });

    return {
      hasInfo: hasInfo,
      brokers: brokers,
      directCount: directCount,
      directValue: directValue,
      brokerCount: brokerCount,
      brokerValue: brokerValue
    };
  };
})();
