import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import type { Channel } from '../types';

interface MultiStreamSelectorProps {
  allStreamers: Channel[];
  selectedUsernames: string[];
  onSelectionChange: (usernames: string[]) => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const MultiStreamSelector: React.FC<MultiStreamSelectorProps> = ({ allStreamers, selectedUsernames, onSelectionChange, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocalization();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  useEffect(() => {
    onOpenChange(isOpen);
    if (isOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, onOpenChange]);

  const toggleStreamer = (username: string) => {
    const newSelected = selectedUsernames.includes(username)
      ? selectedUsernames.filter(u => u !== username)
      : [...selectedUsernames, username];
    onSelectionChange(newSelected);
  };

  const filteredStreamers = allStreamers
    .filter(streamer => 
        streamer.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        streamer.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  const getButtonLabel = () => {
    if (selectedUsernames.length === 0) return t('selectStreamers');
    if (selectedUsernames.length === 1) {
        const streamer = allStreamers.find(s => s.username === selectedUsernames[0]);
        return streamer?.display_name || selectedUsernames[0];
    }
    return t('streamersSelected', { count: selectedUsernames.length });
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 px-5 text-left rtl:text-right text-lg text-black bg-white/20 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/20 dark:placeholder-gray-400 backdrop-blur-sm transition-all flex justify-between items-center"
        style={{ borderRadius: '35px' }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getButtonLabel()}</span>
        <svg className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div
        className={`absolute z-50 w-full top-full mt-2 bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-white/20 dark:border-black/20 shadow-lg max-h-96 flex flex-col origin-top transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        style={{ borderRadius: '15px', overflow: 'hidden' }}
      >
        <div className="p-2 sticky top-0 z-10 bg-white/50 dark:bg-black/50">
          <div className="relative">
             <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-3 rtl:pl-0 rtl:pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </span>
             <input
                ref={searchInputRef}
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchStreamer')}
                className="w-full py-2 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-black bg-black/5 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-white/5 dark:placeholder-gray-400"
              />
          </div>
        </div>

        <ul role="listbox" className="p-2 overflow-y-auto">
          {filteredStreamers.length > 0 ? filteredStreamers.map(streamer => (
            <li
              key={streamer.username}
              onClick={() => toggleStreamer(streamer.username)}
              className="px-3 py-2.5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between gap-3 rounded-md"
              role="option"
              aria-selected={selectedUsernames.includes(streamer.username)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedUsernames.includes(streamer.username) ? 'bg-blue-500 border-blue-500' : 'border-gray-400 dark:border-gray-500'}`}>
                    {selectedUsernames.includes(streamer.username) && <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="white"><path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/></svg>}
                </div>
                <img src={streamer.profile_pic || 'https://picsum.photos/100'} alt={streamer.display_name} className="w-8 h-8 rounded-full object-cover" />
                <span className="flex-grow">{streamer.display_name}</span>
              </div>
              {streamer.is_live && <span className="h-2 w-2 rounded-full bg-green-400"></span>}
            </li>
          )) : (
            <li className="px-3 py-4 text-center text-sm text-gray-500">{t('noStreamersFoundTitle')}</li>
          )}
        </ul>

        {selectedUsernames.length > 0 && (
            <div className="p-2 sticky bottom-0 bg-white/50 dark:bg-black/50">
                <button
                    onClick={(e) => { e.stopPropagation(); onSelectionChange([]) }}
                    className="w-full text-center py-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
                >
                    {t('clearAll')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};