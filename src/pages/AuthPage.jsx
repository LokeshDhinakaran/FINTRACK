// src/pages/AuthPage.jsx — Premium Finance Auth v2
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GoogleSVG = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path fill="#EA4335" d="M5.27 9.77A7 7 0 0112 5c1.76 0 3.35.66 4.57 1.73l3.38-3.38A11.8 11.8 0 0012 .5C7.31.5 3.26 3.07 1.27 6.93l4 2.84z"/>
    <path fill="#34A853" d="M16.04 18.01A7 7 0 015.27 14.23l-4 2.84C3.26 20.93 7.31 23.5 12 23.5c3.19 0 6.22-1.14 8.49-3.29l-4.45-2.2z"/>
    <path fill="#4A90D9" d="M20.49 20.21A11.8 11.8 0 0023.5 12c0-.81-.09-1.6-.23-2.37H12v4.76h6.46a5.5 5.5 0 01-2.38 3.62l4.41 2.2z"/>
    <path fill="#FBBC05" d="M5.27 14.23A6.97 6.97 0 015 12c0-.77.13-1.52.27-2.23L1.27 6.93A11.75 11.75 0 00.5 12c0 1.86.44 3.61 1.2 5.18l3.57-2.95z"/>
  </svg>
);

function FloatInput({ label, type='text', value, onChange, onKeyDown }) {
  const [focused, setFocused] = useState(false);
  const [vis, setVis] = useState(false);
  const isPass = type === 'password';
  return (
    <div style={{ position:'relative', marginTop:14 }}>
      <label style={{
        position:'absolute', left:16,
        top: focused || value ? 8 : '50%',
        transform: focused || value ? 'none' : 'translateY(-50%)',
        fontSize: focused || value ? 10 : 14,
        color: focused ? '#4ade80' : '#444',
        pointerEvents:'none', transition:'all .2s ease', zIndex:1,
        letterSpacing: focused || value ? '0.06em' : 0,
        textTransform: focused || value ? 'uppercase' : 'none',
        fontFamily:'Plus Jakarta Sans, sans-serif',
      }}>{label}</label>
      <input
        type={isPass && !vis ? 'password' : 'text'}
        value={value} onChange={onChange} onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder=" "
        style={{
          width:'100%', padding:'22px 44px 10px 16px',
          background:'#0d0d0f', border:`1.5px solid ${focused ? '#4ade80' : '#1a1a1f'}`,
          borderRadius:14, fontSize:15, color:'#fff', outline:'none',
          fontFamily:'Plus Jakarta Sans, sans-serif',
          transition:'border-color .2s, box-shadow .2s',
          boxShadow: focused ? '0 0 0 3px rgba(74,222,128,.07)' : 'none',
          display:'block',
        }}
      />
      {isPass && (
        <button onClick={() => setVis(v => !v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#444' }}>
          {vis ? '👁' : '🔒'}
        </button>
      )}
    </div>
  );
}

function Spin() {
  return <span style={{ width:18, height:18, border:'2px solid rgba(0,0,0,.3)', borderTopColor:'#000', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />;
}

export default function AuthPage() {
  const { sendOTP, verifyOTP, googleLogin, emailLogin, emailRegister, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const [mode, setMode]     = useState('home');
  const [phone, setPhone]   = useState('');
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [otp, setOtp]       = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const otpRefs = useRef([]);

  useEffect(() => { if (isAuthenticated) nav('/home', { replace:true }); }, [isAuthenticated]);

  async function handleGoogle() {
    setLoading(true);
    try {
      await googleLogin({ name:'Arjun Kumar', email:'arjun.kumar@gmail.com', google_id:'google_demo_001' });
      nav('/home', { replace:true });
    } catch(e) { toast.error(e.response?.data?.error || 'Google sign-in failed'); }
    finally { setLoading(false); }
  }

  const [emailMode, setEmailMode] = useState('login'); // login | register
  const [name, setName]   = useState('');

  async function handleEmail() {
    if (!email || !pass) { toast.error('Enter email and password'); return; }
    if (emailMode === 'register' && !name) { toast.error('Enter your name'); return; }
    if (emailMode === 'register' && pass.length < 8) { toast.error('Password must be 8+ characters'); return; }
    setLoading(true);
    try {
      if (emailMode === 'register') {
        await emailRegister(name, email, pass);
      } else {
        await emailLogin(email, pass);
      }
      nav('/home', { replace:true });
    } catch(e) { toast.error(e.response?.data?.error || (emailMode==='register'?'Registration failed':'Login failed')); }
    finally { setLoading(false); }
  }

  async function handleSendOTP() {
    if (!/^\d{10}$/.test(phone)) { toast.error('Enter 10-digit number'); return; }
    setLoading(true);
    try {
      const d = await sendOTP(phone);
      if (d.demo_otp) setDemoOtp(d.demo_otp);
      setMode('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch(e) { toast.error(e.response?.data?.error || 'Failed to send OTP'); }
    finally { setLoading(false); }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await verifyOTP(phone, code);
      nav('/home', { replace:true });
    } catch(e) {
      toast.error(e.response?.data?.error || 'Invalid OTP');
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  function onOtpChange(v, i) {
    v = v.replace(/\D/,'');
    const n = [...otp]; n[i] = v; setOtp(n);
    if (v && i < 5) otpRefs.current[i+1]?.focus();
  }
  function onOtpKey(e, i) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  }

  return (
    <div style={{ width:'100%', minHeight:'100dvh', background:'#030305', display:'flex', justifyContent:'center', alignItems:'center', position:'relative', overflow:'hidden', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
      <div style={{ position:'absolute', width:380, height:380, background:'radial-gradient(circle, rgba(74,222,128,.1) 0%, transparent 70%)', borderRadius:'50%', top:-100, right:-80, animation:'blob-drift 9s ease-in-out infinite' }} />
      <div style={{ position:'absolute', width:300, height:300, background:'radial-gradient(circle, rgba(74,144,255,.08) 0%, transparent 70%)', borderRadius:'50%', bottom:0, left:-60, animation:'blob-drift 12s ease-in-out infinite reverse' }} />

      <div style={{ width:'100%', maxWidth:460, padding:'40px 30px', position:'relative', zIndex:1, background:'var(--card)', borderRadius:'24px', border:'1px solid var(--border)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:14, justifyContent:'center', marginBottom:36 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,#4ade80,#22c55e)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(74,222,128,.35)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:'"Clash Display", sans-serif', fontSize:28, fontWeight:700, color:'#fff', lineHeight:1.1 }}>FinTrack</div>
            <div style={{ fontSize:11, color:'#1a3a1a', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>Wealth Intelligence</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(11,11,14,.95)', border:'1px solid rgba(255,255,255,.06)', borderRadius:28, padding:'28px 22px', backdropFilter:'blur(24px)', boxShadow:'0 40px 80px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.05)', minHeight:320 }}>

          {mode === 'home' && (
            <div style={{ animation:'fadeUp .3s ease' }}>
              <div style={{ fontFamily:'"Clash Display", sans-serif', fontSize:26, fontWeight:600, color:'#fff', marginBottom:6 }}>Welcome back</div>
              <div style={{ fontSize:13, color:'#444', marginBottom:22 }}>Sign in to your portfolio</div>

              <button onClick={handleGoogle} disabled={loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, width:'100%', padding:'15px', marginBottom:16, background:'rgba(255,255,255,.05)', border:'1.5px solid rgba(255,255,255,.1)', borderRadius:16, color:'#ddd', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                <GoogleSVG />
                <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
              </button>

              <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 12px' }}>
                <div style={{ flex:1, height:1, background:'#151518' }}/>
                <span style={{ fontSize:12, color:'#2a2a2a', whiteSpace:'nowrap' }}>or continue with</span>
                <div style={{ flex:1, height:1, background:'#151518' }}/>
              </div>

              {[{icon:'✉️', label:'Email & Password', to:'email'}, {icon:'📱', label:'Phone OTP', to:'phone'}].map(m => (
                <button key={m.to} onClick={() => setMode(m.to)} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'14px 16px', background:'rgba(255,255,255,.02)', border:'1.5px solid rgba(255,255,255,.06)', borderRadius:16, color:'#aaa', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'Plus Jakarta Sans, sans-serif', marginBottom:8 }}>
                  <span style={{ fontSize:20, width:28 }}>{m.icon}</span>
                  <span>{m.label}</span>
                  <span style={{ marginLeft:'auto', color:'#2a2a2a', fontSize:22 }}>›</span>
                </button>
              ))}

              <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'#1a1a1a' }}>🔒 DPDP compliant · Encrypted sessions</div>
            </div>
          )}

          {mode === 'email' && (
            <div style={{ animation:'fadeUp .3s ease' }}>
              <button onClick={() => setMode('home')} style={{ background:'none', border:'none', color:'#444', fontSize:13, cursor:'pointer', padding:'0 0 12px', fontFamily:'Plus Jakarta Sans, sans-serif' }}>← Back</button>
              {/* Login / Register toggle */}
              <div style={{ display:'flex', gap:0, marginBottom:16, background:'#111116', borderRadius:12, padding:3 }}>
                {['login','register'].map(m=>(
                  <button key={m} onClick={()=>setEmailMode(m)} style={{ flex:1, padding:'9px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Plus Jakarta Sans,sans-serif', background:emailMode===m?'#1e1e22':'transparent', color:emailMode===m?'#fff':'#444', transition:'all .2s' }}>
                    {m==='login'?'Sign In':'Create Account'}
                  </button>
                ))}
              </div>
              <div style={{ fontFamily:'"Clash Display", sans-serif', fontSize:24, fontWeight:600, color:'#fff', marginBottom:6 }}>{emailMode==='login'?'Welcome back':'Create account'}</div>
              <div style={{ fontSize:13, color:'#444', marginBottom:4 }}>{emailMode==='login'?'Sign in with email & password':'Register with email & password'}</div>
              {emailMode==='register' && <FloatInput label="Full name" type="text" value={name} onChange={e => setName(e.target.value)} />}
              <FloatInput label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <FloatInput label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key==='Enter' && handleEmail()} />
              <button onClick={handleEmail} disabled={loading} style={{ width:'100%', padding:'15px', marginTop:16, background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:16, color:'#000', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'"Clash Display", sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 8px 24px rgba(74,222,128,.3)' }}>
                {loading ? <Spin /> : emailMode==='login' ? 'Sign In →' : 'Create Account →'}
              </button>
            </div>
          )}

          {mode === 'phone' && (
            <div style={{ animation:'fadeUp .3s ease' }}>
              <button onClick={() => setMode('home')} style={{ background:'none', border:'none', color:'#444', fontSize:13, cursor:'pointer', padding:'0 0 12px', fontFamily:'Plus Jakarta Sans, sans-serif' }}>← Back</button>
              <div style={{ fontFamily:'"Clash Display", sans-serif', fontSize:26, fontWeight:600, color:'#fff', marginBottom:6 }}>Phone Sign In</div>
              <div style={{ fontSize:13, color:'#444', marginBottom:16 }}>We'll send a 6-digit OTP</div>
              <div style={{ display:'flex', gap:8 }}>
                <select style={{ width:86, flexShrink:0, padding:'12px 8px', background:'#0d0d0f', border:'1.5px solid #1a1a1f', borderRadius:14, color:'#ccc', fontSize:13, outline:'none' }}>
                  <option>+91 🇮🇳</option><option>+1 🇺🇸</option><option>+44 🇬🇧</option>
                </select>
                <input type="tel" placeholder="10-digit number" value={phone} maxLength={10}
                  onChange={e => setPhone(e.target.value.replace(/\D/,''))}
                  onKeyDown={e => e.key==='Enter' && handleSendOTP()}
                  style={{ flex:1, padding:'12px 16px', background:'#0d0d0f', border:'1.5px solid #1a1a1f', borderRadius:14, color:'#fff', fontSize:15, outline:'none', fontFamily:'Plus Jakarta Sans, sans-serif' }} />
              </div>
              <button onClick={handleSendOTP} disabled={loading} style={{ width:'100%', padding:'15px', marginTop:14, background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:16, color:'#000', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'"Clash Display", sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 8px 24px rgba(74,222,128,.3)' }}>
                {loading ? <Spin /> : 'Send OTP →'}
              </button>
            </div>
          )}

          {mode === 'otp' && (
            <div style={{ animation:'fadeUp .3s ease' }}>
              <button onClick={() => { setMode('phone'); setOtp(Array(6).fill('')); }} style={{ background:'none', border:'none', color:'#444', fontSize:13, cursor:'pointer', padding:'0 0 12px', fontFamily:'Plus Jakarta Sans, sans-serif' }}>← Back</button>
              <div style={{ fontFamily:'"Clash Display", sans-serif', fontSize:26, fontWeight:600, color:'#fff', marginBottom:6 }}>Enter OTP</div>
              <div style={{ fontSize:13, color:'#444' }}>Sent to +91 {phone.slice(0,2)}••••{phone.slice(-2)}</div>
              {demoOtp && (
                <div style={{ background:'rgba(74,222,128,.06)', border:'1px solid rgba(74,222,128,.15)', borderRadius:10, padding:'8px 14px', fontSize:13, color:'#555', margin:'12px 0', textAlign:'center' }}>
                  Demo OTP: <strong style={{ color:'#4ade80' }}>{demoOtp}</strong>
                </div>
              )}
              <div style={{ display:'flex', gap:8, justifyContent:'center', margin:'20px 0' }}>
                {otp.map((v, i) => (
                  <input key={i} ref={el => otpRefs.current[i]=el}
                    type="tel" maxLength={1} value={v}
                    onChange={e => onOtpChange(e.target.value, i)}
                    onKeyDown={e => onOtpKey(e, i)}
                    style={{ width:44, height:54, textAlign:'center', fontSize:22, fontWeight:700, background:'#0d0d0f', border:`1.5px solid ${v ? '#4ade80' : '#1a1a1f'}`, borderRadius:14, color:v?'#4ade80':'#fff', outline:'none', fontFamily:'monospace', transition:'all .15s ease', boxShadow: v ? '0 0 0 2px rgba(74,222,128,.15)' : 'none' }}
                  />
                ))}
              </div>
              <button onClick={handleVerify} disabled={loading} style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:16, color:'#000', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'"Clash Display", sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 8px 24px rgba(74,222,128,.3)' }}>
                {loading ? <Spin /> : 'Verify & Continue'}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'#1a1a1a' }}>Secured with JWT HS256 · FinTrack v2.0</div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes blob-drift { 0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.1)}66%{transform:translate(-20px,20px) scale(.95)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
