import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  tagCounts: { [key: string]: number };
  onOpenChange: (isOpen: boolean) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({ allTags, selectedTags, onSelectedTagsChange, tagCounts, onOpenChange }) => {
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

  const toggleTag = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onSelectedTagsChange(newSelectedTags);
  };

  const filteredTags = allTags
    .filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
        const countDiff = (tagCounts[b] || 0) - (tagCounts[a] || 0);
        if (countDiff !== 0) return countDiff;
        return a.localeCompare(b);
    });

  const getButtonLabel = () => {
    if (selectedTags.length === 0) return t('filterByTags');
    if (selectedTags.length === 1) return selectedTags[0];
    return t('tagsSelected', { count: selectedTags.length });
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 text-left rtl:text-right text-black bg-white/20 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/20 dark:placeholder-gray-400 backdrop-blur-sm transition-all flex justify-between items-center"
        style={{ borderRadius: '35px' }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getButtonLabel()}</span>
        <svg className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute z-50 w-full mt-2 bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-white/20 dark:border-black/20 shadow-lg max-h-72 flex flex-col origin-top transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        style={{ borderRadius: '15px', overflow: 'hidden' }}
      >
        {/* Sticky Search Bar */}
        <div className="p-2 sticky top-0 z-10">
          <div className="relative">
             <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-3 rtl:pl-0 rtl:pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </span>
             <input
                ref={searchInputRef}
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchTags')}
                className="w-full py-2 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-black bg-black/5 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-white/5 dark:placeholder-gray-400"
              />
          </div>
        </div>

        {/* Scrollable Tag List */}
        <ul role="listbox" className="p-2 overflow-y-auto">
          {filteredTags.length > 0 ? filteredTags.map(tag => (
            <li
              key={tag}
              onClick={() => toggleTag(tag)}
              className="px-3 py-2.5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between gap-3 rounded-md"
              role="option"
              aria-selected={selectedTags.includes(tag)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedTags.includes(tag) ? 'bg-blue-500 border-blue-500' : 'border-gray-400 dark:border-gray-500'}`}>
                    {selectedTags.includes(tag) && <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="white"><path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/></svg>}
                </div>
                <span className="flex-grow">{tag}</span>
              </div>
              <span className="text-xs text-black/70 dark:text-white/70 bg-black/10 dark:bg-white/10 rounded-full px-2 py-0.5 font-mono">
                {tagCounts[tag] || 0}
              </span>
            </li>
          )) : (
            <li className="px-3 py-4 text-center text-sm text-gray-500">{t('noTagsFound')}</li>
          )}
        </ul>

        {/* Sticky Clear Button */}
        {selectedTags.length > 0 && (
            <div className="p-2 sticky bottom-0">
                <button
                    onClick={() => onSelectedTagsChange([])}
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