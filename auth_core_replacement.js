var authBootPromise=null;
var authRefreshPromise=null;
var rememberedSignInEmail='';
var authLoadRecoveryActive=false;

function authWait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function authMessage(err){return err&&err.message?String(err.message):String(err||'');}
function authStatus(err){return Number(err&&err.status)||0;}
function authIsTimeout(err){var m=authMessage(err).toLowerCase();return authStatus(err)===408||m.indexOf('timed out')!==-1||m.indexOf('timeout')!==-1;}
function authIsNetworkError(err){
  var m=authMessage(err).toLowerCase();
  return !m||m.indexOf('load failed')!==-1||m.indexOf('failed to fetch')!==-1||m.indexOf('network')!==-1||m.indexOf('fetch')!==-1||m.indexOf('connection')!==-1||m.indexOf('timeout')!==-1||m.indexOf('timed out')!==-1||m.indexOf('offline')!==-1||authStatus(err)>=500;
}
function authIsSessionError(err){
  var m=authMessage(err).toLowerCase(),s=authStatus(err);
  return s===401||m.indexOf('jwt')!==-1||m.indexOf('token')!==-1||m.indexOf('session')!==-1||m.indexOf('unauthorized')!==-1;
}
function authIsCredentialError(err){
  var m=authMessage(err).toLowerCase();
  return m.indexOf('invalid login credentials')!==-1||m.indexOf('invalid credentials')!==-1||m.indexOf('email not confirmed')!==-1||m.indexOf('user not found')!==-1;
}
function authWithTimeout(promise,ms,label){
  return new Promise(function(resolve,reject){
    var done=false,timer=setTimeout(function(){
      if(done)return;done=true;
      var err=new Error((label||'Request')+' timed out.');
      err.status=408;err.code='AUTH_TIMEOUT';reject(err);
    },ms||12000);
    Promise.resolve(promise).then(function(value){
      if(done)return;done=true;clearTimeout(timer);resolve(value);
    },function(err){
      if(done)return;done=true;clearTimeout(timer);reject(err);
    });
  });
}
function authStorageKey(){
  try{
    var raw=sb&&sb.supabaseUrl?String(sb.supabaseUrl):'';
    var ref=raw?new URL(raw).hostname.split('.')[0]:'';
    return ref?'sb-'+ref+'-auth-token':'sb-aeaakgndnihmuicyierp-auth-token';
  }catch(_e){return'sb-aeaakgndnihmuicyierp-auth-token';}
}
function authClearStoredSession(){
  var key=authStorageKey();
  try{if(window.localStorage)localStorage.removeItem(key);}catch(_e){}
  try{if(window.sessionStorage)sessionStorage.removeItem(key);}catch(_e){}
}
async function authResetStaleSession(){
  try{await authWithTimeout(sb.auth.signOut(),4000,'Sign out');}catch(_e){}
  authClearStoredSession();
  state.userName=null;state.userRole=null;
}
async function authWaitForOnline(maxMs){
  if(typeof navigator==='undefined'||navigator.onLine!==false)return;
  await new Promise(function(resolve){
    var done=false,timer=setTimeout(finish,maxMs||8000);
    function finish(){if(done)return;done=true;clearTimeout(timer);window.removeEventListener('online',finish);resolve();}
    window.addEventListener('online',finish,{once:true});
  });
}
async function authRefreshSession(){
  if(authRefreshPromise)return authRefreshPromise;
  authRefreshPromise=(async function(){
    var r=await authWithTimeout(sb.auth.refreshSession(),10000,'Session refresh');
    if(r.error)throw r.error;
    return r.data&&r.data.session?r.data.session:null;
  })().finally(function(){authRefreshPromise=null;});
  return authRefreshPromise;
}
async function authRetryOperation(operation,options){
  options=options||{};
  var attempts=options.attempts||3,lastError=null,refreshed=false,timeoutMs=options.timeoutMs||12000,label=options.label||'Request';
  for(var i=0;i<attempts;i++){
    if(typeof navigator!=='undefined'&&navigator.onLine===false)await authWaitForOnline(8000);
    try{
      var result=await authWithTimeout(operation(i),timeoutMs,label);
      if(result&&result.error){
        lastError=result.error;
        if(options.refreshOn401&&authIsSessionError(lastError)&&!refreshed){
          refreshed=true;
          await authRefreshSession();
          continue;
        }
        if(!authIsNetworkError(lastError)||i===attempts-1)return result;
      }else return result;
    }catch(err){
      lastError=err;
      if(options.refreshOn401&&authIsSessionError(err)&&!refreshed){
        refreshed=true;
        await authRefreshSession();
        continue;
      }
      if(!authIsNetworkError(err)||i===attempts-1)throw err;
    }
    await authWait(i===0?500:i===1?1200:2200);
  }
  if(lastError)throw lastError;
  return null;
}

function renderAuthScreen(message,ok,emailValue){
  authLoadRecoveryActive=false;
  var app=document.getElementById('app');
  var preserved=emailValue!==undefined?emailValue:rememberedSignInEmail;
  app.innerHTML='<div class="auth-wrap">'+
    '<p class="eyebrow" style="text-align:center;">Sunbliss Residences</p>'+
    '<h1 class="title" style="text-align:center;">Sales &amp; Collections</h1>'+
    '<div class="auth-card">'+
      '<div style="text-align:center;margin-bottom:16px">'+
        '<p style="font-family:Fraunces,serif;font-size:18px;font-weight:600;margin:0 0 5px;color:var(--ink)">Sign In</p>'+
        '<p style="font-size:11.5px;line-height:1.45;color:var(--muted);margin:0">Authorized CRM and Manager accounts only.</p>'+
      '</div>'+
      '<div id="signInForm">'+
        '<label class="auth-label">Email</label>'+
        '<input type="email" id="siEmail" class="auth-input" autocomplete="username" value="'+esc(preserved||'')+'" />'+
        '<label class="auth-label">Password</label>'+
        '<input type="password" id="siPassword" class="auth-input" autocomplete="current-password" />'+
        '<button class="btn btn-gold" id="btnSignIn" style="width:100%;justify-content:center;margin-top:16px;">Sign In</button>'+
      '</div>'+
      (message?'<div class="auth-msg '+(ok?'auth-msg-ok':'auth-msg-error')+'" role="status">'+esc(message)+'</div>':'')+
    '</div></div>';

  var button=document.getElementById('btnSignIn');
  var email=document.getElementById('siEmail');
  var password=document.getElementById('siPassword');

  async function submit(){
    var userEmail=email?email.value.trim():'';
    var userPassword=password?password.value:'';
    rememberedSignInEmail=userEmail;
    if(!userEmail||!userPassword){renderAuthScreen('Enter your email and password.',false,userEmail);return;}
    if(button){button.disabled=true;button.textContent='Signing in…';}
    var slowTimer=setTimeout(function(){if(button&&button.disabled)button.textContent='Connecting securely…';},5000);
    try{
      var result=await authRetryOperation(function(attempt){
        if(button&&attempt>0)button.textContent='Reconnecting…';
        return sb.auth.signInWithPassword({email:userEmail,password:userPassword});
      },{attempts:3,timeoutMs:15000,label:'Sign in'});
      if(result&&result.error){
        if(authIsCredentialError(result.error))renderAuthScreen(result.error.message,false,userEmail);
        else renderAuthScreen('Connection was interrupted. Please try again.',false,userEmail);
        return;
      }
      await boot(result&&result.data?result.data.session:null);
    }catch(err){
      renderAuthScreen(authIsNetworkError(err)?'Connection was interrupted. Please try again.':authMessage(err),false,userEmail);
    }finally{clearTimeout(slowTimer);}
  }

  if(button)button.onclick=submit;
  [email,password].forEach(function(input){
    if(input)input.addEventListener('keydown',function(ev){if(ev.key==='Enter')submit();});
  });
}

async function denyUnauthorized(message){
  try{await authWithTimeout(sb.auth.signOut(),4000,'Sign out');}catch(_e){}
  state.userName=null;
  state.userRole=null;
  renderAuthScreen(message||'This account is not authorized for this CRM.',false,rememberedSignInEmail);
}

function renderLoadRecovery(message){
  authLoadRecoveryActive=true;
  var app=document.getElementById('app');
  app.innerHTML='<div class="auth-wrap">'+
    '<p class="eyebrow" style="text-align:center;">Sunbliss Residences</p>'+
    '<h1 class="title" style="text-align:center;">Sales &amp; Collections</h1>'+
    '<div class="auth-card">'+
      '<div style="text-align:center;margin-bottom:14px">'+
        '<p style="font-family:Fraunces,serif;font-size:18px;font-weight:600;margin:0 0 5px;color:var(--ink)">Connection interrupted</p>'+
        '<p style="font-size:11.5px;line-height:1.5;color:var(--muted);margin:0">You are still signed in. The CRM could not finish loading data.</p>'+
      '</div>'+
      '<button class="btn btn-gold" id="btnRetryCrmLoad" style="width:100%;justify-content:center;">Retry Loading</button>'+
      '<button class="btn-paper" id="btnRecoverySignOut" style="width:100%;justify-content:center;margin-top:9px;">Sign Out</button>'+
      (message?'<div class="auth-msg auth-msg-error" style="margin-top:12px">'+esc(message)+'</div>':'')+
    '</div></div>';
  var retry=document.getElementById('btnRetryCrmLoad'),out=document.getElementById('btnRecoverySignOut');
  if(retry)retry.onclick=function(){retry.disabled=true;retry.textContent='Retrying…';boot();};
  if(out)out.onclick=async function(){await authResetStaleSession();location.reload();};
}

async function boot(preloadedSession){
  if(authBootPromise)return authBootPromise;
  authBootPromise=(async function(){
    try{
      var session=preloadedSession||null;
      if(!session){
        var sessionResult;
        try{
          sessionResult=await authRetryOperation(function(){return sb.auth.getSession();},{attempts:1,timeoutMs:7000,label:'Saved session'});
        }catch(sessionErr){
          if(authIsTimeout(sessionErr)||authIsSessionError(sessionErr)){
            await authResetStaleSession();
            renderAuthScreen('Your saved session could not be restored. Please sign in again.',false,rememberedSignInEmail);
            return;
          }
          throw sessionErr;
        }
        if(sessionResult&&sessionResult.error){
          if(authIsSessionError(sessionResult.error)){
            await authResetStaleSession();
            renderAuthScreen('Your session expired. Please sign in again.',false,rememberedSignInEmail);
          }else renderLoadRecovery('Could not restore your saved session. Please retry.');
          return;
        }
        session=sessionResult&&sessionResult.data?sessionResult.data.session:null;
      }
      if(!session){renderAuthScreen();return;}

      var userResult;
      try{
        userResult=await authRetryOperation(function(){return sb.auth.getUser();},{attempts:2,timeoutMs:10000,label:'Account verification',refreshOn401:true});
      }catch(userErr){
        if(authIsTimeout(userErr)||authIsSessionError(userErr)){
          await authResetStaleSession();
          renderAuthScreen('Your session expired. Please sign in again.',false,rememberedSignInEmail);
          return;
        }
        throw userErr;
      }
      if(userResult&&userResult.error){
        if(authIsSessionError(userResult.error)){
          await authResetStaleSession();
          renderAuthScreen('Your session expired. Please sign in again.',false,rememberedSignInEmail);
        }else renderLoadRecovery('Could not verify your account. Please retry.');
        return;
      }
      var user=userResult&&userResult.data?userResult.data.user:null;
      if(!user){renderAuthScreen();return;}

      var profileResult=await authRetryOperation(function(){return sb.from('profiles').select('full_name, role').eq('id',user.id).single();},{attempts:2,timeoutMs:10000,label:'Access profile',refreshOn401:true});
      var profile=profileResult&&profileResult.data;
      var role=profile&&profile.role;
      if((profileResult&&profileResult.error)||!profile||(role!=='crm_officer'&&role!=='manager')){
        if(profileResult&&profileResult.error&&authIsNetworkError(profileResult.error)){
          renderLoadRecovery('Could not load your access profile. Please retry.');
          return;
        }
        await denyUnauthorized('This account is not authorized for this CRM.');
        return;
      }

      state.userName=profile.full_name||user.email;
      state.userRole=role;
      var loaded=false,lastError=null;
      for(var attempt=0;attempt<3&&!loaded;attempt++){
        try{
          await authWithTimeout(loadFromSupabase(),20000,'CRM data loading');
          loaded=true;
        }catch(err){
          lastError=err;
          if(authIsSessionError(err)&&attempt===0){
            try{await authRefreshSession();}catch(refreshErr){lastError=refreshErr;}
          }else if(!authIsNetworkError(err)&&!authIsSessionError(err))break;
          if(attempt<2)await authWait(attempt===0?500:1200);
        }
      }
      if(!loaded){renderLoadRecovery(authIsNetworkError(lastError)?'Internet connection was unstable while loading CRM data.':authMessage(lastError)||'Could not load CRM data.');return;}
      authLoadRecoveryActive=false;
      render();
    }catch(err){
      if(authIsTimeout(err))renderLoadRecovery('The CRM took too long to respond. Please retry.');
      else if(authIsNetworkError(err))renderLoadRecovery('Internet connection was interrupted. Please retry.');
      else renderLoadRecovery(authMessage(err)||'Could not load the CRM. Please retry.');
    }
  })().finally(function(){authBootPromise=null;});
  return authBootPromise;
}

document.addEventListener('DOMContentLoaded',function(){boot();});
window.addEventListener('online',function(){if(authLoadRecoveryActive&&!authBootPromise)boot();});
