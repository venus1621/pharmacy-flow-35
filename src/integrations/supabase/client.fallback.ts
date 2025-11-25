// Fallback Supabase client that tolerates missing Vite envs
// This file is safe to keep in the repo: it only uses the public anon key.
// Prefer importing from "@/integrations/supabase/client" — Vite alias redirects here.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Try Vite envs first, then derive from project id, then hard fallback to known public values
const PROJECT_ID = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || 'tesxhyxhqyilevqksuur';
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || `https://${PROJECT_ID}.supabase.co`;
const SUPABASE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3hoeXhocXlpbGV2cWtzdXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTg1NTIsImV4cCI6MjA3ODg3NDU1Mn0.0WoqG0qTAuxtqHGuPIT8env6rCdOyyTgViZF04ga5BU';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
