import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('Loading...');
  const [todayStats, setTodayStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      setStatus('Loading stats...');

      const res = await fetch(`${backendUrl}/api/stats/today`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        setStatus('Error loading stats');
        return;
      }

      const json = await res.json();
      setTodayStats(json);
      setStatus('Loaded');
    }

    load();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h1>WellSync Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>

      <p>{status}</p>

      {todayStats && todayStats.hasData && (
        <pre>{JSON.stringify(todayStats.stats, null, 2)}</pre>
      )}
    </div>
  );
};

export default DashboardPage;