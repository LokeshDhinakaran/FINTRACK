// src/pages/GoalsPage.jsx — Full Goals tracker
import { useState, useEffect } from 'react';
import { goalAPI } from '../services/api';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
const EMOJIS = ['🎯','🏠','✈️','🚗','💍','🎓','💻','🏋️','🌴','💰','🏦','📱','🎸','🏖️','🐶','👶'];
const COLORS  = ['#4ade80','#f59e0b','#4a9eff','#a78bfa','#f87171','#34d399','#fb923c','#e879f9'];

export default function GoalsPage() {
  const [goals,   setGoals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [depositModal, setDepositModal] = useState(null);
  const [depositAmt, setDepositAmt] = useState('');
  const [form,    setForm]    = useState({ name:'', emoji:'🎯', target_amount:'', deadline:'', note:'' });

  useEffect(() => {
    goalAPI.getAll().then(({ data }) => setGoals(data.data)).catch(() => toast.error('Load failed')).finally(() => setLoading(false));
  }, []);

  const totalTarget  = goals.reduce((s,g)=>s+Number(g.target_amount),0);
  const totalSaved   = goals.reduce((s,g)=>s+Number(g.saved_amount||g.current_amount||0),0);
  const achieved     = goals.filter(g=>g.is_achieved).length;

  async function addGoal() {
    if (!form.name || !form.target_amount) { toast.error('Name and target required'); return; }
    try {
      const { data } = await goalAPI.create(form);
      setGoals(p => [data.data, ...p]);
      setModal(false);
      toast.success('Goal created ✓');
      setForm({ name:'', emoji:'🎯', target_amount:'', deadline:'', note:'' });
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
  }

  async function deposit() {
    const amt = Number(depositAmt);
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return; }
    const g = depositModal;
    const newSaved = Math.min(Number(g.saved_amount||g.current_amount||0) + amt, Number(g.target_amount));
    const achieved = newSaved >= Number(g.target_amount);
    try {
      const { data } = await goalAPI.update(g.id, {
        ...g, saved_amount: newSaved, current_amount: newSaved, is_achieved: achieved,
      });
      setGoals(p => p.map(x => x.id === g.id ? data.data : x));
      setDepositModal(null); setDepositAmt('');
      if (achieved) toast.success('🎉 Goal achieved!');
      else toast.success(`₹${amt.toLocaleString('en-IN')} added`);
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
  }

  async function deleteGoal(id) {
    try {
      await goalAPI.remove(id);
      setGoals(p => p.filter(g => g.id !== id));
      toast.success('Goal deleted');
    } catch { toast.error('Failed'); }
  }

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <div style={S.lbl}>SAVINGS</div>
          <h1 style={S.h1}>Goals</h1>
        </div>
        <button onClick={() => setModal(true)} style={S.addBtn}>+</button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div style={S.hero}>
          <div style={S.heroBg}/>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{fontSize:10,color:'#2a4a2a',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600}}>TOTAL PROGRESS</div>
            <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:30,fontWeight:700,color:'#fff',margin:'6px 0 4px'}}>{fmt(totalSaved)}</div>
            <div style={{fontSize:13,color:'#4ade80',marginBottom:14}}>of {fmt(totalTarget)} target across {goals.length} goals</div>
            <div style={{height:8,background:'rgba(255,255,255,.06)',borderRadius:8,overflow:'hidden',marginBottom:10}}>
              <div style={{height:'100%',width:`${totalTarget>0?Math.min((totalSaved/totalTarget)*100,100):0}%`,background:'linear-gradient(90deg,#22c55e,#4ade80)',borderRadius:8,transition:'width .8s ease'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
              <span style={{color:'#3a5a3a'}}>{totalTarget>0?((totalSaved/totalTarget)*100).toFixed(1):0}% saved</span>
              <span style={{color:'#4ade80'}}>🏆 {achieved} achieved</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:40}}><div className="spinner"/></div>
      ) : goals.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:52,marginBottom:14}}>🎯</div>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:20,color:'#fff',marginBottom:8}}>No goals yet</div>
          <div style={{fontSize:13,color:'#444',marginBottom:22}}>Set a savings goal and watch it grow</div>
          <button onClick={()=>setModal(true)} style={S.greenBtn}>+ Create First Goal</button>
        </div>
      ) : (
        goals.map((g, i) => {
          const saved = Number(g.saved_amount || g.current_amount || 0);
          const target = Number(g.target_amount);
          const pct  = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
          const remaining = target - saved;
          const days = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
          const achieved = g.is_achieved || pct >= 100;
          return (
            <div key={g.id} style={{...S.card, animationDelay:`${i*60}ms`, borderColor: achieved ? 'rgba(74,222,128,.3)' : '#111116'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                <div style={{width:50,height:50,borderRadius:16,background:achieved?'rgba(74,222,128,.15)':'rgba(74,222,128,.08)',border:`1px solid ${achieved?'rgba(74,222,128,.4)':'rgba(74,222,128,.15)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
                  {g.emoji || '🎯'}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:15,fontWeight:600,color:'#e0e0e0'}}>{g.name}</div>
                    {achieved && <span style={{fontSize:10,padding:'2px 6px',background:'rgba(74,222,128,.15)',color:'#4ade80',borderRadius:6,fontWeight:700}}>✓ Done</span>}
                  </div>
                  {days !== null && (
                    <div style={{fontSize:11,color:days<0?'#f87171':days<30?'#f59e0b':'#444',marginTop:2}}>
                      {days<0?'Deadline passed':days===0?'Due today':`${days}d left`} · {new Date(g.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  )}
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:20,fontWeight:700,color:achieved?'#4ade80':'#4a9eff'}}>{pct.toFixed(0)}%</div>
                </div>
              </div>

              {/* Progress */}
              <div style={{height:8,background:'#111116',borderRadius:8,overflow:'hidden',marginBottom:10}}>
                <div style={{height:'100%',width:`${pct}%`,background:achieved?'linear-gradient(90deg,#16a34a,#4ade80)':'linear-gradient(90deg,#3b82f6,#4a9eff)',borderRadius:8,transition:'width .8s ease'}}/>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:12}}>
                <span style={{color:'#444'}}>Saved: <strong style={{color:'#e0e0e0'}}>{fmt(saved)}</strong></span>
                <span style={{color:'#444'}}>Target: <strong style={{color:'#e0e0e0'}}>{fmt(target)}</strong></span>
              </div>

              {!achieved && remaining > 0 && (
                <div style={{fontSize:11,color:'#444',marginBottom:12,textAlign:'center'}}>
                  {fmt(remaining)} more to go
                </div>
              )}

              {g.note && <div style={{fontSize:11,color:'#444',background:'#111116',borderRadius:10,padding:'8px 12px',marginBottom:12}}>{g.note}</div>}

              {/* Actions */}
              <div style={{display:'flex',gap:8}}>
                {!achieved && (
                  <button onClick={() => { setDepositModal(g); setDepositAmt(''); }}
                    style={{flex:1,padding:'10px',background:'linear-gradient(135deg,#4ade80,#22c55e)',border:'none',borderRadius:12,color:'#000',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'"Clash Display",sans-serif'}}>
                    + Add Money
                  </button>
                )}
                <button onClick={() => deleteGoal(g.id)}
                  style={{padding:'10px 14px',background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:12,color:'#f87171',fontSize:13,cursor:'pointer'}}>
                  🗑
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Create Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <MHdr title="New Goal" onClose={()=>setModal(false)}/>
            <input className="input" placeholder="Goal name *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{marginBottom:10}}/>
            <input className="input" type="number" placeholder="Target amount (₹) *" value={form.target_amount} onChange={e=>setForm(p=>({...p,target_amount:e.target.value}))} style={{marginBottom:10}}/>
            <input className="input" type="date" placeholder="Deadline (optional)" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} style={{marginBottom:10}}/>
            <input className="input" placeholder="Note (optional)" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} style={{marginBottom:12}}/>
            <div style={{fontSize:10,color:'#444',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Choose Emoji</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {EMOJIS.map(e => (
                <div key={e} onClick={()=>setForm(p=>({...p,emoji:e}))}
                  style={{width:38,height:38,borderRadius:10,background:form.emoji===e?'rgba(74,222,128,.15)':'#111116',border:form.emoji===e?'1px solid rgba(74,222,128,.4)':'1px solid #1a1a1f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,cursor:'pointer',transition:'all .15s'}}>
                  {e}
                </div>
              ))}
            </div>
            <button onClick={addGoal} className="btn-primary">Create Goal →</button>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDepositModal(null)}>
          <div className="modal">
            <MHdr title={`Add to "${depositModal.name}"`} onClose={()=>setDepositModal(null)}/>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:40}}>{depositModal.emoji||'🎯'}</div>
              <div style={{fontSize:12,color:'#444',marginTop:4}}>
                {fmt(depositModal.saved_amount||depositModal.current_amount||0)} saved of {fmt(depositModal.target_amount)}
              </div>
            </div>
            <input className="input" type="number" placeholder="Amount to deposit (₹)" value={depositAmt} autoFocus
              onChange={e=>setDepositAmt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&deposit()} style={{marginBottom:16}}/>
            {/* Quick amounts */}
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {[500,1000,5000,10000].map(a=>(
                <button key={a} onClick={()=>setDepositAmt(String(a))}
                  style={{flex:1,padding:'8px 4px',background:depositAmt==a?'rgba(74,222,128,.15)':'#111116',border:depositAmt==a?'1px solid rgba(74,222,128,.3)':'1px solid #1a1a1f',borderRadius:10,color:depositAmt==a?'#4ade80':'#555',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  ₹{a>=1000?`${a/1000}K`:a}
                </button>
              ))}
            </div>
            <button onClick={deposit} className="btn-primary">Add Money →</button>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function MHdr({title,onClose}) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
      <h2 style={{fontFamily:'"Clash Display",sans-serif',fontSize:18,color:'#fff'}}>{title}</h2>
      <button onClick={onClose} style={{background:'#111116',border:'none',color:'#555',fontSize:16,cursor:'pointer',width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
    </div>
  );
}

const S = {
  page:{padding:'0 16px 100px',background:'#020204',minHeight:'100dvh',fontFamily:'Plus Jakarta Sans,sans-serif'},
  hdr:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 0 14px'},
  lbl:{fontSize:10,color:'#2a2a2a',letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600},
  h1:{fontFamily:'"Clash Display",sans-serif',fontSize:26,fontWeight:700,color:'#fff',marginTop:2},
  addBtn:{width:40,height:40,background:'linear-gradient(135deg,#4ade80,#22c55e)',border:'none',borderRadius:14,color:'#000',fontSize:22,cursor:'pointer',fontWeight:700,boxShadow:'0 6px 20px rgba(74,222,128,.4)',display:'flex',alignItems:'center',justifyContent:'center'},
  hero:{background:'linear-gradient(145deg,#081510,#0d1a10)',border:'1px solid rgba(74,222,128,.14)',borderRadius:24,padding:20,marginBottom:14,position:'relative',overflow:'hidden'},
  heroBg:{position:'absolute',inset:0,background:'radial-gradient(ellipse at 80% 20%,rgba(74,222,128,.06),transparent 60%)',pointerEvents:'none'},
  card:{background:'#0d0d0f',border:'1.5px solid #111116',borderRadius:20,padding:16,marginBottom:10,animation:'fadeUp .3s ease both',transition:'border-color .2s'},
  greenBtn:{padding:'12px 28px',background:'linear-gradient(135deg,#4ade80,#22c55e)',border:'none',borderRadius:14,color:'#000',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'"Clash Display",sans-serif'},
};
