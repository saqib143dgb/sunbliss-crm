const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('cancelled_forfeit_rule_patch_v2.js','utf8');

function node(className='',id=''){
  const n={
    className,id,parentNode:null,children:[],attrs:{},_innerHTML:'',
    get childNodes(){return this.children},
    getAttribute(k){return this.attrs[k]??null},
    setAttribute(k,v){this.attrs[k]=String(v)},
    appendChild(child){
      if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);
      this.children.push(child);child.parentNode=this;return child;
    },
    insertBefore(child,before){
      if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);
      let index=this.children.indexOf(before);
      this.children.splice(index<0?this.children.length:index,0,child);child.parentNode=this;return child;
    },
    querySelector(sel){
      const predicate=sel[0]==='.'?x=>x.className===sel.slice(1):x=>x.id===sel.slice(1);
      function walk(x){for(const c of x.children){if(predicate(c))return c;let found=walk(c);if(found)return found}return null}
      return walk(this);
    },
    closest(sel){if(sel!=='label.brand-field')return null;let p=this;while(p){if(p.className==='brand-field')return p;p=p.parentNode}return null}
  };
  Object.defineProperty(n,'innerHTML',{get(){return n._innerHTML},set(v){n._innerHTML=String(v);n.children=[node('rendered-markup')];n.children[0].parentNode=n}});
  return n;
}
function fixture({mobile=true,existing=false,preRendered=false}={}){
  const panel=node('brand-editor','unitCancellationPanel');
  const scroll=mobile?panel.appendChild(node('crm-cancel-scroll')):panel;
  const before=scroll.appendChild(node('brand-field'));
  before.appendChild(node('input','cuReason'));
  const remarks=scroll.appendChild(node('brand-field'));
  remarks.appendChild(node('input','cuRemarks'));
  const actions=panel.appendChild(node('crm-cancel-actions'));
  let card=null;
  if(existing){
    card=panel.appendChild(node('sunbliss-forfeit-rule'));
    if(preRendered){
      card.setAttribute('data-sunbliss-render-key','20634.00');
      card.innerHTML='old rendered settlement content';
    }
  }
  const start=src.indexOf('  function renderRuleCard(panel, paid){');
  const end=src.indexOf('  function enforce(panel){',start);
  assert.ok(start>=0&&end>start);
  const sandbox={
    document:{createElement(){return node()},getElementById(){throw Error('Renderer must find Remarks within the panel')}},
    money:n=>'AED '+Number(n).toFixed(2)
  };
  vm.runInNewContext(src.slice(start,end)+'\nthis.render=renderRuleCard;',sandbox);
  sandbox.render(panel,20634);
  return {panel,scroll,before,remarks,actions,card:panel.querySelector('.sunbliss-forfeit-rule'),oldCard:card};
}

test('new Cancellation Settlement appears inside the scroll area before Remarks',()=>{
  const x=fixture({mobile:true});
  assert.equal(x.card.parentNode,x.scroll);
  assert.equal(x.scroll.children.indexOf(x.card),x.scroll.children.indexOf(x.remarks)-1);
  assert.equal(x.actions.parentNode,x.panel);
  assert.equal(x.panel.children.length,2,'only scroll area and footer may take vertical space');
});

test('previously misplaced Settlement card moves into scrolling form without rebuilding',()=>{
  const x=fixture({mobile:true,existing:true,preRendered:true});
  assert.equal(x.card,x.oldCard,'must keep the existing card node');
  assert.equal(x.card.parentNode,x.scroll);
  assert.equal(x.panel.children.length,2,'footer must not be pushed up by a third panel child');
  assert.equal(x.card.innerHTML,'old rendered settlement content','do not rewrite values when moving the card');
});

test('desktop still inserts Settlement before Remarks in the original inline panel',()=>{
  const x=fixture({mobile:false});
  assert.equal(x.card.parentNode,x.panel);
  assert.equal(x.panel.children.indexOf(x.card),x.panel.children.indexOf(x.remarks)-1);
});

test('settlement rendering reuses existing card on repeat runs',()=>{
  const x=fixture({mobile:true});
  const first=x.card;
  const html=first.innerHTML;
  const start=src.indexOf('  function renderRuleCard(panel, paid){');
  const end=src.indexOf('  function enforce(panel){',start);
  const sandbox={document:{createElement(){return node()}},money:n=>'AED '+Number(n).toFixed(2)};
  vm.runInNewContext(src.slice(start,end)+'\nthis.render=renderRuleCard;',sandbox);
  sandbox.render(x.panel,20634);
  assert.equal(x.panel.querySelector('.sunbliss-forfeit-rule'),first);
  assert.equal(first.innerHTML,html);
  assert.equal(x.panel.children.length,2);
});

test('visual placement does not touch any amount input, date or business save RPC',()=>{
  const renderer=src.slice(src.indexOf('  function renderRuleCard(panel, paid){'),src.indexOf('  function enforce(panel){'));
  assert.doesNotMatch(renderer, /\.value\s*=|\.disabled\s*=|sb\.rpc|payment_schedule|new Date|due_date|cuDate|cuConfirm/);
  assert.match(src,/if \(settlement\.value !== 'Forfeited'\) settlement\.value = 'Forfeited'/);
  assert.match(src,/if \(forfeited\.value !== expected\) forfeited\.value = expected/);
  const cancel=fs.readFileSync('unit_detail_workflow_patch.js','utf8');
  assert.match(cancel, /p_cancellation_date:date/);
  assert.match(cancel, /id="cuDate" value="' \+ todayISO\(\)/);
  assert.match(cancel, /p_refund_amount:refund/);
  assert.match(cancel, /p_forfeited_amount:forfeited/);
});
