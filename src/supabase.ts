import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  class: string;
  stream: string;
  subjects: string[];
  study_goal: string;
  onboarded: boolean;
};

export type WatchHistory = {
  id: string;
  user_id: string;
  video_id: string;
  video_title: string;
  watch_time: number;
  total_duration: number;
  last_watched_at: string;
  subject: string;
};

export type SavedVideo = {
  id: string;
  user_id: string;
  video_id: string;
  title: string;
  thumbnail: string;
  folder: string;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  timestamp: number;
  created_at: string;
};
