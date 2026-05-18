import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wellsync-logo.png';

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

interface ProfileResponse {
  hasProfile: boolean;
  profile: Profile | null;
}

interface Profile {
  full_name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  step_goal_per_day: number;
  high_hr_threshold: number | null;
  low_spo2_threshold: number | null;
  poor_air_quality_threshold: number | null;
}

type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'athlete';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary',         label: 'Sedentary' },
  { value: 'lightly_active',    label: 'Lightly active' },
  { value: 'moderately_active', label: 'Moderately active' },
  { value: 'very_active',       label: 'Very active' },
  { value: 'athlete',           label: 'Athlete' },
];

const BRAND = {
  deep: '#1f5f63',
  mid: '#2f8a8f',
  light: '#7cc2b5',
  bg: 'linear-gradient(160deg, #eef7f5 0%, #d6ebe6 100%)',
  cardBg: 'rgba(255,255,255,0.9)',
  border: '#d8e9e6',
  text: '#16302f',
  muted: '#5b7c79',
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load profile');
      }

      const json = (await res.json()) as ProfileResponse;

      if (!json.hasProfile || !json.profile) {
        // should not happen with your trigger, but handle gracefully
        setProfile({
          full_name: null,
          age: null,
          height_cm: null,
          weight_kg: null,
          activity_level: null,
          step_goal_per_day: 10000,
          high_hr_threshold: null,
          low_spo2_threshold: null,
          poor_air_quality_threshold: null,
        });
      } else {
        setProfile(json.profile);
      }
    } catch (err: any) {
      setError(err.message ?? 'Error loading profile');
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange<K extends keyof Profile>(
    field: K,
    value: Profile[K]
  ) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const body = {
        full_name: profile.full_name,
        age: profile.age,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        activity_level: profile.activity_level,
        step_goal_per_day: profile.step_goal_per_day,
      };

      const res = await fetch(`${backendUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to save profile';
        throw new Error(msg);
      }

      const json = (await res.json()) as { profile: Profile };
      setProfile(json.profile);
      setSuccess('Profile updated');
    } catch (err: any) {
      setError(err.message ?? 'Error saving profile');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    navigate('/dashboard');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px clamp(16px, 4vw, 48px) 40px',
        background: BRAND.bg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: BRAND.text,
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
          borderRadius: 18,
          border: `1px solid ${BRAND.border}`,
          boxShadow: '0 16px 40px -20px rgba(31,95,99,0.35)',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            border: 'none',
            background: '#eaf2f0',
            padding: '8px 14px',
            borderRadius: 999,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: BRAND.deep,
          }}
        >
          ← Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={logo}
            alt="WellSync"
            style={{ height: 32, width: 'auto', background: 'transparent' }}
            draggable={false}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Profile</div>
            <div style={{ fontSize: 11, color: BRAND.muted }}>
              Keep your details in sync
            </div>
          </div>
        </div>

        <div style={{ width: 100 }} />
      </header>

      {/* Content */}
      {loading ? (
        <div
          style={{
            padding: 24,
            background: BRAND.cardBg,
            borderRadius: 18,
            border: `1px solid ${BRAND.border}`,
            boxShadow: '0 16px 40px -20px rgba(31,95,99,0.35)',
            color: BRAND.muted,
          }}
        >
          Loading profile…
        </div>
      ) : !profile ? (
        <div
          style={{
            padding: 24,
            background: BRAND.cardBg,
            borderRadius: 18,
            border: `1px solid ${BRAND.border}`,
            boxShadow: '0 16px 40px -20px rgba(31,95,99,0.35)',
            color: BRAND.muted,
          }}
        >
          No profile data available.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: 24,
            background: BRAND.cardBg,
            borderRadius: 18,
            border: `1px solid ${BRAND.border}`,
            boxShadow: '0 16px 40px -20px rgba(31,95,99,0.35)',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Personal details</h2>

          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220,38,38,0.25)',
                color: '#9b1c1c',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: 'rgba(22, 163, 74, 0.08)',
                border: '1px solid rgba(22,163,74,0.3)',
                color: '#166534',
                fontSize: 13,
              }}
            >
              {success}
            </div>
          )}

          {/* Full name */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Full name
            </label>
            <input
              type="text"
              value={profile.full_name ?? ''}
              onChange={(e) =>
                handleFieldChange('full_name', e.target.value || null)
              }
              placeholder="Your full name"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${BRAND.border}`,
                fontSize: 14,
              }}
            />
          </div>

          {/* Age / Height / Weight */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Age
              </label>
              <input
                type="number"
                value={profile.age ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'age',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="Years"
                min={0}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Height (cm)
              </label>
              <input
                type="number"
                value={profile.height_cm ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'height_cm',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="e.g. 170"
                min={0}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={profile.weight_kg ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'weight_kg',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="e.g. 65.5"
                min={0}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Activity level */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Activity level
            </label>
            <select
              value={profile.activity_level ?? ''}
              onChange={(e) =>
                handleFieldChange(
                  'activity_level',
                  e.target.value || null
                )
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${BRAND.border}`,
                fontSize: 14,
                backgroundColor: '#ffffff',
              }}
            >
              <option value="">Select activity level</option>
              {ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Step goal */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Daily step goal
            </label>
            <input
              type="number"
              value={profile.step_goal_per_day}
              onChange={(e) =>
                handleFieldChange(
                  'step_goal_per_day',
                  Number(e.target.value || 0)
                )
              }
              min={0}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${BRAND.border}`,
                fontSize: 14,
              }}
            />
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: BRAND.muted,
              }}
            >
              This goal is used on your dashboard and in recommendations.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 8,
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background:
                'linear-gradient(135deg, #1f5f63 0%, #7cc2b5 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;