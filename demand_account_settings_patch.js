/* Project-local, one-time verified payment account configuration.
   Intentionally separate from the generated Demand Letter form. */
(function(){
 'use strict';
 if(window.__crmDemandBankSettingsInstalled)return;
 window.__crmDemandBankSettingsInstalled=true;
 let queued=false;
 function mount(){
  queued=false;
  if(!window.sb||!window.state||state.userRole!=='crm_officer')return;
  const editor=document.querySelector('.brand-editor');
  if(!editor||editor.querySelector('#crmDemandAccountSettings'))return;
  const actions=editor.querySelector('.brand-editor-actions');
  if(!actions)return;
  const section=document.createElement('section');
  section.id='crmDemandAccountSettings';
  section.style.cssText='margin:14px 0;border-top:1px solid var(--paper-line);padding-top:15px';
  section.innerHTML='<label class="brand-field">Demand Letter payment account details (this project only)<textarea id="crmDemandBankValue" rows="5" placeholder="Enter Accounts-approved beneficiary name, bank, IBAN and any required payment reference." style="width:100%;resize:vertical;min-height:110px"></textarea></label>'+
  '<p class="stat-sub" style="margin:0 0 8px">Set these details once after verification with Accounts. They will be filled into Demand Letters automatically. Other projects remain separate.</p>'+
  '<button type="button" class="btn-paper" id="crmDemandBankSave" style="margin-bottom:6px">Save payment account details</button>'+
  '<p role="status" aria-live="polite" id="crmDemandBankStatus" class="stat-sub"></p>';
  actions.before(section);
  const input=section.querySelector('#crmDemandBankValue');
  const button=section.querySelector('#crmDemandBankSave');
  const status=section.querySelector('#crmDemandBankStatus');
  let recordId=null,original='';
  button.disabled=true;status.textContent='Loading project payment details…';
  (async function(){
   try{
    const response=await sb.from('branding').select('id,demand_account_details').limit(1).maybeSingle();
    if(response.error)throw response.error;
    if(!section.isConnected)return;
    if(!response.data)throw Error('Project branding record is unavailable.');
    recordId=response.data.id;original=String(response.data.demand_account_details||'');
    input.value=original;button.disabled=false;status.textContent=original?'Project payment details loaded.':'Not configured. Verify details with Accounts before saving.';
   }catch(error){if(section.isConnected)status.textContent='Could not load project payment details: '+(error.message||'Please try again.');}
  })();
  button.addEventListener('click',async function(){
   if(recordId==null)return;
   const details=input.value.trim();
   if(!details){status.textContent='Enter verified payment account details, or contact Accounts to confirm them.';return;}
   if(details===original){status.textContent='No changes to save.';return;}
   if(!window.confirm('Confirm these bank details have been verified with Accounts for the currently selected project.'))return;
   button.disabled=true;status.textContent='Saving project payment details…';
   try{
    if(state.userRole!=='crm_officer')throw Error('CRM officer access is required.');
    const response=await sb.from('branding').update({demand_account_details:details}).eq('id',recordId).select('id').single();
    if(response.error)throw response.error;
    original=details;status.textContent='Verified payment details saved for this project.';
   }catch(error){status.textContent='Could not save: '+(error.message||'Please try again.');}
   finally{button.disabled=false;}
  });
 }
 function schedule(){if(queued)return;queued=true;setTimeout(mount,40);}
 function install(){
  if(!document.body){setTimeout(install,70);return;}
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  schedule();
 }
 install();
})();
