import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { TeamData, TeamsMap } from '../data/teams';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseUrl.includes('your-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 10
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Normalizes an admin username/identifier into an email format accepted by Supabase Auth.
 * If user enters "auditorium", it converts to "auditorium@admin.com".
 */
export function normalizeAdminEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed}@admin.com`;
}

/**
 * Sign in admin user against Supabase Auth using signInWithPassword.
 * Returns a secure JWT session token managed by Supabase.
 */
export async function signInAdminWithSupabase(
  identifier: string,
  pass: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured in .env' };
  }

  const primaryEmail = normalizeAdminEmail(identifier);
  // Also fallback to admin@auditorium.com if username is auditorium
  const emailsToTry = [primaryEmail];
  if (identifier.trim().toLowerCase() === 'auditorium' && !emailsToTry.includes('admin@auditorium.com')) {
    emailsToTry.push('admin@auditorium.com');
  }

  let lastErrorMessage = '';

  for (const email of emailsToTry) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (!error && data?.session) {
        return { success: true };
      }

      if (error) {
        lastErrorMessage = error.message;
      }
    } catch (err: unknown) {
      lastErrorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  return { success: false, error: lastErrorMessage || 'Invalid login credentials' };
}

/**
 * Sign out admin user from Supabase Auth and revoke JWT session.
 */
export async function signOutAdminFromSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Supabase] Sign out error:', err);
  }
}

/**
 * Retrieve current active Supabase session.
 */
export async function getAdminSession() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}


export interface DbTeamRow {
  table_id: string;
  team_name: string;
  position: string;
  members: Array<{ name: string; role: string }>;
  project_description: string;
  updated_at?: string;
}

export function dbRowToTeamData(row: DbTeamRow): TeamData {
  return {
    table: row.table_id,
    teamName: row.team_name,
    position: row.position || row.table_id,
    members: Array.isArray(row.members) ? row.members : [],
    projectDescription: row.project_description || '',
  };
}

export function teamDataToDbRow(team: TeamData): DbTeamRow {
  return {
    table_id: team.table,
    team_name: team.teamName,
    position: team.position || team.table,
    members: team.members,
    project_description: team.projectDescription,
  };
}

/**
 * Fetch all teams from Supabase database table `teams`
 */
export async function fetchTeamsFromDb(): Promise<TeamsMap | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*');

    if (error) {
      console.warn('[Supabase] Failed to fetch teams:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const map: TeamsMap = {};
    for (const row of data as DbTeamRow[]) {
      if (row.table_id && row.table_id.startsWith('_')) continue;
      map[row.table_id] = dbRowToTeamData(row);
    }
    return map;
  } catch (err) {
    console.warn('[Supabase] Network/Client error while fetching teams:', err);
    return null;
  }
}

/**
 * Upsert a single team into Supabase database
 */
export async function upsertTeamToDb(team: TeamData): Promise<boolean> {
  if (!supabase) return false;
  try {
    const row = teamDataToDbRow(team);
    const { error } = await supabase
      .from('teams')
      .upsert(row, { onConflict: 'table_id' });

    if (error) {
      console.warn('[Supabase] Failed to save team:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Error saving team:', err);
    return false;
  }
}

/**
 * Bulk upsert all teams into Supabase database
 */
export async function bulkUpsertTeamsToDb(teamsMap: TeamsMap): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client is not configured' };
  try {
    const rows = Object.values(teamsMap).map(teamDataToDbRow);
    if (rows.length === 0) return { success: true };

    // Batch upsert in chunks of 50 to avoid request size limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('teams')
        .upsert(chunk, { onConflict: 'table_id' });

      if (error) {
        console.warn('[Supabase] Failed to bulk save teams:', error.message);
        let userMessage = error.message;
        if (error.message.includes('schema cache') || error.message.includes('relation "public.teams" does not exist') || error.message.includes('not found')) {
          userMessage = 'Table "teams" does not exist in Supabase yet. Run the SQL schema in Supabase SQL Editor!';
        }
        return { success: false, error: userMessage };
      }
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Supabase] Error bulk saving teams:', err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch grid configuration from Supabase (Rows, Cols, Number of Tables)
 */
export async function fetchGridConfigFromDb(): Promise<{ rows: string[]; cols: number[]; numTables: number } | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('table_id', '_grid_config_')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    try {
      const parsed = JSON.parse(data.team_name);
      if (Array.isArray(parsed.rows) && Array.isArray(parsed.cols)) {
        return {
          rows: parsed.rows,
          cols: parsed.cols,
          numTables: typeof parsed.numTables === 'number' ? parsed.numTables : parsed.rows.length * parsed.cols.length,
        };
      }
    } catch {
      // Ignore JSON parse errors
    }

    return null;
  } catch (err) {
    console.warn('[Supabase] Error fetching grid config:', err);
    return null;
  }
}

/**
 * Save grid configuration to Supabase
 */
export async function saveGridConfigToDb(rows: string[], cols: number[], numTables: number): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = JSON.stringify({
      numRows: rows.length,
      numCols: cols.length,
      numTables,
      rows,
      cols,
    });

    const { error } = await supabase
      .from('teams')
      .upsert({
        table_id: '_grid_config_',
        team_name: payload,
        position: `${rows.length}x${cols.length}`,
        project_description: String(numTables),
        members: [],
      }, { onConflict: 'table_id' });

    if (error) {
      console.warn('[Supabase] Failed to save grid config:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Error saving grid config:', err);
    return false;
  }
}

/**
 * Event Branding Interface (Hackathon name, date, year)
 */
export interface EventBranding {
  eventName: string;
  eventDate: string;
  eventYear: string;
}

/**
 * Fetch Event Branding configuration from Supabase
 */
export async function fetchEventBrandingFromDb(): Promise<EventBranding | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('table_id', '_event_branding_')
      .maybeSingle();

    if (error || !data) return null;
    return {
      eventName: data.team_name || 'BUILDATHON',
      eventDate: data.position || 'September 2026',
      eventYear: data.project_description || '2026',
    };
  } catch (err) {
    console.warn('[Supabase] Error fetching event branding:', err);
    return null;
  }
}

/**
 * Save Event Branding configuration to Supabase
 */
export async function saveEventBrandingToDb(branding: EventBranding): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('teams')
      .upsert({
        table_id: '_event_branding_',
        team_name: branding.eventName,
        position: branding.eventDate,
        project_description: branding.eventYear,
        members: [],
      }, { onConflict: 'table_id' });

    if (error) {
      console.warn('[Supabase] Failed to save event branding:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Error saving event branding:', err);
    return false;
  }
}
