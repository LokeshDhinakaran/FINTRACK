import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';

const PRIMARY_NAV = [
  { path:'/home',         label:'Home',    icon:HomeIcon },
  { path:'/transactions', label:'Txns',    icon:TxnIcon },
  { path:'/investments',  label:'Invest',  icon:InvestIcon, accent:'#4ade80' },
  { path:'/budgets',      label:'Budget',  icon:BudgetIcon },
  { path:'/settings',     label:'More',    icon:MoreIcon },
];

export default function AppShell() {
  const { tokenStatus, secsLeft, fmtCountdown, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [time, setTime] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      let h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12; if (h === 0) h = 12;
      setTime(`${h}:${m < 10 ? '0' : ''}${m} ${ap}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const isActive = p => loc.pathname === p || loc.pathname.startsWith(p + '/');

  function navTo(path) {
    setMoreOpen(false);
    nav(path);
  }

  return (
    <div className="phone-shell">
      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-bar-time">{time}</span>
        <div className="status-bar-icons">
          {tokenStatus !== 'valid' && (
            <span style={{ fontSize:10, color: tokenStatus==='critical'?'#f87171':'#f59e0b', marginRight:4 }}>
              🔑 {fmtCountdown(secsLeft)}
            </span>
          )}
          {user && (
            <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#4ade80,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#000' }}>
              {(user.name||user.email||'U')[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }} onClick={() => setMoreOpen(false)}>
        <Outlet />
      </div>

      {/* More drawer */}
      {moreOpen && (
        <div style={{ position:'fixed', bottom:64, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:390, zIndex:50, padding:'0 16px 8px' }}>
          <div style={{ background:'#0d0d0f', border:'1px solid #1a1a1f', borderRadius:20, padding:8, boxShadow:'0 -8px 40px rgba(0,0,0,.8)', animation:'fadeUp .2s ease' }}>
            {[
              { path:'/goals',         icon:'🎯', label:'Goals',         sub:'Savings targets' },
              { path:'/loans',         icon:'🏦', label:'Loans & EMI',   sub:'Debt tracker' },
              { path:'/subscriptions', icon:'📱', label:'Subscriptions', sub:'Recurring payments' },
              { path:'/settings',      icon:'⚙️', label:'Settings',      sub:'Account & preferences' },
              { path:'/jwt',           icon:'🔑', label:'JWT Inspector', sub:'Dev tools' },
            ].map(item => (
              <div key={item.path} onClick={() => navTo(item.path)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 10px', borderRadius:14, cursor:'pointer', background: isActive(item.path)?'rgba(74,222,128,.06)':'transparent', transition:'background .15s' }}>
                <div style={{ width:36, height:36, borderRadius:11, background:'#111116', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color: isActive(item.path)?'#4ade80':'#e0e0e0' }}>{item.label}</div>
                  <div style={{ fontSize:11, color:'#444', marginTop:1 }}>{item.sub}</div>
                </div>
                {isActive(item.path) && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#4ade80' }}/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav" onClick={e => e.stopPropagation()}>
        {[
          { path:'/home',         label:'Home',   Icon:HomeIcon },
          { path:'/transactions', label:'Txns',   Icon:TxnIcon },
          { path:'/investments',  label:'Invest', Icon:InvestIcon },
          { path:'/budgets',      label:'Budget', Icon:BudgetIcon },
        ].map(({ path, label, Icon }) => (
          <div key={path} className={`nav-item ${isActive(path)?'active':''}`} onClick={() => { setMoreOpen(false); nav(path); }}>
            <Icon />
            <span>{label}</span>
          </div>
        ))}
        {/* More button */}
        <div className={`nav-item ${moreOpen||['/goals','/loans','/subscriptions','/settings','/jwt'].some(p=>isActive(p))?'active':''}`}
          onClick={() => setMoreOpen(v => !v)}>
          <MoreIcon />
          <span>More</span>
        </div>
      </nav>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function HomeIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function TxnIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>; }
function InvestIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; }
function BudgetIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>; }
function MoreIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>; }
