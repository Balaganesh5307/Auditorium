import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { parseFile, generateTemplateCSV } from '../utils/sheetParser';

export default function AdminPanel() {
  const {
    isAdmin,
    rows,
    cols,
    numTables,
    teams,
    toggleAdmin,
    logoutAdmin,
    setGridConfig,
    setTeamsFromUpload,
    updateSingleTeam,
    resetToDefaults,
    dbStatus,
    dbMessage,
    syncAllToSupabase,
    refreshFromSupabase,
  } = useAdmin();

  const [numRows, setNumRows] = useState<string | number>(rows.length);
  const [numCols, setNumCols] = useState<string | number>(cols.length);
  const [numTablesInput, setNumTablesInput] = useState<string | number>(numTables);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingTable, setIsSavingTable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute all available active table IDs
  const activeTableIds = useMemo(() => {
    const list: string[] = [];
    let count = 0;
    for (const r of rows) {
      for (const c of cols) {
        if (count >= numTables) break;
        list.push(`${r}${c}`);
        count++;
      }
      if (count >= numTables) break;
    }
    return list;
  }, [rows, cols, numTables]);

  const [selectedTableForEdit, setSelectedTableForEdit] = useState<string>('');
  const [editTeamName, setEditTeamName] = useState('');
  const [editMembers, setEditMembers] = useState<string[]>(['', '', '', '']);

  // Default selected table when grid updates
  useEffect(() => {
    if (activeTableIds.length > 0 && (!selectedTableForEdit || !activeTableIds.includes(selectedTableForEdit))) {
      setSelectedTableForEdit(activeTableIds[0]);
    }
  }, [activeTableIds, selectedTableForEdit]);

  // Sync edit form fields whenever selected table or teams context changes
  useEffect(() => {
    const targetTable = selectedTableForEdit || activeTableIds[0];
    if (!targetTable) return;

    const existing = teams[targetTable];
    if (existing && existing.members && existing.members.length > 0) {
      setEditTeamName(existing.teamName || '');
      setEditMembers(existing.members.slice(0, 4).map((m) => m.name || ''));
    } else {
      setEditTeamName(`Team ${targetTable}`);
      setEditMembers(['Member 1', 'Member 2']);
    }
  }, [selectedTableForEdit, teams, activeTableIds]);

  const handleMemberNameChange = (index: number, value: string) => {
    setEditMembers((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleAddMember = () => {
    if (editMembers.length < 4) {
      setEditMembers((prev) => [...prev, '']);
    }
  };

  const handleRemoveMember = (index: number) => {
    if (editMembers.length > 1) {
      setEditMembers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveTeam = useCallback(async () => {
    if (!selectedTableForEdit) return;
    const validMembers = editMembers
      .map((name) => name.trim())
      .filter((name) => name !== '')
      .map((name, i) => ({ name, role: `Member ${i + 1}` }));

    const membersToSave = validMembers.length > 0 ? validMembers : [
      { name: 'Member 1', role: 'Member 1' },
    ];

    setIsSavingTable(true);
    try {
      const saved = await updateSingleTeam(selectedTableForEdit, {
        teamName: editTeamName.trim() || `Team ${selectedTableForEdit}`,
        projectDescription: '',
        members: membersToSave,
      });

      if (saved) {
        setUploadStatus(`Saved details for Table ${selectedTableForEdit} to DB & updated display!`);
      } else {
        setUploadStatus(`Saved details for Table ${selectedTableForEdit} (${membersToSave.length} member${membersToSave.length > 1 ? 's' : ''})!`);
      }
      setError(null);
      setTimeout(() => setUploadStatus(null), 3000);
    } catch {
      setError(`Failed to save details for Table ${selectedTableForEdit}`);
    } finally {
      setIsSavingTable(false);
    }
  }, [selectedTableForEdit, editTeamName, editMembers, updateSingleTeam]);

  // Sync state if context changes externally
  useEffect(() => {
    setNumRows(rows.length);
    setNumCols(cols.length);
    setNumTablesInput(numTables);
  }, [rows.length, cols.length, numTables]);

  const parsedR = Math.min(26, Math.max(1, parseInt(String(numRows), 10) || 1));
  const parsedC = Math.min(10, Math.max(1, parseInt(String(numCols), 10) || 1));
  const maxTables = parsedR * parsedC;
  const parsedT = Math.min(maxTables, Math.max(1, parseInt(String(numTablesInput), 10) || maxTables));

  const handleApplyGrid = useCallback(() => {
    setNumRows(parsedR);
    setNumCols(parsedC);
    setNumTablesInput(parsedT);
    setGridConfig(parsedR, parsedC, parsedT);
    setUploadStatus('Grid updated successfully!');
    setError(null);
    setTimeout(() => setUploadStatus(null), 3000);
  }, [parsedR, parsedC, parsedT, setGridConfig]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);
      setUploadStatus(`Processing ${file.name}...`);

      try {
        const teamsData = await parseFile(file);
        const count = Object.keys(teamsData).length;
        setTeamsFromUpload(teamsData);
        setUploadStatus(`Successfully loaded ${count} teams from ${file.name}`);
      } catch (err: any) {
        setError(err.message || 'Failed to parse file');
        setUploadStatus(null);
      } finally {
        setUploading(false);
        // Reset file input so the same file can be re-uploaded
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [setTeamsFromUpload]
  );

  const handleDownloadTemplate = useCallback(() => {
    const csv = generateTemplateCSV(rows, cols);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buildathon_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, cols]);

  const handleDownloadCSVBackup = useCallback(() => {
    const headers = ['Table,Team Name,Member 1,Member 2,Member 3,Member 4'];
    const rowLines = activeTableIds.map((tableId) => {
      const t = teams[tableId] || {
        table: tableId,
        teamName: `Team ${tableId}`,
        members: [],
      };
      const m = (t.members || []).map((mem) => `"${(mem.name || '').replace(/"/g, '""')}"`);
      while (m.length < 4) m.push('""');
      return `"${t.table}","${(t.teamName || '').replace(/"/g, '""')}",${m.slice(0, 4).join(',')}`;
    });
    const csvContent = [headers, ...rowLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buildathon_${activeTableIds.length}_teams_backup.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [teams, activeTableIds]);

  const handleReset = useCallback(() => {
    resetToDefaults();
    setNumRows(12);
    setNumCols(5);
    setNumTablesInput(60);
    setUploadStatus('Reset to defaults!');
    setError(null);
    setTimeout(() => setUploadStatus(null), 3000);
  }, [resetToDefaults]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        const fakeEvent = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(fakeEvent);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <>
      {/* Admin Panel (Accessible only via hidden 10-click Easter egg login) */}
      <div className={`admin-panel ${isAdmin ? 'open' : ''}`}>
        <div className="admin-panel-header">
          <div className="admin-header-title-wrap">
            <h3>Admin Panel</h3>
            <span className="admin-auth-badge">Auditorium</span>
          </div>
          <div className="admin-header-actions">
            <button
              className="admin-logout-btn"
              onClick={logoutAdmin}
              title="Log out and lock Admin Panel"
            >
              <span className="logout-icon">🚪</span>
              <span>Logout</span>
            </button>
            <button
              className="admin-close-btn"
              onClick={toggleAdmin}
              title="Close Admin Panel"
              aria-label="Close Admin Panel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="admin-panel-body">
          {/* Supabase Cloud Database Status */}
          <div className="db-sync-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                Supabase Database
              </span>
              <span className={`db-status-badge ${dbStatus}`}>
                ● {dbStatus.toUpperCase()}
              </span>
            </div>
            {dbMessage && (
              <p className="admin-hint" style={{ marginBottom: '0.6rem', fontSize: '0.73rem', color: '#64748b' }}>
                {dbMessage}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={refreshFromSupabase}
                style={{ flex: 1, fontSize: '0.72rem', padding: '0.4rem' }}
                title="Fetch latest tables from Supabase"
              >
                🔄 Refresh from DB
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={syncAllToSupabase}
                style={{ flex: 1, fontSize: '0.72rem', padding: '0.4rem' }}
                title="Push all tables to Supabase"
              >
                ☁️ Push All to DB
              </button>
            </div>
          </div>

          {/* Grid Configuration */}
          <div className="admin-section">
            <h4 className="admin-section-title">Grid Configuration</h4>
            <div className="admin-grid-inputs">
              <div className="admin-input-group">
                <label>Rows (A-Z)</label>
                <input
                  type="number"
                  min={1}
                  max={26}
                  value={numRows}
                  onChange={(e) => setNumRows(e.target.value)}
                />
              </div>
              <div className="admin-input-group">
                <label>Columns</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={numCols}
                  onChange={(e) => setNumCols(e.target.value)}
                />
              </div>
              <div className="admin-input-group">
                <label>Tables</label>
                <input
                  type="number"
                  min={1}
                  max={maxTables}
                  value={numTablesInput}
                  onChange={(e) => setNumTablesInput(e.target.value)}
                />
              </div>
            </div>
            <button className="admin-btn admin-btn-primary" onClick={handleApplyGrid}>
              Apply Layout ({parsedT} of {maxTables} tables)
            </button>
          </div>

          {/* File Upload */}
          <div className="admin-section">
            <h4 className="admin-section-title">Upload Team Data</h4>
            <p className="admin-hint">
              Accepts CSV, Excel, PDF, or Image files
            </p>

            <div
              className={`admin-dropzone ${uploading ? 'uploading' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="admin-spinner" />
              ) : (
                <>
                  <span className="admin-dropzone-icon">📄</span>
                  <span>Drop file here or click to browse</span>
                  <span className="admin-dropzone-formats">.csv .xlsx .pdf .png .jpg</span>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp,.bmp"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '8px', marginTop: '0.4rem' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={handleDownloadTemplate}
                style={{ flex: 1, marginBottom: 0, fontSize: '0.72rem', padding: '0.5rem 0.6rem' }}
              >
                ↓ CSV Template
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={handleDownloadCSVBackup}
                style={{ flex: 1, marginBottom: 0, fontSize: '0.72rem', padding: '0.5rem 0.6rem' }}
                title="Export current 60 teams to CSV"
              >
                💾 Export CSV Backup
              </button>
            </div>
          </div>

          {/* Manual Team Details Editor */}
          <div className="admin-section">
            <h4 className="admin-section-title">Manual Team Editor</h4>
            <p className="admin-hint">Select a table to edit or insert team details</p>

            <div className="admin-input-group" style={{ marginBottom: '0.8rem' }}>
              <label>Select Table</label>
              <select
                className="admin-select"
                value={selectedTableForEdit}
                onChange={(e) => setSelectedTableForEdit(e.target.value)}
              >
                {activeTableIds.map((id) => (
                  <option key={id} value={id}>
                    Table {id} ({teams[id]?.teamName || `Team ${id}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-input-group" style={{ marginBottom: '0.8rem' }}>
              <label>Team Name</label>
              <input
                type="text"
                placeholder="e.g. ESPADA / Nova Squad"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
              />
            </div>

            <div className="admin-members-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#444', margin: 0 }}>
                  Team Members ({editMembers.length}/4)
                </label>
                {editMembers.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--red)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    + Add Member
                  </button>
                )}
              </div>

              {editMembers.map((name, idx) => (
                <div key={idx} className="admin-member-single-row" style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder={`Member ${idx + 1} Name`}
                    value={name}
                    onChange={(e) => handleMemberNameChange(idx, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {editMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      title="Remove member"
                      style={{
                        background: '#f0f0f0',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#666',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSaveTeam}
              disabled={isSavingTable}
              style={{ marginTop: '0.8rem' }}
            >
              {isSavingTable
                ? `💾 Saving Table ${selectedTableForEdit} to DB...`
                : `💾 Save Details for Table ${selectedTableForEdit}`}
            </button>
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className="admin-status success">{uploadStatus}</div>
          )}
          {error && (
            <div className="admin-status error">{error}</div>
          )}

          {/* Current Info */}
          <div className="admin-section">
            <h4 className="admin-section-title">Current Layout</h4>
            <p className="admin-info">
              {rows.length} rows × {cols.length} columns = {rows.length * cols.length} tables
            </p>
            <p className="admin-info">
              Rows: {rows[0]} – {rows[rows.length - 1]}
            </p>
          </div>

          {/* Reset */}
          <div className="admin-section">
            <button className="admin-btn admin-btn-danger" onClick={handleReset}>
              ↻ Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
