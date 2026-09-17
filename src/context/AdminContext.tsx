import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { TeamsMap, TeamData } from '../data/teams';
import { teams as defaultTeams } from '../data/teams';
import {
  isSupabaseConfigured,
  fetchTeamsFromDb,
  upsertTeamToDb,
  bulkUpsertTeamsToDb,
  signInAdminWithSupabase,
  signOutAdminFromSupabase,
  getAdminSession,
  supabase,
  type DbTeamRow,
  dbRowToTeamData,
  fetchEventBrandingFromDb,
  saveEventBrandingToDb,
  fetchGridConfigFromDb,
  saveGridConfigToDb,
} from '../lib/supabase';

// Default grid config
const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEFAULT_COLS = [1, 2, 3, 4, 5];
const DEFAULT_NUM_TABLES = 60; // 12 × 5

export const DEFAULT_EVENT_NAME = 'BUILDATHON';
export const DEFAULT_EVENT_DATE = 'September 2026';
export const DEFAULT_EVENT_YEAR = '2026';

export type DbSyncStatus = 'idle' | 'syncing' | 'connected' | 'offline' | 'error';

interface AdminState {
  rows: string[];
  cols: number[];
  numTables: number;
  teams: TeamsMap;
  eventName: string;
  eventDate: string;
  eventYear: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  isDbConfigured: boolean;
  dbStatus: DbSyncStatus;
  dbMessage?: string;
}

interface AdminContextType extends AdminState {
  setGridConfig: (numRows: number, numCols: number, numTables: number) => void;
  setTeamsFromUpload: (data: TeamsMap) => void;
  updateSingleTeam: (tableId: string, teamData: Partial<TeamData>) => Promise<boolean>;
  toggleAdmin: () => void;
  resetToDefaults: () => void;
  updateEventBranding: (name: string, date: string, year: string) => Promise<boolean>;
  syncAllToSupabase: () => Promise<boolean>;
  refreshFromSupabase: () => Promise<boolean>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginAdmin: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

const STORAGE_KEY = 'buildathon_admin_config';
const AUTH_STORAGE_KEY = 'buildathon_admin_auth';

function generateRowLabels(count: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < count && i < 26; i++) {
    labels.push(String.fromCharCode(65 + i)); // A-Z
  }
  return labels;
}

function generateColNumbers(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}

function loadFromStorage(): Partial<AdminState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.rows) && Array.isArray(parsed.cols) && parsed.teams) {
        return {
          rows: parsed.rows.length > 0 ? parsed.rows : DEFAULT_ROWS,
          cols: parsed.cols.length > 0 ? parsed.cols : DEFAULT_COLS,
          numTables: parsed.numTables || DEFAULT_NUM_TABLES,
          teams: parsed.teams || defaultTeams,
          eventName: parsed.eventName || DEFAULT_EVENT_NAME,
          eventDate: parsed.eventDate || DEFAULT_EVENT_DATE,
          eventYear: parsed.eventYear || DEFAULT_EVENT_YEAR,
        };
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveToStorage(state: AdminState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rows: state.rows,
        cols: state.cols,
        numTables: state.numTables,
        teams: state.teams,
        eventName: state.eventName,
        eventDate: state.eventDate,
        eventYear: state.eventYear,
      })
    );
  } catch {
    // Ignore storage errors
  }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();

  const [state, setState] = useState<AdminState>(() => {
    const stored = loadFromStorage();
    const storedAuth = typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true' : false;
    return {
      rows: stored?.rows || DEFAULT_ROWS,
      cols: stored?.cols || DEFAULT_COLS,
      numTables: stored?.numTables || DEFAULT_NUM_TABLES,
      teams: stored?.teams || defaultTeams,
      eventName: stored?.eventName || DEFAULT_EVENT_NAME,
      eventDate: stored?.eventDate || DEFAULT_EVENT_DATE,
      eventYear: stored?.eventYear || DEFAULT_EVENT_YEAR,
      isAdmin: false,
      isAuthenticated: storedAuth,
      isLoginModalOpen: false,
      isDbConfigured: configured,
      dbStatus: configured ? 'syncing' : 'offline',
      dbMessage: configured
        ? 'Connecting to Supabase...'
        : 'Configure VITE_SUPABASE_URL in .env to enable Supabase DB storage',
    };
  });

  // Persist to localStorage only when actual data fields change
  // (not on UI-only state like isAdmin, isLoginModalOpen, dbStatus, etc.)
  useEffect(() => {
    saveToStorage(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rows, state.cols, state.numTables, state.teams, state.eventName, state.eventDate, state.eventYear]);

  // Initial fetch and Realtime sync with Supabase
  useEffect(() => {
    if (!configured || !supabase) {
      setState((prev) => ({
        ...prev,
        isDbConfigured: false,
        dbStatus: 'offline',
        dbMessage: 'Supabase URL not configured in .env',
      }));
      return;
    }

    let isMounted = true;

    async function initSupabaseData() {
      setState((prev) => ({
        ...prev,
        dbStatus: 'syncing',
        dbMessage: 'Fetching data from Supabase...',
      }));

      try {
        const [fetchedTeams, fetchedBranding, fetchedGrid] = await Promise.all([
          fetchTeamsFromDb(),
          fetchEventBrandingFromDb(),
          fetchGridConfigFromDb(),
        ]);

        if (!isMounted) return;

        if (fetchedBranding) {
          setState((prev) => ({
            ...prev,
            eventName: fetchedBranding.eventName,
            eventDate: fetchedBranding.eventDate,
            eventYear: fetchedBranding.eventYear,
          }));
        }

        if (fetchedGrid) {
          setState((prev) => {
            const actualTables = fetchedGrid.numTables;
            const newTeams: TeamsMap = {};
            let count = 0;
            for (const r of fetchedGrid.rows) {
              for (const c of fetchedGrid.cols) {
                if (count >= actualTables) break;
                const tableId = `${r}${c}`;
                if (prev.teams[tableId]) {
                  newTeams[tableId] = prev.teams[tableId];
                } else {
                  newTeams[tableId] = {
                    table: tableId,
                    teamName: `Team ${tableId}`,
                    position: tableId,
                    members: [
                      { name: 'Member 1', role: 'Team Leader' },
                      { name: 'Member 2', role: 'Developer' },
                      { name: 'Member 3', role: 'Designer' },
                      { name: 'Member 4', role: 'Engineer' },
                    ],
                    projectDescription: 'Project description pending',
                  };
                }
                count++;
              }
              if (count >= actualTables) break;
            }
            return {
              ...prev,
              rows: fetchedGrid.rows,
              cols: fetchedGrid.cols,
              numTables: actualTables,
              teams: newTeams,
            };
          });
        }

        if (fetchedTeams && Object.keys(fetchedTeams).length > 0) {
          setState((prev) => ({
            ...prev,
            teams: {
              ...prev.teams,
              ...fetchedTeams,
            },
            dbStatus: 'connected',
            dbMessage: `Connected: Loaded ${Object.keys(fetchedTeams).length} teams from Supabase`,
          }));
        } else {
          // Table exists or is empty -> seed initial teams into Supabase
          setState((prev) => ({
            ...prev,
            dbStatus: 'connected',
            dbMessage: 'Connected to Supabase (Table is ready)',
          }));
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          dbStatus: 'error',
          dbMessage: `Supabase connection error: ${msg}`,
        }));
      }
    }

    initSupabaseData();

    // Subscribe to realtime changes on `teams` table
    const channel = supabase
      .channel('teams-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as DbTeamRow;
            if (row && row.table_id === '_event_branding_') {
              setState((prev) => ({
                ...prev,
                eventName: row.team_name || prev.eventName,
                eventDate: row.position || prev.eventDate,
                eventYear: row.project_description || prev.eventYear,
              }));
            } else if (row && row.table_id === '_grid_config_') {
              try {
                const parsed = JSON.parse(row.team_name);
                if (Array.isArray(parsed.rows) && Array.isArray(parsed.cols)) {
                  setState((prev) => {
                    const actualTables = typeof parsed.numTables === 'number' ? parsed.numTables : parsed.rows.length * parsed.cols.length;
                    const newTeams: TeamsMap = {};
                    let count = 0;
                    for (const r of parsed.rows) {
                      for (const c of parsed.cols) {
                        if (count >= actualTables) break;
                        const tableId = `${r}${c}`;
                        if (prev.teams[tableId]) {
                          newTeams[tableId] = prev.teams[tableId];
                        } else {
                          newTeams[tableId] = {
                            table: tableId,
                            teamName: `Team ${tableId}`,
                            position: tableId,
                            members: [
                              { name: 'Member 1', role: 'Team Leader' },
                              { name: 'Member 2', role: 'Developer' },
                              { name: 'Member 3', role: 'Designer' },
                              { name: 'Member 4', role: 'Engineer' },
                            ],
                            projectDescription: 'Project description pending',
                          };
                        }
                        count++;
                      }
                      if (count >= actualTables) break;
                    }
                    return {
                      ...prev,
                      rows: parsed.rows,
                      cols: parsed.cols,
                      numTables: actualTables,
                      teams: newTeams,
                    };
                  });
                }
              } catch {
                // ignore json error
              }
            } else if (row && row.table_id && !row.table_id.startsWith('_')) {
              const updatedTeam = dbRowToTeamData(row);
              setState((prev) => ({
                ...prev,
                teams: {
                  ...prev.teams,
                  [updatedTeam.table]: updatedTeam,
                },
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase?.removeChannel(channel);
    };
  }, [configured]);

  // Check for active Supabase Auth session on mount and listen to auth state changes
  useEffect(() => {
    if (!configured || !supabase) return;

    let isMounted = true;

    getAdminSession().then((session) => {
      if (isMounted && session?.user) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
        }));
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
        }));
      } else if (event === 'SIGNED_OUT') {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isAdmin: false,
        }));
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [configured]);

  const setGridConfig = useCallback((numRows: number, numCols: number, numTables: number) => {
    const rows = generateRowLabels(numRows);
    const cols = generateColNumbers(numCols);
    const maxTables = numRows * numCols;
    const actualTables = Math.min(numTables, maxTables);

    setState((prev) => {
      const newTeams: TeamsMap = {};
      let count = 0;
      for (const row of rows) {
        for (const col of cols) {
          if (count >= actualTables) break;
          const tableId = `${row}${col}`;
          if (prev.teams[tableId]) {
            newTeams[tableId] = prev.teams[tableId];
          } else {
            newTeams[tableId] = {
              table: tableId,
              teamName: `Team ${tableId}`,
              position: tableId,
              members: [
                { name: 'Member 1', role: 'Team Leader' },
                { name: 'Member 2', role: 'Developer' },
                { name: 'Member 3', role: 'Designer' },
                { name: 'Member 4', role: 'Engineer' },
              ],
              projectDescription: 'Project description pending',
            };
          }
          count++;
        }
        if (count >= actualTables) break;
      }
      return { ...prev, rows, cols, numTables: actualTables, teams: newTeams };
    });

    // Automatically sync grid layout to Supabase DB for all browsers & users
    saveGridConfigToDb(rows, cols, actualTables).catch((e) => {
      console.warn('[Supabase] Failed to persist grid config:', e);
    });
  }, []);

  const setTeamsFromUpload = useCallback((data: TeamsMap) => {
    setState((prev) => {
      const merged = { ...prev.teams };
      for (const [key, value] of Object.entries(data)) {
        merged[key] = value;
      }
      return { ...prev, teams: merged };
    });

    // Also sync to Supabase in background
    bulkUpsertTeamsToDb(data).catch((e) => {
      console.warn('[Supabase] Failed to persist uploaded teams:', e);
    });
  }, []);

  const updateSingleTeam = useCallback(async (tableId: string, teamData: Partial<TeamData>): Promise<boolean> => {
    let targetTeam: TeamData | null = null;

    setState((prev) => {
      const existing = prev.teams[tableId] || {
        table: tableId,
        teamName: `Team ${tableId}`,
        position: tableId,
        members: [
          { name: 'Member 1', role: 'Team Leader' },
          { name: 'Member 2', role: 'Developer' },
          { name: 'Member 3', role: 'Designer' },
          { name: 'Member 4', role: 'Engineer' },
        ],
        projectDescription: 'Project description pending',
      };

      targetTeam = {
        ...existing,
        ...teamData,
        table: tableId,
        position: tableId,
      };

      return {
        ...prev,
        teams: {
          ...prev.teams,
          [tableId]: targetTeam,
        },
      };
    });

    if (!targetTeam) return false;

    // Automatically save to Supabase DB
    try {
      const saved = await upsertTeamToDb(targetTeam);
      if (saved) {
        // Automatically fetch and display latest data from Supabase
        const freshTeams = await fetchTeamsFromDb();
        if (freshTeams && freshTeams[tableId]) {
          setState((prev) => ({
            ...prev,
            teams: {
              ...prev.teams,
              ...freshTeams,
            },
            dbStatus: 'connected',
          }));
        }
        return true;
      }
    } catch (e) {
      console.warn(`[Supabase] Failed to persist team ${tableId}:`, e);
    }
    return false;
  }, []);

  const syncAllToSupabase = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      dbStatus: 'syncing',
      dbMessage: 'Saving all teams to Supabase...',
    }));
    const result = await bulkUpsertTeamsToDb(state.teams);
    setState((prev) => ({
      ...prev,
      dbStatus: result.success ? 'connected' : 'error',
      dbMessage: result.success
        ? `Successfully saved ${Object.keys(prev.teams).length} teams to Supabase!`
        : (result.error || 'Failed to save teams to Supabase. Check table permissions.'),
    }));
    return result.success;
  }, [state.teams]);

  const refreshFromSupabase = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      dbStatus: 'syncing',
      dbMessage: 'Refreshing data from Supabase...',
    }));
    const fetched = await fetchTeamsFromDb();
    if (fetched && Object.keys(fetched).length > 0) {
      setState((prev) => ({
        ...prev,
        teams: {
          ...prev.teams,
          ...fetched,
        },
        dbStatus: 'connected',
        dbMessage: `Successfully loaded ${Object.keys(fetched).length} teams from Supabase!`,
      }));
      return true;
    } else {
      setState((prev) => ({
        ...prev,
        dbStatus: 'connected',
        dbMessage: 'Supabase table is currently empty or not reachable.',
      }));
      return false;
    }
  }, []);

  const openLoginModal = useCallback(() => {
    setState((prev) => ({ ...prev, isLoginModalOpen: true }));
  }, []);

  const closeLoginModal = useCallback(() => {
    setState((prev) => ({ ...prev, isLoginModalOpen: false }));
  }, []);

  const loginAdmin = useCallback(
    async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      if (!configured || !supabase) {
        return {
          success: false,
          error: 'Supabase is not configured. Check VITE_SUPABASE_URL in your .env file.',
        };
      }

      const res = await signInAdminWithSupabase(username, pass);
      if (res.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        }
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isAdmin: true,
          isLoginModalOpen: false,
        }));
        return { success: true };
      }

      return {
        success: false,
        error: res.error || 'Invalid credentials. Please verify your Supabase admin user.',
      };
    },
    [configured]
  );

  const logoutAdmin = useCallback(async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
    await signOutAdminFromSupabase();
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      isAdmin: false,
      isLoginModalOpen: false,
    }));
  }, []);

  const toggleAdmin = useCallback(() => {
    setState((prev) => {
      // If not authenticated, opening admin requires logging in
      if (!prev.isAdmin && !prev.isAuthenticated) {
        return { ...prev, isLoginModalOpen: true };
      }
      return { ...prev, isAdmin: !prev.isAdmin };
    });
  }, []);

  const updateEventBranding = useCallback(
    async (name: string, date: string, year: string): Promise<boolean> => {
      const cleanName = name.trim() || DEFAULT_EVENT_NAME;
      const cleanDate = date.trim() || DEFAULT_EVENT_DATE;
      const cleanYear = year.trim() || DEFAULT_EVENT_YEAR;

      setState((prev) => ({
        ...prev,
        eventName: cleanName,
        eventDate: cleanDate,
        eventYear: cleanYear,
      }));

      try {
        const saved = await saveEventBrandingToDb({
          eventName: cleanName,
          eventDate: cleanDate,
          eventYear: cleanYear,
        });
        return saved;
      } catch (err) {
        console.warn('[Supabase] Failed to save event branding:', err);
        return false;
      }
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rows: DEFAULT_ROWS,
      cols: DEFAULT_COLS,
      numTables: DEFAULT_NUM_TABLES,
      teams: defaultTeams,
      eventName: DEFAULT_EVENT_NAME,
      eventDate: DEFAULT_EVENT_DATE,
      eventYear: DEFAULT_EVENT_YEAR,
      isAdmin: true,
    }));
    saveGridConfigToDb(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_NUM_TABLES).catch(console.warn);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        ...state,
        setGridConfig,
        setTeamsFromUpload,
        updateSingleTeam,
        updateEventBranding,
        toggleAdmin,
        resetToDefaults,
        syncAllToSupabase,
        refreshFromSupabase,
        openLoginModal,
        closeLoginModal,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
