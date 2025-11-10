import React from 'react';
import type { QuranicVerse as VerseType } from '../data/quranicVerses';

interface QuranicVerseProps {
  verse: VerseType;
}

export const QuranicVerse: React.FC<QuranicVerseProps> = ({ verse }) => {
  return (
    <div className="w-full max-w-3xl text-center my-6 p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer">
      <p 
        className="text-xl md:text-2xl font-bold mb-2 text-black dark:text-white" 
        style={{ fontFamily: "'Noto Naskh Arabic', serif" }}
        dir="rtl"
      >
        {verse.verse}
      </p>
      {/* FIX: Conditionally render source and interpretation as they are now optional */}
      {verse.source && <p className="text-sm text-black/70 dark:text-white/70 mb-3" dir="rtl">{verse.source}</p>}
      {verse.interpretation && <p className="text-base text-black/80 dark:text-white/80" dir="rtl">{verse.interpretation}</p>}
    </div>
  );
};