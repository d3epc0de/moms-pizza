import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isMock = supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
