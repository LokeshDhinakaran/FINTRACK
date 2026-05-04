// src/pages/TransactionsPage.jsx — Full transaction manager v2
import { useState, useEffect, useRef } from 'react';
import { txnAPI, categoryAPI, accountAPI } from '../services/api';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');

export default function TransactionsPage() {
  const [txns,       setTxns]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [loadMore,   setLoadMore]   = useState(false);
  const [modal,      setModal]      = useState(false);
  const [editTxn,    setEditTxn]    = useState(null);
  const [delId,      setDelId]      = useState(null);
  const [categories, setCategories] = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [summary,    setSummary]    = useState({ income:0, expenses:0 });
  const searchTimer = useRef(null);

  const blankForm = () => ({
    type:'expense', title:'', amount:'', category_id:'',
    account_id:'', date:new Date().toISOString().split('T')[0], note:'',
  });
  const [form, setForm] = useState(blankForm());

  // Load categories + accounts once
  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.data)).catch(()=>{});
    accountAPI.getAll().then(({ data }) => {
      setAccounts(data.data);
      if (data.data.length) setForm(p => ({ ...p, account_id: String(data.data[0].id) }));
    }).catch(()=>{});
  }, []);

  // Load summary for current month
  useEffect(() => {
    const now = new Date();
    txnAPI.summary({ month: now.getMonth()+1, year: now.getFullYear() })
      .then(({ data }) => setSummary({ income: Number(data.summary?.total_income||0), expenses: Number(data.summary?.total_expense||0) }))
      .catch(()=>{});
  }, [txns.length]);

  const loadTxns = async (p = 1, replace = true) => {
    if (p === 1) setLoading(true); else setLoadMore(true);
    try {
      const { data } = await txnAPI.getAll({ page:p, limit:25, search, type:typeFilter });
      setTxns(prev => replace ? data.data : [...prev, ...data.data]);
      setTotal(data.total); setPage(p);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); setLoadMore(false); }
  };

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadTxns(1), 300);
  }, [search, typeFilter]);

  async function handleSave() {
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return; }
    if (!form.account_id) { toast.error('Select an account'); return; }
    try {
      if (editTxn) {
        const { data } = await txnAPI.update(editTxn.id, { ...form, amount: Number(form.amount) });
        setTxns(p => p.map(t => t.id === editTxn.id ? data.data : t));
        toast.success('Updated ✓');
      } else {
        const { data } = await txnAPI.create({ ...form, amount: Number(form.amount) });
        setTxns(p => [data.data, ...p]);
        toast.success('Added ✓');
      }
      closeModal();
    } catch(e) { toast.error(e.response?.data?.error || 'Failed'); }
  }

  async function handleDelete(id) {
    try {
      await txnAPI.remove(id);
      setTxns(p => p.filter(t => t.id !== id));
      setDelId(null); setTotal(t => t - 1);
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  }

  function openEdit(t) {
    setEditTxn(t);
    setForm({ type:t.type, title:t.title, amount:String(t.amount), category_id:String(t.category_id||''), account_id:String(t.account_id||''), date:t.date?.split('T')[0]||'', note:t.note||'' });
    setModal(true);
  }

  function closeModal() {
    setModal(false); setEditTxn(null); setForm(blankForm());
    if (accounts.length) setForm(p => ({ ...p, account_id: String(accounts[0].id) }));
  }

  // Group by date
  const grouped = txns.reduce((acc, t) => {
    const key = new Date(t.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
    (acc[key] = acc[key]||[]).push(t);
    return acc;
  }, {});

  const filteredCats = categories.filter(c => c.type === form.type || c.type === 'investment');

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.hdr}>
        <div>
          <div style={S.lbl}>ACTIVITY</div>
          <h1 style={S.h1}>Transactions</h1>
        </div>
        <button onClick={() => setModal(true)} style={S.addBtn}>+</button>
      </div>

      {/* Month summary strip */}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <div style={{ flex:1, background:'rgba(74,222,128,.06)', border:'1px solid rgba(74,222,128,.15)', borderRadius:14, padding:'10px 14px' }}>
          <div style={{ fontSize:9, color:'#2a4a2a', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:3 }}>INCOME</div>
          <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:16, fontWeight:700, color:'#4ade80' }}>{fmt(summary.income)}</div>
        </div>
        <div style={{ flex:1, background:'rgba(248,113,113,.06)', border:'1px solid rgba(248,113,113,.15)', borderRadius:14, padding:'10px 14px' }}>
          <div style={{ fontSize:9, color:'#4a1a1a', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:3 }}>EXPENSES</div>
          <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:16, fontWeight:700, color:'#f87171' }}>{fmt(summary.expenses)}</div>
        </div>
        <div style={{ flex:1, background:'rgba(74,144,255,.06)', border:'1px solid rgba(74,144,255,.15)', borderRadius:14, padding:'10px 14px' }}>
          <div style={{ fontSize:9, color:'#1a2a4a', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:3 }}>NET</div>
          <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:16, fontWeight:700, color: summary.income - summary.expenses >= 0 ? '#4ade80' : '#f87171' }}>
            {fmt(summary.income - summary.expenses)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:10 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#333', fontSize:15, pointerEvents:'none' }}>🔍</span>
        <input className="input" placeholder="Search transactions…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft:42, background:'#0d0d0f', border:'1px solid #111116' }}/>
        {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:6, marginBottom:14, alignItems:'center' }}>
        {[
          { val:'',        label:'All',     bg:'rgba(74,144,255,.15)', c:'#4a9eff', bc:'rgba(74,144,255,.3)' },
          { val:'income',  label:'Income',  bg:'rgba(74,222,128,.15)', c:'#4ade80', bc:'rgba(74,222,128,.3)' },
          { val:'expense', label:'Expense', bg:'rgba(248,113,113,.15)',c:'#f87171', bc:'rgba(248,113,113,.3)' },
        ].map(f => (
          <button key={f.val} onClick={() => setTypeFilter(f.val)}
            style={{ padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Plus Jakarta Sans,sans-serif',
              background: typeFilter===f.val ? f.bg : '#0d0d0f',
              color:       typeFilter===f.val ? f.c  : '#444',
              border:     `1px solid ${typeFilter===f.val ? f.bc : '#111116'}`,
              transition: 'all .15s' }}>
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft:'auto', fontSize:11, color:'#2a2a2a' }}>{total} total</div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spinner"/></div>
      ) : txns.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 20px' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <div style={{ fontFamily:'"Clash Display",sans-serif', fontSize:18, color:'#fff', marginBottom:8 }}>
            {search ? 'No results found' : 'No transactions yet'}
          </div>
          <div style={{ fontSize:13, color:'#444', marginBottom:20 }}>
            {search ? `Nothing matches "${search}"` : 'Tap + to add your first transaction'}
          </div>
          {!search && <button onClick={() => setModal(true)} style={S.greenBtn}>+ Add Transaction</button>}
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((s,t) => s + (t.type==='income' ? Number(t.amount) : -Number(t.amount)), 0);
            return (
              <div key={date}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:10, color:'#2a2a2a', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, margin:'12px 0 8px' }}>
                  <span>{date}</span>
                  <span style={{ color: dayTotal >= 0 ? '#4ade80' : '#f87171' }}>{dayTotal >= 0 ? '+' : ''}{fmt(dayTotal)}</span>
                </div>
                <div style={{ background:'#0d0d0f', border:'1px solid #111116', borderRadius:20, overflow:'hidden', marginBottom:4 }}>
                  {items.map((t, i) => (
                    <div key={t.id}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderBottom:i<items.length-1?'1px solid #0a0a0c':'none', cursor:'pointer', position:'relative' }}
                      onClick={() => setDelId(delId===t.id ? null : t.id)}>
                      <div style={{ width:38, height:38, borderRadius:12, background:t.type==='income'?'rgba(74,222,128,.1)':'rgba(248,113,113,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
                        {t.category_icon || (t.type==='income'?'💰':'💸')}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:500, color:'#e0e0e0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                        <div style={{ fontSize:10, color:'#333', marginTop:2 }}>{t.category_name||'General'} · {t.account_name||'Account'}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:t.type==='income'?'#4ade80':'#f87171' }}>
                          {t.type==='income'?'+':'-'}{fmt(t.amount)}
                        </div>
                        {/* Inline actions */}
                        {delId===t.id && (
                          <div style={{ display:'flex', gap:4, marginTop:5, justifyContent:'flex-end' }}>
                            <button onClick={e => { e.stopPropagation(); openEdit(t); }}
                              style={{ fontSize:10, color:'#4a9eff', background:'rgba(74,144,255,.1)', border:'1px solid rgba(74,144,255,.2)', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>
                              ✎ Edit
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                              style={{ fontSize:10, color:'#f87171', background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.2)', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>
                              🗑 Del
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {txns.length < total && (
            <button onClick={() => loadTxns(page+1, false)} disabled={loadMore}
              style={{ width:'100%', padding:14, background:'#0d0d0f', border:'1px solid #111116', borderRadius:14, color:'#444', fontSize:13, cursor:'pointer', marginTop:8, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
              {loadMore ? 'Loading…' : `Load more (${total - txns.length} remaining)`}
            </button>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxHeight:'90dvh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontFamily:'"Clash Display",sans-serif', color:'#fff' }}>{editTxn ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={closeModal} style={{ background:'#111116', border:'none', color:'#555', fontSize:16, cursor:'pointer', width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            {/* Type toggle */}
            <div style={{ display:'flex', gap:4, marginBottom:16, background:'#111116', borderRadius:12, padding:3 }}>
              {[{v:'expense',l:'💸 Expense',c:'#f87171'},{v:'income',l:'💰 Income',c:'#4ade80'}].map(t => (
                <button key={t.v} onClick={() => setForm(p => ({ ...p, type:t.v, category_id:'' }))}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Plus Jakarta Sans,sans-serif',
                    background: form.type===t.v ? t.c+'18' : 'transparent',
                    color:       form.type===t.v ? t.c         : '#444',
                    border:     `1px solid ${form.type===t.v ? t.c+'30' : 'transparent'}`,
                    transition: 'all .2s' }}>
                  {t.l}
                </button>
              ))}
            </div>

            <input className="input" placeholder="Title *" value={form.title}
              onChange={e => setForm(p => ({ ...p, title:e.target.value }))} style={{ marginBottom:10 }}/>
            <input className="input" type="number" placeholder="Amount (₹) *" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount:e.target.value }))} style={{ marginBottom:10 }}/>
            <input className="input" type="date" value={form.date}
              onChange={e => setForm(p => ({ ...p, date:e.target.value }))} style={{ marginBottom:10 }}/>

            {/* Category */}
            <select className="input" value={form.category_id}
              onChange={e => setForm(p => ({ ...p, category_id:e.target.value }))} style={{ marginBottom:10 }}>
              <option value="">— Category (optional) —</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>

            {/* Account */}
            <select className="input" value={form.account_id}
              onChange={e => setForm(p => ({ ...p, account_id:e.target.value }))} style={{ marginBottom:10 }}>
              <option value="">— Select Account * —</option>
              {accounts.map(a => <option key={a.id} value={a.id}>🏦 {a.name} ({fmt(a.balance)})</option>)}
            </select>

            <input className="input" placeholder="Note (optional)" value={form.note}
              onChange={e => setForm(p => ({ ...p, note:e.target.value }))} style={{ marginBottom:18 }}/>

            <button onClick={handleSave} className="btn-primary">
              {editTxn ? 'Save Changes →' : 'Add Transaction →'}
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
  greenBtn:{ padding:'12px 28px', background:'linear-gradient(135deg,#4ade80,#22c55e)', border:'none', borderRadius:14, color:'#000', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'"Clash Display",sans-serif' },
};
