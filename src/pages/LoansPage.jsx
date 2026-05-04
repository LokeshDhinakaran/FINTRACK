// src/pages/LoansPage.jsx — EMI & Loan Tracker
import { useState, useEffect } from 'react';
import { loanAPI } from '../services/api';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
const TYPES = ['home','car','personal','education','other'];
const TYPE_INFO = {
  home:      { icon:'🏠', color:'#4a9eff' },
  car:       { icon:'🚗', color:'#f59e0b' },
  personal:  { icon:'💳', color:'#a78bfa' },
  education: { icon:'🎓', color:'#34d399' },
  other:     { icon:'💰', color:'#888' },
};

// EMI calculator: P*r*(1+r)^n / ((1+r)^n - 1)
function calcEMI(principal, annualRate, months) {
  if (!annualRate) return principal / months;
  const r = annualRate / 1200;
  return (principal * r * Math.pow(1+r, months)) / (Math.pow(1+r, months) - 1);
}

export default function LoansPage() {
  const [loans,   setLoans]   = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [calcMode, setCalcMode] = useState(false);
  const [form, setForm] = useState({ name:'', type:'personal', principal:'', interest_rate:'', tenure_months:'', emi_date:'1', lender:'' });
  const [calc, setCalc] = useState({ principal:'', rate:'', months:'' });

  useEffect(() => {
    loanAPI.getAll().then(({ data }) => { setLoans(data.data); setSummary(data.summary||{}); })
      .catch(() => toast.error('Load failed')).finally(() => setLoading(false));
  }, []);

  const emiPreview = form.principal && form.interest_rate && form.tenure_months
    ? calcEMI(Number(form.principal), Number(form.interest_rate), Number(form.tenure_months))
    : 0;

  const calcResult = calc.principal && calc.rate && calc.months
    ? { emi: calcEMI(Number(calc.principal), Number(calc.rate), Number(calc.months)),
        total: calcEMI(Number(calc.principal), Number(calc.rate), Number(calc.months)) * Number(calc.months),
        interest: calcEMI(Number(calc.principal), Number(calc.rate), Number(calc.months)) * Number(calc.months) - Number(calc.principal) }
    : null;

  async function addLoan() {
    const { name, type, principal, interest_rate, tenure_months, emi_date, lender } = form;
    if (!name || !principal || !tenure_months) { toast.error('Name, principal and tenure required'); return; }
    try {
      const emi = calcEMI(Number(principal), Number(interest_rate||0), Number(tenure_months));
      const { data } = await loanAPI.create({ name, type, principal: Number(principal), remaining: Number(principal), emi_amount: Math.round(emi), interest_rate: Number(interest_rate||0), tenure_months: Number(tenure_months), emi_date: Number(emi_date||1), lender });
      setLoans(p => [data.data, ...p]);
      setSummary(s => ({ ...s, total_remaining: (s.total_remaining||0)+Number(principal), total_emi: (s.total_emi||0)+Math.round(emi) }));
      setModal(false);
      toast.success('Loan added ✓');
      setForm({ name:'', type:'personal', principal:'', interest_rate:'', tenure_months:'', emi_date:'1', lender:'' });
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
  }

  async function payEMI(loan) {
    const newPaid = loan.paid_months + 1;
    const newRemaining = Math.max(0, Number(loan.remaining) - Number(loan.emi_amount));
    const done = newPaid >= loan.tenure_months;
    try {
      const { data } = await loanAPI.update(loan.id, { ...loan, remaining: newRemaining, paid_months: newPaid, is_active: !done });
      setLoans(p => p.map(l => l.id === loan.id ? data.data : l));
      setPayModal(null);
      if (done) toast.success('🎉 Loan fully paid!');
      else toast.success(`EMI paid! ${loan.tenure_months - newPaid} left`);
    } catch { toast.error('Failed'); }
  }

  async function deleteLoan(id) {
    await loanAPI.remove(id);
    setLoans(p => p.filter(l => l.id !== id));
    toast.success('Deleted');
  }

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <div style={S.lbl}>LIABILITIES</div>
          <h1 style={S.h1}>Loans & EMI</h1>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setCalcMode(v=>!v)} style={{...S.ghostBtn,color:calcMode?'#4ade80':'#555',borderColor:calcMode?'rgba(74,222,128,.3)':'#1a1a1f'}}>🧮</button>
          <button onClick={()=>setModal(true)} style={S.addBtn}>+</button>
        </div>
      </div>

      {/* EMI Calculator */}
      {calcMode && (
        <div style={{background:'#0d0d0f',border:'1px solid rgba(74,144,255,.2)',borderRadius:20,padding:16,marginBottom:14,animation:'fadeUp .25s ease'}}>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:14,fontWeight:600,color:'#4a9eff',marginBottom:12}}>🧮 EMI Calculator</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
            {[{ph:'Principal (₹)',k:'principal'},{ph:'Rate (%/yr)',k:'rate'},{ph:'Months',k:'months'}].map(f=>(
              <input key={f.k} className="input" type="number" placeholder={f.ph} value={calc[f.k]} onChange={e=>setCalc(p=>({...p,[f.k]:e.target.value}))} style={{padding:'10px 10px',fontSize:12}}/>
            ))}
          </div>
          {calcResult && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[['EMI/mo',calcResult.emi,'#4ade80'],['Total',calcResult.total,'#4a9eff'],['Interest',calcResult.interest,'#f87171']].map(([l,v,c])=>(
                <div key={l} style={{background:'#111116',borderRadius:12,padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:'#444',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:c}}>{fmt(Math.round(v))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {loans.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
          {[['TOTAL DEBT',summary.total_remaining,'#f87171'],['MONTHLY EMI',summary.total_emi,'#f59e0b']].map(([l,v,c])=>(
            <div key={l} style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:18,padding:'14px'}}>
              <div style={{fontSize:9,color:'#333',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{l}</div>
              <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:22,fontWeight:700,color:c}}>{fmt(v)}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:40}}><div className="spinner"/></div>
      ) : loans.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:52,marginBottom:14}}>🏦</div>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:20,color:'#fff',marginBottom:8}}>No loans tracked</div>
          <div style={{fontSize:13,color:'#444',marginBottom:22}}>Add your loans to track EMI and remaining balance</div>
          <button onClick={()=>setModal(true)} style={S.greenBtn}>+ Add Loan</button>
        </div>
      ) : loans.map((loan, i) => {
        const ti = TYPE_INFO[loan.type] || TYPE_INFO.other;
        const paidPct = loan.tenure_months > 0 ? (loan.paid_months / loan.tenure_months) * 100 : 0;
        const left = loan.tenure_months - loan.paid_months;
        const done = !loan.is_active || paidPct >= 100;
        return (
          <div key={loan.id} style={{...S.card,animationDelay:`${i*60}ms`,borderColor:done?'rgba(74,222,128,.2)':'#111116',opacity:done?.85:1}}>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:14}}>
              <div style={{width:46,height:46,borderRadius:14,background:ti.color+'15',border:`1px solid ${ti.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{ti.icon}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:14,fontWeight:600,color:'#e0e0e0'}}>{loan.name}</div>
                  {done && <span style={{fontSize:9,padding:'2px 6px',background:'rgba(74,222,128,.12)',color:'#4ade80',borderRadius:5,fontWeight:700}}>PAID</span>}
                </div>
                <div style={{fontSize:11,color:'#444',marginTop:2}}>{loan.lender||'—'} · {loan.type} · {loan.interest_rate}% p.a.</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:16,fontWeight:700,color:'#f87171'}}>{fmt(loan.remaining)}</div>
                <div style={{fontSize:10,color:'#444',marginTop:2}}>remaining</div>
              </div>
            </div>

            {/* Progress */}
            <div style={{height:6,background:'#111116',borderRadius:6,overflow:'hidden',marginBottom:8}}>
              <div style={{height:'100%',width:`${paidPct}%`,background:done?'linear-gradient(90deg,#16a34a,#4ade80)':'linear-gradient(90deg,#ea580c,#fb923c)',borderRadius:6,transition:'width .8s ease'}}/>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:12}}>
              <span style={{color:'#444'}}>{loan.paid_months}/{loan.tenure_months} EMIs paid</span>
              <span style={{color:loan.interest_rate>10?'#f87171':'#4ade80'}}>EMI: <strong>{fmt(loan.emi_amount)}/mo</strong></span>
            </div>

            {!done && left > 0 && (
              <div style={{fontSize:11,color:'#444',background:'#111116',borderRadius:10,padding:'8px 12px',marginBottom:12,textAlign:'center'}}>
                {left} EMIs left · {fmt(Math.round(Number(loan.remaining)))} total remaining
              </div>
            )}

            <div style={{display:'flex',gap:8}}>
              {!done && (
                <button onClick={()=>setPayModal(loan)}
                  style={{flex:1,padding:'10px',background:'linear-gradient(135deg,#fb923c,#f97316)',border:'none',borderRadius:12,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'"Clash Display",sans-serif'}}>
                  Pay EMI →
                </button>
              )}
              <button onClick={()=>deleteLoan(loan.id)}
                style={{padding:'10px 14px',background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:12,color:'#f87171',fontSize:13,cursor:'pointer'}}>
                🗑
              </button>
            </div>
          </div>
        );
      })}

      {/* Add Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal" style={{maxHeight:'90dvh',overflowY:'auto'}}>
            <MHdr title="Add Loan" onClose={()=>setModal(false)}/>
            <input className="input" placeholder="Loan name *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{marginBottom:10}}/>
            <select className="input" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{marginBottom:10}}>
              {TYPES.map(t=><option key={t} value={t}>{TYPE_INFO[t].icon} {t[0].toUpperCase()+t.slice(1)}</option>)}
            </select>
            {[{ph:'Principal amount (₹) *',k:'principal',t:'number'},{ph:'Interest rate (%/year)',k:'interest_rate',t:'number'},{ph:'Tenure (months) *',k:'tenure_months',t:'number'},{ph:'EMI date (1-28)',k:'emi_date',t:'number'},{ph:'Lender / Bank',k:'lender',t:'text'}].map(f=>(
              <input key={f.k} className="input" type={f.t} placeholder={f.ph} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={{marginBottom:10}}/>
            ))}
            {emiPreview > 0 && (
              <div style={{background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.15)',borderRadius:12,padding:'12px',marginBottom:14,textAlign:'center'}}>
                <div style={{fontSize:11,color:'#444',marginBottom:4}}>ESTIMATED EMI</div>
                <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:24,fontWeight:700,color:'#4ade80'}}>{fmt(Math.round(emiPreview))}<span style={{fontSize:13,color:'#444'}}>/mo</span></div>
                <div style={{fontSize:11,color:'#444',marginTop:4}}>Total payment: {fmt(Math.round(emiPreview*Number(form.tenure_months)))}</div>
              </div>
            )}
            <button onClick={addLoan} className="btn-primary">Add Loan →</button>
          </div>
        </div>
      )}

      {/* Pay EMI confirm */}
      {payModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setPayModal(null)}>
          <div className="modal">
            <MHdr title="Confirm EMI Payment" onClose={()=>setPayModal(null)}/>
            <div style={{textAlign:'center',padding:'10px 0 20px'}}>
              <div style={{fontSize:40,marginBottom:8}}>{TYPE_INFO[payModal.type]?.icon||'💳'}</div>
              <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:18,color:'#fff',marginBottom:4}}>{payModal.name}</div>
              <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:32,fontWeight:700,color:'#fb923c',margin:'10px 0'}}>{fmt(payModal.emi_amount)}</div>
              <div style={{fontSize:12,color:'#444'}}>EMI #{payModal.paid_months+1} of {payModal.tenure_months}</div>
            </div>
            <button onClick={()=>payEMI(payModal)} style={{width:'100%',padding:15,background:'linear-gradient(135deg,#fb923c,#f97316)',border:'none',borderRadius:14,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'"Clash Display",sans-serif'}}>
              Confirm Payment →
            </button>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function MHdr({title,onClose}) {
  return <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
    <h2 style={{fontFamily:'"Clash Display",sans-serif',fontSize:18,color:'#fff'}}>{title}</h2>
    <button onClick={onClose} style={{background:'#111116',border:'none',color:'#555',fontSize:16,cursor:'pointer',width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
  </div>;
}

const S = {
  page:{padding:'0 16px 100px',background:'#020204',minHeight:'100dvh',fontFamily:'Plus Jakarta Sans,sans-serif'},
  hdr:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 0 14px'},
  lbl:{fontSize:10,color:'#2a2a2a',letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600},
  h1:{fontFamily:'"Clash Display",sans-serif',fontSize:26,fontWeight:700,color:'#fff',marginTop:2},
  addBtn:{width:40,height:40,background:'linear-gradient(135deg,#fb923c,#f97316)',border:'none',borderRadius:14,color:'#fff',fontSize:22,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'},
  ghostBtn:{padding:'8px 12px',background:'transparent',border:'1px solid',borderRadius:12,fontSize:16,cursor:'pointer',height:40},
  card:{background:'#0d0d0f',border:'1.5px solid',borderRadius:20,padding:16,marginBottom:10,animation:'fadeUp .3s ease both',transition:'border-color .2s'},
  greenBtn:{padding:'12px 28px',background:'linear-gradient(135deg,#4ade80,#22c55e)',border:'none',borderRadius:14,color:'#000',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'"Clash Display",sans-serif'},
};
