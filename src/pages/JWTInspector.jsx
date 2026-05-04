// src/pages/JWTInspector.jsx — Premium v2
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function JWTInspector() {
  const { token, tokenPayload, tokenStatus, secsLeft, fmtCountdown, refreshToken } = useAuth();

  if (!token) return (
    <div style={S.page}>
      <div style={{textAlign:'center',paddingTop:80}}>
        <div style={{fontSize:48,marginBottom:12}}>🔑</div>
        <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:18,color:'#fff',marginBottom:8}}>No active token</div>
        <div style={{fontSize:13,color:'#444'}}>Sign in to inspect your JWT</div>
      </div>
    </div>
  );

  const parts = token.split('.');
  const statusColor = tokenStatus==='critical'?'#f87171':tokenStatus==='warning'?'#fbbf24':'#4ade80';

  async function handleCopy() {
    try { await navigator.clipboard.writeText(token); toast.success('Token copied!'); }
    catch { toast.error('Copy failed'); }
  }

  return (
    <div style={S.page}>
      <div style={{padding:'20px 0 14px'}}>
        <div style={S.lbl}>SECURITY</div>
        <h1 style={S.h1}>JWT Inspector</h1>
      </div>

      {/* Status */}
      <div onClick={refreshToken} style={{background:statusColor+'08',border:`1px solid ${statusColor}25`,borderRadius:16,padding:'12px 14px',marginBottom:14,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:statusColor,boxShadow:`0 0 6px ${statusColor}`}}/>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:statusColor}}>{tokenStatus==='critical'?'⚠ Token expiring!':tokenStatus==='warning'?'Session expiring soon':'✓ JWT Token active'}</div>
            <div style={{fontSize:10,color:'#444',marginTop:1}}>Expires in {fmtCountdown(secsLeft)}</div>
          </div>
        </div>
        {tokenStatus!=='valid'&&<span style={{fontSize:12,color:'#4ade80',fontWeight:600}}>Refresh →</span>}
      </div>

      {/* Full token */}
      <div style={S.sectionLabel}>FULL TOKEN</div>
      <div style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:14,padding:'12px 14px',marginBottom:8,fontFamily:'monospace',fontSize:10,wordBreak:'break-all',lineHeight:1.8}}>
        <span style={{color:'#4a9eff'}}>{parts[0]}</span>
        <span style={{color:'#2a2a2a'}}>.</span>
        <span style={{color:'#f59e0b'}}>{parts[1]}</span>
        <span style={{color:'#2a2a2a'}}>.</span>
        <span style={{color:'#4ade80'}}>{parts[2]}</span>
      </div>
      <button onClick={handleCopy} style={{width:'100%',padding:11,background:'#0d0d0f',border:'1px solid #111116',borderRadius:12,color:'#444',cursor:'pointer',fontSize:12,marginBottom:16,fontFamily:'Plus Jakarta Sans,sans-serif'}}>
        📋 Copy token to clipboard
      </button>

      {/* Header */}
      <div style={S.sectionLabel}>HEADER · Algorithm + Type</div>
      <div style={{background:'rgba(74,144,255,.05)',border:'1px solid rgba(74,144,255,.15)',borderRadius:12,padding:'11px 14px',fontFamily:'monospace',fontSize:11,color:'#4a9eff',marginBottom:10,lineHeight:1.9}}>
        {`{\n  "alg": "HS256",\n  "typ": "JWT"\n}`}
      </div>

      {/* Payload claims */}
      <div style={S.sectionLabel}>PAYLOAD · Decoded Claims</div>
      <div style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:16,overflow:'hidden',marginBottom:10}}>
        {tokenPayload && Object.entries(tokenPayload).map(([k,v],i,arr)=>{
          const isTime = k==='exp'||k==='iat'||k==='nbf';
          const isCustom = ['sub','name','email','phone','role','method','scope'].includes(k);
          const tagColor = k==='exp'?'#f59e0b':isCustom?'#4a9eff':'#4ade80';
          const tagBg    = k==='exp'?'rgba(245,158,11,.1)':isCustom?'rgba(74,144,255,.1)':'rgba(74,222,128,.1)';
          return (
            <div key={k} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 14px',borderBottom:i<arr.length-1?'1px solid #0a0a0c':'none'}}>
              <span style={{fontSize:9,padding:'3px 7px',borderRadius:6,fontWeight:700,flexShrink:0,marginTop:1,background:tagBg,color:tagColor,letterSpacing:'0.04em'}}>{k}</span>
              <span style={{fontSize:11,color:'#888',fontFamily:'monospace',wordBreak:'break-all',lineHeight:1.5}}>
                {isTime
                  ? `${new Date(v*1000).toLocaleString('en-IN')}${k==='exp'?` (in ${fmtCountdown(secsLeft)})`:''}` 
                  : String(v)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Signature */}
      <div style={S.sectionLabel}>SIGNATURE · HMAC-SHA256</div>
      <div style={{background:'rgba(245,158,11,.05)',border:'1px solid rgba(245,158,11,.15)',borderRadius:12,padding:'11px 14px',fontFamily:'monospace',fontSize:10,color:'#f59e0b',wordBreak:'break-all',lineHeight:1.8,marginBottom:16}}>
        {parts[2]}
      </div>

      {/* Legend */}
      <div style={S.sectionLabel}>CLAIMS LEGEND</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
        {[['sub','Subject'],['name','Username'],['exp','Expiry ⚠'],['iat','Issued at'],['role','Role'],['jti','JWT ID']].map(([k,desc])=>{
          const tagColor=k==='exp'?'#f59e0b':['sub','name','role'].includes(k)?'#4a9eff':'#4ade80';
          return (
            <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{fontSize:9,padding:'2px 6px',borderRadius:5,fontWeight:700,background:tagColor+'12',color:tagColor}}>{k}</span>
              <span style={{fontSize:10,color:'#333'}}>{desc}</span>
            </div>
          );
        })}
      </div>

      {/* How JWT works */}
      <div style={S.sectionLabel}>HOW JWT WORKS IN FINTRACK</div>
      <div style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:20,padding:'4px 0',marginBottom:20}}>
        {[
          ['1','Login → Token issued','Server validates OTP/Google → signs JWT HS256'],
          ['2','Auto-attached to requests','Authorization: Bearer header on every API call'],
          ['3','Signature verified server-side','HMAC-SHA256 checked using secret key'],
          ['4','Axios auto-refresh on 401','Silently renews token via HTTP-only cookie'],
          ['5','exp claim enforced','Expired sessions auto-redirect to login'],
        ].map(([n,t,d],i,arr)=>(
          <div key={n} style={{display:'flex',gap:12,padding:'13px 14px',borderBottom:i<arr.length-1?'1px solid #0a0a0c':'none'}}>
            <div style={{width:22,height:22,borderRadius:'50%',border:'1px solid rgba(74,222,128,.3)',background:'rgba(74,222,128,.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#4ade80',fontWeight:700,flexShrink:0,marginTop:1}}>{n}</div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#e0e0e0'}}>{t}</div>
              <div style={{fontSize:11,color:'#444',marginTop:2}}>{d}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}

const S = {
  page:{padding:'0 16px 100px',background:'#020204',minHeight:'100dvh',fontFamily:'Plus Jakarta Sans,sans-serif'},
  lbl:{fontSize:10,color:'#2a2a2a',letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600},
  h1:{fontFamily:'"Clash Display",sans-serif',fontSize:26,fontWeight:700,color:'#fff',marginTop:2},
  sectionLabel:{fontSize:9,color:'#2a2a2a',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,margin:'4px 0 8px'},
};
