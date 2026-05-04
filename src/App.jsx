import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage           from './pages/AuthPage';
import AppShell           from './components/layout/AppShell';
import HomePage           from './pages/HomePage';
import TransactionsPage   from './pages/TransactionsPage';
import BudgetsPage        from './pages/BudgetsPage';
import GoalsPage          from './pages/GoalsPage';
import InvestmentsPage    from './pages/InvestmentsPage';
import LoansPage          from './pages/LoansPage';
import SubscriptionsPage  from './pages/SubscriptionsPage';
import SettingsPage       from './pages/SettingsPage';
import JWTInspector       from './pages/JWTInspector';

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100dvh', background:'#020204' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'2px solid #1a2a1a', borderTopColor:'#4ade80', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 16px' }} />
        <div style={{ fontSize:12, color:'#333', fontFamily:'Plus Jakarta Sans,sans-serif' }}>Loading FinTrack…</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<Protected><AppShell /></Protected>}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home"          element={<HomePage />} />
        <Route path="transactions"  element={<TransactionsPage />} />
        <Route path="budgets"       element={<BudgetsPage />} />
        <Route path="goals"         element={<GoalsPage />} />
        <Route path="investments"   element={<InvestmentsPage />} />
        <Route path="loans"         element={<LoansPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="settings"      element={<SettingsPage />} />
        <Route path="jwt"           element={<JWTInspector />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
