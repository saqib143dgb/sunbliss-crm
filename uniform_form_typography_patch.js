(function(){
  'use strict';
  if(window.__sunblissUniformFormTypographyInstalled)return;
  window.__sunblissUniformFormTypographyInstalled=true;

  // One visual language for editable form labels and entered values.
  // Do not style dashboards, KPI cards, menu/navigation, or action buttons.
  var style=document.createElement('style');
  style.id='sunblissUniformFormTypographyStyles';
  style.textContent=[
    ':root{--crm-form-label-size:14px;--crm-form-value-size:16px;--crm-form-label-weight:400;--crm-form-value-weight:650}',
    [
      'body .brand-editor label.brand-field',
      'body #scheduledActionPanel label.brand-field',
      'body #customerPaymentResponsePanel label.brand-field',
      'body #modificationRequestPanel label.brand-field',
      'body .rpp-panel label.rpp-field',
      'body #paymentPlanRevisionPanel label.rpp-field',
      'body #installmentEditDialog label.brand-field',
      'body #paymentDetailDialog label.brand-field',
      'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card label.brand-field'
    ].join(',')+
      '{font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:var(--crm-form-label-size)!important;line-height:1.4!important;font-weight:var(--crm-form-label-weight)!important;color:var(--muted,#66635c)!important;letter-spacing:normal!important;text-transform:none!important}',
    'body #inlineComplianceEditor .crm-compliance-field-label{font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:var(--crm-form-label-size)!important;line-height:1.4!important;font-weight:var(--crm-form-label-weight)!important;color:var(--muted,#66635c)!important;letter-spacing:normal!important}',
    'body #inlineComplianceEditor .crm-compliance-optional{font-size:inherit!important;font-weight:400!important;color:var(--muted,#66635c)!important}',
    [
      'body .brand-editor label.brand-field :is(input,select,textarea)',
      'body #scheduledActionPanel label.brand-field :is(input,select,textarea)',
      'body #customerPaymentResponsePanel label.brand-field :is(input,select,textarea)',
      'body #modificationRequestPanel label.brand-field :is(input,select,textarea)',
      'body .rpp-panel label.rpp-field :is(input,select,textarea)',
      'body #paymentPlanRevisionPanel label.rpp-field :is(input,select,textarea)',
      'body #installmentEditDialog label.brand-field :is(input,select,textarea)',
      'body #paymentDetailDialog label.brand-field :is(input,select,textarea)',
      'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card label.brand-field input'
    ].join(',')+
      '{font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:var(--crm-form-value-size)!important;line-height:1.3!important;font-weight:var(--crm-form-value-weight)!important;color:var(--ink,#102333)!important;letter-spacing:normal!important;font-style:normal!important;text-transform:none!important}',
    [
      'body #inlineComplianceEditor .crm-compliance-editor-card :is(input,select)',
      'body #installmentEditDialog :is(input,select,textarea)',
      'body #paymentDetailDialog :is(input,select,textarea)',
      'body #transactionEditPanel :is(input,select,textarea)',
      'body #extraInstallmentPanel :is(input,select,textarea)',
      'body #paymentPlanRevisionPanel :is(input,select,textarea)'
    ].join(',')+
      '{font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:var(--crm-form-value-size)!important;line-height:1.3!important;font-weight:var(--crm-form-value-weight)!important;color:var(--ink,#102333)!important;letter-spacing:normal!important;font-style:normal!important}',
    [
      'body .brand-editor label.brand-field :is(input,textarea)::placeholder',
      'body .rpp-panel label.rpp-field :is(input,textarea)::placeholder',
      'body #scheduledActionPanel :is(input,textarea)::placeholder',
      'body #inlineComplianceEditor :is(input,textarea)::placeholder',
      'body #customerEditPanel :is(input,textarea)::placeholder'
    ].join(',')+
      '{font-weight:400!important;color:var(--muted,#66635c)!important;opacity:.72!important}',
    '@media(max-width:1023px){',
      'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card label.brand-field{font-size:var(--crm-form-label-size)!important;font-weight:var(--crm-form-label-weight)!important;color:var(--muted,#66635c)!important}',
      'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card label.brand-field input{font-size:var(--crm-form-value-size)!important;font-weight:var(--crm-form-value-weight)!important;color:var(--ink,#102333)!important}',
    '}'
  ].join('\n');
  document.head.appendChild(style);
})();