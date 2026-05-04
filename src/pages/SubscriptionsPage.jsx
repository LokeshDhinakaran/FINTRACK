// src/pages/SubscriptionsPage.jsx — Subscription tracker
import { useState, useEffect } from 'react';
import { subAPI } from '../services/api';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
const SUB_ICONS = ['📺','🎵','☁️','💪','📰','🎮','🎬','📚','🛡️','📧','💻','🔐','🏥','🚗','✈️'];
const PERIODS   = ['monthly','yearly','weekly'];
const CATS = ['Entertainment','Music','Cloud','Fitness','News','Gaming','Productivity','Security','Health','Other'];

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export default function SubscriptionsPage() {
  const [subs,    setSubs]    = useState([]);
  const [monthly, setMonthly] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form, setForm] = useState({ name:'', icon:'📺', amount:'', period:'monthly', next_due:'', category:'Entertainment' });

  useEffect(() => {
    subAPI.getAll().then(({ data }) => { setSubs(data.data); setMonthly(data.monthly_total||0); })
      .catch(()=>toast.error('Load failed')).finally(()=>setLoading(false));
  }, []);

  async function addSub() {
    if (!form.name || !form.amount || !form.next_due) { toast.error('Name, amount and due date required'); return; }
    try {
      const { data } = await subAPI.create(form);
      setSubs(p => [...p, data.data].sort((a,b)=>new Date(a.next_due)-new Date(b.next_due)));
      const addMonthly = form.period==='monthly'?Number(form.amount):form.period==='yearly'?Number(form.amount)/12:Number(form.amount)*4.33;
      setMonthly(m => m + addMonthly);
      setModal(false);
      toast.success('Subscription added ✓');
      setForm({ name:'', icon:'📺', amount:'', period:'monthly', next_due:'', category:'Entertainment' });
    } catch(e) { toast.error(e.response?.data?.error||'Failed'); }
  }

  async function toggleActive(sub) {
    try {
      const { data } = await subAPI.update(sub.id, { ...sub, is_active: !sub.is_active });
      setSubs(p => p.map(s => s.id===sub.id ? data.data : s));
    } catch { toast.error('Failed'); }
  }

  async function deleteSub(id) {
    await subAPI.remove(id);
    setSubs(p => p.filter(s => s.id!==id));
    toast.success('Removed');
  }

  const active   = subs.filter(s => s.is_active);
  const paused   = subs.filter(s => !s.is_active);
  const yearly   = monthly * 12;
  const upcoming = active.filter(s => daysUntil(s.next_due) <= 7).length;

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <div style={S.lbl}>RECURRING</div>
          <h1 style={S.h1}>Subscriptions</h1>
        </div>
        <button onClick={()=>setModal(true)} style={S.addBtn}>+</button>
      </div>

      {/* Summary */}
      {subs.length > 0 && (
        <div style={{background:'linear-gradient(145deg,#0d0a18,#130f20)',border:'1px solid rgba(167,139,250,.15)',borderRadius:24,padding:20,marginBottom:14,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(167,139,250,.1),transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{fontSize:10,color:'#3a2a5a',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600}}>MONTHLY SPEND</div>
            <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:32,fontWeight:700,color:'#fff',margin:'6px 0 4px'}}>{fmt(Math.round(monthly))}</div>
            <div style={{fontSize:13,color:'#a78bfa',marginBottom:14}}>{fmt(Math.round(yearly))} per year · {active.length} active</div>
            {upcoming > 0 && (
              <div style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)',borderRadius:10,padding:'8px 12px',fontSize:12,color:'#fbbf24',display:'inline-flex',alignItems:'center',gap:6}}>
                ⚡ {upcoming} subscription{upcoming>1?'s':''} due this week
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:40}}><div className="spinner"/></div>
      ) : subs.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:52,marginBottom:14}}>📱</div>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:20,color:'#fff',marginBottom:8}}>No subscriptions</div>
          <div style={{fontSize:13,color:'#444',marginBottom:22}}>Track Netflix, Spotify, and all your recurring payments</div>
          <button onClick={()=>setModal(true)} style={S.purpleBtn}>+ Add Subscription</button>
        </div>
      ) : (
        <>
          {active.length > 0 && <div style={S.sectionLabel}>ACTIVE · {active.length}</div>}
          {[...active].map((s, i) => <SubCard key={s.id} sub={s} i={i} onToggle={toggleActive} onDelete={deleteSub}/>)}
          {paused.length > 0 && <div style={{...S.sectionLabel,marginTop:16}}>PAUSED · {paused.length}</div>}
          {[...paused].map((s, i) => <SubCard key={s.id} sub={s} i={i} onToggle={toggleActive} onDelete={deleteSub} paused/>)}
        </>
      )}

      {/* Add Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <h2 style={{fontFamily:'"Clash Display",sans-serif',fontSize:18,color:'#fff'}}>Add Subscription</h2>
              <button onClick={()=>setModal(false)} style={{background:'#111116',border:'none',color:'#555',fontSize:16,cursor:'pointer',width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <input className="input" placeholder="Service name *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{marginBottom:10}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              <input className="input" type="number" placeholder="Amount (₹) *" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/>
              <select className="input" value={form.period} onChange={e=>setForm(p=>({...p,period:e.target.value}))}>
                {PERIODS.map(p=><option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <input className="input" type="date" placeholder="Next due date *" value={form.next_due} onChange={e=>setForm(p=>({...p,next_due:e.target.value}))} style={{marginBottom:10}}/>
            <select className="input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{marginBottom:12}}>
              {CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{fontSize:10,color:'#444',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Icon</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {SUB_ICONS.map(ic=>(
                <div key={ic} onClick={()=>setForm(p=>({...p,icon:ic}))}
                  style={{width:38,height:38,borderRadius:10,background:form.icon===ic?'rgba(167,139,250,.15)':'#111116',border:form.icon===ic?'1px solid rgba(167,139,250,.4)':'1px solid #1a1a1f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,cursor:'pointer'}}>
                  {ic}
                </div>
              ))}
            </div>
            <button onClick={addSub} style={{width:'100%',padding:15,background:'linear-gradient(135deg,#a78bfa,#8b5cf6)',border:'none',borderRadius:14,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'"Clash Display",sans-serif'}}>
              Add Subscription →
            </button>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function SubCard({ sub, i, onToggle, onDelete, paused }) {
  const days = daysUntil(sub.next_due);
  const dueColor = days <= 0 ? '#f87171' : days <= 3 ? '#f59e0b' : days <= 7 ? '#fbbf24' : '#444';
  const monthlyEq = sub.period==='monthly' ? sub.amount : sub.period==='yearly' ? (sub.amount/12).toFixed(0) : (sub.amount*4.33).toFixed(0);

  return (
    <div style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:18,padding:'14px',marginBottom:8,animationDelay:`${i*50}ms`,animation:'fadeUp .3s ease both',opacity:paused?.6:1}}>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div style={{width:44,height:44,borderRadius:13,background:paused?'#111116':'rgba(167,139,250,.12)',border:`1px solid ${paused?'#1a1a1f':'rgba(167,139,250,.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
          {sub.icon||'📱'}
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:13,fontWeight:600,color:paused?'#555':'#e0e0e0'}}>{sub.name}</div>
          <div style={{fontSize:10,color:'#333',marginTop:2}}>{sub.category} · {sub.period}</div>
          <div style={{fontSize:10,color:dueColor,marginTop:2}}>
            {days<0?'Overdue':days===0?'Due today':`Due in ${days}d`} · {new Date(sub.next_due).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:15,fontWeight:700,color:paused?'#555':'#a78bfa'}}>
            ₹{Number(sub.amount).toLocaleString('en-IN')}
          </div>
          <div style={{fontSize:10,color:'#333',marginTop:1}}>₹{Number(monthlyEq).toLocaleString('en-IN')}/mo</div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginTop:10}}>
        <button onClick={()=>onToggle(sub)}
          style={{flex:1,padding:'8px',background:paused?'rgba(74,222,128,.08)':'rgba(255,255,255,.03)',border:`1px solid ${paused?'rgba(74,222,128,.2)':'#1a1a1f'}`,borderRadius:10,color:paused?'#4ade80':'#555',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
          {paused?'▶ Resume':'⏸ Pause'}
        </button>
        <button onClick={()=>onDelete(sub.id)}
          style={{padding:'8px 12px',background:'rgba(248,113,113,.06)',border:'1px solid rgba(248,113,113,.15)',borderRadius:10,color:'#f87171',fontSize:13,cursor:'pointer'}}>
          🗑
        </button>
      </div>
    </div>
  );
}

const S = {
  page:{padding:'0 16px 100px',background:'#020204',minHeight:'100dvh',fontFamily:'Plus Jakarta Sans,sans-serif'},
  hdr:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 0 14px'},
  lbl:{fontSize:10,color:'#2a2a2a',letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600},
  h1:{fontFamily:'"Clash Display",sans-serif',fontSize:26,fontWeight:700,color:'#fff',marginTop:2},
  addBtn:{width:40,height:40,background:'linear-gradient(135deg,#a78bfa,#8b5cf6)',border:'none',borderRadius:14,color:'#fff',fontSize:22,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'},
  sectionLabel:{fontSize:9,color:'#2a2a2a',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,margin:'4px 0 8px'},
  purpleBtn:{padding:'12px 28px',background:'linear-gradient(135deg,#a78bfa,#8b5cf6)',border:'none',borderRadius:14,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'"Clash Display",sans-serif'},
};
