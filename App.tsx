
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchKickChannel, extractUsername } from './services/kickService';
import type { KickApiResponse, Channel } from './types';
import { KICK_STREAMERS, POLLING_INTERVAL_SECONDS, ENABLE_APPLY_SECTION, ENABLE_SHARE_STREAM_VIEW } from './constants';
import { StreamerCard } from './StreamerCard';
import { ThemeToggle } from './components/ThemeToggle';
import { TagFilter } from './components/TagFilter';
import { useLocalization } from './hooks/useLocalization';
import { requestNotificationPermission, showLiveNotification } from './utils/notificationManager';
import { StreamerModal } from './StreamerModal';
import { quranicVerses } from './data/quranicVerses';
import type { QuranicVerse as VerseType } from './data/quranicVerses';
import { QuranicVerse } from './components/QuranicVerse';
import { ScheduledStreams } from './components/ScheduledStreams';
import { Sidebar } from './components/Sidebar';
import { useFavorites } from './hooks/useFavorites';
import { EnrichedScheduledStream } from './components/ScheduledStreamCard';
import { MultiStreamSelector } from './components/MultiStreamSelector';
import { ShareStreamView, WindowData } from './components/ShareStreamView';
import { TutorialModal } from './components/TutorialModal';

// --- Intro Animation Component ---
const IntroAnimation: React.FC<{ onComplete: () => void, progress: number }> = ({ onComplete, progress }) => {
  const [stage, setStage] = useState<'falling' | 'assembled' | 'spinning' | 'opening'>('falling');
  const [pieces, setPieces] = useState<Array<{x: number, y: number, r: number, delay: number, s: number}>>([]);
  const [userClickedContinue, setUserClickedContinue] = useState(false);
  
  // 8x8 Grid (64 pieces)
  const rows = 8;
  const cols = 8;
  const totalPieces = rows * cols;

  useEffect(() => {
    // Generate random starting positions for pieces
    const newPieces = Array.from({ length: totalPieces }).map(() => ({
      x: (Math.random() - 0.5) * window.innerWidth * 1.2, 
      y: (Math.random() - 0.5) * window.innerHeight * 1.2,
      r: (Math.random() - 0.5) * 360, 
      delay: Math.random() * 0.3, 
      s: Math.random() * 2 + 0.5, 
    }));
    setPieces(newPieces);

    // Timeline
    // t1: Start assembling nicely
    const t1 = setTimeout(() => setStage('assembled'), 100); 
    
    // t2: Start spinning after assembly
    const t2 = setTimeout(() => setStage('spinning'), 2500); 

    return () => {
      clearTimeout(t1); clearTimeout(t2);
    };
  }, [totalPieces]);

  // Logic to trigger opening: either progress is 100 OR user clicked continue
  useEffect(() => {
    if (stage === 'opening') return;

    // Auto open if loaded and spinning started (to avoid opening before logo is formed)
    if (progress >= 100 && (stage === 'assembled' || stage === 'spinning') && !userClickedContinue) {
        // Add a small delay if it loaded super fast so user sees the logo
        const delay = stage === 'assembled' ? 2000 : 500;
        const t = setTimeout(() => setStage('opening'), delay);
        return () => clearTimeout(t);
    }

    // Manual open
    if (userClickedContinue) {
        setStage('opening');
    }
  }, [progress, stage, userClickedContinue]);

  // Cleanup after opening animation finishes
  useEffect(() => {
      if (stage === 'opening') {
          const t = setTimeout(() => {
              onComplete();
          }, 1000); // Wait for curtain animation
          return () => clearTimeout(t);
      }
  }, [stage, onComplete]);

  const handleContinue = () => {
      setUserClickedContinue(true);
  };

  // Image URL
  const logoUrl = "https://i.postimg.cc/g2mhxC8q/vas_AGbotko-OBs.png";

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${stage === 'opening' ? 'pointer-events-none' : ''}`}>
       {/* Left Curtain */}
       <div 
         className={`absolute top-0 left-0 h-full w-1/2 bg-[#141e30] transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] origin-left z-0`}
         style={{ transform: stage === 'opening' ? 'translateX(-100%)' : 'translateX(0)' }}
       />
       {/* Right Curtain */}
       <div 
         className={`absolute top-0 right-0 h-full w-1/2 bg-[#141e30] transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] origin-right z-0`}
         style={{ transform: stage === 'opening' ? 'translateX(100%)' : 'translateX(0)' }}
       />

       {/* Content Container */}
       <div 
         className="relative z-10 flex flex-col items-center justify-center gap-10 transition-all duration-500"
         style={{ 
            opacity: stage === 'opening' ? 0 : 1,
            transform: stage === 'opening' ? 'scale(1.1)' : 'scale(1)'
         }}
       >
           {/* Logo Container */}
           <div 
              className={`relative w-64 h-64 transition-all ease-in-out rounded-full overflow-hidden`}
              style={{ 
                transform: stage === 'spinning' ? 'rotate(360deg)' : 'rotate(0deg)',
                transitionDuration: stage === 'spinning' ? '1.5s' : '0.8s'
              }}
           >
             {pieces.map((p, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const width = 100 / cols;
                const height = 100 / rows;
                const bgX = (col / (cols - 1)) * 100;
                const bgY = (row / (rows - 1)) * 100;

                const isFalling = stage === 'falling';

                return (
                  <div 
                    key={i}
                    className="absolute shadow-sm"
                    style={{
                      top: `${row * (100 / rows)}%`,
                      left: `${col * (100 / cols)}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      backgroundImage: `url(${logoUrl})`,
                      backgroundSize: `${cols * 100}% ${rows * 100}%`,
                      backgroundPosition: `${bgX}% ${bgY}%`,
                      // Improved cubic-bezier for "gathering nicely"
                      transition: `all 2s cubic-bezier(0.34, 1.56, 0.64, 1)`, 
                      transform: isFalling 
                        ? `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.r}deg) scale(${p.s})` 
                        : `translate3d(0, 0, 0) rotate(0deg) scale(1)`,
                      opacity: isFalling ? 0 : 1,
                      transitionDelay: isFalling ? `${p.delay}s` : '0s',
                      willChange: 'transform, opacity'
                    }}
                  />
                );
             })}
           </div>

           {/* Loading Section (Below Logo) */}
           <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                {/* Loading Bar */}
                <div className="w-72 flex flex-col gap-2">
                    <div className="flex justify-between text-white/80 font-mono text-sm font-bold">
                        <span>LOADING DATA</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-4 w-full bg-gray-900/60 rounded-full border border-white/10 backdrop-blur-sm overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-300 ease-out relative" 
                            style={{ width: `${progress}%` }} 
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleContinue}
                    className="group relative px-10 py-3 overflow-hidden rounded-[30px] bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold tracking-widest uppercase transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Continue
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
                </button>
           </div>
       </div>
    </div>
  );
};


// LanguageToggle Component
const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLocalization();
  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-full bg-black/10 dark:bg-white/10 text-black dark:text-white backdrop-blur-sm transition-colors"
      aria-label={t('switchToLang', { lang: language === 'en' ? t('lang_ar') : t('lang_en') })}
    >
      <span className="font-bold text-lg">{language === 'en' ? 'AR' : 'EN'}</span>
    </button>
  );
};

// NotificationsToggle Component
const NotificationsToggle: React.FC<{enabled: boolean, onToggle: (e: boolean) => void, permission: NotificationPermission | null}> = ({ enabled, onToggle, permission }) => {
  const { t } = useLocalization();
  const tooltipText = permission === 'denied' 
    ? t('notificationsBlocked') 
    : enabled ? t('notificationsDisable') : t('notificationsEnable');

  return (
    <div className="group relative">
      <button
        onClick={() => onToggle(!enabled)}
        disabled={permission === 'denied'}
        className="p-2 rounded-full bg-black/10 dark:bg-white/10 text-black dark:text-white backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={tooltipText}
      >
        {enabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9m-9 4l18-18" />
          </svg>
        )}
      </button>
      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 rounded bg-gray-900 p-2 text-xs text-white transition-all w-max max-w-xs text-center z-20">
        {tooltipText}
      </span>
    </div>
  );
};

// ApplySection Component
const ApplySection: React.FC = () => {
    const { t } = useLocalization();
    const [layoutType] = useState(() => Math.random() < 0.5 ? 'layout1' : 'layout2');

    const experiences = useMemo(() => [
        { key: 'experienceTag1', text: t('experienceTag1') },
        { key: 'experienceTag2', text: t('experienceTag2') },
        { key: 'experienceTag3', text: t('experienceTag3') },
        { key: 'experienceTag4', text: t('experienceTag4') },
    ].sort((a, b) => b.text.length - a.text.length), [t]);

    const ExperienceTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="bg-black/10 dark:bg-white/10 rounded-lg px-4 py-2 text-center font-semibold text-base text-black dark:text-white">
            {children}
        </div>
    );
    
    return (
        <section id="apply-section" className="container mx-auto px-4 pb-8">
            <div className="w-full max-w-6xl mx-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 p-8 shadow-lg backdrop-blur-lg transition-all duration-300 ease-in-out hover:shadow-2xl overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-black dark:text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {t('applyTitleOutOfRp')}
                </h2>

                {layoutType === 'layout1' ? (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                        {/* Left Column: Note */}
                        <div className="flex flex-col text-center lg:text-left rtl:lg:text-right">
                            <div>
                                <h3 className="text-3xl font-bold mb-2 text-black dark:text-white">{t('noteTitle')}</h3>
                                <p className="text-lg text-gray-900 dark:text-white">{t('noteText')}</p>
                            </div>
                            <img 
                                src={"https://i.postimg.cc/Ss3Rz0gj/Bs-BKXFTQ.png"}
                                alt="Field Report Example"
                                className="w-[600px] h-auto max-w-none rounded-xl shadow-lg mt-auto object-cover -translate-x-[75px] -translate-y-[-29px]"
                            />
                        </div>
                        
                        {/* Center Column: Image and Button */}
                        <div className="flex flex-col items-center justify-center gap-6 order-first lg:order-none">
                            <img 
                                src="https://i.postimg.cc/g2mhxC8q/vas_AGbotko-OBs.png" 
                                alt="CIA Logo" 
                                className="w-56 h-56 rounded-full border-2 border-white/20 shadow-lg"
                            />
                            <a
                                href="https://docs.google.com/forms/d/e/1FAIpQLScsGPexod2flMh9GXl8w7FHV44UgNveSmOQjqY6jInTg5Mxtw/viewform$0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block w-56 rounded-xl border border-black/20 dark:border-white/10 bg-black/10 dark:bg-white/10 px-8 py-3 text-lg font-semibold backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-black/20 dark:hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 text-center text-black dark:text-white"
                            >
                                {t('applyButton')}
                            </a>
                        </div>
                        
                        {/* Right Column: Targeted Experiences */}
                        <div className="space-y-6 text-center lg:text-left rtl:lg:text-right">
                             <div>
                                <h3 className="text-3xl font-bold mb-4 text-black dark:text-white">{t('targetedExperiencesTitle')}</h3>
                                <div className="space-y-3">
                                    {experiences.map(exp => (
                                        <ExperienceTag key={exp.key}>{exp.text}</ExperienceTag>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : ( // layoutType === 'layout2'
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-col h-full space-y-6 text-center lg:text-left rtl:lg:text-right">
                            <div className="space-y-6 flex-grow">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">{t('noteTitle')}</h3>
                                    <p className="text-gray-900 dark:text-white">{t('noteText')}</p>
                                </div>
                                <hr className="border-t border-black/10 dark:border-white/10" />
                                <div>
                                    <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">{t('targetedExperiencesTitle')}</h3>
                                    <div className="space-y-3">
                                        <ExperienceTag>{experiences[0].text}</ExperienceTag>
                                        <ExperienceTag>{experiences[1].text}</ExperienceTag>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <ExperienceTag>{experiences[2].text}</ExperienceTag>
                                            <ExperienceTag>{experiences[3].text}</ExperienceTag>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <a
                                href="https://docs.google.com/forms/d/e/1FAIpQLScsGPexod2flMh9GXl8w7FHV44UgNveSmOQjqY6jInTg5Mxtw/viewform$0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full mt-6 rounded-xl border border-black/20 dark:border-white/10 bg-black/10 dark:bg-white/10 px-8 py-3 text-lg font-semibold backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-black/20 dark:hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 text-center text-black dark:text-white"
                            >
                                {t('applyButton')}
                            </a>
                        </div>
                        <div className="flex justify-center items-center order-first lg:order-last">
                            <img 
                                src="https://i.postimg.cc/g2mhxC8q/vas_AGbotko-OBs.png" 
                                alt="CIA Logo" 
                                className="w-64 h-64 lg:w-full lg:h-auto max-w-sm rounded-full border-2 border-white/20 shadow-lg"
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};


const Footer: React.FC = () => {
    const { t } = useLocalization();
    const [copiedDiscordId, setCopiedDiscordId] = useState<string | null>(null);

    const handleDiscordCopy = (id: string) => {
        navigator.clipboard.writeText(id).then(() => {
            setCopiedDiscordId(id);
            setTimeout(() => setCopiedDiscordId(null), 2000);
        });
    };
    
    const XIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );

    const DiscordIcon = () => (
        <img 
            src="https://i.postimg.cc/nrNpXdWK/IMG-7921.webp" 
            alt="Discord Logo" 
            className="h-5 w-5" 
        />
    );

    const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
        <div className="group/tooltip relative">
            {children}
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover/tooltip:scale-100 rounded bg-gray-900 p-2 text-xs text-white transition-all dark:bg-gray-900 w-max max-w-xs text-center z-50">
                {text}
            </span>
        </div>
    );

    return (
        <footer id="credits-footer" className="text-center py-8 text-black dark:text-white" style={{ color: 'var(--text-body)' }}>
            <h3 className="text-xl font-bold mb-6 text-black dark:text-white" style={{ color: 'var(--text-title)' }}>{t('footerTitle')}</h3>
            <div className="flex justify-center items-start gap-12 md:gap-24">
                {/* Mohammed */}
                <div className="flex flex-col items-center gap-3">
                    <p className="font-bold text-lg text-black dark:text-white">Mohammed</p>
                    <div className="flex items-center gap-3">
                        <Tooltip text={copiedDiscordId === '221.k' ? t('discordIdCopied') : t('copyDiscordId')}>
                            <button onClick={() => handleDiscordCopy('221.k')} className="p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-black dark:text-white">
                                <DiscordIcon />
                            </button>
                        </Tooltip>
                        <a href="https://x.com/i_MohammedQht" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-black dark:text-white" aria-label="Mohammed's Twitter">
                            <XIcon />
                        </a>
                    </div>
                </div>
                {/* Osama */}
                <div className="flex flex-col items-center gap-3">
                    <p className="font-bold text-lg text-black dark:text-white">Osama</p>
                    <div className="flex items-center gap-3">
                         <Tooltip text={copiedDiscordId === 'alwa2' ? t('discordIdCopied') : t('copyDiscordId')}>
                            <button onClick={() => handleDiscordCopy('alwa2')} className="p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-black dark:text-white">
                                <DiscordIcon />
                            </button>
                        </Tooltip>
                        <a href="https://x.com/alwa28" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-black dark:text-white" aria-label="Osama's Twitter">
                            <XIcon />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const CACHED_STREAMER_DATA_KEY = 'cachedStreamerData';

const App: React.FC = () => {
  const { t } = useLocalization();
  // Initialize with placeholders for all configured streamers to allow incremental loading
  const [streamerData, setStreamerData] = useState<KickApiResponse | null>(() => {
    try {
      const cachedData = localStorage.getItem(CACHED_STREAMER_DATA_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Initial empty state derived from constants
      return {
          checked_at: new Date().toISOString(),
          data: KICK_STREAMERS.map(s => ({
            username: s.username,
            display_name: s.username,
            profile_pic: null,
            is_live: false,
            live_title: null,
            viewer_count: null,
            live_since: null,
            last_stream_start_time: null,
            live_url: `https://kick.com/${s.username}`,
            profile_url: `https://kick.com/${s.username}`,
            tags: s.tags,
            character: s.character,
            isLoading: true // Mark as loading initially
          }))
      };
    } catch (e) {
      console.error("Failed to parse cached data", e);
      return null;
    }
  });

  // Intro State
  const [showIntro, setShowIntro] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Mounted ref to prevent state updates on unmounted component
  const mountedRef = useRef(true);

  // isLoading is mostly managed per-card now, but we keep this for potential global usage if needed
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(streamerData ? new Date(streamerData.checked_at) : null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<'status' | 'viewers_desc' | 'live_duration_desc' | 'last_seen_desc'>('status');
  const [selectedStreamer, setSelectedStreamer] = useState<Channel | null>(null);
  const [isLinksCopied, setIsLinksCopied] = useState(false);
  const [randomVerse, setRandomVerse] = useState<VerseType | null>(null);
  
  const [view, setView] = useState<'live' | 'scheduled' | 'favorites' | 'multistream' | 'share'>('live');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const isTransitioningRef = useRef(false);
  const [scheduleStats, setScheduleStats] = useState<{ enrichedSchedules: EnrichedScheduledStream[], liveSoonCount: number; scheduledCount: number; liveSoonLinks: string[] }>({ enrichedSchedules: [], liveSoonCount: 0, scheduledCount: 0, liveSoonLinks: [] });
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [scheduleSortOption, setScheduleSortOption] = useState<'soonest' | 'status'>('soonest');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  
  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [streamerNotificationSettings, setStreamerNotificationSettings] = useState<{ [key: string]: boolean }>({});
  
  // Favorites State
  const { favorites, toggleFavorite, clearFavorites, isFavorite, hasFavorites } = useFavorites();

  // Multi Stream State
  const [multiStreamSelection, setMultiStreamSelection] = useState<string[]>([]);
  const [multiStreamLink, setMultiStreamLink] = useState<string | null>(null);
  const [isMultiStreamLinkCopied, setIsMultiStreamLinkCopied] = useState(false);

  // Scroll Button State
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  // Share Stream View State
  const [shareViewWindows, setShareViewWindows] = useState<WindowData[]>([]);
  const [shareViewNextZIndex, setShareViewNextZIndex] = useState(100);
  const [shareViewExtraSpace, setShareViewExtraSpace] = useState(0);

  // Tutorial Modal State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.txt', { cache: 'no-store' });
        if (!res.ok) {
          if (res.status !== 404) {
            console.error(`Failed to fetch version.txt: ${res.statusText}`);
          }
          return;
        }
        const latestVersion = (await res.text()).trim();
        const currentVersion = localStorage.getItem('site-version');

        if (currentVersion !== latestVersion) {
          localStorage.setItem('site-version', latestVersion);
          if (currentVersion) {
            window.location.reload();
          }
        }
      } catch (err) {
        console.error('Version check failed:', err);
      }
    };

    checkVersion();
    const intervalId = setInterval(checkVersion, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Pick a random verse on mount
    const verseSource = quranicVerses;
    if (verseSource.length > 0) {
        setRandomVerse(verseSource[Math.floor(Math.random() * verseSource.length)]);
    }

    setNotificationPermission(typeof Notification !== 'undefined' ? Notification.permission : null);
    const settingsLS = JSON.parse(localStorage.getItem('streamerNotifications') || '{}');
    setStreamerNotificationSettings(settingsLS);

    // Check if the tutorial has been dismissed before
    const hasDismissed = localStorage.getItem('tutorialDismissed');
    if (hasDismissed !== 'true') {
      // Use a timeout to avoid showing the modal too abruptly on first load
      const timer = setTimeout(() => setIsTutorialOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTutorialClose = () => {
    // This function is for "Got It", which implies the user read it.
    localStorage.setItem('tutorialDismissed', 'true');
    setIsTutorialOpen(false);
  };
  
  const handleTutorialDismiss = () => {
    // This is for the explicit "Dismiss" button
    localStorage.setItem('tutorialDismissed', 'true');
    setIsTutorialOpen(false);
  };
  
  const updateStreamerNotificationSetting = async (streamerName: string, enabled: boolean) => {
    if (enabled) { // Trying to enable
        let permission = notificationPermission;
        if (permission !== 'granted') {
            permission = await requestNotificationPermission();
            setNotificationPermission(permission);
        }
        
        if (permission !== 'granted') {
            return; // User denied or dismissed, don't enable
        }
    }

    const newSettings = { ...streamerNotificationSettings, [streamerName]: enabled };
    setStreamerNotificationSettings(newSettings);
    localStorage.setItem('streamerNotifications', JSON.stringify(newSettings));
  };

  const handleToggleAllNotifications = async (enable: boolean) => {
      let permission = notificationPermission;
      if (enable && permission !== 'granted') {
          permission = await requestNotificationPermission();
          setNotificationPermission(permission);
      }
      
      if (permission !== 'granted' && enable) {
          return; // Don't enable if permission denied
      }

      const newSettings = { ...streamerNotificationSettings };
      KICK_STREAMERS.forEach(s => {
          newSettings[s.username] = enable;
      });
      setStreamerNotificationSettings(newSettings);
      localStorage.setItem('streamerNotifications', JSON.stringify(newSettings));
  };

  const areAnyNotificationsEnabled = useMemo(() => {
    return Object.values(streamerNotificationSettings).some(v => v === true);
  }, [streamerNotificationSettings]);

  const allTags = useMemo(() => {
    const tags = KICK_STREAMERS.flatMap(streamer => streamer.tags);
    return [...new Set(tags)].sort();
  }, []);
  
  const tagCounts = useMemo(() => {
    if (!streamerData?.data) return {};
    const counts: { [key: string]: number } = {};
    KICK_STREAMERS.forEach(streamerInfo => {
        const streamerOnline = streamerData.data.find(s => s.username.toLowerCase() === streamerInfo.username.toLowerCase());
        if (streamerOnline) {
            streamerInfo.tags?.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        }
    });
    return counts;
  }, [streamerData]);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    setError(null);
    
    // Create a temporary data structure if we don't have one, or use existing to avoid layout shift
    // We do NOT set global isLoading to true, because we want incremental updates
    
    let processedCount = 0;
    const totalStreamers = KICK_STREAMERS.length;

    const updateState = (updatedChannel: Channel) => {
        if (!mountedRef.current) return;
        setStreamerData(prevData => {
            if (!prevData) {
                // Should technically be initialized already, but safe fallback
                return {
                    checked_at: new Date().toISOString(),
                    data: [updatedChannel]
                };
            }
            
            const newData = prevData.data.map(item => 
                item.username.toLowerCase() === updatedChannel.username.toLowerCase() 
                ? updatedChannel 
                : item
            );
            
            // Check if user just went live for notifications
            if (prevData) {
                const prevStreamer = prevData.data.find(s => s.username.toLowerCase() === updatedChannel.username.toLowerCase());
                if (prevStreamer && !prevStreamer.is_live && updatedChannel.is_live) {
                    const notificationBody = updatedChannel.live_title || t('isNowLive', { name: updatedChannel.display_name });
                    showLiveNotification(updatedChannel, notificationBody);
                }
            }

            return {
                ...prevData,
                checked_at: new Date().toISOString(),
                data: newData
            };
        });
        setLastUpdated(new Date());
    };

    // Sequential fetching with delay
    for (const streamerConfig of KICK_STREAMERS) {
        if (!mountedRef.current) break;
        try {
            // Set individual loading state if not already loaded (optional, depends on UX preference)
            // Here we just fetch. The initial state already has isLoading: true for first load.
            
            const cleanUsername = extractUsername(streamerConfig.username);
            const channelData = await fetchKickChannel(cleanUsername);
            
            const enrichedChannel: Channel = {
                ...channelData,
                tags: streamerConfig.tags,
                character: streamerConfig.character,
                isLoading: false, // Mark as done
                username: streamerConfig.username // Preserve original casing from config if needed
            };
            
            updateState(enrichedChannel);

        } catch (err) {
            console.error(`Error fetching ${streamerConfig.username}`, err);
             // Update state with error but mark as "loaded" for progress bar
             if (mountedRef.current) {
                 setStreamerData(prevData => {
                    if(!prevData) return null;
                    const newData = prevData.data.map(item => 
                         item.username.toLowerCase() === streamerConfig.username.toLowerCase()
                         ? { ...item, error: true, isLoading: false }
                         : item
                    );
                    return { ...prevData, data: newData, checked_at: new Date().toISOString() };
                 });
             }
        }
        
        processedCount++;
        if (mountedRef.current) {
            setLoadingProgress(Math.floor((processedCount / totalStreamers) * 100));
        }

        // Reduced timeout to 10ms for faster loading while keeping sequentiality
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
  }, [t]);

  // Sync state to local storage whenever it changes
  useEffect(() => {
      if (streamerData) {
          localStorage.setItem(CACHED_STREAMER_DATA_KEY, JSON.stringify(streamerData));
      }
  }, [streamerData]);

  useEffect(() => {
    fetchData();
    // The polling interval needs to be longer than the total time to fetch all streamers
    // 60 streamers * 0.05 seconds = ~3 seconds.
    // POLLING_INTERVAL_SECONDS is 120 (2 mins), so this is safe.
    const intervalId = setInterval(fetchData, POLLING_INTERVAL_SECONDS * 1000);
    return () => clearInterval(intervalId);
  }, [fetchData]);
  
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    const handleScroll = () => {
      // Considered "at top" if scrolled less than 100px
      setIsAtTop(window.scrollY < 100);
    };

    const checkVisibility = () => {
      setShowScrollBtn(document.documentElement.scrollHeight > window.innerHeight);
    };

    const checkState = () => {
      handleScroll();
      checkVisibility();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkState);

    // Use MutationObserver to detect content changes that affect scroll height
    const observer = new MutationObserver(checkState);
    observer.observe(rootEl, {
      childList: true,
      subtree: true,
    });
    
    // Initial check after a short delay to allow content to render
    const initialCheckTimeout = setTimeout(checkState, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkState);
      observer.disconnect();
      clearTimeout(initialCheckTimeout);
    };
  }, []);


  const handleScrollButtonClick = () => {
    if (isAtTop) {
      document.getElementById('credits-footer')?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };
  
  const sortedStreamers = useMemo(() => {
    if (!streamerData?.data) return [];
    
    const streamersToSort: Channel[] = [...streamerData.data];
    const liveStreamers = streamersToSort.filter(s => s.is_live);
    const offlineStreamers = streamersToSort.filter(s => !s.is_live);

    switch (sortOption) {
      case 'live_duration_desc':
        liveStreamers.sort((a, b) => {
          const dateA = a.live_since ? new Date(a.live_since).getTime() : Infinity;
          const dateB = b.live_since ? new Date(b.live_since).getTime() : Infinity;
          return dateA - dateB; // Earlier date means longer duration
        });
        offlineStreamers.sort((a, b) => {
          const dateA = a.last_stream_start_time ? new Date(a.last_stream_start_time).getTime() : 0;
          const dateB = b.last_stream_start_time ? new Date(b.last_stream_start_time).getTime() : 0;
          return dateB - dateA;
        });
        return [...liveStreamers, ...offlineStreamers];

      case 'last_seen_desc':
        streamersToSort.sort((a, b) => {
          const timeA = a.is_live ? Date.now() : (a.last_stream_start_time ? new Date(a.last_stream_start_time).getTime() : 0);
          const timeB = b.is_live ? Date.now() : (b.last_stream_start_time ? new Date(b.last_stream_start_time).getTime() : 0);
          return timeB - timeA;
        });
        return streamersToSort;
        
      case 'viewers_desc':
        streamersToSort.sort((a, b) => {
            if (a.is_live && !b.is_live) return -1;
            if (!a.is_live && b.is_live) return 1;
            if (a.is_live && b.is_live) {
              return (b.viewer_count ?? 0) - (a.viewer_count ?? 0);
            }
            // For offline streamers, sort by last seen (more recent first)
            const dateA = a.last_stream_start_time ? new Date(a.last_stream_start_time).getTime() : 0;
            const dateB = b.last_stream_start_time ? new Date(b.last_stream_start_time).getTime() : 0;
            return dateB - dateA;
        });
        return streamersToSort;
        
      case 'status':
      default:
        liveStreamers.sort((a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0));
        offlineStreamers.sort((a, b) => {
          const dateA = a.last_stream_start_time ? new Date(a.last_stream_start_time).getTime() : 0;
          const dateB = b.last_stream_start_time ? new Date(b.last_stream_start_time).getTime() : 0;
          return dateB - dateA;
        });
        return [...liveStreamers, ...offlineStreamers];
    }
  }, [streamerData, sortOption]);

  const filteredStreamers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let streamers = sortedStreamers;

    if (selectedTags.length > 0) {
      streamers = streamers.filter(streamer =>
        streamer.tags && streamer.tags.some(tag => selectedTags.includes(tag))
      );
    }
    
    if (query) {
       streamers = streamers.filter(streamer => {
        const firstCharacter = streamer.character?.split('|')[0].trim().toLowerCase() || '';
        const liveTitle = streamer.live_title?.toLowerCase() || '';
        return streamer.username.toLowerCase().includes(query) ||
               (streamer.character && firstCharacter.includes(query)) ||
               (streamer.is_live && liveTitle.includes(query));
       });
    }
    
    return streamers;
  }, [sortedStreamers, searchQuery, selectedTags]);
  
    const favoriteLiveStreamers = useMemo(() => {
        return (streamerData?.data || []).filter(s => favorites.includes(s.username));
    }, [streamerData, favorites]);

    const favoriteScheduledStreamers = useMemo(() => {
        return scheduleStats.enrichedSchedules.filter(s => favorites.includes(s.streamer.username));
    }, [scheduleStats.enrichedSchedules, favorites]);

    const allFavoriteStreamers = useMemo(() => {
        const liveFavs = favoriteLiveStreamers;
        const scheduledFavsUsernames = new Set(favoriteScheduledStreamers.map(s => s.streamer.username));
        // Avoid duplicates if a scheduled streamer also appears in the main list
        const uniqueLiveFavs = liveFavs.filter(s => !scheduledFavsUsernames.has(s.username));
        return [...uniqueLiveFavs, ...favoriteScheduledStreamers.map(s => s.streamer)];
    }, [favoriteLiveStreamers, favoriteScheduledStreamers]);
    
    const favoritesLiveCount = useMemo(() => favoriteLiveStreamers.filter(s => s.is_live).length, [favoriteLiveStreamers]);
    const favoritesOfflineCount = useMemo(() => favoriteLiveStreamers.filter(s => !s.is_live).length + favoriteScheduledStreamers.length, [favoriteLiveStreamers, favoriteScheduledStreamers]);


  const liveCount = useMemo(() => filteredStreamers.filter(s => s.is_live).length, [filteredStreamers]);
  const offlineCount = useMemo(() => filteredStreamers.filter(s => !s.is_live).length, [filteredStreamers]);
  const inactiveCount = useMemo(() => {
    const oneWeekAgoTimestamp = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);

    return filteredStreamers.filter(streamer => {
      if (streamer.is_live || !streamer.last_stream_start_time) {
        return false;
      }
      try {
        const lastStreamTimestamp = new Date(streamer.last_stream_start_time).getTime();
        if (isNaN(lastStreamTimestamp)) return false;
        return lastStreamTimestamp < oneWeekAgoTimestamp;
      } catch (e) {
        return false;
      }
    }).length;
  }, [filteredStreamers]);

  const liveStreamersInFilter = useMemo(() => filteredStreamers.filter(s => s.is_live), [filteredStreamers]);

  const handleCopyLinks = useCallback(() => {
    let urlsToCopy: string[] = [];
  
    switch(view) {
      case 'live':
        urlsToCopy = liveStreamersInFilter.length > 0
          ? liveStreamersInFilter.map(s => s.live_url!)
          : filteredStreamers.map(s => s.profile_url);
        break;
      case 'scheduled':
        urlsToCopy = scheduleStats.liveSoonLinks;
        break;
      case 'favorites':
        urlsToCopy = allFavoriteStreamers.map(s => s.profile_url);
        break;
      case 'multistream':
      case 'share':
        // This button isn't shown in these views, but handle just in case
        return;
    }
  
    const urlsString = urlsToCopy.filter(Boolean).join('\n');
    
    if (urlsString) {
      navigator.clipboard.writeText(urlsString).then(() => {
        setIsLinksCopied(true);
        setTimeout(() => setIsLinksCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy links: ', err);
        alert('Could not copy links to clipboard.');
      });
    }
  }, [view, filteredStreamers, liveStreamersInFilter, scheduleStats.liveSoonLinks, allFavoriteStreamers]);
  
    const copyButtonText = useMemo(() => {
        if (view === 'scheduled') return t('copyLiveSoonLinks');
        if (view === 'favorites') return t('copyFavorites');
        return liveStreamersInFilter.length > 0 ? t('copyLiveLinks') : t('copyProfileLinks');
    }, [view, t, liveStreamersInFilter.length]);
    
  const isCopyButtonDisabled = (view === 'scheduled' && scheduleStats.liveSoonLinks.length === 0) || (view === 'favorites' && allFavoriteStreamers.length === 0);
  
  const changeView = (newView: 'live' | 'scheduled' | 'favorites' | 'multistream' | 'share') => {
    if (isTransitioningRef.current || view === newView) return;
    isTransitioningRef.current = true;
    
    if (view === 'multistream' && newView !== 'multistream') {
        setMultiStreamSelection([]);
        setMultiStreamLink(null);
    }

    setIsAnimatingOut(true);
    
    setTimeout(() => {
        setView(newView);
        setIsAnimatingOut(false);
        setTimeout(() => {
            isTransitioningRef.current = false;
        }, 50);
    }, 300);
  };
  
  const handleScheduleStatsUpdate = useCallback((stats: { enrichedSchedules: EnrichedScheduledStream[], liveSoonCount: number; scheduledCount: number; liveSoonLinks: string[] }) => {
    setScheduleStats(stats);
  }, []);
  
  const handleSidebarNavigate = (section: 'live' | 'scheduled' | 'credits' | 'apply' | 'favorites' | 'multistream' | 'share' | 'appTutorial') => {
    if (section === 'live' || section === 'scheduled' || section === 'favorites' || section === 'multistream' || section === 'share') {
        changeView(section);
    } else if (section === 'credits') {
      document.getElementById('credits-footer')?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'apply') {
        document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'appTutorial') {
        setIsTutorialOpen(true);
    }
    
    setIsSidebarOpen(false);
  };
  
  const handleClearFavorites = () => {
    clearFavorites();
    changeView('live');
  };

  const getTitle = () => {
    switch(view) {
        case 'live': return t('liveStreams');
        case 'scheduled': return t('scheduleStreams');
        case 'favorites': return t('favoritesStreams');
        case 'multistream': return t('multiStreamGeneratorTitle');
        case 'share': return t('shareYourStreamTitle');
    }
  }

  // Multi-stream logic
  const selectedMultiStreamers = useMemo(() => {
      if (!streamerData?.data) return [];
      return multiStreamSelection
          .map(username => streamerData.data.find(s => s.username === username))
          .filter((s): s is Channel => s !== undefined);
  }, [multiStreamSelection, streamerData]);

  const handleGenerateMultiStreamLink = () => {
      if (multiStreamSelection.length === 0) return;
      const usernamesPath = multiStreamSelection.join('/');
      const link = `https://multikick.com/${usernamesPath}`;
      setMultiStreamLink(link);
  };

  const handleCopyMultiStreamLink = () => {
      if (!multiStreamLink) return;
      navigator.clipboard.writeText(multiStreamLink).then(() => {
          setIsMultiStreamLinkCopied(true);
          setTimeout(() => setIsMultiStreamLinkCopied(false), 2000);
      });
  };

  const soonestSchedule = useMemo(() => {
    if (scheduleStats.enrichedSchedules && scheduleStats.enrichedSchedules.length > 0) {
        // The list is already sorted by startTime ascending in ScheduledStreams component
        return scheduleStats.enrichedSchedules[0];
    }
    return null;
  }, [scheduleStats.enrichedSchedules]);


  return (
    <div className="min-h-screen w-full transition-colors duration-300 text-black dark:text-white" style={{ color: 'var(--text-body)' }}>
      
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} progress={loadingProgress} />}
      
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={handleTutorialClose}
        onDismiss={handleTutorialDismiss}
      />
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={handleSidebarNavigate} 
        activeView={view} 
        showApplyLink={ENABLE_APPLY_SECTION}
        hasFavorites={hasFavorites}
        showShareStreamLink={ENABLE_SHARE_STREAM_VIEW}
        soonestSchedule={soonestSchedule}
      />

      <div className="container mx-auto px-4 py-8">
        <header className="w-full flex flex-col items-center mb-8 relative">
          <div className="absolute top-0 left-0 rtl:left-auto rtl:right-0 md:hidden">
            <ThemeToggle />
          </div>
          <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 flex items-center gap-2">
            <NotificationsToggle enabled={areAnyNotificationsEnabled} onToggle={handleToggleAllNotifications} permission={notificationPermission} />
            <LanguageToggle />
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
             <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-sm transition-colors text-black dark:text-white"
                aria-label={t('openMenu')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
          </div>
          <img 
            src="https://i.postimg.cc/g2mhxC8q/vas_AGbotko-OBs.png" 
            alt="CIA Logo" 
            className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg mb-4 transform -translate-x-3"
          />
          <h1 className="text-5xl font-bold tracking-[0.5em] text-black dark:text-white" style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--text-title)' }}>
            C I A
          </h1>
          <h2 className="text-xl font-semibold mt-2 text-black dark:text-white" style={{ fontFamily: "'Poppins', sans-serif", transform: 'translateX(-10px)', color: 'var(--text-title)' }}>
            {getTitle()}
          </h2>

          {randomVerse && <QuranicVerse verse={randomVerse} />}

          {lastUpdated && (view === 'live' || view === 'scheduled' || view === 'favorites' || view === 'multistream') && (
             <p className="text-sm text-gray-900 dark:text-white/60 mt-4">
               {t('lastUpdated', { time: lastUpdated.toLocaleTimeString() })}
             </p>
          )}
        </header>
        
        <div style={{ display: view !== 'share' ? 'block' : 'none' }}>
            <div
              key={view}
              className="animation-container mt-8 relative z-30"
            >
              {view === 'live' && (
                  <>
                      <div className="relative z-10 space-y-6 mb-6">
                        {streamerData && (
                            <>
                              <div className="w-full max-w-6xl mx-auto space-y-4">
                                {/* Search Input */}
                                <div className={`${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '0ms' }}>
                                  <div className="relative w-full">
                                    <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-4 rtl:pl-0 rtl:pr-4 pointer-events-none">
                                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                    </span>
                                    <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchStreamer')} className="w-full py-3 pl-11 pr-4 rtl:pl-4 rtl:pr-11 text-black bg-white/40 placeholder-gray-700 rounded-full border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white dark:bg-black/20 dark:placeholder-gray-400 dark:border-transparent dark:focus:ring-blue-400 backdrop-blur-sm transition-all" aria-label={t('searchStreamer')} />
                                  </div>
                                </div>

                                {/* Filters and Sort */}
                                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                                  <div className={`${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'} ${isTagFilterOpen ? 'relative z-20' : 'relative'}`} style={{ animationDelay: '50ms' }}>
                                    <TagFilter 
                                      allTags={allTags} 
                                      selectedTags={selectedTags} 
                                      onSelectedTagsChange={setSelectedTags} 
                                      tagCounts={tagCounts} 
                                      onOpenChange={setIsTagFilterOpen} 
                                    />
                                  </div>
                                  <div className={`${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '100ms' }}>
                                    <div className="relative w-full">
                                      <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)} className="w-full py-3 pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-black bg-white/40 rounded-full border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white dark:bg-black/20 dark:border-transparent dark:focus:ring-blue-400 backdrop-blur-sm transition-all appearance-none" aria-label={t('sortBy')}>
                                        <option value="status">{t('sortByStatus')}</option>
                                        <option value="viewers_desc">{t('viewersHighToLow')}</option>
                                        <option value="live_duration_desc">{t('sortByLiveDuration')}</option>
                                        <option value="last_seen_desc">{t('sortByLastSeen')}</option>
                                      </select>
                                      <span className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-4 rtl:pr-0 rtl:pl-4 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-700 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Live Stats */}
                              <div className={`flex flex-col items-center gap-4 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '150ms' }}>
                                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 text-sm border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 rounded-full px-4 py-2 backdrop-blur-sm text-black font-semibold dark:font-normal dark:text-white">
                                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-500"></span><span>{t('liveCount', { count: liveCount })}</span></span>
                                  <div className="h-4 w-px bg-black/20 dark:bg-white/20 hidden sm:block"></div>
                                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-600 dark:bg-red-500"></span><span>{t('offlineCount', { count: offlineCount })}</span></span>
                                  <div className="h-4 w-px bg-black/20 dark:bg-white/20 hidden sm:block"></div>
                                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gray-600 dark:bg-gray-500"></span><span>{t('inactiveCount', { count: inactiveCount })}</span></span>
                                </div>
                              </div>
                            </>
                        )}
                      </div>
                      {error && (
                        <div className={`text-center bg-red-500/20 text-red-900 dark:text-red-300 p-4 rounded-lg mb-8 flex flex-col sm:flex-row items-center justify-center gap-4 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '0ms' }}>
                          <div>
                              <p><strong>{t('apiErrorTitle')}</strong> {error}</p>
                              <p>{t('apiErrorBody')}</p>
                          </div>
                          <button
                              onClick={fetchData}
                              disabled={isLoading}
                              className="rounded-lg px-4 py-2 text-sm font-semibold bg-red-400/20 text-black dark:text-white hover:bg-red-400/40 transition-colors disabled:opacity-50 disabled:cursor-wait"
                          >
                              {t('retry')}
                          </button>
                        </div>
                      )}

                      {/* Render Streamers Grid (Loading state handled per-card inside) */}
                      {streamerData ? (
                        <>
                          <main
                            key={`live-grid-${sortOption}-${searchQuery}-${selectedTags.join('_')}`}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                          >
                            {filteredStreamers.map((streamer, index) => (
                              <div key={streamer.username} className={isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'} style={{ animationDelay: `${200 + index * 30}ms` }}>
                                  <StreamerCard 
                                    streamer={streamer} 
                                    onCardClick={() => setSelectedStreamer(streamer)}
                                    isNotificationSubscribed={!!streamerNotificationSettings[streamer.username]}
                                    onNotificationToggle={updateStreamerNotificationSetting}
                                    notificationPermission={notificationPermission}
                                    isFavorite={isFavorite(streamer.username)}
                                    onToggleFavorite={toggleFavorite}
                                  />
                              </div>
                            ))}
                          </main>
                          {filteredStreamers.length === 0 && (
                            <div className={`text-center py-16 text-black/80 dark:text-white/80 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '200ms' }}>
                              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-title)' }}>{t('noStreamersFoundTitle')}</h3>
                              <p className="mt-2 text-base" style={{ color: 'var(--text-body)' }}>{t('noStreamersFoundBody')}</p>
                            </div>
                          )}
                        </>
                      ) : null}
                  </>
              )}
              {view === 'scheduled' && (
                  <>
                      <div className="space-y-8 mb-6">
                         {streamerData && (
                            <div className="space-y-6">
                              <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                                <div className={`${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '0ms' }}>
                                  <div className="relative w-full">
                                    <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-4 rtl:pl-0 rtl:pr-4 pointer-events-none">
                                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                    </span>
                                    <input type="search" value={scheduleSearchQuery} onChange={(e) => setScheduleSearchQuery(e.target.value)} placeholder={t('searchSchedules')} className="w-full py-3 pl-11 pr-4 rtl:pl-4 rtl:pr-11 text-black bg-white/40 placeholder-gray-700 rounded-full border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white dark:bg-black/20 dark:placeholder-gray-400 dark:border-transparent dark:focus:ring-blue-400 backdrop-blur-sm transition-all" aria-label={t('searchSchedules')} />
                                  </div>
                                </div>
                                <div className={`${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '50ms' }}>
                                  <div className="relative w-full">
                                    <select value={scheduleSortOption} onChange={(e) => setScheduleSortOption(e.target.value as 'soonest' | 'status')} className="w-full py-3 pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-black bg-white/40 rounded-full border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white dark:bg-black/20 dark:border-transparent dark:focus:ring-blue-400 backdrop-blur-sm transition-all appearance-none" aria-label={t('sortBy')}>
                                      <option value="soonest">{t('sortBySoonest')}</option>
                                      <option value="status">{t('sortByStatusScheduled')}</option>
                                    </select>
                                     <span className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-4 rtl:pr-0 rtl:pl-4 pointer-events-none">
                                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className={`flex flex-col items-center gap-4 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '100ms' }}>
                                <button onClick={handleCopyLinks} disabled={isCopyButtonDisabled} className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/10 dark:bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-black/20 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed text-black dark:text-white">
                                  {isLinksCopied ? ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>{t('copied')}</span></> ) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span>{copyButtonText}</span></> )}
                                </button>
                                <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 text-sm text-black dark:text-white">
                                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-[pulse-live_2s_infinite]"></span><span>{t('liveSoonCount', { count: scheduleStats.liveSoonCount })}</span></span>
                                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-[pulse-scheduled_2s_infinite]"></span><span>{t('scheduledCount', { count: scheduleStats.scheduledCount })}</span></span>
                                </div>
                              </div>
                            </div>
                         )}
                      </div>
                      <ScheduledStreams 
                          streamerData={streamerData}
                          onCardClick={setSelectedStreamer}
                          streamerNotificationSettings={streamerNotificationSettings}
                          onNotificationToggle={updateStreamerNotificationSetting}
                          notificationPermission={notificationPermission}
                          onStatsUpdate={handleScheduleStatsUpdate}
                          searchQuery={scheduleSearchQuery}
                          sortOption={scheduleSortOption}
                          isAnimatingOut={isAnimatingOut}
                          baseDelay={150}
                          isFavorite={isFavorite}
                          onToggleFavorite={toggleFavorite}
                      />
                  </>
              )}
              {view === 'multistream' && (
                  <div className="space-y-8 mb-6">
                    <div className={`${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'} ${isTagFilterOpen ? 'relative z-[9999]' : ''}`} style={{ animationDelay: '0ms' }}>
                        <MultiStreamSelector
                            allStreamers={streamerData?.data || []}
                            selectedUsernames={multiStreamSelection}
                            onSelectionChange={setMultiStreamSelection}
                            onOpenChange={setIsTagFilterOpen}
                        />
                    </div>

                    {multiStreamSelection.length > 0 && (
                        <div className={`flex flex-col items-center gap-4 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '50ms' }}>
                            <button
                                onClick={handleGenerateMultiStreamLink}
                                className="w-full max-w-sm rounded-xl border border-black/20 dark:border-white/10 bg-black/10 dark:bg-white/10 px-8 py-3 text-lg font-semibold backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-black/20 dark:hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 text-center text-black dark:text-white"
                            >
                                {t('generateMultiStream')}
                            </button>
                        </div>
                    )}
                    
                    {multiStreamLink && (
                        <div className={`space-y-4 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '100ms' }}>
                            <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3">
                                <a
                                    href={multiStreamLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-grow w-full sm:w-auto flex items-center gap-3 rounded-xl border border-black/20 dark:border-white/10 bg-black/10 dark:bg-white/10 px-4 py-3 text-base font-semibold backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-black/20 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 text-left rtl:text-right text-black dark:text-white"
                                >
                                    <div className="flex -space-x-3 rtl:space-x-reverse overflow-hidden">
                                        {selectedMultiStreamers.slice(0, 5).map(s => (
                                            <img key={s.username} src={s.profile_pic || ''} alt={s.display_name} className="h-8 w-8 rounded-full border-2 border-white/50 dark:border-black/50 object-cover inline-block" />
                                        ))}
                                        {selectedMultiStreamers.length > 5 && (
                                           <span className="h-8 w-8 rounded-full border-2 border-white/50 dark:border-black/50 bg-gray-600 flex items-center justify-center text-xs font-bold">+{selectedMultiStreamers.length - 5}</span>
                                        )}
                                    </div>
                                    <span className="truncate">{t('multiStreamLink')}</span>
                                </a>
                                <button
                                    onClick={handleCopyMultiStreamLink}
                                    className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 rounded-xl border border-black/20 dark:border-white/10 bg-black/10 dark:bg-white/5 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-black/20 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 text-black dark:text-white"
                                >
                                    {isMultiStreamLinkCopied ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            <span>{t('linkCopied')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            <span>{t('copyLink')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {selectedMultiStreamers.length > 0 ? (
                        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {selectedMultiStreamers.map((streamer, index) => (
                               <div key={streamer.username} className={isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'} style={{ animationDelay: `${200 + index * 30}ms` }}>
                                  <StreamerCard 
                                    streamer={streamer} 
                                    onCardClick={() => setSelectedStreamer(streamer)}
                                    isNotificationSubscribed={!!streamerNotificationSettings[streamer.username]}
                                    onNotificationToggle={updateStreamerNotificationSetting}
                                    notificationPermission={notificationPermission}
                                    isFavorite={isFavorite(streamer.username)}
                                    onToggleFavorite={toggleFavorite}
                                  />
                              </div>
                            ))}
                        </main>
                    ) : (
                        <div className={`text-center py-16 text-black/80 dark:text-white/80 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '200ms' }}>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-title)' }}>{t('noStreamersSelectedTitle')}</h3>
                            <p className="mt-2 text-base" style={{ color: 'var(--text-body)' }}>{t('noStreamersSelectedBody')}</p>
                        </div>
                    )}
                  </div>
              )}
              {view === 'favorites' && (
                    <>
                        <div className="relative z-10 space-y-6 mb-6">
                            <div className={`flex flex-col items-center gap-4 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '150ms' }}>
                                <div className="flex justify-center items-center flex-wrap gap-4">
                                    <button onClick={handleCopyLinks} disabled={isCopyButtonDisabled} className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/10 dark:bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-black/20 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed text-black dark:text-white">
                                      {isLinksCopied ? ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>{t('copied')}</span></> ) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span>{copyButtonText}</span></> )}
                                    </button>
                                    <button onClick={handleClearFavorites} disabled={!hasFavorites} className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/10 dark:bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-black/20 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 dark:text-red-400">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       <span>{t('clearFavorites')}</span>
                                    </button>
                                </div>
                                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 text-sm border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 rounded-full px-4 py-2 backdrop-blur-sm text-black font-semibold dark:font-normal dark:text-white">
                                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-500"></span><span>{t('liveCount', { count: favoritesLiveCount })}</span></span>
                                    <div className="h-4 w-px bg-black/20 dark:bg-white/20 hidden sm:block"></div>
                                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-600 dark:bg-red-500"></span><span>{t('offlineCount', { count: favoritesOfflineCount })}</span></span>
                                </div>
                            </div>
                        </div>
                        {hasFavorites ? (
                            <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                               {[...favoriteLiveStreamers, ...favoriteScheduledStreamers].sort((a,b) => {
                                    const isALive = 'is_live' in a && a.is_live;
                                    const isBLive = 'is_live' in b && b.is_live;
                                    if (isALive && !isBLive) return -1;
                                    if (!isALive && isBLive) return 1;
                                    if (isALive && isBLive) {
                                        return ((b as Channel).viewer_count ?? 0) - ((a as Channel).viewer_count ?? 0);
                                    }
                                    
                                    const isAScheduled = 'startTime' in a;
                                    const isBScheduled = 'startTime' in b;
                                    if (isAScheduled && !isBScheduled) return -1;
                                    if (!isAScheduled && isBScheduled) return 1;
                                    if (isAScheduled && isBScheduled) {
                                        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                                    }
                                    
                                    const timeA = (a as Channel).last_stream_start_time ? new Date((a as Channel).last_stream_start_time!).getTime() : 0;
                                    const timeB = (b as Channel).last_stream_start_time ? new Date((b as Channel).last_stream_start_time!).getTime() : 0;
                                    return timeB - timeA;
                               }).map((item, index) => {
                                   if ('streamer' in item) { // It's a EnrichedScheduledStream
                                       return (
                                           <div key={item.id} className={`${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: `${200 + index * 30}ms` }}>
                                             <ScheduledStreams.Card 
                                                schedule={item}
                                                onCardClick={() => setSelectedStreamer(item.streamer)}
                                                isNotificationSubscribed={!!streamerNotificationSettings[item.streamer.username]}
                                                onNotificationToggle={updateStreamerNotificationSetting}
                                                notificationPermission={notificationPermission}
                                                isFavorite={isFavorite(item.streamer.username)}
                                                onToggleFavorite={toggleFavorite}
                                             />
                                           </div>
                                       )
                                   } else { // It's a Channel
                                       return (
                                         <div key={item.username} className={isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'} style={{ animationDelay: `${200 + index * 30}ms` }}>
                                             <StreamerCard 
                                                streamer={item} 
                                                onCardClick={() => setSelectedStreamer(item)}
                                                isNotificationSubscribed={!!streamerNotificationSettings[item.username]}
                                                onNotificationToggle={updateStreamerNotificationSetting}
                                                notificationPermission={notificationPermission}
                                                isFavorite={isFavorite(item.username)}
                                                onToggleFavorite={toggleFavorite}
                                             />
                                         </div>
                                       );
                                   }
                               })}
                            </main>
                        ) : (
                             <div className={`text-center py-16 text-black/80 dark:text-white/80 ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`} style={{ animationDelay: '200ms' }}>
                              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-title)' }}>{t('noFavoritesTitle')}</h3>
                              <p className="mt-2 text-base" style={{ color: 'var(--text-body)' }}>{t('noFavoritesBody')}</p>
                            </div>
                        )}
                    </>
              )}
            </div>
        </div>
        <div style={{ display: view === 'share' ? 'block' : 'none' }}>
            <div className="animation-container mt-8 relative z-30">
                 <ShareStreamView
                    liveStreamers={streamerData?.data.filter(s => s.is_live) || []}
                    isAnimatingOut={isAnimatingOut}
                    windows={shareViewWindows}
                    setWindows={setShareViewWindows}
                    nextZIndex={shareViewNextZIndex}
                    setNextZIndex={setShareViewNextZIndex}
                    extraSpace={shareViewExtraSpace}
                    setExtraSpace={setShareViewExtraSpace}
                />
            </div>
        </div>
      </div>
      
      <StreamerModal streamer={selectedStreamer} onClose={() => setSelectedStreamer(null)} />
      {ENABLE_APPLY_SECTION && <ApplySection />}
      <Footer />
      {showScrollBtn && (
        <button
          onClick={handleScrollButtonClick}
          className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 p-3 rounded-full bg-black/10 dark:bg-black/20 text-black dark:text-white backdrop-blur-lg border border-black/10 dark:border-white/10 shadow-lg hover:bg-black/20 dark:hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label={isAtTop ? t('scrollToBottom') : t('scrollToTop')}
        >
          {isAtTop ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v17" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default App;
