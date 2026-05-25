// src/components/CreateActivityWidget.tsx
import React from 'react';
import { BRAND } from '../pages/DashboardPage';
import type { CommunityActivity } from '../pages/CommunityPage';

interface CreateActivityWidgetProps {
  onCreate: (data: {
    title: string;
    description: string;
    type: CommunityActivity['type'];
    city: string;
    locationDetails: string;
    startTime: string; // ISO-ish string from <input type="datetime-local">
    endTime: string;
    isPublic: boolean;
  }) => void;
}

const CreateActivityWidget: React.FC<CreateActivityWidgetProps> = ({
  onCreate,
}) => {
  const [showCreate, setShowCreate] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [newType, setNewType] =
    React.useState<CommunityActivity['type']>('walk');
  const [city, setCity] = React.useState('');
  const [locationDetails, setLocationDetails] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(true);

  const canSubmit =
    newTitle.trim() &&
    city.trim() &&
    startTime.trim() &&
    endTime.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    onCreate({
      title: newTitle.trim(),
      description: newDescription.trim(),
      type: newType,
      city: city.trim(),
      locationDetails: locationDetails.trim(),
      startTime,
      endTime,
      isPublic,
    });

    setNewTitle('');
    setNewDescription('');
    setNewType('walk');
    setCity('');
    setLocationDetails('');
    setStartTime('');
    setEndTime('');
    setIsPublic(true);
    setShowCreate(false);
  }

  return (
    <>
      {/* Floating create button */}
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 'none',
          background: BRAND.brandGradient,
          color: '#ffffff',
          fontSize: 26,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: BRAND.cardShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
        }}
      >
        +
      </button>

      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            zIndex: 45,
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              width: 340,
              maxWidth: '100%',
              margin: 16,
              borderRadius: 18,
              border: `1px solid ${BRAND.border}`,
              background: 'rgba(255,255,255,0.97)',
              boxShadow: BRAND.cardShadow,
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  color: BRAND.text,
                }}
              >
                New activity
              </h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: BRAND.muted,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 4,
              }}
            >
              <input
                type="text"
                placeholder="Activity title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 13,
                }}
              />

              <textarea
                placeholder="Optional description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 13,
                  minHeight: 50,
                  resize: 'vertical',
                }}
              />

              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 13,
                }}
              />

              <input
                type="text"
                placeholder="Location details (optional)"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 13,
                }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 12,
                  color: BRAND.muted,
                }}
              >
                <label>
                  <span>Start time</span>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      marginTop: 2,
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 10,
                      border: `1px solid ${BRAND.border}`,
                      fontSize: 13,
                    }}
                  />
                </label>

                <label>
                  <span>End time</span>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      marginTop: 2,
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 10,
                      border: `1px solid ${BRAND.border}`,
                      fontSize: 13,
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 2,
                  fontSize: 12,
                  color: BRAND.muted,
                }}
              >
                <input
                  id="activity-public-toggle"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="activity-public-toggle">
                  Public activity (visible to others)
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  gap: 8,
                }}
              >
                <select
                  value={newType}
                  onChange={(e) =>
                    setNewType(e.target.value as CommunityActivity['type'])
                  }
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 999,
                    border: `1px solid ${BRAND.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="walk">Walk</option>
                  <option value="run">Run</option>
                  <option value="steps">Steps challenge</option>
                  <option value="challenge">Other challenge</option>
                </select>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: 'none',
                    background: BRAND.brandGradient,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: canSubmit ? 'pointer' : 'default',
                    opacity: canSubmit ? 1 : 0.6,
                  }}
                >
                  Create activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateActivityWidget;