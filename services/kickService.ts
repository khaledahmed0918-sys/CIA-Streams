import type { Channel, KickApiResponse } from '../types';

// --- IMPORTANT ---
// This is a client-side implementation and is NOT recommended for production.
// A backend proxy should be used to handle API keys, caching, and rate limits to avoid CORS issues and exposure of secrets.
// This implementation is for demonstration purposes only.

const DEFAULT_PROFILE_PIC = 'https://i.postimg.cc/QNW4B8KQ/00WZrbng.png'; // Using the favicon as a fallback

/**
 * Extracts a clean username from a string, which can be a username or a full Kick URL.
 * @param input The string to parse.
 * @returns The extracted username.
 */
const extractUsername = (input: string): string => {
    if (input.includes('kick.com/')) {
        // Find the last part of the path, removing query params or fragments
        return input.split('/').pop()?.split('?')[0].split('#')[0] || input;
    }
    return input;
};


/**
 * Fetches data for a single Kick channel, preserving the original username case.
 * @param originalUsername The Kick username with its intended capitalization.
 * @returns A Promise that resolves to a Channel object.
 */
const fetchKickChannel = async (originalUsername: string): Promise<Channel> => {
  const url = `https://kick.com/api/v1/channels/${originalUsername}`;
  try {
    const response = await fetch(url);

    if (response.status === 404) {
       throw new Error(`User not found: ${originalUsername}`);
    }
    if (!response.ok) {
      throw new Error(`API error for ${originalUsername}: ${response.status}`);
    }
    
    const data = await response.json();

    if (!data.user) {
        throw new Error(`User data not found for: ${originalUsername}`);
    }

    const isLive = data.livestream !== null;

    let lastStreamStartTime = null;
    if (!isLive) {
      try {
        const videosUrl = `https://kick.com/api/v2/channels/${originalUsername}/videos`;
        // Using a CORS proxy to bypass client-side fetch restrictions.
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(videosUrl)}`;
        const videosResponse = await fetch(proxyUrl);
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          if (videosData && videosData.length > 0 && videosData[0].created_at) {
            lastStreamStartTime = videosData[0].created_at;
          }
        }
      } catch (videoError) {
        console.error(`Failed to fetch recent videos for ${originalUsername}:`, videoError);
      }
    }
    
    // Fallback if video fetch fails or returns no videos
    if (!lastStreamStartTime && !isLive && data.previous_livestreams && data.previous_livestreams.length > 0) {
      lastStreamStartTime = data.previous_livestreams[0].start_time;
    }

    const socialLinks: { [key: string]: string } = {};
    if (data.user?.twitter) socialLinks.twitter = data.user.twitter;
    if (data.user?.youtube) socialLinks.youtube = data.user.youtube;
    if (data.user?.instagram) socialLinks.instagram = data.user.instagram;
    if (data.user?.discord) socialLinks.discord = data.user.discord;

    return {
      username: originalUsername,
      display_name: originalUsername,
      profile_pic: data.user.profile_pic || DEFAULT_PROFILE_PIC,
      is_live: isLive,
      live_title: data.livestream?.session_title || null,
      viewer_count: data.livestream?.viewer_count ?? null,
      live_since: data.livestream?.start_time || null,
      last_stream_start_time: lastStreamStartTime,
      live_url: `https://kick.com/${originalUsername}`,
      profile_url: `https://kick.com/${originalUsername}`,
      bio: data.user.bio || null,
      followers_count: data.followers_count ?? null,
      banner_image: data.banner_image?.url || null,
      live_category: data.livestream?.category?.name || null,
      social_links: socialLinks,
    };
  } catch (error) {
    console.error(`Failed to fetch data for ${originalUsername}:`, error);
    // Return a default error state for this channel so the UI can handle it gracefully
    return {
      username: originalUsername,
      display_name: originalUsername,
      profile_pic: DEFAULT_PROFILE_PIC,
      is_live: false,
      live_title: null,
      viewer_count: null,
      live_since: null,
      last_stream_start_time: null,
      live_url: `https://kick.com/${originalUsername}`,
      profile_url: `https://kick.com/${originalUsername}`,
      error: true, // Flag for the UI
      last_checked_at: new Date().toISOString(),
      bio: null,
      followers_count: null,
      banner_image: null,
      live_category: null,
    };
  }
};

/**
 * Fetches statuses for multiple Kick channels in parallel.
 * @param streamers An array of Kick streamer configurations.
 * @returns A Promise that resolves to a KickApiResponse object.
 */
export const fetchChannelStatuses = async (streamers: { username: string; tags: string[]; character: string }[]): Promise<KickApiResponse> => {
  const channelDataPromises = streamers.map(async (streamerConfig) => {
    const username = extractUsername(streamerConfig.username);
    const channelData = await fetchKickChannel(username);
    return {
      ...channelData,
      // Merge original metadata from the constants file
      tags: streamerConfig.tags,
      character: streamerConfig.character,
    };
  });
  const results = await Promise.all(channelDataPromises);

  return {
    checked_at: new Date().toISOString(),
    data: results,
  };
};
