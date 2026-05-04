// src/pages/SettingsPage.jsx — Premium v2
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, logout, tokenStatus, secsLeft, fmtCountdown, refreshToken } = useAuth();
  const nav = useNavigate();
  const [toggles,setToggles] = useState({ darkMode:true, biometric:false, notifications:true, cloudSync:true });
  const toggle = k => setToggles(t=>({...t,[k]:!t[k]}));

  async function handleLogout() {
    if(!confirm('Sign out?')) return;
    await logout();
    nav('/login',{replace:true});
  }

  const statusColor = tokenStatus==='critical'?'#f87171':tokenStatus==='warning'?'#fbbf24':'#4ade80';
  const authMethod  = user?.auth_method||'phone';

  const PREFS = [
    {k:'notifications', icon:'🔔', label:'Push Notifications', sub:'Transaction alerts & reminders'},
    {k:'biometric',     icon:'🔐', label:'Biometric Lock',     sub:'Face ID / fingerprint unlock'},
    {k:'cloudSync',     icon:'☁️', label:'Cloud Sync',         sub:'Sync across devices'},
  ];

  const LINKS = [
    {icon:'📊', label:'JWT Inspector',     action:()=>nav('/jwt'),              badge:'DEV'},
    {icon:'🔒', label:'Privacy Policy',    action:()=>toast('Coming soon')},
    {icon:'❓', label:'Help & Support',    action:()=>toast('help@fintrack.app')},
    {icon:'⭐', label:'Rate FinTrack',     action:()=>toast('Thank you!')},
    {icon:'ℹ️', label:'About',             action:()=>toast('FinTrack v2.0'), badge:'v2.0'},
  ];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{padding:'20px 0 14px'}}>
        <div style={S.lbl}>ACCOUNT</div>
        <h1 style={S.h1}>Settings</h1>
      </div>

      {/* User Card */}
      <div style={S.userCard}>
        <div style={S.avatar}>{(user?.name||'U')[0].toUpperCase()}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:16,fontWeight:600,color:'#fff'}}>{user?.name||'User'}</div>
          <div style={{fontSize:12,color:'#444',marginTop:2}}>{user?.email||user?.phone||'—'}</div>
          <div style={{marginTop:6}}>
            <span style={{padding:'3px 8px',borderRadius:8,fontSize:10,fontWeight:600,background:'rgba(74,144,255,.12)',color:'#4a9eff',border:'1px solid rgba(74,144,255,.2)'}}>
              {authMethod==='google'?'🔵 Google':authMethod==='email'?'✉️ Email':'📱 Phone'}
            </span>
          </div>
        </div>
        <button style={S.editBtn}>Edit</button>
      </div>

      {/* JWT Session */}
      <div style={{...S.jwtBar,borderColor:statusColor+'30',background:statusColor+'08'}} onClick={refreshToken}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:statusColor,boxShadow:`0 0 6px ${statusColor}`,flexShrink:0}}/>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:statusColor}}>
              {tokenStatus==='critical'?'⚠ Token expiring!':tokenStatus==='warning'?'Session expiring soon':'✓ Session active'}
            </div>
            <div style={{fontSize:10,color:'#444',marginTop:1}}>
              JWT expires in {fmtCountdown(secsLeft)} · Tap to extend
            </div>
          </div>
        </div>
        {tokenStatus!=='valid'&&(
          <span style={{fontSize:12,color:'#4ade80',fontWeight:600}}>Refresh →</span>
        )}
      </div>

      {/* Preferences */}
      <div style={S.sectionLabel}>PREFERENCES</div>
      <div style={S.cardGroup}>
        {PREFS.map((p,i)=>(
          <div key={p.k} style={{...S.rowItem,borderBottom:i<PREFS.length-1?'1px solid #0a0a0c':'none'}}>
            <div style={S.rowIcon}>{p.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:'#e0e0e0'}}>{p.label}</div>
              <div style={{fontSize:11,color:'#333',marginTop:1}}>{p.sub}</div>
            </div>
            <Toggle on={toggles[p.k]} onToggle={()=>toggle(p.k)}/>
          </div>
        ))}
      </div>

      {/* Links */}
      <div style={S.sectionLabel}>MORE</div>
      <div style={S.cardGroup}>
        {LINKS.map((l,i)=>(
          <div key={l.label} onClick={l.action}
            style={{...S.rowItem,borderBottom:i<LINKS.length-1?'1px solid #0a0a0c':'none',cursor:'pointer'}}>
            <div style={S.rowIcon}>{l.icon}</div>
            <div style={{fontSize:13,fontWeight:500,color:'#e0e0e0',flex:1}}>{l.label}</div>
            {l.badge&&<span style={{padding:'2px 7px',borderRadius:6,fontSize:9,fontWeight:700,background:'rgba(74,144,255,.12)',color:'#4a9eff'}}>{l.badge}</span>}
            <span style={{color:'#2a2a2a',fontSize:18,marginLeft:6}}>›</span>
          </div>
        ))}
      </div>

      {/* App Info */}
      <div style={{textAlign:'center',padding:'16px 0',marginTop:4}}>
        <div style={{fontSize:10,color:'#1a1a1a',letterSpacing:'0.08em'}}>FINTRACK v2.0 · Built with ❤️ · JWT + React</div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        style={{width:'100%',padding:15,background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:16,color:'#f87171',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:20}}>
        Sign Out
      </button>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}

function Toggle({on,onToggle}) {
  return (
    <div onClick={onToggle} style={{width:42,height:24,borderRadius:12,background:on?'linear-gradient(135deg,#4ade80,#22c55e)':'#1a1a1f',cursor:'pointer',position:'relative',flexShrink:0,transition:'background .2s',border:on?'none':'1px solid #2a2a2a'}}>
      <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:on?21:3,transition:'left .2s ease',boxShadow:'0 1px 4px rgba(0,0,0,.4)'}}/>
    </div>
  );
}

const S = {
  page:{padding:'0 16px 100px',background:'#020204',minHeight:'100dvh',fontFamily:'Plus Jakarta Sans,sans-serif'},
  lbl:{fontSize:10,color:'#2a2a2a',letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600},
  h1:{fontFamily:'"Clash Display",sans-serif',fontSize:26,fontWeight:700,color:'#fff',marginTop:2},
  userCard:{background:'linear-gradient(145deg,#081510,#0d1a10)',border:'1px solid rgba(74,222,128,.14)',borderRadius:22,padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:14},
  avatar:{width:52,height:52,background:'linear-gradient(135deg,#4ade80,#22c55e)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#000',fontWeight:700,fontSize:20,boxShadow:'0 4px 14px rgba(74,222,128,.3)',flexShrink:0},
  editBtn:{padding:'8px 14px',background:'transparent',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,color:'#444',fontSize:12,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'},
  jwtBar:{borderRadius:16,padding:'12px 14px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',border:'1px solid',transition:'all .2s'},
  sectionLabel:{fontSize:9,color:'#2a2a2a',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,margin:'4px 0 8px'},
  cardGroup:{background:'#0d0d0f',border:'1px solid #111116',borderRadius:20,overflow:'hidden',marginBottom:14},
  rowItem:{display:'flex',alignItems:'center',gap:12,padding:'14px'},
  rowIcon:{width:34,height:34,borderRadius:10,background:'#111116',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0},
};
