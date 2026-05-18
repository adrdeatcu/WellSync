import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

type RangeOption = 1 | 3 | 7 | 14 | 30;

interface StepsHistoryItem {
  date: string;
  total_steps: number;
}

interface HeartRateHistoryItem {
  date: string;
  avg_heart_rate_bpm: number | null;
  min_heart_rate_bpm: number | null;
  max_heart_rate_bpm: number | null;
}

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeOption>(7);
  const [loading, setLoading] = useState(false);
  const [stepsHistory, setStepsHistory] = useState<StepsHistoryItem[] | null>(null);
  const [hrHistory, setHrHistory] = useState<HeartRateHistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  async function loadData(days: RangeOption) {
    setLoading(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const [stepsRes, hrRes] = await Promise.all([
        fetch(`${backendUrl}/api/history/steps?days=${days}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${backendUrl}/api/history/heart-rate?days=${days}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (!stepsRes.ok || !hrRes.ok) {
        throw new Error('Failed to load history');
      }

      const stepsJson = (await stepsRes.json()) as { history: StepsHistoryItem[] };
      const hrJson = (await hrRes.json()) as { history: HeartRateHistoryItem[] };

      setStepsHistory(stepsJson.history);
      setHrHistory(hrJson.history);
    } catch (err: any) {
      setError(err.message ?? 'Error loading history');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    navigate('/dashboard');
  }

  const ranges: RangeOption[] = [1, 3, 7, 14, 30];
  const hasSteps = stepsHistory && stepsHistory.length > 0;
  const hasHr = hrHistory && hrHistory.length > 0;
  const actualDays = hasSteps ? stepsHistory!.length : 0;

  return (
    <div style={{ minHeight: '100vh', padding: 24, background: '#f3f7f6' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            border: 'none',
            background: '#eaf2f0',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          ← Back to dashboard
        </button>
        <h1 style={{ margin: 0 }}>History</h1>
        <div />
      </header>

      <div style={{ marginBottom: 16 }}>
        {ranges.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            style={{
              marginRight: 8,
              padding: '6px 10px',
              borderRadius: 999,
              border: r === range ? '1px solid #1f5f63' : '1px solid #d8e9e6',
              background: r === range ? 'rgba(31,95,99,0.1)' : '#ffffff',
              cursor: 'pointer',
            }}
          >
            {r === 30 ? '1M' : `${r}d`}
          </button>
        ))}
      </div>

      {loading && <p>Loading history...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <>
          {actualDays > 0 && actualDays < range && (
            <p style={{ fontSize: 12, color: '#7d9492', marginBottom: 12 }}>
              Showing {actualDays} of {range} days (only days with data are displayed).
            </p>
          )}

          <section style={{ marginBottom: 24 }}>
            <h2>Steps per day</h2>
            {hasSteps ? (
              <ul>
                {stepsHistory!.map((item) => (
                  <li key={item.date}>
                    {item.date}: {item.total_steps.toLocaleString()} steps
                  </li>
                ))}
              </ul>
            ) : (
              <p>No steps history for this range yet.</p>
            )}
          </section>

          <section>
            <h2>Heart rate per day</h2>
            {hasHr ? (
              <ul>
                {hrHistory!.map((item) => (
                  <li key={item.date}>
                    {item.date}: avg {item.avg_heart_rate_bpm ?? '—'} bpm
                    {item.min_heart_rate_bpm != null &&
                      item.max_heart_rate_bpm != null &&
                      ` (min ${item.min_heart_rate_bpm}, max ${item.max_heart_rate_bpm})`}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No heart-rate history for this range yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default HistoryPage;