import { memo } from 'react';
import { useAdmin } from '../context/AdminContext';
import type { TeamData } from '../data/teams';

interface TeamPanelProps {
  tableId: string | null;
  visible: boolean;
  onBack: () => void;
}

const TeamPanel = memo(function TeamPanel({ tableId, visible, onBack }: TeamPanelProps) {
  const { teams } = useAdmin();
  const teamData: TeamData | null = tableId ? teams[tableId] || null : null;

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
            <h2 className="team-panel-name">{teamData.teamName}</h2>
            <div className="team-panel-table">TABLE {teamData.table}</div>
          </div>

          <div className="team-panel-body">
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
