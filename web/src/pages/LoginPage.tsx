import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        // After sign up, Supabase may send confirmation email depending on settings
        // For now, just switch to login mode
        setMode('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        if (data.session) {
          // Successful login, go to dashboard
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
      <h1>WellSync {mode === 'login' ? 'Login' : 'Register'}</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading
            ? 'Please wait...'
            : mode === 'login'
            ? 'Login'
            : 'Register'}
        </button>
      </form>

      <button
        style={{ marginTop: 10 }}
        onClick={() =>
          setMode((m) => (m === 'login' ? 'register' : 'login'))
        }
      >
        {mode === 'login'
          ? "Don't have an account? Register"
          : 'Have an account? Login'}
      </button>
    </div>
  );
};

export default LoginPage;