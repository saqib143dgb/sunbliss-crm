function renderAuthScreen(message,ok){
  var app=document.getElementById('app');
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
        '<input type="email" id="siEmail" class="auth-input" autocomplete="username" />'+
        '<label class="auth-label">Password</label>'+
        '<input type="password" id="siPassword" class="auth-input" autocomplete="current-password" />'+
        '<button class="btn btn-gold" id="btnSignIn" style="width:100%;justify-content:center;margin-top:16px;">Sign In</button>'+
      '</div>'+
      (message?'<div class="auth-msg '+(ok?'auth-msg-ok':'auth-msg-error')+'">'+esc(message)+'</div>':'')+
    '</div></div>';

  var button=document.getElementById('btnSignIn');
  var email=document.getElementById('siEmail');
  var password=document.getElementById('siPassword');

  async function submit(){
    var userEmail=email?email.value.trim():'';
    var userPassword=password?password.value:'';
    if(!userEmail||!userPassword){renderAuthScreen('Enter your email and password.',false);return}
    if(button){button.disabled=true;button.textContent='Signing in…'}
    var result=await sb.auth.signInWithPassword({email:userEmail,password:userPassword});
    if(result.error){renderAuthScreen(result.error.message,false);return}
    boot();
  }

  if(button)button.onclick=submit;
  [email,password].forEach(function(input){
    if(input)input.addEventListener('keydown',function(ev){if(ev.key==='Enter')submit()});
  });
}

async function denyUnauthorized(message){
  try{await sb.auth.signOut()}catch(_e){}
  state.userName=null;
  state.userRole=null;
  renderAuthScreen(message||'This account is not authorized for this CRM.',false);
}

async function boot(){
  try{
    var sessionResult=await sb.auth.getSession();
    if(sessionResult.error){renderAuthScreen(sessionResult.error.message,false);return}
    var session=sessionResult.data&&sessionResult.data.session;
    if(!session){renderAuthScreen();return}

    var userResult=await sb.auth.getUser();
    if(userResult.error){
      try{await sb.auth.signOut()}catch(_e){}
      renderAuthScreen('Your session expired. Please sign in again.',false);
      return;
    }
    var user=userResult.data&&userResult.data.user;
    if(!user){renderAuthScreen();return}

    var profileResult=await sb.from('profiles').select('full_name, role').eq('id',user.id).single();
    var profile=profileResult.data;
    var role=profile&&profile.role;
    if(profileResult.error||!profile||(role!=='crm_officer'&&role!=='manager')){
      await denyUnauthorized('This account is not authorized for this CRM.');
      return;
    }

    state.userName=profile.full_name||user.email;
    state.userRole=role;
    await loadFromSupabase();
    render();
  }catch(err){
    renderAuthScreen(err&&err.message?err.message:'Could not load the CRM. Please try again.',false);
  }
}

document.addEventListener('DOMContentLoaded',boot);
