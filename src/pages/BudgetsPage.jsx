// src/pages/BudgetsPage.jsx — Budget tracker v2
import { useState, useEffect } from 'react';
import { budgetAPI } from '../services/api';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
const COLORS  = ['#4ade80','#f59e0b','#4a9eff','#a78bfa','#f87171','#34d399','#fb923c','#e879f9','#22d3ee'];
const PERIODS = ['monthly','weekly','yearly'];
const PERIOD_LABEL = { monthly:'This month', weekly:'This week', yearly:'This year' };

function RingChart({ pct, color, size=52 }) {
  const r = 20, circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111116" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray .8s ease' }}/>
    </svg>
  );
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [form, setForm] = useState({
    name:'', amount:'', period:'monthly', color:'#4ade80',
    start_date: new Date().toISOString().split('T')[0],
  });

  const load = () => {
    budgetAPI.getAll()
      .then(({ data }) => setBudgets(data.data))
      .catch(() => toast.error('Failed to load budgets'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const totalBudget = budgets.reduce((s,b) => s + Number(b.amount), 0);
  const totalSpent  = budgets.reduce((s,b) => s + Number(b.spent||b.spent_amount||0), 0);
  const overallPct  = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const overCount   = budgets.filter(b => Number(b.spent||b.spent_amount||0) > Number(b.amount)).length;

  async function saveBudget() {
    if (!form.name || !form.amount) { toast.error('Name and amount required'); return; }
    try {
      if (editId) {
        const { data } = await budgetAPI.update(editId, form);
        setBudgets(p => p.map(b => b.id === editId ? { ...b, ...data.data } : b));
        toast.success('Budget updated ✓');
      } else {
        const { data } = await budgetAPI.create(form);
        setBudgets(p => [data.data, ...p]);
        toast.success('Budget created ✓');
      }
      closeModal();
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
  }

  async function deleteBudget(id) {
    try {
      await budgetAPI.remove(id);
      setBudgets(p => p.filter(b => b.id !== id));
      toast.success('Budget deleted');
    } catch { toast.error('Delete failed'); }
  }

  function openEdit(b) {
    setForm({ name:b.name, amount:String(b.amount), period:b.period, color:b.color||'#4ade80', start_date:b.start_date||new Date().toISOString().split('T')[0] });
    setEditId(b.id);
    setModal(true);
  }

  function closeModal() {
    setModal(false); setEditId(null);
    setForm({ name:'', amount:'', period:'monthly', color:'#4ade80', start_date:new Date().toISOString().split('T')[0] });
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.hdr}>
        <div>
          <div style={S.lbl}>PLANNING</div>
          <h1 style={S.h1}>Budgets</h1>
        </div>
        <button onClick={() => setModal(true)} style={S.addBtn}>+</button>
      </div>

      {/* Monthly Summary Hero */}
      {budgets.length > 0 && (
        <div style={S.hero}>
          <div style={S.heroBg}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:10, color:'#2a4a2a', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600 }}>MONTHLY BUDGET</div>
                <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:28, fontWeight:700, color:'#fff', margin:'4px 0' }}>
                  {fmt(totalSpent)}
                  <span style={{ fontSize:14, color:'#444', fontWeight:400 }}> / {fmt(totalBudget)}</span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:22, fontWeight:700, color: overallPct > 90 ? '#f87171' : '#4ade80' }}>
                  {overallPct.toFixed(0)}%
                </div>
                <div style={{ fontSize:10, color:'#444', marginTop:2 }}>used</div>
              </div>
            </div>
            <div style={{ height:8, background:'rgba(255,255,255,.06)', borderRadius:8, overflow:'hidden', marginBottom:8 }}>
              <div style={{ height:'100%', width:`${overallPct}%`, background: overallPct > 90 ? 'linear-gradient(90deg,#dc2626,#f87171)' : 'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius:8, transition:'width .8s ease' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
              <span style={{ color:'#3a5a3a' }}>{fmt(totalBudget - totalSpent)} remaining</span>
              {overCount > 0 && <span style={{ color:'#f87171' }}>⚠ {overCount} over budget</span>}
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spinner"/></div>
      ) : budgets.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:52, marginBottom:14 }}>📊</div>
          <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:20, color:'#fff', marginBottom:8 }}>No budgets yet</div>
          <div style={{ fontSize:13, color:'#444', marginBottom:22 }}>Create budgets to control your spending</div>
          <button onClick={() => setModal(true)} style={S.greenBtn}>+ Create Budget</button>
        </div>
      ) : (
        budgets.map((b, i) => {
          const spent = Number(b.spent || b.spent_amount || 0);
          const limit = Number(b.amount);
          const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const over  = spent > limit;
          const c     = b.color || '#4ade80';
          const remain = limit - spent;
          return (
            <div key={b.id} style={{ ...S.card, animationDelay:`${i*60}ms`, borderColor: over ? 'rgba(248,113,113,.25)' : '#111116' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <RingChart pct={pct} color={over ? '#f87171' : c}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:14, fontWeight:600, color:'#e0e0e0' }}>{b.name}</div>
                    <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:15, fontWeight:700, color: over ? '#f87171' : c }}>
                      {fmt(spent)}
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:3 }}>
                    <div style={{ fontSize:10, color:'#444', textTransform:'capitalize' }}>{PERIOD_LABEL[b.period]||b.period}</div>
                    <div style={{ fontSize:10, color:'#444' }}>of {fmt(limit)}</div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height:4, background:'#111116', borderRadius:4, overflow:'hidden', marginTop:8 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: over ? 'linear-gradient(90deg,#dc2626,#f87171)' : `linear-gradient(90deg,${c}88,${c})`, borderRadius:4, transition:'width .8s ease' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                    <span style={{ fontSize:10, color: over ? '#f87171' : '#444' }}>
                      {over ? `⚠ Over by ${fmt(spent - limit)}` : `${fmt(remain)} left`}
                    </span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => openEdit(b)} style={S.editBtn}>✎</button>
                      <button onClick={() => deleteBudget(b.id)} style={S.delBtn}>×</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2 style={{ fontFamily:'"Clash Display",sans-serif', color:'#fff' }}>{editId ? 'Edit Budget' : 'New Budget'}</h2>
              <button onClick={closeModal} style={{ background:'#111116', border:'none', color:'#555', fontSize:16, cursor:'pointer', width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            <input className="input" placeholder="Budget name *" value={form.name}
              onChange={e => setForm(p => ({ ...p, name:e.target.value }))} style={{ marginBottom:10 }}/>
            <input className="input" type="number" placeholder="Limit amount (₹) *" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount:e.target.value }))} style={{ marginBottom:10 }}/>
            <select className="input" value={form.period}
              onChange={e => setForm(p => ({ ...p, period:e.target.value }))} style={{ marginBottom:12 }}>
              {PERIODS.map(p => <option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}
            </select>

            {/* Color picker */}
            <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Color</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm(p => ({ ...p, color:c }))}
                  style={{ width:30, height:30, borderRadius:'50%', background:c, cursor:'pointer', border: form.color===c ? '2.5px solid #fff' : '2.5px solid transparent', boxShadow: form.color===c ? `0 0 0 2px ${c}` : 'none', transition:'all .15s' }}/>
              ))}
            </div>

            <button onClick={saveBudget} className="btn-primary">
              {editId ? 'Save Changes →' : 'Create Budget →'}
            </button>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

const S = {
  page:  { padding:'0 16px 100px', background:'#020204', minHeight:'100dvh', fontFamily:'Plus Jakarta Sans,sans-serif' },
  hdr:   { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 0 14px' },
  lbl:   { fontSize:10, color:'#2a2a2a', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 },
  h1:    { fontFamily:'"Clash Display",sans-serif', fontSize:26, fontWeight:700, color:'#fff', marginTop:2 },
  addBtn:{ width:40, height:40, background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:14, color:'#000', fontSize:22, cursor:'pointer', fontWeight:700, boxShadow:'0 6px 20px rgba(74,222,128,.4)', display:'flex', alignItems:'center', justifyContent:'center' },
  hero:  { background:'linear-gradient(145deg,#081510,#0d1a10)', border:'1px solid rgba(74,222,128,.14)', borderRadius:24, padding:20, marginBottom:14, position:'relative', overflow:'hidden' },
  heroBg:{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 20%,rgba(74,222,128,.07),transparent 60%)', pointerEvents:'none' },
  card:  { background:'#0d0d0f', border:'1.5px solid', borderRadius:20, padding:16, marginBottom:10, animation:'fadeUp .3s ease both', transition:'border-color .2s' },
  greenBtn:{ padding:'12px 28px', background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:14, color:'#000', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'"Clash Display",sans-serif' },
  editBtn:{ width:26, height:26, background:'rgba(74,144,255,.08)', border:'1px solid rgba(74,144,255,.15)', borderRadius:8, color:'#4a9eff', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' },
  delBtn: { width:26, height:26, background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.15)', borderRadius:8, color:'#f87171', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' },
};
