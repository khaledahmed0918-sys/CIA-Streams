import React, { useState, useEffect, useMemo } from 'react';
import type { ScheduledStream as ScheduledStreamType, Channel, KickApiResponse } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { ScheduledStreamCard, EnrichedScheduledStream } from './ScheduledStreamCard';
import { SCHEDULED_STREAMS } from '../data/scheduledStreams';

interface ScheduledStreamsProps {
  streamerData: KickApiResponse | null;
  onCardClick: (streamer: Channel) => void;
  streamerNotificationSettings: { [key: string]: boolean };
  onNotificationToggle: (streamerName: string, enabled: boolean) => Promise<void>;
  notificationPermission: NotificationPermission | null;
  onStatsUpdate: (stats: { enrichedSchedules: EnrichedScheduledStream[], liveSoonCount: number; scheduledCount: number; liveSoonLinks: string[] }) => void;
  searchQuery: string;
  sortOption: 'soonest' | 'status';
  isAnimatingOut: boolean;
  baseDelay: number;
  isFavorite: (username: string) => boolean;
  onToggleFavorite: (username: string) => void;
}

const ScheduledStreamsComponent: React.FC<ScheduledStreamsProps> = (props) => {
    const { 
        streamerData,
        onCardClick,
        streamerNotificationSettings,
        onNotificationToggle,
        notificationPermission,
        onStatsUpdate,
        searchQuery,
        sortOption,
        isAnimatingOut,
        baseDelay,
        isFavorite,
        onToggleFavorite,
    } = props;
    const [schedules, setSchedules] = useState<ScheduledStreamType[]>([]);
    const { t } = useLocalization();

    useEffect(() => {
        const loadSchedules = () => {
            const now = new Date().getTime();
            const upcoming = SCHEDULED_STREAMS.filter(s => new Date(s.startTime).getTime() > now)
                                              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            setSchedules(upcoming);
        };
        
        loadSchedules();
        const intervalId = setInterval(loadSchedules, 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);
    
    const enrichedSchedules = useMemo(() => {
        if (!streamerData?.data) return [];
        
        return schedules.map(schedule => {
            const streamerDetails = streamerData.data.find(s => s.username === schedule.streamerUsername);
            if (!streamerDetails) return null;
            return { ...schedule, streamer: streamerDetails };
        }).filter((item): item is EnrichedScheduledStream => item !== null);
    }, [schedules, streamerData]);

    useEffect(() => {
        const THIRTY_MINUTES_MS = 30 * 60 * 1000;
        const now = new Date().getTime();
        
        const liveSoonStreams = enrichedSchedules.filter(s => {
            const timeUntil = new Date(s.startTime).getTime() - now;
            return timeUntil > 0 && timeUntil <= THIRTY_MINUTES_MS;
        });

        const scheduledStreams = enrichedSchedules.filter(s => {
            const timeUntil = new Date(s.startTime).getTime() - now;
            return timeUntil > THIRTY_MINUTES_MS;
        });
        
        onStatsUpdate({
            enrichedSchedules,
            liveSoonCount: liveSoonStreams.length,
            scheduledCount: scheduledStreams.length,
            liveSoonLinks: liveSoonStreams.map(s => s.streamer.profile_url)
        });

    }, [enrichedSchedules, onStatsUpdate]);

    const filteredAndSortedSchedules = useMemo(() => {
        let processedSchedules = [...enrichedSchedules];

        const query = searchQuery.toLowerCase().trim();
        if (query) {
            processedSchedules = processedSchedules.filter(schedule => {
                const streamerName = schedule.streamer.display_name.toLowerCase();
                const notes = schedule.notes.toLowerCase();
                const characters = (schedule.characters || []).join(' ').toLowerCase();
                
                return streamerName.includes(query) || notes.includes(query) || characters.includes(query);
            });
        }
        
        if (sortOption === 'status') {
            processedSchedules.sort((a, b) => {
                const now = new Date().getTime();
                const THIRTY_MINUTES_MS = 30 * 60 * 1000;

                const timeUntilA = new Date(a.startTime).getTime() - now;
                const timeUntilB = new Date(b.startTime).getTime() - now;
                
                const isALiveSoon = timeUntilA > 0 && timeUntilA <= THIRTY_MINUTES_MS;
                const isBLiveSoon = timeUntilB > 0 && timeUntilB <= THIRTY_MINUTES_MS;
                
                if (isALiveSoon && !isBLiveSoon) return -1;
                if (!isALiveSoon && isBLiveSoon) return 1;

                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            });
        }
        
        return processedSchedules;
    }, [enrichedSchedules, searchQuery, sortOption]);

    if (schedules.length === 0) {
        return (
            <div className={`text-center py-16 text-black/80 dark:text-white/80 ${isAnimatingOut ? 'animate-fall-out' : 'animate-fall-in'}`} style={{ animationDelay: `${baseDelay}ms` }}>
                <h3 className="text-2xl font-bold">{t('noSchedulesTitle')}</h3>
                <p className="mt-2 text-base text-black/60 dark:text-white/60">{t('noSchedulesBody')}</p>
            </div>
        );
    }
    
    if (filteredAndSortedSchedules.length === 0) {
        return (
             <div className={`text-center py-16 text-black/80 dark:text-white/80 ${isAnimatingOut ? 'animate-fall-out' : 'animate-fall-in'}`} style={{ animationDelay: `${baseDelay}ms` }}>
                <h3 className="text-2xl font-bold">{t('noStreamersFoundTitle')}</h3>
                <p className="mt-2 text-base text-black/60 dark:text-white/60">{t('noStreamersFoundBody')}</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedSchedules.map((schedule, index) => (
                     <div key={schedule.id} className={`${isAnimatingOut ? 'animate-fall-out' : 'animate-fall-in'}`} style={{ animationDelay: `${baseDelay + index * 30}ms` }}>
                        <ScheduledStreamCard 
                            schedule={schedule} 
                            onCardClick={() => onCardClick(schedule.streamer)}
                            isNotificationSubscribed={!!streamerNotificationSettings[schedule.streamer.username]}
                            onNotificationToggle={onNotificationToggle}
                            notificationPermission={notificationPermission}
                            isFavorite={isFavorite(schedule.streamer.username)}
                            onToggleFavorite={onToggleFavorite}
                        />
                     </div>
                ))}
            </main>
        </div>
    );
};

export const ScheduledStreams = Object.assign(ScheduledStreamsComponent, {
    Card: ScheduledStreamCard,
});