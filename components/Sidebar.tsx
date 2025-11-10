import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useCountdown } from '../hooks/useCountdown';
import type { EnrichedScheduledStream } from './ScheduledStreamCard';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: 'live' | 'scheduled' | 'credits' | 'apply' | 'favorites' | 'multistream' | 'share') => void;
  activeView: 'live' | 'scheduled' | 'favorites' | 'multistream' | 'share';
  showApplyLink: boolean;
  hasFavorites: boolean;
  showShareStreamLink: boolean;
  soonestSchedule: EnrichedScheduledStream | null;
}

const CountdownTimer: React.FC<{ targetDate: string, activeView: SidebarProps['activeView'] }> = ({ targetDate, activeView }) => {
    const { days, hours, minutes, seconds, isOver } = useCountdown(targetDate);
    if (isOver) return null;
    
    const parts = [];
    if (days > 0) {
        parts.push(`${days}d`);
        parts.push(`${hours}h`);
    } else if (hours > 0) {
        parts.push(`${hours}h`);
        parts.push(`${minutes}m`);
    } else if (minutes > 0) {
        parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
    } else {
        parts.push(`${seconds}s`);
    }

    // FIX: 'activeView' was not defined in this component's scope. It is now passed as a prop.
    const timerClass = activeView === 'scheduled' 
      ? 'bg-white/20 text-white' 
      : 'bg-black/10 dark:bg-white/10';

    return (
        <span className={`text-xs font-mono rounded-md px-2 py-1 transition-colors ${timerClass}`}>
            {parts.join(' ')}
        </span>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, activeView, showApplyLink, hasFavorites, showShareStreamLink, soonestSchedule }) => {
  const { t } = useLocalization();

  return (
    <div
      className={`fixed top-0 right-0 rtl:right-auto rtl:left-0 h-full w-64 sm:w-72 bg-slate-200/80 dark:bg-slate-900/80 backdrop-blur-xl border-l border-r-0 rtl:border-r rtl:border-l-0 border-white/10 shadow-2xl z-50 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${isOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidebar-title"
    >
      <div className="flex flex-col h-full p-6 text-black dark:text-white" style={{ color: 'var(--text-body)' }}>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                 <img 
                    src="https://i.postimg.cc/g2mhxC8q/vas_AGbotko-OBs.png" 
                    alt="CIA Logo" 
                    className="w-10 h-10 rounded-full border border-white/20"
                />
                <h2 id="sidebar-title" className="text-xl font-bold tracking-widest" style={{ color: 'var(--text-title)' }}>C I A</h2>
            </div>
          
          <button onClick={onClose} aria-label={t('close')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <hr className="border-t border-black/10 dark:border-white/10 mb-6" />

        <nav>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => onNavigate('live')}
                className={`w-full text-left rtl:text-right px-4 py-3 rounded-lg text-lg font-semibold transition-colors ${activeView === 'live' ? 'bg-blue-500 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                {t('sidebarLiveStreams')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('scheduled')}
                className={`w-full flex items-center justify-between text-left rtl:text-right px-4 py-3 rounded-lg text-lg font-semibold transition-colors ${activeView === 'scheduled' ? 'bg-blue-500 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                <span>{t('sidebarScheduleStreams')}</span>
                {soonestSchedule && <CountdownTimer targetDate={soonestSchedule.startTime} activeView={activeView} />}
              </button>
            </li>
             <li>
              <button
                onClick={() => onNavigate('multistream')}
                className={`w-full text-left rtl:text-right px-4 py-3 rounded-lg text-lg font-semibold transition-colors ${activeView === 'multistream' ? 'bg-blue-500 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                {t('sidebarMultiStream')}
              </button>
            </li>
            {showShareStreamLink && (
              <li>
                <button
                  onClick={() => onNavigate('share')}
                  className={`w-full text-left rtl:text-right px-4 py-3 rounded-lg text-lg font-semibold transition-colors ${activeView === 'share' ? 'bg-blue-500 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                >
                  {t('sidebarShareStream')}
                </button>
              </li>
            )}
            {hasFavorites && (
                <li>
                    <button
                    onClick={() => onNavigate('favorites')}
                    className={`w-full text-left rtl:text-right px-4 py-3 rounded-lg text-lg font-semibold transition-colors ${activeView === 'favorites' ? 'bg-blue-500 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                    >
                    {t('sidebarFavorites')}
                    </button>
                </li>
            )}
            {showApplyLink && (
               <li>
                <button
                  onClick={() => onNavigate('apply')}
                  className="w-full text-left rtl:text-right px-4 py-3 rounded-lg text-lg font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  {t('sidebarApply')}
                </button>
              </li>
            )}
            <li>
              <button
                onClick={() => onNavigate('credits')}
                className="w-full text-left rtl:text-right px-4 py-3 rounded-lg text-lg font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                {t('sidebarCredits')}
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex-grow"></div>

        <p className="text-center text-sm text-black/70 dark:text-white/70 mt-auto">
            {t('sidebarThanks')}
        </p>
      </div>
    </div>
  );
};