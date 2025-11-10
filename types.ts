export interface Channel {
  username: string;
  display_name: string;
  profile_pic: string | null;
  is_live: boolean;
  live_title: string | null;
  viewer_count: number | null;
  live_since: string | null; // ISO8601
  last_stream_start_time: string | null; // ISO8601
  live_url: string | null;
  profile_url: string;
  tags?: string[];
  character?: string;
  characters?: string[];
  error?: boolean; // To indicate stale data
  last_checked_at?: string; // ISO8601 for stale data
  bio?: string;
  followers_count?: number;
  banner_image: string | null;
  live_category: string | null;
  social_links?: { [platform: string]: string };
}

export interface KickApiResponse {
  checked_at: string; // ISO8601
  data: Channel[];
}

export interface ScheduledStream {
  id: string;
  streamerUsername: string;
  startTime: string; // ISO8601
  notes: string;
  characters?: string[];
}
