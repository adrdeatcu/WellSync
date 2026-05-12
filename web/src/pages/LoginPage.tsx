import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wellsync-logo.png';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMode('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ws-page">
      <div className="ws-blob ws-blob--tl" />
      <div className="ws-blob ws-blob--br" />

      <div className="ws-shell">
        <div className="ws-brand">
          <img src={logo} alt="WellSync" className="ws-logo" draggable={false} />
          <p className="ws-tagline">Your health in sync</p>
        </div>

        <div className="ws-card">
          <h1 className="ws-title">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="ws-subtitle">
            {mode === 'login'
              ? 'Sign in to continue your wellness journey.'
              : 'Start syncing your health today.'}
          </p>

          <form onSubmit={handleSubmit} className="ws-form">
            <label className="ws-field">
              <span className="ws-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="ws-input"
              />
            </label>

            <label className="ws-field">
              <span className="ws-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="ws-input"
              />
            </label>

            {error && <div className="ws-error">{error}</div>}

            <button type="submit" disabled={loading} className="ws-submit">
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
            </button>
          </form>

          <div className="ws-switch">
            {mode === 'login' ? 'New to WellSync? ' : 'Already have an account? '}
            <button
              type="button"
              className="ws-link"
              onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="ws-footer">
          © {new Date().getFullYear()} WellSync. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
