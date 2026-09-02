var authBootPromise=null;
var authRefreshPromise=null;
var rememberedSignInEmail='';
var authLoadRecoveryActive=false;

function authWait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function authMessage(err){return err&&err.message?String(err.message):String(err||'');}
function authStatus(err){return Number(err&&err.status)||0;}
function authIsNetworkError(err){
  var m=authMessage(err).toLowerCase();
  return !m||m.indexOf('load failed')!==-1||m.indexOf('failed to fetch')!==-1||m.indexOf('network')!==-1||m.indexOf('fetch')!==-1||m.indexOf('connection')!==-1||m.indexOf('timeout')!==-1||m.indexOf('offline')!==-1||authStatus(err)>=500;
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
    var settled=false;
    var timer=setTimeout(function(){
      if(settled)return;
      settled=true;
      var err=new Error((label||'Secure request')+' timeout');
      err.name='AuthTimeoutError';
      err.authTimeout=true;
      reject(err);
    },ms||12000);
    Promise.resolve(promise).then(function(value){
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve(value);
    },function(err){
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      reject(err);
    });
  });
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
    var r=await authWithTimeout(sb.auth.refreshSession(),12000,'Session refresh');
    if(r.error)throw r.error;
    return r.data&&r.data.session?r.data.session:null;
  })().finally(function(){authRefreshPromise=null;});
  return authRefreshPromise;
}
async function authRetryOperation(operation,options){
  options=options||{};
  var attempts=options.attempts||3,lastError=null,refreshed=false;
  for(var i=0;i<attempts;i++){
    if(typeof navigator!=='undefined'&&navigator.onLine===false)await authWaitForOnline(8000);
    try{
      var result=await authWithTimeout(operation(i),options.timeoutMs||12000,options.timeoutLabel||'Secure request');
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
      },{attempts:3,timeoutMs:12000,timeoutLabel:'Sign-in request'});
      if(result&&result.error){
        if(authIsCredentialError(result.error))renderAuthScreen(result.error.message,false,userEmail);
        else renderAuthScreen('Connection was interrupted. Please try again.',false,userEmail);
        return;
      }
      if(button)button.textContent='Opening CRM…';
      await boot(result&&result.data?result.data.session:null);
    }catch(err){
      renderAuthScreen(authIsNetworkError(err)?'Secure connection timed out. Please try again.':authMessage(err),false,userEmail);
    }finally{clearTimeout(slowTimer);}
  }

  if(button)button.onclick=submit;
  [email,password].forEach(function(input){
    if(input)input.addEventListener('keydown',function(ev){if(ev.key==='Enter')submit();});
  });
}

async function denyUnauthorized(message){
  try{await authWithTimeout(sb.auth.signOut(),8000,'Sign-out request');}catch(_e){}
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
  if(out)out.onclick=async function(){try{await authWithTimeout(sb.auth.signOut(),8000,'Sign-out request');}catch(_e){}location.reload();};
}

async function boot(preloadedSession){
  if(authBootPromise)return authBootPromise;
  authBootPromise=(async function(){
    try{
      var session=preloadedSession||null;
      if(!session){
        var sessionResult=await authRetryOperation(function(){return sb.auth.getSession();},{attempts:3,timeoutMs:10000,timeoutLabel:'Session check'});
        if(sessionResult&&sessionResult.error){renderAuthScreen(authMessage(sessionResult.error),false);return;}
        session=sessionResult&&sessionResult.data?sessionResult.data.session:null;
      }
      if(!session){renderAuthScreen();return;}

      var userResult=await authRetryOperation(function(){return sb.auth.getUser();},{attempts:3,refreshOn401:true,timeoutMs:10000,timeoutLabel:'Account verification'});
      if(userResult&&userResult.error){
        if(authIsSessionError(userResult.error)){
          try{await authWithTimeout(sb.auth.signOut(),8000,'Sign-out request');}catch(_e){}
          renderAuthScreen('Your session expired. Please sign in again.',false,rememberedSignInEmail);
        }else renderLoadRecovery('Could not verify your account. Please retry.');
        return;
      }
      var user=userResult&&userResult.data?userResult.data.user:null;
      if(!user){renderAuthScreen();return;}

      var profileResult=await authRetryOperation(function(){return sb.from('profiles').select('full_name, role').eq('id',user.id).single();},{attempts:3,refreshOn401:true,timeoutMs:10000,timeoutLabel:'Profile loading'});
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
          await authWithTimeout(loadFromSupabase(),15000,'CRM data loading');
          loaded=true;
        }catch(err){
          lastError=err;
          if(err&&err.authTimeout&&window.state&&Array.isArray(state.dues)&&state.dues.length){
            console.warn('CRM core data loaded; continuing while a non-critical post-load sync finishes in the background.');
            loaded=true;
            break;
          }
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
      if(authIsNetworkError(err))renderLoadRecovery('Internet connection was interrupted. Please retry.');
      else renderLoadRecovery(authMessage(err)||'Could not load the CRM. Please retry.');
    }
  })().finally(function(){authBootPromise=null;});
  return authBootPromise;
}

document.addEventListener('DOMContentLoaded',function(){boot();});
window.addEventListener('online',function(){if(authLoadRecoveryActive&&!authBootPromise)boot();});
