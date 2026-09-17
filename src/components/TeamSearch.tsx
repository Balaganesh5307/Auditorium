import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { useAdmin } from '../context/AdminContext';

interface TeamSearchProps {
  onTableSelect: (tableId: string) => void;
  visible: boolean;
}

const TeamSearch = memo(function TeamSearch({ onTableSelect, visible }: TeamSearchProps) {
  const { teams, rows, cols, numTables } = useAdmin();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Set of valid, active table IDs in the current auditorium layout (e.g. A1 to J6)
  const activeTableSet = useMemo(() => {
    const set = new Set<string>();
    let count = 0;
    const safeRows = rows && rows.length > 0 ? rows : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const safeCols = cols && cols.length > 0 ? cols : [1, 2, 3, 4, 5, 6];
    const totalLimit = numTables ?? (safeRows.length * safeCols.length);

    for (const r of safeRows) {
      for (const c of safeCols) {
        if (count >= totalLimit) break;
        set.add(`${r}${c}`);
        count++;
      }
      if (count >= totalLimit) break;
    }
    return set;
  }, [rows, cols, numTables]);

  // Search through teams by team name or table ID — strictly limited to active tables
  const results = query.trim().length > 0
    ? Object.entries(teams)
        .filter(([tableId, team]) => {
          if (!activeTableSet.has(tableId)) return false;
          const q = query.toLowerCase().trim();
          return (
            team.teamName.toLowerCase().includes(q) ||
            tableId.toLowerCase().includes(q)
          );
        })
        .slice(0, 6) // Limit to 6 results
    : [];

  const showResults = isFocused && results.length > 0;

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleSelect = useCallback(
    (tableId: string) => {
      setQuery('');
      setIsFocused(false);
      inputRef.current?.blur();
      onTableSelect(tableId);
    },
    [onTableSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showResults) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex][0]);
      } else if (e.key === 'Escape') {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    },
    [showResults, results, selectedIndex, handleSelect]
  );

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!visible) return null;

  return (
    <div className="team-search-container">
      <div className={`team-search ${isFocused ? 'focused' : ''}`}>
        <div className="team-search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          className="team-search-input"
          placeholder="Find your team..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            className="team-search-clear"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {showResults && (
        <div className="team-search-results" ref={resultsRef}>
          {results.map(([tableId, team], index) => (
            <button
              key={tableId}
              className={`team-search-result ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(tableId)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="team-search-result-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="team-search-result-info">
                <span className="team-search-result-name">{team.teamName}</span>
                <span className="team-search-result-table">Table {tableId}</span>
              </div>
              <span className="team-search-result-arrow">→</span>
            </button>
          ))}
        </div>
      )}

      {isFocused && query.trim().length > 0 && results.length === 0 && (
        <div className="team-search-results" ref={resultsRef}>
          <div className="team-search-no-results">
            No teams found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
});

export default TeamSearch;
