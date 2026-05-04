// src/pages/HomePage.jsx — Premium v2
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashAPI } from '../services/api';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import toast from 'react-hot-toast';
Chart.register(...registerables);

const fmt  = n => '₹' + Number(n||0).toLocaleString('en-IN');
const GREET = () => { const h=new Date().getHours(); if(h<12)return 'Good morning'; if(h<17)return 'Good afternoon'; return 'Good evening'; };

function useCountUp(target, dur=900) {
  const [v,setV]=useState(0); const raf=useRef();
  useEffect(()=>{
    const s=performance.now();
    const step=t=>{ const p=Math.min((t-s)/dur,1),e=1-Math.pow(1-p,3);setV(Math.floor(target*e));if(p<1)raf.current=requestAnimationFrame(step); };
    raf.current=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf.current);
  },[target]);
  return v;
}

const QUICK_ACTIONS = [
  { icon:'➕', label:'Add Txn',    path:'/transactions' },
  { icon:'📊', label:'Budgets',    path:'/budgets' },
  { icon:'🎯', label:'Goals',      path:'/goals' },
  { icon:'📈', label:'Invest',     path:'/investments' },
];

export default function HomePage() {
  const { user, tokenStatus, secsLeft, fmtCountdown, refreshToken } = useAuth();
  const [overview,setOverview]=useState(null);
  const [trends,setTrends]=useState([]);
  const [loading,setLoading]=useState(true);
  const netWorth = useCountUp(overview?.net_worth||0);

  useEffect(()=>{
    Promise.all([dashAPI.overview(), dashAPI.trends()])
      .then(([o,t])=>{ setOverview(o.data); setTrends(t.data.data); })
      .catch(()=>toast.error('Failed to load dashboard'))
      .finally(()=>setLoading(false));
  },[]);

  if(loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:400}}>
      <div className="spinner"/>
    </div>
  );

  const lbl = trends.map(r=>{ const [y,m]=r.month.split('-'); return new Date(y,m-1).toLocaleString('default',{month:'short'}); });
  const lineData = {
    labels: lbl,
    datasets:[
      { label:'Income',   data:trends.map(r=>r.income),   borderColor:'#4ade80',borderWidth:2,tension:0.4,fill:true,pointRadius:0,
        backgroundColor:ctx=>{ const g=ctx.chart.ctx.createLinearGradient(0,0,0,120);g.addColorStop(0,'rgba(74,222,128,.15)');g.addColorStop(1,'rgba(74,222,128,0)');return g; } },
      { label:'Expenses', data:trends.map(r=>r.expenses), borderColor:'#f87171',borderWidth:2,tension:0.4,fill:false,pointRadius:0 },
    ],
  };
  const chartOpts={
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},
    scales:{
      x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#333',font:{size:10}}},
      y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#333',font:{size:10},callback:v=>'₹'+(v/1000)+'K'}},
    },
  };

  const savings_rate = overview?.savings_rate || 0;

  return (
    <div style={{padding:'0 16px 100px',background:'#020204',minHeight:'100dvh',fontFamily:'Plus Jakarta Sans,sans-serif'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0 12px'}}>
        <div>
          <div style={{fontSize:11,color:'#2a2a2a',textTransform:'uppercase',letterSpacing:'0.1em'}}>
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
          </div>
          <h1 style={{fontFamily:'"Clash Display",sans-serif',fontSize:22,fontWeight:700,color:'#fff',marginTop:2}}>
            {GREET()}, {user?.name?.split(' ')[0]||'there'} 👋
          </h1>
        </div>
        <div style={{width:40,height:40,background:'linear-gradient(135deg,#4ade80,#22c55e)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#000',fontWeight:700,fontSize:16,boxShadow:'0 4px 14px rgba(74,222,128,.3)'}}>
          {(user?.name||'U')[0].toUpperCase()}
        </div>
      </div>

      {/* JWT warning */}
      {tokenStatus!=='valid'&&(
        <div onClick={refreshToken} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:tokenStatus==='critical'?'rgba(239,68,68,.08)':'rgba(245,158,11,.08)',border:`1px solid ${tokenStatus==='critical'?'rgba(239,68,68,.2)':'rgba(245,158,11,.2)'}`,borderRadius:14,padding:'10px 14px',marginBottom:12,cursor:'pointer'}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:tokenStatus==='critical'?'#ef4444':'#f59e0b',boxShadow:`0 0 6px ${tokenStatus==='critical'?'#ef4444':'#f59e0b'}`}}/>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:tokenStatus==='critical'?'#f87171':'#fbbf24'}}>{tokenStatus==='critical'?'⚠ Session expiring!':'Session expiring soon'}</div>
              <div style={{fontSize:10,color:'#444'}}>Expires in {fmtCountdown(secsLeft)}</div>
            </div>
          </div>
          <span style={{fontSize:12,color:'#4ade80'}}>Refresh →</span>
        </div>
      )}

      {/* Net Worth Hero */}
      <div style={{background:'linear-gradient(145deg,#081510,#0c1a10)',border:'1px solid rgba(74,222,128,.14)',borderRadius:24,padding:'22px 20px',marginBottom:12,position:'relative',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.6)'}}>
        <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,background:'radial-gradient(circle,rgba(74,222,128,.08),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{fontSize:10,color:'#2a4a2a',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600}}>TOTAL NET WORTH</div>
        <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:36,fontWeight:700,color:'#fff',margin:'6px 0 4px'}}>₹{netWorth.toLocaleString('en-IN')}</div>
        <div style={{fontSize:13,color:'#4ade80',marginBottom:14}}>↑ Portfolio: {fmt(overview?.portfolio)}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[{l:'INCOME',v:overview?.income,c:'#4ade80'},{l:'EXPENSES',v:overview?.expenses,c:'#f87171'}].map(i=>(
            <div key={i.l}>
              <div style={{fontSize:9,color:'#333',letterSpacing:'0.1em',marginBottom:3}}>{i.l}</div>
              <div style={{fontSize:18,fontWeight:700,color:i.c}}>{fmt(i.v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {QUICK_ACTIONS.map(a=>(
          <div key={a.label} onClick={()=>window.location.href=a.path}
            style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:16,padding:'12px 6px',textAlign:'center',cursor:'pointer'}}>
            <div style={{fontSize:22,marginBottom:5}}>{a.icon}</div>
            <div style={{fontSize:10,color:'#555',fontWeight:500}}>{a.label}</div>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
        <div style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:18,padding:'14px'}}>
          <div style={{fontSize:9,color:'#333',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>SAVINGS RATE</div>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:28,fontWeight:700,color:'#4ade80'}}>{savings_rate}%</div>
          <div style={{height:4,background:'#1a1a1f',borderRadius:4,marginTop:8,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${savings_rate}%`,background:'linear-gradient(90deg,#22c55e,#4ade80)',borderRadius:4,transition:'width .8s ease'}}/>
          </div>
        </div>
        <div style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:18,padding:'14px'}}>
          <div style={{fontSize:9,color:'#333',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>NET SAVINGS</div>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:22,fontWeight:700,color:'#4a9eff'}}>{fmt(overview?.savings)}</div>
          <div style={{fontSize:11,color:'#444',marginTop:6}}>This month</div>
        </div>
      </div>

      {/* Trend Chart */}
      {trends.length>0&&(
        <div style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:20,padding:'16px',marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:14,fontWeight:600,color:'#e0e0e0'}}>Income vs Expenses</div>
            <div style={{display:'flex',gap:10}}>
              {[{c:'#4ade80',l:'Income'},{c:'#f87171',l:'Expenses'}].map(x=>(
                <div key={x.l} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#444'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:x.c}}/>
                  <span>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{height:130}}><Line data={lineData} options={chartOpts}/></div>
        </div>
      )}

      {/* Accounts */}
      {overview?.accounts?.length>0&&(
        <>
          <div style={{fontSize:10,color:'#2a2a2a',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,margin:'4px 0 10px'}}>ACCOUNTS</div>
          {overview.accounts.map(a=>(
            <div key={a.id} style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:18,padding:'14px',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <div style={{width:38,height:38,borderRadius:12,background:a.color||'rgba(74,144,255,.15)',border:'1px solid rgba(74,144,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>🏦</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:'#e0e0e0'}}>{a.name}</div>
                  <div style={{fontSize:11,color:'#333',marginTop:1,textTransform:'capitalize'}}>{a.type}</div>
                </div>
              </div>
              <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:16,fontWeight:700,color:'#4a9eff'}}>{fmt(a.balance)}</div>
            </div>
          ))}
        </>
      )}

      {/* Recent Transactions */}
      {overview?.recent_transactions?.length>0&&(
        <>
          <div style={{fontSize:10,color:'#2a2a2a',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,margin:'12px 0 10px'}}>RECENT ACTIVITY</div>
          <div style={{background:'#0d0d0f',border:'1px solid #111116',borderRadius:20,overflow:'hidden'}}>
            {overview.recent_transactions.map((t,i)=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderBottom:i<overview.recent_transactions.length-1?'1px solid #0a0a0c':'none'}}>
                <div style={{width:36,height:36,borderRadius:11,background:t.type==='income'?'rgba(74,222,128,.1)':'rgba(248,113,113,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{t.category_icon||'💰'}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:'#e0e0e0'}}>{t.title}</div>
                  <div style={{fontSize:10,color:'#333',marginTop:2}}>{new Date(t.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · {t.category_name||'General'}</div>
                </div>
                <div style={{fontWeight:700,fontSize:14,color:t.type==='income'?'#4ade80':'#f87171'}}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!overview?.recent_transactions?.length&&!loading&&(
        <div style={{textAlign:'center',padding:'50px 20px'}}>
          <div style={{fontSize:48,marginBottom:12}}>📊</div>
          <div style={{fontFamily:'"Clash Display",sans-serif',fontSize:18,color:'#fff',marginBottom:8}}>No transactions yet</div>
          <div style={{fontSize:13,color:'#444'}}>Add your first transaction to get started</div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}
