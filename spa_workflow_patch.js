(function(){
 'use strict';
 if(window.__sunblissOpenSpaTask)return;
 const labels={sent:'Mark Sent',no_reply:'No Reply',appointment:'Office Appointment',no_show:'Did Not Attend',clarification:'Needs Clarification',change:'Requests a Change',escalate:'Management Review',refused:'Refuses to Sign',remote:'Digital Signing',customer_signed:'Customer Signed',accepted:'Customer Agrees',later:'Follow Up Later',approved:'Approved',conditional:'Approved with Conditions',rejected:'Rejected',prepared:'Revised SPA Ready',checked:'Review Complete',revise:'Needs Correction',developer_signed:'Developer Signed',registered:'Registered',pending:'Not Yet Issued',issued:'Issued'};
 const response=['appointment','customer_signed','remote','clarification','change','refused','escalate','later'];
 const options={invite:['sent',...response],reminder:['sent','no_reply','accepted',...response],call:['accepted',...response],appointment:['customer_signed','appointment','no_show','clarification','change','refused','escalate','later'],followup:['accepted',...response],remote:['sent',...response],clarify:['sent','accepted',...response],approval:['approved','conditional','rejected','later'],decision:['sent','accepted',...response],revise:['prepared','later'],review:['checked','revise','later'],developer:['developer_signed','later'],email:['sent','later'],oqood:['registered','later'],issuance:['issued','pending','later'],contract:['sent','later']};
 const tips={invite:'Send the invitation, then mark it sent.',reminder:'No reply? Send a signing reminder. After two reminders, call the customer.',call:'Call the customer and record the outcome.',appointment:'Record the visit outcome or choose a new appointment.',clarify:'Record the reply after obtaining any required internal clarification.',approval:'Record the management decision and a short explanation.',decision:'Send the decision, then record the customer response.',revise:'Prepare the approved changes and enter the revised SPA reference.',review:'Check the revised SPA before it is sent for signing.',developer:'The customer has signed. Record the developer signature next.',email:'Email the copy signed by both parties, then mark it sent.',oqood:'Complete registration in Oqood, then record the date and reference.',issuance:'Check whether the Initial Contract of Sale has been issued.',contract:'Send the Initial Contract of Sale, then mark it sent.',remote:'Send the SPA through your approved digital signing process.',followup:'Record the customer response or arrange signing.'};
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const needsDate=o=>['appointment','later','no_show','pending','customer_signed','developer_signed','registered','issued','sent'].includes(o);
 const future=o=>['appointment','later','no_show','pending'].includes(o);
 const needsRef=o=>['customer_signed','developer_signed','registered','issued','prepared'].includes(o);
 const needsNote=o=>['clarification','change','refused','escalate','approved','conditional','rejected'].includes(o);
 function close(){document.getElementById('scheduledActionPanel')?.remove();}
 window.__sunblissOpenSpaTask=function(task){
  close();const c=(window.state?.dues||[]).find(c=>Number(c.sno)===Number(task.unit_id));
  const panel=document.createElement('div');panel.id='scheduledActionPanel';panel.className='brand-editor';panel.dataset.mode='spa';
  panel.innerHTML='<p class="section-label">'+esc(task.action_label)+'</p><p class="scheduled-form-summary">'+esc(c?c.unit+' · '+c.name:'Unit '+task.unit_id)+'</p><p>'+esc(tips[task.spa_step]||'Record the next step.')+'</p>'+(task.note?'<p class="scheduled-outcome-current">'+esc(task.note)+'</p>':'')+'<p id="spaError" class="brand-error" role="alert" hidden></p><label class="brand-field">Outcome<select id="spaOutcome">'+(options[task.spa_step]||[]).map(o=>'<option value="'+o+'">'+labels[o]+'</option>').join('')+'</select></label><div id="spaFields"></div><details id="spaHistory"><summary>Task history</summary><div>Loading…</div></details><div class="brand-editor-actions"><button type="button" id="spaSave" class="btn btn-gold">Save</button><button type="button" id="spaClose" class="btn-paper">Cancel</button></div>';
  document.body.appendChild(panel);
  const field=(label,id,type,required,value='')=>'<label class="brand-field">'+label+(required?' *':'')+'<input id="'+id+'" type="'+type+'" value="'+esc(value)+'" '+(required?'required':'')+' /></label>';
  function fields(){const o=panel.querySelector('#spaOutcome').value;
   panel.querySelector('#spaFields').innerHTML=(needsDate(o)?field(future(o)?(o==='appointment'?'Appointment date':'Follow-up date'):'Completed date','spaDate','date',true,today()):'')+(o==='appointment'?field('Time (Dubai)','spaTime','time',true):'')+(o==='customer_signed'?'<label class="brand-field">Signing method<select id="spaMethod"><option value="office">Office</option><option value="digital">Digital</option></select></label>':'')+(needsRef(o)?field(o==='registered'?'Oqood reference':'Document reference or link','spaRef','text',true):'')+'<label class="brand-field">'+(needsNote(o)?'Note *':'Note (optional)')+'<textarea id="spaNote" maxlength="4000" placeholder="'+(o==='change'?'Clause, requested change and reason':o==='clarification'?'Clause and customer question':'Short note')+'"></textarea></label>';
   const d=panel.querySelector('#spaDate');if(d)d.setAttribute(future(o)?'min':'max',today());
   panel.querySelector('#spaSave').textContent=o==='sent'?'Mark Sent':o==='customer_signed'||o==='developer_signed'?'Record Signature':o==='registered'?'Mark Registered':o==='issued'?'Mark Issued':'Save';
  }
  panel.querySelector('#spaOutcome').onchange=fields;fields();panel.querySelector('#spaClose').onclick=close;
  sb.from('scheduled_actions').select('action_label,completed_at,completion_note,status,note,spa_data').eq('spa_sale_id',task.spa_sale_id).order('id',{ascending:false}).then(r=>{
   if(!panel.isConnected)return;const host=panel.querySelector('#spaHistory div');
   host.innerHTML=r.error?'Could not load history.':(r.data||[]).map(t=>'<p><strong>'+esc(t.action_label)+'</strong> · '+esc(t.status)+(t.completed_at?' · '+esc(new Date(t.completed_at).toLocaleDateString('en-GB',{timeZone:'Asia/Dubai'})):'')+'<br>'+esc(t.completion_note||t.note||'')+(t.spa_data?.reference?'<br>Reference: '+esc(t.spa_data.reference):'')+'</p>').join('')||'No earlier actions.';
  });
  panel.querySelector('#spaSave').onclick=async function(){const button=this,o=panel.querySelector('#spaOutcome').value;
   const val=id=>panel.querySelector('#'+id)?.value.trim()||null;
   const error=panel.querySelector('#spaError');error.hidden=true;
   function fail(message,id){error.textContent=message;error.hidden=false;const f=panel.querySelector('#'+id);f?.scrollIntoView({block:'center'});f?.focus();}
   if(needsDate(o)&&!val('spaDate'))return fail('Choose a date.','spaDate');
   if(o==='appointment'&&!val('spaTime'))return fail('Choose an appointment time.','spaTime');
   if(needsRef(o)&&!val('spaRef'))return fail('Enter the reference.','spaRef');
   if(needsNote(o)&&!val('spaNote'))return fail('Enter a short note.','spaNote');
   button.disabled=true;button.textContent='Saving…';
   try{const r=await sb.rpc('crm_resolve_spa_task',{p_task_id:Number(task.id),p_outcome:o,p_data:{date:val('spaDate'),time:val('spaTime'),reference:val('spaRef'),method:val('spaMethod'),note:val('spaNote')}});if(r.error)throw r.error;
    close();await window.__sunblissRefreshScheduledActions?.();
    if(c&&o==='developer_signed'){c.spa='Signed';if(c.info)c.info.spaDate=val('spaDate');}
    if(c&&o==='registered'){c.oqood='Completed';if(c.info)c.info.oqoodDate=val('spaDate');}
    if(typeof window.renderMain==='function')window.renderMain();
   }catch(e){fail(e.message||'Could not save. Please try again.','spaOutcome');button.disabled=false;button.textContent='Try Again';}
  };
 };
 // Restore SPA task routing while retaining the stable scheduled actions implementation.
 document.addEventListener('click', function(event){
   var button=event.target&&event.target.closest&&event.target.closest('.scheduled-mark-done[data-task-id]');
   if(!button||!window.__sunblissScheduledActionRows)return;
   var id=Number(button.getAttribute('data-task-id'));
   var rows=window.__sunblissScheduledActionRows();
   var task=Array.isArray(rows)&&rows.find(function(row){return Number(row.id)===id;});
   if(!task||task.workflow_kind!=='spa')return;
   event.preventDefault();
   event.stopPropagation();
   event.stopImmediatePropagation();
   var originalText=button.textContent;
   button.disabled=true;
   button.textContent='Opening SPA task…';
   Promise.resolve(sb.from('scheduled_actions').select('id,unit_id,action_label,note,status,spa_sale_id,spa_step,spa_data').eq('id',id).single()).then(function(result){
     if(result.error)throw result.error;
     if(!result.data||result.data.workflow_kind&&result.data.workflow_kind!=='spa')throw Error('SPA task is unavailable.');
     window.__sunblissOpenSpaTask(Object.assign({},task,result.data));
   }).catch(function(error){
     window.alert(error&&error.message?error.message:'Could not open the SPA task. Please retry.');
   }).finally(function(){
     if(button.isConnected){button.disabled=false;button.textContent=originalText;}
   });
 },true);

})();
