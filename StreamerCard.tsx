import React, { useState, useEffect, useRef } from 'react';
import type { Channel } from './types';
import { useLocalization } from './hooks/useLocalization';
import { humanizeTime, formatFullDateTime } from './utils/time';

interface StreamerCardProps {
  streamer: Channel;
  onCardClick: () => void;
  isNotificationSubscribed: boolean;
  onNotificationToggle: (streamerName: string, enabled: boolean) => Promise<void>;
  notificationPermission: NotificationPermission | null;
  isFavorite: boolean;
  onToggleFavorite: (streamerName: string) => void;
}

const FavoriteStar: React.FC<{
    streamerName: string;
    isFavorite: boolean;
    onToggle: (streamerName: string) => void;
}> = ({ streamerName, isFavorite, onToggle }) => {
    const { t } = useLocalization();
    const [isClicked, setIsClicked] = useState(false);
    const prevIsFavoriteRef = useRef(isFavorite);

    useEffect(() => {
        if (prevIsFavoriteRef.current !== isFavorite) {
            setIsClicked(true);
            setTimeout(() => setIsClicked(false), 300);
        }
        prevIsFavoriteRef.current = isFavorite;
    }, [isFavorite]);

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(streamerName);
    };

    const tooltipText = isFavorite ? t('removeFromFavorites') : t('addToFavorites');

    return (
        <div className="group/star relative z-20">
            <button
                onClick={toggle}
                className={`p-2 rounded-full transition-transform duration-200 ease-in-out active:scale-90 ${isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-white'} ${isClicked ? 'animate-star-pop' : ''}`}
                aria-label={tooltipText}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            </button>
            <span className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 scale-0 group-hover/star:scale-100 rounded bg-gray-800 p-2 text-xs text-white transition-all w-max max-w-xs text-center z-20">
                {tooltipText}
            </span>
        </div>
    );
};

const NotificationBell: React.FC<{
    streamerName: string;
    isSubscribed: boolean;
    onToggle: (streamerName: string, enabled: boolean) => Promise<void>;
    notificationPermission: NotificationPermission | null;
}> = ({ streamerName, isSubscribed, onToggle, notificationPermission }) => {
  const { t } = useLocalization();
  const [isClicked, setIsClicked] = useState(false);
  const prevIsSubscribedRef = useRef(isSubscribed);

  useEffect(() => {
    if (prevIsSubscribedRef.current === false && isSubscribed === true) {
      // Just got enabled
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 1000);
    }
    prevIsSubscribedRef.current = isSubscribed;
  }, [isSubscribed]);

  const toggleSubscription = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(streamerName, !isSubscribed);
  };

  const tooltipText = isSubscribed ? t('disableNotificationsForStreamer', {name: streamerName}) : t('enableNotificationsForStreamer', {name: streamerName});

  return (
    <div className="group/bell relative z-20">
      <button 
        onClick={toggleSubscription} 
        className={`p-2 rounded-full transition-transform duration-200 ease-in-out active:scale-90 ${isSubscribed ? 'text-yellow-400' : 'text-gray-400 hover:text-white'} ${isClicked ? 'animate-bell-ring' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={tooltipText}
        disabled={notificationPermission === 'denied' && !isSubscribed}
      >
        {isSubscribed ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )}
      </button>
      <span className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 scale-0 group-hover/bell:scale-100 rounded bg-gray-800 p-2 text-xs text-white transition-all w-max max-w-xs text-center z-20">
        {tooltipText}
      </span>
    </div>
  );
};

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="group/tooltip relative">
    {children}
    <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-800 p-2 text-xs text-white transition-all group-hover/tooltip:scale-100 dark:bg-gray-900 w-max max-w-xs text-center z-50">
      {text}
    </span>
  </div>
);

const StatusBadge: React.FC<{ isLive: boolean; viewerCount: number | null; category: string | null }> = ({ isLive, viewerCount, category }) => {
  const { t } = useLocalization();
  return (
    <div
      className="absolute left-[-0.5rem] top-[-0.5rem] rtl:left-auto rtl:right-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm z-10"
      aria-label={isLive ? t('live') : t('offline')}
      role="status"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse-glow pulse-green' : 'bg-red-500 animate-offline-glow'}`}></span>
      <span className="flex-shrink-0">{isLive ? t('live') : t('offline')}</span>
      {isLive && viewerCount !== null && (
        <>
          <span className="text-white/30">|</span>
          <div className="flex items-center gap-1 text-white/80 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>{viewerCount.toLocaleString()}</span>
          </div>
        </>
      )}
      {isLive && category && (
        <>
            <span className="text-white/30">|</span>
            <Tooltip text={category}>
                <span className="truncate max-w-[100px] text-white/80">{category}</span>
            </Tooltip>
        </>
      )}
    </div>
  );
};


export const StreamerCard: React.FC<StreamerCardProps> = ({ streamer, onCardClick, isNotificationSubscribed, onNotificationToggle, notificationPermission, isFavorite, onToggleFavorite }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { t, language } = useLocalization();
  const firstCharacter = streamer.character?.split('|')[0].trim();
  const [justWentLive, setJustWentLive] = useState(false);
  const prevIsLiveRef = useRef(streamer.is_live);

  useEffect(() => {
    if (prevIsLiveRef.current === false && streamer.is_live === true) {
      setJustWentLive(true);
      const timer = setTimeout(() => {
        setJustWentLive(false);
      }, 2000); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
    prevIsLiveRef.current = streamer.is_live;
  }, [streamer.is_live]);
  
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(streamer.profile_url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const tooltipText = streamer.is_live
    ? `${t('liveFor', { time: humanizeTime(streamer.live_since, language) })}`
    : streamer.error
      ? t('lastCheckFailed', { time: formatFullDateTime(streamer.last_checked_at, language) })
      : `${t('lastSeen')} ${formatFullDateTime(streamer.last_stream_start_time, language)}`;

  return (
    <div 
      className={`group relative min-h-[160px] rounded-2xl border border-white/10 bg-white/5 p-5 text-black shadow-lg backdrop-blur-lg transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl dark:text-white dark:border-white/10 dark:bg-black/20 cursor-pointer ${justWentLive ? 'animate-live-glow' : ''}`}
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      aria-label={`${t('viewDetails')} for ${streamer.display_name}`}
      style={{ background: 'var(--card-bg)' }}
    >
      <div className="streamer-card-text" style={{ color: 'var(--text-streamer)' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100 dark:from-white/5"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <StatusBadge isLive={streamer.is_live} viewerCount={streamer.viewer_count} category={streamer.live_category} />
          <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex items-center">
              <FavoriteStar
                  streamerName={streamer.username}
                  isFavorite={isFavorite}
                  onToggle={onToggleFavorite}
              />
              <NotificationBell 
                  streamerName={streamer.username}
                  isSubscribed={isNotificationSubscribed}
                  onToggle={onNotificationToggle}
                  notificationPermission={notificationPermission}
              />
          </div>

          <div className="flex items-center gap-4 pt-8">
            <Tooltip text={tooltipText}>
              <a href={streamer.profile_url} target="_blank" rel="noopener noreferrer" aria-label={`${streamer.display_name}'s profile`} onClick={(e) => e.stopPropagation()}>
                  <img
                    src={streamer.profile_pic || 'https://picsum.photos/200'}
                    alt={`${streamer.display_name}'s avatar`}
                    className="h-16 w-16 rounded-full border-2 border-white/20 object-cover"
                  />
              </a>
            </Tooltip>
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate text-xl font-bold">{streamer.display_name}</h3>
              
              <div className="mt-1 space-y-1">
                {firstCharacter && !streamer.error && (
                  <p className="truncate text-sm opacity-70">
                    <span className="font-semibold">{t('character')}</span> {firstCharacter}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {(streamer.followers_count !== null && !streamer.error) && (
              <Tooltip text={`${streamer.followers_count.toLocaleString()} ${t('followers')}`}>
                  <div className="mt-2 flex items-center gap-1.5 text-sm opacity-70">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="font-semibold">{streamer.followers_count.toLocaleString()}</span>
                      <span>{t('followers')}</span>
                  </div>
              </Tooltip>
          )}

          {streamer.tags && streamer.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {streamer.tags.slice(0, 3).map(tag => (
                <span key={tag} className="rounded-full bg-black/20 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex-grow" />

          <div className="flex items-end justify-between gap-4 mt-2">
              <div className="flex-1 min-w-0 text-sm">
                  {streamer.error ? (
                      <p className="truncate italic text-red-500">{t('failedToLoadData')}</p>
                  ) : streamer.is_live && streamer.live_title ? (
                      <Tooltip text={streamer.live_title}>
                          <p className="truncate cursor-default opacity-80">
                              {streamer.live_title}
                          </p>
                      </Tooltip>
                  ) : !streamer.is_live ? (
                      streamer.bio ? (
                          <Tooltip text={streamer.bio}>
                              <p className="truncate italic opacity-70">"{streamer.bio}"</p>
                          </Tooltip>
                      ) : streamer.last_stream_start_time ? (
                          <p className="opacity-70">
                              <span className="font-semibold">{t('lastSeen')}</span> {formatFullDateTime(streamer.last_stream_start_time, language)}
                          </p>
                      ) : (
                          <p className="opacity-70 italic">{t('noRecentActivity')}</p>
                      )
                  ) : null}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Tooltip text={isCopied ? t('copied') : t('shareProfile')}>
                  <button
                    onClick={handleShareClick}
                    className="flex-shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95"
                    aria-label={t('shareProfile')}
                  >
                    {isCopied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
                <a
                    href={streamer.is_live ? streamer.live_url! : streamer.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95"
                >
                    {t('link')}
                </a>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};