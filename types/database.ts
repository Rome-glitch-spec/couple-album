export type MediaType = 'photo' | 'video' | 'collage';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  owner_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  file_name: string;
  media_type: MediaType;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  caption: string | null;
  taken_at: string | null;
  uploaded_at: string;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_media_id: string | null;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_media_id: string | null;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Collage {
  id: string;
  created_by: string;
  media_id: string | null;
  layout: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Reminder {
  id: string;
  reminder_type: string;
  reminder_day: number;
  reminder_time: string;
  enabled: boolean;
  message: string;
  updated_at: string;
}

export interface AppSettings {
  id: number;
  relationship_start_date: string | null;
  monthsary_day: number;
  notification_settings: { browser: boolean; in_app: boolean };
  updated_at: string;
}

// Minimal Database generic shape so the Supabase client stays typed without
// hand-maintaining the full generated schema. Extend via `supabase gen types`
// for full type safety once the project is linked.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      media: { Row: Media; Insert: Partial<Media>; Update: Partial<Media> };
      albums: { Row: Album; Insert: Partial<Album>; Update: Partial<Album> };
      album_media: {
        Row: { album_id: string; media_id: string; added_at: string };
        Insert: { album_id: string; media_id: string };
        Update: Record<string, never>;
      };
      collections: { Row: Collection; Insert: Partial<Collection>; Update: Partial<Collection> };
      collection_media: {
        Row: { collection_id: string; media_id: string; added_at: string };
        Insert: { collection_id: string; media_id: string };
        Update: Record<string, never>;
      };
      collages: { Row: Collage; Insert: Partial<Collage>; Update: Partial<Collage> };
      reminders: { Row: Reminder; Insert: Partial<Reminder>; Update: Partial<Reminder> };
      app_settings: { Row: AppSettings; Insert: Partial<AppSettings>; Update: Partial<AppSettings> };
    };
  };
}
