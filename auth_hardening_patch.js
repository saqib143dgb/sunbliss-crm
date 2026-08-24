(function(){
  'use strict';

  var legacyBoot = typeof window.boot === 'function' ? window.boot : null;
  if (legacyBoot) document.removeEventListener('DOMContentLoaded', legacyBoot);

  function safe(value){
    var text = value === null || value === undefined ? '' : String(value);
    if (typeof window.esc === 'function') return window.esc(text);
    return text.replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function renderSignInOnly(message,ok){
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML =
      '<div class="auth-wrap">' +
        '<p class="eyebrow" style="text-align:center;">Sunbliss Residences</p>' +
        '<h1 class="title" style="text-align:center;">Sales &amp; Collections</h1>' +
        '<div class="auth-card">' +
          '<div style="text-align:center;margin-bottom:16px">' +
            '<p style="font-family:Fraunces,serif;font-size:18px;font-weight:600;margin:0 0 5px;color:var(--ink)">Sign In</p>' +
            '<p style="font-size:11.5px;line-height:1.45;color:var(--muted);margin:0">Authorized CRM and Manager accounts only.</p>' +
          '</div>' +
          '<div id="signInForm">' +
            '<label class="auth-label">Email</label>' +
            '<input type="email" id="siEmail" class="auth-input" autocomplete="username" />' +
            '<label class="auth-label">Password</label>' +
            '<input type="password" id="siPassword" class="auth-input" autocomplete="current-password" />' +
            '<button class="btn btn-gold" id="btnSignIn" style="width:100%;justify-content:center;margin-top:16px;">Sign In</button>' +
          '</div>' +
          (message ? '<div class="auth-msg ' + (ok ? 'auth-msg-ok' : 'auth-msg-error') + '">' + safe(message) + '</div>' : '') +
        '</div>' +
      '</div>';

    var button = document.getElementById('btnSignIn');
    var email = document.getElementById('siEmail');
    var password = document.getElementById('siPassword');

    async function submit(){
      var userEmail = email ? email.value.trim() : '';
      var userPassword = password ? password.value : '';
      if (!userEmail || !userPassword){
        renderSignInOnly('Enter your email and password.',false);
        return;
      }
      if (button){ button.disabled = true; button.textContent = 'Signing in…'; }
      var result = await sb.auth.signInWithPassword({email:userEmail,password:userPassword});
      if (result.error){
        renderSignInOnly(result.error.message,false);
        return;
      }
      await hardenedBoot();
    }

    if (button) button.onclick = submit;
    [email,password].forEach(function(input){
      if (!input) return;
      input.addEventListener('keydown',function(ev){
        if (ev.key === 'Enter') submit();
      });
    });
  }

  async function rejectUnauthorized(message){
    try{ await sb.auth.signOut(); }catch(_e){}
    state.userName = null;
    state.userRole = null;
    renderSignInOnly(message || 'This account is not authorized for this CRM.',false);
  }

  async function hardenedBoot(){
    try{
      var userResult = await sb.auth.getUser();
      if (userResult.error) throw userResult.error;
      var user = userResult.data && userResult.data.user;
      if (!user){
        renderSignInOnly();
        return;
      }

      var profileResult = await sb.from('profiles')
        .select('full_name, role')
        .eq('id',user.id)
        .single();

      var profile = profileResult.data;
      var role = profile && profile.role;
      if (profileResult.error || !profile || (role !== 'crm_officer' && role !== 'manager')){
        await rejectUnauthorized('This account is not authorized for this CRM.');
        return;
      }

      state.userName = profile.full_name || user.email;
      state.userRole = role;
      await loadFromSupabase();
      render();
    }catch(err){
      await rejectUnauthorized(err && err.message ? err.message : 'Could not verify this account.');
    }
  }

  window.renderAuthScreen = renderSignInOnly;
  window.boot = hardenedBoot;

  // Prevent any browser-side code path from reintroducing self-registration.
  try{
    sb.auth.signUp = async function(){
      return {
        data:{user:null,session:null},
        error:new Error('Sign up is disabled for this CRM.')
      };
    };
  }catch(_e){}

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', hardenedBoot, {once:true});
  }else{
    hardenedBoot();
  }
})();
