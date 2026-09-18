import { memo } from 'react';
import { useAdmin } from '../context/AdminContext';
import type { TeamData } from '../data/teams';
import { getSharedPartner } from '../data/sharedLayout';

interface TeamPanelProps {
  tableId: string | null;
  visible: boolean;
  onBack: () => void;
}

const TeamPanel = memo(function TeamPanel({ tableId, visible, onBack }: TeamPanelProps) {
  const { teams } = useAdmin();
  const teamData: TeamData | null = tableId ? teams[tableId] || null : null;

  // Check if this table has a shared partner
  const partnerId = tableId ? getSharedPartner(tableId) : undefined;
  const partnerData: TeamData | null = partnerId ? teams[partnerId] || null : null;
  const isShared = !!partnerId;

  return (
    <div className={`team-panel ${visible ? 'visible' : ''}`}>
      {teamData && (
        <>
          <div className="team-panel-header">
            <button className="close-btn" onClick={onBack} aria-label="Close" title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="team-panel-badge">BUILDATHON 2026</div>

            {isShared ? (
              <>
                <div className="team-panel-table" style={{ marginTop: '0.3rem' }}>
                  SHARED TABLE {tableId} / {partnerId}
                </div>
              </>
            ) : (
              <>
                <h2 className="team-panel-name">{teamData.teamName}</h2>
                <div className="team-panel-table">TABLE {teamData.table}</div>
              </>
            )}
          </div>

          <div className="team-panel-body">
            {isShared ? (
              <>
                {/* ── Team A Section ── */}
                <div className="team-panel-section shared-team-block">
                  <div className="shared-team-header">
                    <span className="shared-team-id">{tableId}</span>
                    <span className="shared-team-name">{teamData.teamName}</span>
                  </div>
                  <h3 className="team-panel-section-title">
                    Team Members ({teamData.members.length})
                  </h3>
                  {teamData.members.map((member, index) => (
                    <div key={index} className="team-member">
                      <span className="team-member-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="team-member-info">
                        <div className="team-member-name">{member.name}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Divider ── */}
                <div className="shared-divider">
                  <span className="shared-divider-line" />
                  <span className="shared-divider-line" />
                </div>

                {/* ── Team B Section ── */}
                {partnerData && (
                  <div className="team-panel-section shared-team-block">
                    <div className="shared-team-header">
                      <span className="shared-team-id">{partnerId}</span>
                      <span className="shared-team-name">{partnerData.teamName}</span>
                    </div>
                    <h3 className="team-panel-section-title">
                      Team Members ({partnerData.members.length})
                    </h3>
                    {partnerData.members.map((member, index) => (
                      <div key={index} className="team-member">
                        <span className="team-member-number">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="team-member-info">
                          <div className="team-member-name">{member.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* ── Single Table — standard layout ── */
              <div className="team-panel-section">
                <h3 className="team-panel-section-title">Team Members ({teamData.members.length})</h3>
                {teamData.members.map((member, index) => (
                  <div key={index} className="team-member">
                    <span className="team-member-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="team-member-info">
                      <div className="team-member-name">{member.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="team-panel-footer">
            <button className="back-btn" onClick={onBack}>
              <span className="arrow">←</span>
              <span>Back to Auditorium</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default TeamPanel;
