// src/pages/InvestmentsPage.jsx — Premium Cashew-Inspired v2
import { useState, useEffect, useRef } from 'react';
import { investAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const fmt  = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const pct  = (g, inv) => inv > 0 ? ((g / inv) * 100).toFixed(1) : '0.0';

const CATS = [
  { id:'insurance',    emoji:'🛡️', name:'Insurance',    desc:'LIC · Health · Term',      risk:'Low',    rc:'#22c55e' },
  { id:'gold',         emoji:'🪙', name:'Gold',          desc:'SGB · ETF · Digital',      risk:'Medium', rc:'#f59e0b' },
  { id:'stocks',       emoji:'📈', name:'Stocks',        desc:'NSE · BSE · Zerodha',      risk:'High',   rc:'#ef4444' },
  { id:'mutual_fund',  emoji:'💹', name:'Mutual Funds',  desc:'ELSS · Index · Hybrid',    risk:'Medium', rc:'#a78bfa' },
  { id:'fixed_income', emoji:'🏦', name:'Fixed Income',  desc:'PPF · NPS · FD',           risk:'Low',    rc:'#34d399' },
  { id:'real_estate',  emoji:'🏘️', name:'Real Estate',   desc:'REITs · Direct Property',  risk:'Medium', rc:'#fb923c' },
];

const PLANS = {
  insurance: [
    { name:'LIC Jeevan Anand', org:'LIC of India', ret:'~5.5% IRR', risk:'Low', min:'₹50K/yr', tax:'80C+10(10D)', tenure:'16–35 yr', liq:'Low', color:'#22c55e',
      analysis:'Dual benefit — maturity payout + whole life cover. Effective post-tax yield ~7.5% at 30% slab. Best as protection base.',
      steps:[{t:'Calculate HLV',d:'Annual income × 10 = minimum sum assured'},{t:'SA ≥ ₹50L',d:'Smaller covers = dangerous underinsurance'},{t:'Pay annual premium',d:'Monthly adds 4–5% loading charge'},{t:'Nominate digitally',d:'licindia.in — prevents claim delays'}],
      url:'https://licindia.in', urlLabel:'Visit LIC India' },
    { name:'Star Health Comprehensive', org:'Star Health Insurance', ret:'Cashless', risk:'Low', min:'₹15K/yr', tax:'80D ₹25K', tenure:'Annual', liq:'Cashless', color:'#4ade80',
      analysis:'6700+ hospitals, 86.5% claim ratio, 541 daycare procedures. ₹5L family floater ≈ ₹14,400/yr.',
      steps:[{t:'Choose family floater',d:'Cheaper if all members healthy'},{t:'Min ₹5L SI',d:'One cardiac surgery = ₹3.5–8L'},{t:'Disclose pre-existing',d:'Non-disclosure = rejection'},{t:'Port before 45',d:'Lock good rates young'}],
      url:'https://starhealth.in', urlLabel:'Visit Star Health' },
  ],
  gold: [
    { name:'Sovereign Gold Bond', org:'Reserve Bank of India', ret:'8–12% p.a.', risk:'Low–Med', min:'₹5,000', tax:'Tax-free maturity', tenure:'8 years', liq:'Medium', color:'#fbbf24',
      analysis:'Best gold product. 2.5% annual interest + gold price gain. Zero charges. Tax-free at maturity. ₹1L in 2016 → ₹3.4L by 2024.',
      steps:[{t:'Watch RBI windows',d:'4–6 tranches/yr at rbi.org.in'},{t:'Buy on Zerodha',d:'₹50/g discount vs bank branch'},{t:'Hold to maturity',d:'Tax-free exit at 8 years'},{t:'Exit via NSE after Yr 1',d:'Listed — liquidity available early'}],
      url:'https://rbi.org.in', urlLabel:'RBI SGB Schedule' },
    { name:'Gold ETF', org:'HDFC / Nippon AMC', ret:'10–12% p.a.', risk:'Medium', min:'₹500', tax:'LTCG 12.5% >2yr', tenure:'No lock-in', liq:'Very High', color:'#f59e0b',
      analysis:'995-purity gold in vault. HDFC Gold ETF: ₹35,000Cr AUM, 0.59% ER. Best for monthly SIP-equivalent gold accumulation.',
      steps:[{t:'Open demat at Zerodha',d:'15-min Aadhaar + PAN KYC'},{t:'Search HDFCMFGETF',d:'Largest Gold ETF by AUM'},{t:'Set monthly buy ₹1000',d:'Rupee cost averaging'},{t:'Cap at 10% portfolio',d:'Gold is hedge, not primary growth'}],
      url:'https://nseindia.com', urlLabel:'Track on NSE' },
  ],
  stocks: [
    { name:'NSE Direct Equity', org:'National Stock Exchange', ret:'14–18% CAGR', risk:'High', min:'₹500', tax:'LTCG 12.5% >1yr', tenure:'5+ years', liq:'Very High', color:'#f87171',
      analysis:'Nifty 50: 14.2% CAGR over 20 years. Only invest money not needed for 5+ years. Diversify: 8–12 stocks, 4–5 sectors.',
      steps:[{t:'Open Zerodha demat',d:'₹0 delivery brokerage, 15-min KYC'},{t:'Nifty 100 stocks only',d:'HDFC Bank, TCS, Infosys, Reliance'},{t:'Buy monthly',d:'Removes market-timing anxiety'},{t:'Rebalance annually',d:'Overtrading destroys returns'}],
      url:'https://nseindia.com', urlLabel:'NSE Market Data' },
    { name:'Zerodha Kite', org:'Zerodha Broking', ret:'Market-linked', risk:'Variable', min:'₹100', tax:'By holding', tenure:'Any', liq:'Instant', color:'#ef4444',
      analysis:'₹0 delivery brokerage, ₹20 flat intraday. Free Varsity education + Smallcase + Console XIRR.',
      steps:[{t:'Open at zerodha.com',d:'₹200 one-time charge'},{t:'Read Varsity first',d:'13-module free financial education'},{t:'Start with Coin MFs',d:'Zero commission direct plan SIPs'},{t:'Paper trade 3 months',d:'Track virtual before real money'}],
      url:'https://zerodha.com', urlLabel:'Open Zerodha Free' },
  ],
  mutual_fund: [
    { name:'ELSS — Mirae Asset', org:'Mirae Asset MF', ret:'15–18% CAGR', risk:'Med–High', min:'₹500/mo', tax:'₹1.5L 80C', tenure:'3yr lock', liq:'Low', color:'#a78bfa',
      analysis:'₹1.5L/yr × 20 yrs = ₹1.8Cr vs ₹55L in FD. Mirae 5-yr CAGR 18.4%. Cornerstone 80C product.',
      steps:[{t:'SIP ₹12,500/month',d:'Each instalment has own 3-yr lock'},{t:'Choose Mirae/Quant/Axis',d:'Compare 5-yr SIP on Morningstar India'},{t:'Continue in downturns',d:'Falling NAV = more units = bigger recovery'},{t:'Claim 80C in ITR',d:'Form 16 from AMC + ITR2 filing'}],
      url:'https://miraeassetmf.co.in', urlLabel:'Mirae Asset ELSS' },
    { name:'Nifty 50 Index Fund', org:'UTI / HDFC AMC', ret:'13–14% CAGR', risk:'Med–High', min:'₹100/mo', tax:'LTCG 12.5% >1yr', tenure:'7+ years', liq:'High', color:'#8b5cf6',
      analysis:'Beats 80% of active large-caps over 15 years. ₹10K/month SIP for 15 yrs at 13% = ₹58L.',
      steps:[{t:'Open Kuvera or MFCentral',d:'Direct plan — zero commission'},{t:'Pick UTI Nifty 50',d:'ER 0.20% — lowest'},{t:'SIP on salary date',d:'Automate before lifestyle inflation'},{t:'Step up 10% every April',d:'Compounds dramatically'}],
      url:'https://mfcentral.com', urlLabel:'Start SIP on MFCentral' },
  ],
  fixed_income: [
    { name:'Public Provident Fund', org:'Govt. of India', ret:'7.1% p.a.', risk:'Zero', min:'₹500/yr', tax:'EEE exempt', tenure:'15 years', liq:'Low', color:'#34d399',
      analysis:'Only EEE instrument. ₹1.5L/yr × 25 yrs = ₹1.08Cr completely tax-free. ₹46,800 tax saved/yr at 30% slab.',
      steps:[{t:'Open at India Post / SBI',d:'10-minute online account setup'},{t:'Invest ₹1.5L in April',d:'Apr 1–5 earns full year interest'},{t:'Never miss a year',d:'Min ₹500 or account goes inactive'},{t:'Open for spouse too',d:'₹3L family benefit = ₹93K tax saved'}],
      url:'https://www.indiapost.gov.in', urlLabel:'Open PPF at India Post' },
    { name:'NPS Tier 1', org:'NPS Trust / PFRDA', ret:'10–12% CAGR', risk:'Low–Med', min:'₹500/yr', tax:'₹50K 80CCD(1B)', tenure:'Till 60', liq:'Very Low', color:'#6ee7b7',
      analysis:'Extra ₹50K deduction beyond 80C. SBI/HDFC PFM equity CAGR: 12.8% since 2009.',
      steps:[{t:'Open at enps.nsdl.com',d:'PRAN instantly, 15 minutes'},{t:'Active Choice: 75% equity',d:'Maximum long-term growth'},{t:'Claim 80CCD(1B) in ITR',d:'Most salaried miss this ₹50K'},{t:'At 60: 60% tax-free',d:'40% must be annuitised'}],
      url:'https://npstrust.org.in', urlLabel:'Open NPS Account' },
  ],
  real_estate: [
    { name:'REITs — Embassy / Mindspace', org:'NSE / BSE Listed', ret:'8–11% p.a.', risk:'Medium', min:'₹300 (1 unit)', tax:'Partial tax-free', tenure:'3+ years', liq:'High', color:'#fb923c',
      analysis:'Own Mumbai BKC / Whitefield Grade-A offices from ₹300. Embassy REIT yield 8.3%. Tenants: Google, JP Morgan, IBM.',
      steps:[{t:'Search EMBASSY on NSE',d:'Embassy (EQNR), Mindspace (MINE)'},{t:'Understand distributions',d:'70% return-of-capital (tax-free)'},{t:'Hold 3+ years',d:'BKC + Whitefield rents grow 8–12%'},{t:'Monitor DPU quarterly',d:'Rising DPU = healthy REIT'}],
      url:'https://embassyofficeparks.com', urlLabel:'Embassy REIT Portal' },
  ],
};

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const start = performance.now();
    const step = t => {
      const p = Math.min((t - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(target * ease));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return val;
}

const GROWTH_DATA = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [{
    data: [310000, 340000, 325000, 380000, 420000, 450000, 487000],
    borderColor: '#4ade80', borderWidth: 2, fill: true, tension: 0.4,
    pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#4ade80',
    backgroundColor: ctx => {
      const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 100);
      g.addColorStop(0, 'rgba(74,222,128,.2)');
      g.addColorStop(1, 'rgba(74,222,128,0)');
      return g;
    },
  }],
};

export default function InvestmentsPage() {
  const [myInvests, setMyInvests] = useState([]);
  const [openCat,   setOpenCat]   = useState(null);
  const [openProd,  setOpenProd]  = useState(null);
  const [tab,       setTab]       = useState('plans');
  const [modal,     setModal]     = useState(false);
  const [form, setForm] = useState({ name:'', category:'mutual_fund', invested_amount:'', current_value:'', sip_amount:'', notes:'' });

  useEffect(() => {
    investAPI.getAll().then(({ data }) => setMyInvests(data.data)).catch(() => {});
  }, []);

  const totalInvested = myInvests.reduce((s, i) => s + Number(i.invested_amount), 0);
  const totalCurrent  = myInvests.reduce((s, i) => s + Number(i.current_value),   0);
  const totalGain     = totalCurrent - totalInvested;
  const displayTotal  = totalCurrent || 487000;
  const countUpVal    = useCountUp(displayTotal);

  const catGroups = CATS.map(c => ({
    name: c.name, color: c.rc,
    total: myInvests.filter(i => i.category === c.id).reduce((s, i) => s + Number(i.current_value), 0),
  })).filter(g => g.total > 0);

  const pieData = catGroups.length ? {
    labels: catGroups.map(g => g.name),
    datasets: [{ data: catGroups.map(g => g.total), backgroundColor: catGroups.map(g => g.color), borderWidth: 0, hoverOffset: 8 }],
  } : {
    labels: ['Mutual Funds', 'Stocks', 'Gold', 'Fixed Income'],
    datasets: [{ data: [40, 25, 15, 20], backgroundColor: ['#8b5cf6','#ef4444','#f59e0b','#22c55e'], borderWidth: 0, hoverOffset: 8 }],
  };

  async function addInvestment() {
    if (!form.name) { toast.error('Investment name required'); return; }
    try {
      const { data } = await investAPI.create(form);
      setMyInvests(p => [data.data, ...p]);
      setModal(false);
      toast.success('Investment added ✓');
      setForm({ name:'', category:'mutual_fund', invested_amount:'', current_value:'', sip_amount:'', notes:'' });
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerLabel}>PORTFOLIO</div>
          <h1 style={S.h1}>Investments</h1>
        </div>
        <button onClick={() => setModal(true)} style={S.addBtn}>+</button>
      </div>

      {/* Hero Card */}
      <div style={S.heroCard}>
        <div style={S.heroGlow} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={S.heroLabel}>Total Portfolio Value</div>
          <div style={S.heroValue}>₹{countUpVal.toLocaleString('en-IN')}</div>
          <div style={S.heroRow}>
            <div style={S.heroStat}>
              <div style={S.hsl}>INVESTED</div>
              <div style={S.hsv}>{fmt(totalInvested || 380000)}</div>
            </div>
            <div style={S.heroDiv} />
            <div style={S.heroStat}>
              <div style={S.hsl}>GAIN</div>
              <div style={{ ...S.hsv, color: totalGain >= 0 ? '#4ade80' : '#f87171' }}>+{fmt(Math.abs(totalGain) || 107000)}</div>
            </div>
            <div style={S.heroDiv} />
            <div style={S.heroStat}>
              <div style={S.hsl}>RETURN</div>
              <div style={{ ...S.hsv, color:'#4ade80' }}>
                {totalInvested > 0 ? pct(totalGain, totalInvested) : '28.2'}%
              </div>
            </div>
          </div>
          <div style={{ height:72, margin:'0 -20px' }}>
            <Line data={GROWTH_DATA} options={{
              responsive:true, maintainAspectRatio:false,
              plugins:{ legend:{display:false}, tooltip:{enabled:true, mode:'index', intersect:false} },
              scales:{ x:{display:false}, y:{display:false} },
            }} />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={S.chartsRow}>
        <div style={S.pieWrap}>
          <div style={S.chartLabel}>Allocation</div>
          <div style={{ position:'relative', height:110, marginTop:6 }}>
            <Doughnut data={pieData} options={{
              responsive:true, maintainAspectRatio:false, cutout:'72%',
              plugins:{ legend:{display:false}, tooltip:{enabled:true} },
            }} />
            <div style={S.pieCenter}>
              <div style={{ fontSize:9, color:'#444' }}>TYPES</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{pieData.labels.length}</div>
            </div>
          </div>
          <div style={S.pieLegs}>
            {pieData.labels.slice(0,3).map((l,i) => (
              <div key={l} style={S.pieLeg}>
                <div style={{ width:6, height:6, borderRadius:'50%', background: pieData.datasets[0].backgroundColor[i] }} />
                <span style={{ fontSize:9, color:'#555' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={S.insightWrap}>
          <div style={S.chartLabel}>AI Insights</div>
          {[
            { e:'📈', t:'ELSS SIP up +2.4% this month' },
            { e:'⚡', t:'Rebalance Gold to 15% target' },
            { e:'🏆', t:'Top performer: Nifty 50 +18.4%' },
          ].map((ins, i) => (
            <div key={i} style={S.insightRow}>
              <span style={{ fontSize:14 }}>{ins.e}</span>
              <span style={{ fontSize:11, color:'#666', lineHeight:1.4 }}>{ins.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[{id:'plans',label:'📋 Plans'},{id:'portfolio',label:'💼 My Portfolio'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...S.tabBtn, ...(tab===t.id ? S.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PLANS */}
      {tab === 'plans' && CATS.map((cat, ci) => {
        const isOpen = openCat === cat.id;
        const plans  = PLANS[cat.id] || [];
        return (
          <div key={cat.id} style={{ animationDelay:`${ci*60}ms`, animation:'fadeUp .35s ease both' }}>
            <div onClick={() => { setOpenCat(isOpen ? null : cat.id); setOpenProd(null); }}
              style={{ ...S.catRow, borderColor: isOpen ? cat.rc+'44' : '#111114' }}>
              <div style={{ ...S.catEmoji, background: cat.rc+'15', borderColor: cat.rc+'25' }}>{cat.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={S.catName}>{cat.name}</div>
                <div style={S.catDesc}>{cat.desc}</div>
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <Chip color={cat.rc}>{cat.risk} risk</Chip>
                  <Chip>{plans.length} plans</Chip>
                </div>
              </div>
              <div style={{ fontSize:22, fontWeight:700, transition:'transform .25s, color .2s',
                transform: isOpen ? 'rotate(90deg)' : 'none',
                color: isOpen ? cat.rc : '#2a2a2a' }}>›</div>
            </div>

            {isOpen && plans.map((plan, pi) => {
              const pid = cat.id+pi;
              const isP = openProd === pid;
              return (
                <div key={pid} onClick={() => setOpenProd(isP ? null : pid)}
                  style={{ ...S.planCard, borderColor: isP ? plan.color+'40' : '#111116',
                    animationDelay:`${pi*80}ms`, animation:'fadeUp .25s ease both' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={S.planName}>{plan.name}</div>
                      <div style={S.planOrg}>{plan.org}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:700, color:plan.color }}>{plan.ret}</div>
                      <div style={{ fontSize:10, color:'#444', marginTop:2 }}>{plan.tenure}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                    <Chip>{plan.risk} risk</Chip>
                    <Chip>{plan.min}</Chip>
                    <Chip color="#4a9eff">{plan.tax}</Chip>
                  </div>

                  {isP && (
                    <div onClick={e => e.stopPropagation()} style={S.expanded}>
                      <div style={S.statGrid}>
                        {[['Min Invest', plan.min],['Liquidity', plan.liq],['Tax Benefit', plan.tax]].map(([l,v]) => (
                          <div key={l} style={S.statBox}>
                            <div style={S.statL}>{l}</div>
                            <div style={S.statV}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={S.analyBox}>
                        <div style={{ fontSize:10, color:'#4a9eff', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginBottom:6 }}>⚡ Expert Analysis</div>
                        <div style={{ fontSize:12, color:'#666', lineHeight:1.7 }}>{plan.analysis}</div>
                      </div>
                      <div style={{ fontSize:10, color:'#2a2a2a', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, margin:'12px 0 8px' }}>Action Plan</div>
                      {plan.steps.map((s, j) => (
                        <div key={j} style={{ display:'flex', gap:10, marginBottom:10, animationDelay:`${j*50}ms`, animation:'fadeUp .2s ease both' }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', border:`1px solid ${plan.color}50`, background:plan.color+'10', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:plan.color, flexShrink:0, marginTop:1 }}>{j+1}</div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:600, color:'#ccc' }}>{s.t}</div>
                            <div style={{ fontSize:11, color:'#444', marginTop:1 }}>{s.d}</div>
                          </div>
                        </div>
                      ))}
                      <a href={plan.url} target="_blank" rel="noreferrer"
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'12px', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', marginTop:12, textDecoration:'none', color:plan.color, border:`1px solid ${plan.color}35`, background:plan.color+'0d' }}>
                        {plan.urlLabel} ↗
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* PORTFOLIO */}
      {tab === 'portfolio' && (
        <div>
          {myInvests.length === 0 ? (
            <div style={{ textAlign:'center', padding:'50px 20px' }}>
              <div style={{ fontSize:52, marginBottom:14 }}>💼</div>
              <div style={{ fontFamily:'"Clash Display", sans-serif', fontSize:20, color:'#fff', marginBottom:8 }}>No investments yet</div>
              <div style={{ fontSize:13, color:'#444', marginBottom:22 }}>Tap + to add your first investment</div>
              <button onClick={() => setModal(true)} style={{ padding:'12px 28px', background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:14, color:'#000', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'"Clash Display", sans-serif' }}>+ Add Investment</button>
            </div>
          ) : myInvests.map((inv, idx) => {
            const gain = Number(inv.current_value) - Number(inv.invested_amount);
            const ret  = Number(inv.invested_amount) > 0 ? (gain / Number(inv.invested_amount) * 100).toFixed(1) : 0;
            const isPos = gain >= 0;
            const catInfo = CATS.find(c => c.id === inv.category);
            return (
              <div key={inv.id} style={{ ...S.portCard, animationDelay:`${idx*60}ms`, animation:'fadeUp .3s ease both' }}>
                <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
                  <div style={{ width:42, height:42, background:'#111116', borderRadius:13, fontSize:19, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {catInfo?.emoji || '💰'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'"Clash Display", sans-serif', fontSize:14, fontWeight:600, color:'#e0e0e0' }}>{inv.name}</div>
                    <div style={{ fontSize:11, color:'#444', marginTop:2, textTransform:'capitalize' }}>{(inv.category||'').replace('_',' ')}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16, fontWeight:700, color: isPos?'#4ade80':'#f87171' }}>{fmt(inv.current_value)}</div>
                    <div style={{ fontSize:11, fontWeight:600, color: isPos?'#4ade80':'#f87171', marginTop:2 }}>{isPos?'▲':'▼'} {Math.abs(ret)}%</div>
                  </div>
                </div>
                <div style={{ height:4, background:'#1a1a1f', borderRadius:4, overflow:'hidden', marginBottom:8 }}>
                  <div style={{ height:'100%', borderRadius:4, width:`${Math.min(100, (Number(inv.current_value)/Math.max(Number(inv.invested_amount),1))*100)}%`, background: isPos?'linear-gradient(90deg,#22c55e,#4ade80)':'linear-gradient(90deg,#dc2626,#f87171)', transition:'width .8s ease' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#444' }}>
                  <span>Invested: {fmt(inv.invested_amount)}</span>
                  <span style={{ color: isPos?'#4ade80':'#f87171' }}>{isPos?'+':''}{fmt(gain)}</span>
                </div>
                {inv.sip_amount > 0 && (
                  <div style={{ marginTop:10, padding:'7px 10px', background:'rgba(74,222,128,.06)', border:'1px solid rgba(74,222,128,.15)', borderRadius:8, fontSize:11, color:'#4ade80' }}>
                    🔄 SIP: {fmt(inv.sip_amount)}/month · Date {inv.sip_date||'1'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={S.overlay} onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div style={S.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontFamily:'"Clash Display", sans-serif', fontSize:20, color:'#fff' }}>Add Investment</h2>
              <button onClick={() => setModal(false)} style={{ background:'#111116', border:'none', color:'#555', fontSize:16, cursor:'pointer', width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            {[
              { ph:'Investment name *', key:'name', type:'text' },
              { ph:'Amount invested (₹)', key:'invested_amount', type:'number' },
              { ph:'Current value (₹)', key:'current_value', type:'number' },
              { ph:'Monthly SIP (optional)', key:'sip_amount', type:'number' },
              { ph:'Notes (optional)', key:'notes', type:'text' },
            ].map(f => (
              <input key={f.key} className="input" type={f.type} placeholder={f.ph}
                value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]:e.target.value}))}
                style={{ marginBottom:10 }} />
            ))}
            <select className="input" value={form.category}
              onChange={e => setForm(p => ({...p, category:e.target.value}))} style={{ marginBottom:16 }}>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
            <button onClick={addInvestment} style={{ width:'100%', padding:15, background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:14, color:'#000', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'"Clash Display", sans-serif', boxShadow:'0 8px 24px rgba(74,222,128,.3)' }}>
              Add to Portfolio →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(74,222,128,0); } 50% { box-shadow:0 0 0 8px rgba(74,222,128,.06); } }
      `}</style>
    </div>
  );
}

function Chip({ children, color='#3a3a3a' }) {
  return (
    <span style={{ padding:'3px 8px', borderRadius:7, fontSize:10, fontWeight:600,
      background:color+'18', color, border:`1px solid ${color}28`,
      fontFamily:'Plus Jakarta Sans, sans-serif' }}>
      {children}
    </span>
  );
}

const S = {
  page: { padding:'0 16px 100px', fontFamily:'Plus Jakarta Sans, sans-serif', background:'#020204', minHeight:'100dvh' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 0 14px' },
  headerLabel: { fontSize:10, color:'#2a2a2a', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 },
  h1: { fontFamily:'"Clash Display", sans-serif', fontSize:26, fontWeight:700, color:'#fff', marginTop:2 },
  addBtn: { width:40, height:40, background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:14, color:'#000', fontSize:22, cursor:'pointer', fontWeight:700, boxShadow:'0 6px 20px rgba(74,222,128,.4)', display:'flex', alignItems:'center', justifyContent:'center' },
  heroCard: { borderRadius:24, padding:'22px 20px 0', marginBottom:14, overflow:'hidden', background:'linear-gradient(145deg,#081510,#0d1a10,#0a1510)', border:'1px solid rgba(74,222,128,.14)', boxShadow:'0 20px 60px rgba(0,0,0,.7)', position:'relative', animation:'glow-pulse 5s ease-in-out infinite' },
  heroGlow: { position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 10%, rgba(74,222,128,.08) 0%, transparent 60%)', pointerEvents:'none' },
  heroLabel: { fontSize:10, color:'#2a4a2a', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:600 },
  heroValue: { fontFamily:'"Clash Display", sans-serif', fontSize:34, fontWeight:700, color:'#fff', margin:'6px 0 14px' },
  heroRow: { display:'flex', gap:0, marginBottom:14 },
  heroStat: { flex:1 },
  heroDiv: { width:1, background:'rgba(255,255,255,.05)', margin:'0 8px' },
  hsl: { fontSize:9, color:'#2a4a2a', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 },
  hsv: { fontSize:13, fontWeight:700, color:'#e0e0e0' },
  chartsRow: { display:'flex', gap:10, marginBottom:14 },
  pieWrap: { flex:1, background:'#0d0d0f', border:'1px solid #111116', borderRadius:20, padding:'14px', position:'relative' },
  insightWrap: { flex:1, background:'#0d0d0f', border:'1px solid #111116', borderRadius:20, padding:'14px' },
  chartLabel: { fontSize:10, color:'#333', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 },
  pieCenter: { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -10%)', textAlign:'center' },
  pieLegs: { display:'flex', gap:6, marginTop:8, flexWrap:'wrap' },
  pieLeg: { display:'flex', alignItems:'center', gap:4 },
  insightRow: { display:'flex', gap:8, alignItems:'flex-start', marginTop:10 },
  tabs: { display:'flex', gap:6, marginBottom:14, background:'#0a0a0c', borderRadius:14, padding:4, border:'1px solid #111116' },
  tabBtn: { flex:1, padding:10, borderRadius:11, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:'transparent', color:'#333', fontFamily:'Plus Jakarta Sans, sans-serif', transition:'all .2s ease' },
  tabActive: { background:'#141416', color:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,.5)' },
  catRow: { display:'flex', alignItems:'center', gap:12, background:'#0d0d0f', borderRadius:18, padding:'14px', marginBottom:8, cursor:'pointer', border:'1.5px solid', transition:'border-color .2s ease' },
  catEmoji: { width:44, height:44, borderRadius:14, fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid', flexShrink:0 },
  catName: { fontFamily:'"Clash Display", sans-serif', fontSize:15, fontWeight:600, color:'#e0e0e0' },
  catDesc: { fontSize:11, color:'#333', marginTop:2 },
  planCard: { background:'#0d0d0f', borderRadius:16, padding:14, marginLeft:14, marginBottom:8, cursor:'pointer', border:'1.5px solid', transition:'border-color .2s ease' },
  planName: { fontFamily:'"Clash Display", sans-serif', fontSize:14, fontWeight:600, color:'#e0e0e0' },
  planOrg: { fontSize:11, color:'#333', marginTop:2 },
  expanded: { marginTop:14, paddingTop:14, borderTop:'1px solid #111116', animation:'fadeUp .2s ease' },
  statGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 },
  statBox: { background:'#111116', borderRadius:10, padding:'8px', textAlign:'center' },
  statL: { fontSize:9, color:'#2a2a2a', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 },
  statV: { fontSize:11, fontWeight:600, color:'#888' },
  analyBox: { background:'rgba(74,144,255,.05)', border:'1px solid rgba(74,144,255,.1)', borderRadius:12, padding:'12px', marginBottom:12 },
  portCard: { background:'#0d0d0f', border:'1px solid #111116', borderRadius:20, padding:'16px', marginBottom:10 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.88)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 },
  modal: { width:'90%', maxWidth:500, margin:'0 auto', background:'#0d0d0f', borderRadius:'24px', padding:'30px', border:'1px solid rgba(255,255,255,.06)', animation:'fadeUp .3s ease', boxShadow:'0 20px 60px rgba(0,0,0,.9)' },
};
