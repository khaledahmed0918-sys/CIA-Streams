import React, { useState } from 'react';
import type { ScheduledStream } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { KICK_STREAMERS } from '../constants';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Omit<ScheduledStream, 'id'>) => void;
}

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useLocalization();
  const [streamerUsername, setStreamerUsername] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [charactersStr, setCharactersStr] = useState('');
  const [errors, setErrors] = useState<{ streamer?: string; startTime?: string }>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { streamer?: string; startTime?: string } = {};
    if (!streamerUsername) {
      newErrors.streamer = t('streamerRequired');
    }
    if (!startTime) {
      newErrors.startTime = t('startTimeRequired');
    } else if (new Date(startTime).getTime() <= new Date().getTime()) {
      newErrors.startTime = t('startTimeInPast');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    const characters = charactersStr.split(',').map(c => c.trim()).filter(Boolean);

    onSave({
      streamerUsername,
      startTime,
      notes,
      characters: characters.length > 0 ? characters : undefined,
    });
    handleClose();
  };
  
  const handleClose = () => {
      setStreamerUsername('');
      setStartTime('');
      setNotes('');
      setCharactersStr('');
      setErrors({});
      onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-schedule-modal-title"
    >
      <div 
        className="relative w-full max-w-md bg-slate-200/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 text-black dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-schedule-modal-title" className="text-2xl font-bold mb-6">{t('addSchedule')}</h2>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="streamer" className="block text-sm font-medium text-black/80 dark:text-white/80 mb-1">{t('streamer')}</label>
                <select id="streamer" value={streamerUsername} onChange={e => setStreamerUsername(e.target.value)} className="w-full py-2 px-3 bg-white/50 dark:bg-black/50 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="" disabled>{t('selectStreamer')}</option>
                    {KICK_STREAMERS.map(s => <option key={s.username} value={s.username}>{s.username}</option>)}
                </select>
                {errors.streamer && <p className="text-red-500 text-xs mt-1">{errors.streamer}</p>}
            </div>
            <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-black/80 dark:text-white/80 mb-1">{t('startTime')}</label>
                <input type="datetime-local" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full py-2 px-3 bg-white/50 dark:bg-black/50 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400" />
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
            </div>
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-black/80 dark:text-white/80 mb-1">{t('notes')}</label>
                <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full py-2 px-3 bg-white/50 dark:bg-black/50 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
                <label htmlFor="characters" className="block text-sm font-medium text-black/80 dark:text-white/80 mb-1">{t('charactersOptional')}</label>
                <input type="text" id="characters" value={charactersStr} onChange={e => setCharactersStr(e.target.value)} className="w-full py-2 px-3 bg-white/50 dark:bg-black/50 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
            <button onClick={handleClose} className="rounded-lg px-4 py-2 text-sm font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors">{t('cancel')}</button>
            <button onClick={handleSave} className="rounded-lg px-4 py-2 text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors">{t('save')}</button>
        </div>
      </div>
    </div>
  );
};
