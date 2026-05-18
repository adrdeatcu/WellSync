import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wellsync-logo.png';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

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

const BRAND = {
  deep: '#1f5f63',
  mid: '#2f8a8f',
  light: '#7cc2b5',
  bgGradient:
    'radial-gradient(1200px 600px at 10% -10%, rgba(124,194,181,0.35), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(31,95,99,0.25), transparent 55%), linear-gradient(180deg, #eaf6f3 0%, #f3f7f6 60%, #e7f1ef 100%)',
  cardBg: 'rgba(255,255,255,0.75)',
  cardBorder: '1px solid rgba(255,255,255,0.6)',
  cardShadow: '0 20px 50px -20px rgba(31,95,99,0.35)',
  textMuted: '#5b7c79',
  divider: 'rgba(31,95,99,0.08)',
};

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
  const hasSteps = !!stepsHistory && stepsHistory.length > 0;
  const hasHr = !!hrHistory && hrHistory.length > 0;
  const actualDays = hasSteps ? stepsHistory!.length : 0;

  const stepsStats = useMemo(() => {
    if (!hasSteps) return null;
    const totals = stepsHistory!.map((s) => s.total_steps);
    const sum = totals.reduce((a, b) => a + b, 0);
    return {
      total: sum,
      avg: Math.round(sum / totals.length),
      best: Math.max(...totals),
    };
  }, [stepsHistory, hasSteps]);

  const hrStats = useMemo(() => {
    if (!hasHr) return null;
    const avgs = hrHistory!
      .map((h) => h.avg_heart_rate_bpm)
      .filter((v): v is number => typeof v === 'number');
    const mins = hrHistory!
      .map((h) => h.min_heart_rate_bpm)
      .filter((v): v is number => typeof v === 'number');
    const maxs = hrHistory!
      .map((h) => h.max_heart_rate_bpm)
      .filter((v): v is number => typeof v === 'number');
    if (!avgs.length) return null;
    return {
      avg: Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length),
      min: mins.length ? Math.min(...mins) : null,
      max: maxs.length ? Math.max(...maxs) : null,
    };
  }, [hrHistory, hasHr]);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px clamp(16px, 4vw, 48px) 48px',
        background: BRAND.bgGradient,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#16302f',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 20px',
          marginBottom: 24,
          background: BRAND.cardBg,
          border: BRAND.cardBorder,
          borderRadius: 18,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: BRAND.cardShadow,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(31,95,99,0.15)',
            background: 'rgba(255,255,255,0.6)',
            padding: '8px 14px',
            borderRadius: 999,
            cursor: 'pointer',
            color: BRAND.deep,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          ← Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={logo}
            alt="WellSync"
            style={{ height: 36, width: 'auto', background: 'transparent' }}
            draggable={false}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.deep }}>
              History
            </div>
            <div style={{ fontSize: 11, color: BRAND.textMuted }}>
              Your health in sync
            </div>
          </div>
        </div>

        <div style={{ width: 110 }} />
      </header>

      {/* Range pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {ranges.map((r) => {
          const active = r === range;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: active
                  ? '1px solid transparent'
                  : '1px solid rgba(31,95,99,0.15)',
                background: active
                  ? `linear-gradient(135deg, ${BRAND.deep}, ${BRAND.light})`
                  : 'rgba(255,255,255,0.7)',
                color: active ? '#ffffff' : BRAND.deep,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                boxShadow: active
                  ? '0 8px 20px -8px rgba(31,95,99,0.5)'
                  : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {r === 30 ? '1M' : `${r}d`}
            </button>
          );
        })}
      </div>

      {actualDays > 0 && actualDays < range && (
        <p style={{ fontSize: 12, color: BRAND.textMuted, marginBottom: 16 }}>
          Showing {actualDays} of {range} days (only days with data are displayed).
        </p>
      )}

      {loading && (
        <div
          style={{
            padding: 24,
            background: BRAND.cardBg,
            border: BRAND.cardBorder,
            borderRadius: 18,
            boxShadow: BRAND.cardShadow,
            color: BRAND.textMuted,
          }}
        >
          Loading history…
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
            color: '#9b1c1c',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Steps card */}
          <section
            style={{
              padding: 24,
              background: BRAND.cardBg,
              border: BRAND.cardBorder,
              borderRadius: 22,
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              boxShadow: BRAND.cardShadow,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    color: BRAND.deep,
                    fontWeight: 700,
                  }}
                >
                  Steps per day
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 12,
                    color: BRAND.textMuted,
                  }}
                >
                  Daily total over the selected range
                </p>
              </div>
              {stepsStats && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Stat label="Total" value={stepsStats.total.toLocaleString()} />
                  <Stat label="Avg / day" value={stepsStats.avg.toLocaleString()} />
                  <Stat label="Best" value={stepsStats.best.toLocaleString()} />
                </div>
              )}
            </div>

            {hasSteps ? (
              <>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <AreaChart
                      data={stepsHistory!}
                      margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="stepsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={BRAND.light} stopOpacity={0.55} />
                          <stop offset="100%" stopColor={BRAND.light} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={BRAND.divider} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: BRAND.textMuted }}
                        tickMargin={8}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: BRAND.textMuted }}
                        tickMargin={8}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid rgba(31,95,99,0.15)',
                          background: 'rgba(255,255,255,0.95)',
                          boxShadow: '0 10px 30px -10px rgba(31,95,99,0.3)',
                        }}
                        formatter={(value: any) =>
                          typeof value === 'number' ? value.toLocaleString() : value
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="total_steps"
                        stroke={BRAND.deep}
                        strokeWidth={2.5}
                        fill="url(#stepsFill)"
                        activeDot={{ r: 5, fill: BRAND.deep }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <DayList>
                  {stepsHistory!.map((item) => (
                    <DayRow
                      key={item.date}
                      date={item.date}
                      value={`${item.total_steps.toLocaleString()} steps`}
                    />
                  ))}
                </DayList>
              </>
            ) : (
              <EmptyState text="No steps history for this range yet." />
            )}
          </section>

          {/* Heart rate card */}
          <section
            style={{
              padding: 24,
              background: BRAND.cardBg,
              border: BRAND.cardBorder,
              borderRadius: 22,
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              boxShadow: BRAND.cardShadow,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    color: BRAND.deep,
                    fontWeight: 700,
                  }}
                >
                  Heart rate per day
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 12,
                    color: BRAND.textMuted,
                  }}
                >
                  Average bpm, with daily min and max
                </p>
              </div>
              {hrStats && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Stat label="Avg" value={`${hrStats.avg} bpm`} />
                  {hrStats.min != null && <Stat label="Min" value={`${hrStats.min}`} />}
                  {hrStats.max != null && <Stat label="Max" value={`${hrStats.max}`} />}
                </div>
              )}
            </div>

            {hasHr ? (
              <>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={hrHistory!}
                      margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={BRAND.divider} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: BRAND.textMuted }}
                        tickMargin={8}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: BRAND.textMuted }}
                        tickMargin={8}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid rgba(31,95,99,0.15)',
                          background: 'rgba(255,255,255,0.95)',
                          boxShadow: '0 10px 30px -10px rgba(31,95,99,0.3)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="min_heart_rate_bpm"
                        stroke={BRAND.light}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                        name="Min"
                      />
                      <Line
                        type="monotone"
                        dataKey="max_heart_rate_bpm"
                        stroke={BRAND.light}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                        name="Max"
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_heart_rate_bpm"
                        stroke={BRAND.deep}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: BRAND.deep }}
                        activeDot={{ r: 5 }}
                        name="Avg"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <DayList>
                  {hrHistory!.map((item) => (
                    <DayRow
                      key={item.date}
                      date={item.date}
                      value={
                        <>
                          avg {item.avg_heart_rate_bpm ?? '—'} bpm
                          {item.min_heart_rate_bpm != null &&
                            item.max_heart_rate_bpm != null && (
                              <span style={{ color: BRAND.textMuted, marginLeft: 6 }}>
                                (min {item.min_heart_rate_bpm}, max{' '}
                                {item.max_heart_rate_bpm})
                              </span>
                            )}
                        </>
                      }
                    />
                  ))}
                </DayList>
              </>
            ) : (
              <EmptyState text="No heart-rate history for this range yet." />
            )}
          </section>
        </div>
      )}
    </div>
  );
};

/* ---------- small presentational helpers ---------- */

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      padding: '8px 14px',
      borderRadius: 12,
      background: 'rgba(31,95,99,0.06)',
      border: '1px solid rgba(31,95,99,0.1)',
      minWidth: 90,
    }}
  >
    <div style={{ fontSize: 11, color: BRAND.textMuted, fontWeight: 500 }}>
      {label}
    </div>
    <div style={{ fontSize: 16, color: BRAND.deep, fontWeight: 700 }}>{value}</div>
  </div>
);

const DayList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul
    style={{
      listStyle: 'none',
      padding: 0,
      margin: '20px 0 0',
      display: 'grid',
      gap: 6,
      maxHeight: 220,
      overflowY: 'auto',
    }}
  >
    {children}
  </ul>
);

const DayRow: React.FC<{ date: string; value: React.ReactNode }> = ({
  date,
  value,
}) => (
  <li
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 14px',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.6)',
      border: '1px solid rgba(31,95,99,0.06)',
      fontSize: 13,
    }}
  >
    <span style={{ color: BRAND.deep, fontWeight: 600 }}>{date}</span>
    <span style={{ color: '#2a4948' }}>{value}</span>
  </li>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      padding: 32,
      textAlign: 'center',
      color: BRAND.textMuted,
      background: 'rgba(31,95,99,0.04)',
      borderRadius: 14,
      border: '1px dashed rgba(31,95,99,0.15)',
    }}
  >
    {text}
  </div>
);

export default HistoryPage;
