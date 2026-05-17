import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wellsync-logo.png';

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

interface TodayStatsResponse {
  hasData: boolean;
  stats: {
    total_steps: number;
    avg_heart_rate_bpm: number | null;
    min_heart_rate_bpm: number | null;
    max_heart_rate_bpm: number | null;
    avg_air_quality_index: number | null;
    avg_temperature_c: number | null;
    avg_humidity_percent: number | null;
    avg_pressure_hpa: number | null;
  } | null;
}

interface GoalsResponse {
  hasProfile: boolean;
  goals: {
    step_goal_per_day: number;
    high_hr_threshold: number | null;
    low_spo2_threshold: number | null;
    poor_air_quality_threshold: number | null;
  } | null;
}

type PanelSection = 'history' | 'profile';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('Loading...');
  const [todayStats, setTodayStats] = useState<TodayStatsResponse | null>(null);
  const [goals, setGoals] = useState<GoalsResponse | null>(null);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [panelSection, setPanelSection] = useState<PanelSection>('history');

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      setStatus('Loading stats...');

      // Fetch today stats
      const statsRes = await fetch(`${backendUrl}/api/stats/today`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!statsRes.ok) {
        setStatus('Error loading stats');
        return;
      }

      const statsJson: TodayStatsResponse = await statsRes.json();
      setTodayStats(statsJson);

      // Fetch goals
      const goalsRes = await fetch(`${backendUrl}/api/goals`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (goalsRes.ok) {
        const goalsJson: GoalsResponse = await goalsRes.json();
        setGoals(goalsJson);
      }

      setStatus('Loaded');
    }

    load();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const steps =
    todayStats && todayStats.hasData && todayStats.stats?.total_steps
      ? todayStats.stats.total_steps
      : 0;

  const stepGoal =
    goals && goals.hasProfile && goals.goals?.step_goal_per_day
      ? goals.goals.step_goal_per_day
      : 10000;

  const progress = stepGoal > 0 ? Math.min(steps / stepGoal, 1) : 0;

  let progressMessage =
    'No data for today yet. Once measurements arrive, your progress will appear here.';
  if (steps > 0) {
    const pct = progress * 100;
    if (pct < 30) {
      progressMessage =
        'You are just getting started. A short walk will boost your progress.';
    } else if (pct < 80) {
      progressMessage =
        'Nice pace! One more walk will put you close to your goal.';
    } else if (pct < 100) {
      progressMessage =
        'You are almost there. A little more effort to reach your goal.';
    } else {
      progressMessage = 'Goal achieved! Great job today.';
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f3f7f6',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          height: 60,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {/* Left: brand logo only */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={logo}
            alt="WellSync"
            style={{ height: 32, width: 'auto', display: 'block' }}
          />
        </div>

        {/* Center: tagline */}
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 14,
            color: '#4a6e6c',
          }}
        >
          Your health in sync
        </div>

        {/* Right: user icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#9aa9a6' }}>{status}</span>
          <button
            type="button"
            onClick={() => setShowUserPanel(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: '#eaf5f3',
              color: '#1f5f63',
              cursor: 'pointer',
              position: 'relative',
            }}
            aria-label="Open account panel"
          >
            {/* Simple user icon using CSS: head + body */}
            <span
              style={{
                position: 'absolute',
                top: 6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: '#1f5f63',
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 5,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 10,
                borderRadius: 999,
                backgroundColor: '#1f5f63',
              }}
            />
          </button>
        </div>
      </header>

      {/* Main content (Today) */}
      <main style={{ maxWidth: 700, margin: '24px auto', padding: '0 16px' }}>
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: '1px solid #d8e9e6',
            background: '#ffffff',
            boxShadow: '0 16px 40px -24px rgba(31,95,99,0.35)',
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 4 }}>Welcome back</h2>
          <p
            style={{
              margin: 0,
              marginBottom: 16,
              color: '#5d7b79',
            }}
          >
            Steps progress for today
          </p>

          <div style={{ fontSize: 28, fontWeight: 600, color: '#1f3b3a' }}>
            {steps.toLocaleString()}{' '}
            <span style={{ fontSize: 16, fontWeight: 400 }}>steps</span>
          </div>
          <p style={{ margin: 4, color: '#5d7b79' }}>
            of {stepGoal.toLocaleString()} steps
          </p>

          {/* Progress bar */}
          <div
            style={{
              marginTop: 12,
              width: '100%',
              height: 10,
              borderRadius: 999,
              background: '#f1f5f4',
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                borderRadius: 999,
                background:
                  'linear-gradient(135deg, #1f5f63 0%, #7cc2b5 100%)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <p style={{ marginTop: 12, color: '#4a6e6c' }}>{progressMessage}</p>

          {/* Simple HR/environment summary if data exists */}
          {todayStats && todayStats.hasData && todayStats.stats && (
            <div
              style={{
                marginTop: 16,
                fontSize: 14,
                color: '#5d7b79',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 8,
              }}
            >
              <p style={{ margin: 2 }}>
                Avg HR: {todayStats.stats.avg_heart_rate_bpm ?? '—'} bpm
              </p>
              <p style={{ margin: 2 }}>
                Avg AQI: {todayStats.stats.avg_air_quality_index ?? '—'}
              </p>
              <p style={{ margin: 2 }}>
                Temp: {todayStats.stats.avg_temperature_c ?? '—'} °C
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Right side user panel overlay */}
      {showUserPanel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowUserPanel(false)}
        >
          <div
            style={{
              width: 320,
              maxWidth: '80%',
              height: '100%',
              background: '#ffffff',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>Account</h3>
              <button
                type="button"
                onClick={() => setShowUserPanel(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            {/* Section tabs */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setPanelSection('history')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 999,
                  border:
                    panelSection === 'history'
                      ? '1px solid #1f5f63'
                      : '1px solid #d8e9e6',
                  background:
                    panelSection === 'history'
                      ? 'rgba(31,95,99,0.08)'
                      : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setPanelSection('profile')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 999,
                  border:
                    panelSection === 'profile'
                      ? '1px solid #1f5f63'
                      : '1px solid #d8e9e6',
                  background:
                    panelSection === 'profile'
                      ? 'rgba(31,95,99,0.08)'
                      : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Profile
              </button>
            </div>

            {/* Panel content placeholder */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {panelSection === 'history' && (
                <p style={{ fontSize: 14, color: '#5d7b79' }}>
                  History view will show your step totals for the last days
                  using /api/history/steps. (We will implement this next.)
                </p>
              )}
              {panelSection === 'profile' && (
                <p style={{ fontSize: 14, color: '#5d7b79' }}>
                  Profile view will let you edit your daily step goal and
                  thresholds via /api/goals. (We will implement this next.)
                </p>
              )}
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                marginTop: 12,
                height: 40,
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #1f5f63, #7cc2b5)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;