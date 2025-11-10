import React from 'react';
import type { Channel } from './types';
import { useLocalization } from './hooks/useLocalization';
import { humanizeTime, formatFullDateTime } from './utils/time';

interface StreamerModalProps {
  streamer: Channel | null;
  onClose: () => void;
}

// Helper function to build full social media URLs
const buildSocialLink = (platform: string, handleOrUrl: string): string => {
  // If it's already a full URL, return it
  if (handleOrUrl.startsWith('http')) {
    return handleOrUrl;
  }
  // Handle protocol-relative URLs
  if (handleOrUrl.startsWith('//')) {
    return `https:${handleOrUrl}`;
  }

  // Sanitize handle to remove leading characters that might break the URL
  const cleanHandle = handleOrUrl.replace(/^[@/]/, '');

  switch (platform) {
    case 'twitter':
      return `https://x.com/${cleanHandle}`;
    case 'youtube':
      return `https://www.youtube.com/${cleanHandle}`;
    case 'instagram':
      return `https://www.instagram.com/${cleanHandle}`;
    case 'discord':
      return `https://discord.gg/${cleanHandle}`;
    default:
      // A reasonable fallback for other platforms
      return `https://${platform}.com/${cleanHandle}`;
  }
};


export const StreamerModal: React.FC<StreamerModalProps> = ({ streamer, onClose }) => {
  const { t, language } = useLocalization();
  if (!streamer) return null;
  
  const socialMediaMetadata: { [key: string]: { name: string; icon: React.ReactElement } } = {
    twitter: {
      name: t('socialTwitter'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    youtube: {
      name: t('socialYoutube'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.268,4,12,4,12,4S5.732,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.732,2,12,2,12s0,4.268,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.732,20,12,20,12,20s6.268,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.268,22,12,22,12S22,7.732,21.582,6.186z M9.999,15.199V8.801l5.199,3.199L9.999,15.199z" />
        </svg>
      ),
    },
    instagram: {
      name: t('socialInstagram'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.585-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.585-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.585.069-4.85c.149-3.225 1.664 4.771 4.919-4.919C8.415 2.175 8.796 2.163 12 2.163zm0 1.802c-3.116 0-3.475.012-4.698.068-2.618.12-3.79 1.28-3.91 3.91-.056 1.222-.067 1.58-.067 4.698s.011 3.475.067 4.698c.12 2.628 1.293 3.79 3.91 3.91 1.222.056 1.58.067 4.698.067s3.475-.011 4.698-.067c2.618-.12 3.79-1.28 3.91-3.91.056-1.222.067-1.58.067-4.698s-.011-3.475-.067-4.698c-.12-2.628-1.293-3.79-3.91-3.91-1.223-.056-1.582-.068-4.698-.068zm0 3.259c-2.455 0-4.45 1.995-4.45 4.45s1.995 4.45 4.45 4.45 4.45-1.995 4.45-4.45-1.995-4.45-4.45-4.45zm0 7.105c-1.465 0-2.655-1.19-2.655-2.655s1.19-2.655 2.655-2.655 2.655 1.19 2.655 2.655-1.19 2.655-2.655 2.655zm4.805-7.305c-.75 0-1.355-.605-1.355-1.355s.605-1.355 1.355-1.355 1.355.605 1.355 1.355-.605 1.355-1.355 1.355z" />
        </svg>
      ),
    },
    discord: {
      name: t('socialDiscord'),
      icon: (
        <img 
            src="https://i.postimg.cc/nrNpXdWK/IMG-7921.webp" 
            alt="Discord Logo" 
            className="h-5 w-5" 
        />
      ),
    },
  };

  const characters = streamer.character?.split('|').map(c => c.trim()).filter(Boolean) || [];
  // FIX: Ensure social link handles are strings to prevent type errors.
  const socialLinks = streamer.social_links ? Object.entries(streamer.social_links).filter(([, handle]) => typeof handle === 'string' && handle) : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="streamer-modal-title"
    >
      <div 
        className="relative w-full max-w-lg bg-slate-200/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
             {streamer.banner_image ? (
                <img src={streamer.banner_image} alt={`${streamer.display_name}'s banner`} className="w-full h-32 object-cover" />
             ) : (
                <div className="w-full h-32 bg-gradient-to-r from-slate-500 to-slate-700 dark:from-slate-800 dark:to-slate-900"></div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-200/80 dark:from-slate-900/80 to-transparent"></div>
        </div>

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-white hover:text-gray-200 transition-colors z-20"
          aria-label={t('close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="relative p-6 -mt-16 z-10 text-black dark:text-white">
            <div className="flex items-end gap-4">
              <img
                src={streamer.profile_pic || 'https://picsum.photos/200'}
                alt={`${streamer.display_name}'s avatar`}
                className="h-24 w-24 rounded-full border-4 border-slate-200 dark:border-slate-900 object-cover"
              />
              <div className="pb-2">
                <h2 id="streamer-modal-title" className="text-3xl font-bold">{streamer.display_name}</h2>
                {streamer.followers_count !== null && !streamer.error && (
                     <div className="flex items-center gap-1.5 text-sm text-black/70 dark:text-white/70">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="font-semibold">{streamer.followers_count.toLocaleString()}</span>
                        <span>{t('followers')}</span>
                    </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                    <dt className="font-bold text-black/60 dark:text-white/60">{t('status')}</dt>
                    <dd className={`flex items-center gap-2 font-semibold ${streamer.is_live ? 'text-green-500' : 'text-red-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${streamer.is_live ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {streamer.is_live ? t('live') : t('offline')}
                    </dd>
                </div>
                <div>
                     <dt className="font-bold text-black/60 dark:text-white/60">{streamer.is_live ? t('liveFor', {time: ''}).trim() : t('lastSeen')}</dt>
                     <dd>{streamer.is_live ? humanizeTime(streamer.live_since, language) : (streamer.last_stream_start_time ? formatFullDateTime(streamer.last_stream_start_time, language) : t('noRecentActivity'))}</dd>
                </div>
                {streamer.is_live && streamer.live_category && (
                    <div className="sm:col-span-2">
                        <dt className="font-bold text-black/60 dark:text-white/60">{t('category')}</dt>
                        <dd>{streamer.live_category}</dd>
                    </div>
                )}
            </div>

            {streamer.is_live && streamer.live_title && (
              <div className="mt-4">
                <h3 className="font-bold text-lg mb-1">{t('streamTitle')}</h3>
                <p className="text-black/80 dark:text-white/80 text-sm">{streamer.live_title}</p>
              </div>
            )}

            {streamer.bio && (
              <div className="mt-4">
                <h3 className="font-bold text-lg mb-1">{t('bio')}</h3>
                <p className="text-black/80 dark:text-white/80 italic text-sm">"{streamer.bio}"</p>
              </div>
            )}

            {characters.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold text-lg mb-2">{t('allCharacters')}</h3>
                <div className="flex flex-wrap gap-2">
                  {characters.map(char => (
                    <span key={char} className="rounded-full bg-black/20 dark:bg-white/10 px-3 py-1 text-sm font-semibold">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
             {streamer.tags && streamer.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold text-lg mb-2">{t('tags')}</h3>
                <div className="flex flex-wrap gap-2">
                  {streamer.tags.map(tag => (
                    <span key={tag} className="rounded-full bg-black/20 dark:bg-white/10 px-3 py-1 text-sm font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {socialLinks.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-bold text-lg mb-2">{t('socials')}</h3>
                    <div className="flex flex-wrap gap-2">
                    {socialLinks.map(([platform, handleOrUrl]) => {
                        const metadata = socialMediaMetadata[platform];
                        if (!metadata) return null; // Only show platforms we have metadata for
                        
                        const finalUrl = buildSocialLink(platform, handleOrUrl as string);
                        
                        return (
                        <a
                            key={platform}
                            href={finalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-full bg-black/20 dark:bg-white/10 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-black/30 dark:hover:bg-white/20"
                        >
                            {metadata.icon}
                            <span>{metadata.name}</span>
                        </a>
                        );
                    })}
                    </div>
                </div>
            )}
            
            <a
               href={streamer.is_live ? streamer.live_url! : streamer.profile_url}
               target="_blank"
               rel="noopener noreferrer"
               className="mt-6 w-full text-center block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
           >
               {t('link')}
           </a>

        </div>
      </div>
    </div>
  );
};