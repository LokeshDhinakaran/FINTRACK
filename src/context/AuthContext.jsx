// src/context/AuthContext.jsx — FinTrack Auth v2
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function parseJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

const WARN_SECS     = 300; // 5 min
const CRITICAL_SECS = 60;  // 1 min

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [token,        setToken]        = useState(() => localStorage.getItem('fintrack_token'));
  const [tokenPayload, setTokenPayload] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [secsLeft,     setSecsLeft]     = useState(9999);
  const timerRef = useRef(null);

  // ── Decode token ───────────────────────────────────────
  useEffect(() => {
    if (token) {
      const p = parseJWT(token);
      setTokenPayload(p);
    } else {
      setTokenPayload(null);
    }
  }, [token]);

  // ── Countdown timer ────────────────────────────────────
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!tokenPayload?.exp) { setSecsLeft(9999); return; }
    const tick = () => {
      const s = Math.max(0, tokenPayload.exp - Math.floor(Date.now() / 1000));
      setSecsLeft(s);
      if (s === 0) { clearInterval(timerRef.current); setToken(null); setUser(null); localStorage.removeItem('fintrack_token'); }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [tokenPayload]);

  // ── Verify session on mount ────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('fintrack_token');
    if (stored) {
      const p = parseJWT(stored);
      const valid = p?.exp && p.exp > Math.floor(Date.now() / 1000);
      if (valid) {
        setToken(stored);
        authAPI.me().then(({ data }) => setUser(data.user)).catch(() => {
          setToken(null); localStorage.removeItem('fintrack_token');
        }).finally(() => setLoading(false));
      } else {
        localStorage.removeItem('fintrack_token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // ── Save token helper ──────────────────────────────────
  const saveToken = useCallback((t, u) => {
    localStorage.setItem('fintrack_token', t);
    setToken(t);
    if (u) setUser(u);
  }, []);

  // ── Auth methods ───────────────────────────────────────
  const sendOTP = async phone => {
    const { data } = await authAPI.sendOTP(phone);
    return data;
  };

  const verifyOTP = async (phone, otp) => {
    const { data } = await authAPI.verifyOTP(phone, otp);
    saveToken(data.access_token, data.user);
    return data;
  };

  const googleLogin = async payload => {
    const { data } = await authAPI.google(payload);
    saveToken(data.access_token, data.user);
    return data;
  };

  const emailLogin = async (email, password) => {
    const { data } = await authAPI.emailLogin(email, password);
    saveToken(data.access_token, data.user);
    return data;
  };

  const emailRegister = async (name, email, password) => {
    const { data } = await authAPI.emailRegister(name, email, password);
    saveToken(data.access_token, data.user);
    return data;
  };

  const refreshToken = useCallback(async () => {
    try {
      const { data } = await authAPI.refresh();
      saveToken(data.access_token);
      return data;
    } catch { return null; }
  }, [saveToken]);

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('fintrack_token');
    setToken(null); setUser(null); setTokenPayload(null);
  };

  // ── Token status ───────────────────────────────────────
  const tokenStatus = secsLeft <= CRITICAL_SECS ? 'critical' : secsLeft <= WARN_SECS ? 'warning' : 'valid';

  const fmtCountdown = s => {
    if (s >= 3600) return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
    if (s >= 60)   return `${Math.floor(s/60)}m ${s%60}s`;
    return `${s}s`;
  };

  return (
    <AuthContext.Provider value={{
      user, token, tokenPayload, loading,
      isAuthenticated: !!token && !!user,
      secsLeft, tokenStatus, fmtCountdown,
      sendOTP, verifyOTP, googleLogin, emailLogin, emailRegister,
      refreshToken, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
