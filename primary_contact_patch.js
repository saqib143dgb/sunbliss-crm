(function(){
  'use strict';

  function primaryPhone(raw){
    var text = String(raw || '').trim();
    if (!text) return '';

    var parts = text.split(/(?:\r?\n|[,;|/]|\s+&\s+|\s+and\s+|\s+or\s+)/i);
    for (var i = 0; i < parts.length; i++){
      var part = parts[i].trim();
      if ((part.match(/\d/g) || []).length >= 7) return part;
    }

    var match = text.match(/\+?\d[\d\s().-]{5,}\d/);
    return match ? match[0].trim() : text;
  }

  function primaryEmail(raw){
    var text = String(raw || '').trim();
    if (!text) return '';
    var match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? match[0] : text.split(/(?:\r?\n|[,;|/]|\s+&\s+|\s+and\s+|\s+or\s+)/i)[0].trim();
  }

  window.waReminderHref = function(customer){
    var phone = customer && customer.info ? primaryPhone(customer.info.phone) : '';
    var digits = phone && typeof waDigits === 'function' ? waDigits(phone) : phone.replace(/\D/g,'');
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(reminderMessage(customer));
  };

  window.mailReminderHref = function(customer){
    var email = customer && customer.info ? primaryEmail(customer.info.email) : '';
    var subject = 'Payment reminder — Unit ' + customer.unit;
    return 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(reminderMessage(customer));
  };

  window.__sunblissPrimaryContactHelpers = {
    phone: primaryPhone,
    email: primaryEmail
  };
})();
