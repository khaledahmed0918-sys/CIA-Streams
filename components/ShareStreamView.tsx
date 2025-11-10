import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import type { Channel } from '../types';
import { StreamWindow } from './StreamWindow';

declare const pako: any;

export interface WindowData {
    id: string;
    zIndex: number;
    position: { x: number; y: number };
    size: { width: number; height: number };
    streamerUsername: string | null;
    isChatVisible: boolean;
    isPlayerMaximized: boolean;
    isWindowMaximized: boolean;
}

export interface Layout {
    windows: WindowData[];
    extraSpace: number;
}

interface SavedLayout {
    id: string;
    name: string;
    code: string;
}

interface CodePayload {
    v: number;
    name: string;
    createdAt: number;
    layout: Layout;
    expiresAt: number | null;
}

const STORAGE_KEY_SAVED_LAYOUTS = 'cia_saved_layouts';

const keyMap: { [key: string]: string } = {
    windows: 'w', extraSpace: 'es', id: 'i', zIndex: 'z', position: 'p', size: 's', 
    streamerUsername: 'u', isChatVisible: 'c', isPlayerMaximized: 'pm', isWindowMaximized: 'wm',
    x: 'x', y: 'y', width: 'wd', height: 'ht'
};
const reverseKeyMap = Object.fromEntries(Object.entries(keyMap).map(([k, v]) => [v, k]));

const minifyObject = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(minifyObject);
    if (typeof obj !== 'object' || obj === null) return obj;
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [keyMap[k] || k, minifyObject(v)])
    );
};

const deminifyObject = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(deminifyObject);
    if (typeof obj !== 'object' || obj === null) return obj;
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [reverseKeyMap[k] || k, deminifyObject(v)])
    );
};

interface ShareStreamViewProps {
    liveStreamers: Channel[];
    isAnimatingOut: boolean;
    windows: WindowData[];
    setWindows: React.Dispatch<React.SetStateAction<WindowData[]>>;
    nextZIndex: number;
    setNextZIndex: React.Dispatch<React.SetStateAction<number>>;
    extraSpace: number;
    setExtraSpace: React.Dispatch<React.SetStateAction<number>>;
}

export const ShareStreamView: React.FC<ShareStreamViewProps> = ({ 
    liveStreamers, 
    isAnimatingOut,
    windows,
    setWindows,
    nextZIndex,
    setNextZIndex,
    extraSpace,
    setExtraSpace,
}) => {
    const { t } = useLocalization();

    const addWindow = useCallback(() => {
        if (liveStreamers.length === 0) {
            alert(t('noLiveStreamers'));
            return;
        }
        const newWindow: WindowData = {
            id: `window-${Date.now()}`,
            zIndex: nextZIndex,
            position: {
                x: 50 + ((windows.length * 40) % 300),
                y: 50 + ((windows.length * 40) % 200),
            },
            size: { width: 640, height: 480 },
            streamerUsername: liveStreamers[0]?.username || null,
            isChatVisible: true,
            isPlayerMaximized: false,
            isWindowMaximized: false
        };
        setWindows(prev => [...prev, newWindow]);
        setNextZIndex(prev => prev + 1);
    }, [liveStreamers, nextZIndex, windows.length, t, setWindows, setNextZIndex]);

    const updateWindow = useCallback((id: string, data: Partial<WindowData>) => {
        setWindows(currentWindows =>
            currentWindows.map(w => (w.id === id ? { ...w, ...data } : w))
        );
    }, [setWindows]);

    const closeWindow = useCallback((id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
    }, [setWindows]);
    
    const bringToFront = useCallback((id: string) => {
        if (windows.find(w => w.id === id)?.zIndex !== nextZIndex - 1) {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: nextZIndex } : w));
            setNextZIndex(prev => prev + 1);
        }
    }, [windows, nextZIndex, setWindows, setNextZIndex]);

    const applyLayout = useCallback((layout: Layout) => {
        setExtraSpace(layout.extraSpace);
        setWindows(layout.windows);
        const maxZ = Math.max(...layout.windows.map(w => w.zIndex), 100);
        setNextZIndex(maxZ + 1);
    }, [setExtraSpace, setWindows, setNextZIndex]);

    return (
        <div className={`animation-container ${isAnimatingOut ? 'animate-item-pop-out' : 'animate-item-pop-in'}`}>
            <LayoutManager 
                onApplyLayout={applyLayout} 
                currentLayout={{ windows, extraSpace }}
                onAddWindow={addWindow}
            />
            <div 
                className="share-stream-view relative" 
                style={{ 
                    height: `calc(60vh + ${extraSpace}px)`,
                    paddingBottom: '80px'
                }}
            >
                {windows.map(winData => (
                    <StreamWindow
                        key={winData.id}
                        windowData={winData}
                        liveStreamers={liveStreamers}
                        onClose={closeWindow}
                        onFocus={bringToFront}
                        onUpdate={updateWindow}
                    />
                ))}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[9999]">
                    <button
                      onClick={() => setExtraSpace(prev => prev + 300)}
                      className="rounded-[35px] border border-white/10 bg-white/10 px-8 py-3 text-lg font-semibold backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 text-center"
                      style={{ color: 'var(--text-body)' }}
                    >
                      {t('addSpace')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LayoutManager: React.FC<{
    onApplyLayout: (layout: Layout) => void;
    currentLayout: Layout;
    onAddWindow: () => void;
}> = ({ onApplyLayout, currentLayout, onAddWindow }) => {
    const { t } = useLocalization();
    const [expiration, setExpiration] = useState<number | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [layoutName, setLayoutName] = useState('');
    const [codeToApply, setCodeToApply] = useState('');
    const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
    const [deletingLayoutId, setDeletingLayoutId] = useState<string | null>(null);
    const saveNameInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_SAVED_LAYOUTS);
        if (stored) {
            try {
                setSavedLayouts(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse saved layouts", e);
                localStorage.removeItem(STORAGE_KEY_SAVED_LAYOUTS);
            }
        }
    }, []);

    const generateCode = useCallback(() => {
        const payload: Omit<CodePayload, 'v'> = {
            name: layoutName.trim() || `Layout @ ${new Date().toLocaleTimeString()}`,
            createdAt: Date.now(),
            layout: currentLayout,
            expiresAt: expiration ? Date.now() + expiration * 60 * 1000 : null,
        };
        const minifiedPayload = {
            v: 2,
            ...minifyObject(payload)
        };
        const jsonString = JSON.stringify(minifiedPayload);
        const compressed = pako.deflate(jsonString); // Returns Uint8Array
        
        let binaryString = '';
        for (let i = 0; i < compressed.length; i++) {
            binaryString += String.fromCharCode(compressed[i]);
        }
        
        const code = btoa(binaryString);
        setGeneratedCode(code);
    }, [currentLayout, expiration, layoutName]);

    const handleApplyCode = useCallback((code: string) => {
        if (!code.trim()) return;
        try {
            const binaryString = atob(code);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const decoded = pako.inflate(bytes, { to: 'string' });
            const rawPayload = JSON.parse(decoded);

            let payload: CodePayload;
            if (rawPayload.v === 2) {
                payload = deminifyObject(rawPayload);
            } else if (rawPayload.v === 1) { 
                payload = { ...rawPayload, name: 'Legacy Layout', createdAt: Date.now() };
            } else {
                throw new Error('Unsupported version');
            }
            
            if (!payload.layout) throw new Error('Invalid payload');

            if (payload.expiresAt && Date.now() > payload.expiresAt) {
                alert(t('invalidOrExpiredCode'));
                return;
            }
            onApplyLayout(payload.layout);
        } catch (error) {
            console.error(error);
            alert(t('loadLayoutError'));
        }
    }, [onApplyLayout, t]);
    
    const handleSaveLayout = useCallback(() => {
        if (!layoutName.trim()) {
            saveNameInputRef.current?.focus();
            return;
        }
        const payload: Omit<CodePayload, 'v'> = {
            name: layoutName.trim(),
            createdAt: Date.now(),
            layout: currentLayout,
            expiresAt: null, // Saved layouts don't expire
        };
        const minifiedPayload = { v: 2, ...minifyObject(payload) };
        const jsonString = JSON.stringify(minifiedPayload);
        const compressed = pako.deflate(jsonString); // returns Uint8Array

        let binaryString = '';
        for (let i = 0; i < compressed.length; i++) {
            binaryString += String.fromCharCode(compressed[i]);
        }
        const code = btoa(binaryString);
        
        const newLayout: SavedLayout = {
            id: `layout-${Date.now()}`,
            name: layoutName.trim(),
            code,
        };
        const newSavedLayouts = [...savedLayouts, newLayout];
        setSavedLayouts(newSavedLayouts);
        localStorage.setItem(STORAGE_KEY_SAVED_LAYOUTS, JSON.stringify(newSavedLayouts));
        setLayoutName('');
    }, [layoutName, currentLayout, savedLayouts]);

    const handleDeleteLayout = useCallback((layoutId: string, layoutName: string) => {
        if (deletingLayoutId) return;

        if (window.confirm(t('confirmDeleteLayout', { name: layoutName }))) {
            setDeletingLayoutId(layoutId);
            setTimeout(() => {
                setSavedLayouts(prev => {
                    const newLayouts = prev.filter(l => l.id !== layoutId);
                    localStorage.setItem(STORAGE_KEY_SAVED_LAYOUTS, JSON.stringify(newLayouts));
                    return newLayouts;
                });
                setDeletingLayoutId(null);
            }, 300);
        }
    }, [deletingLayoutId, t]);
    
    const expirationOptions = [
        { label: t('never'), value: null }, { label: t('minutes', { count: 1 }), value: 1 },
        { label: t('minutes', { count: 5 }), value: 5 }, { label: t('minutes', { count: 15 }), value: 15 },
        { label: t('minutes', { count: 30 }), value: 30 }, { label: t('hour'), value: 60 },
        { label: t('hours', { count: 12 }), value: 720 }, { label: t('day'), value: 1440 }
    ];

    return (
      <div className="w-full max-w-6xl mx-auto space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={onAddWindow} className="h-full w-full rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm text-lg font-semibold transition-all duration-200 hover:bg-white/20">
                  {t('addStreamWindow')}
              </button>
              
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-3">
                  <input ref={saveNameInputRef} type="text" value={layoutName} onChange={e => setLayoutName(e.target.value)} placeholder={t('layoutName')} className="w-full py-2 px-3 bg-black/5 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-white/5 dark:placeholder-gray-400" />
                   <div className="flex items-center gap-3">
                        {!generatedCode ? (
                            <button onClick={generateCode} className="flex-grow rounded-lg bg-blue-500/80 text-white px-4 py-2 font-semibold hover:bg-blue-500/100 transition-colors">
                                {t('generateCode')}
                            </button>
                        ) : (
                            <div className="flex-grow flex items-center gap-1 bg-black/10 dark:bg-white/10 rounded-lg p-1">
                                <input type="text" readOnly value={generatedCode} className="flex-grow bg-transparent text-xs px-2 outline-none" />
                                <button onClick={() => navigator.clipboard.writeText(generatedCode)} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                                <button onClick={generateCode} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded" title={t('regenerate')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" transform="rotate(90 12 12)" /></svg>
                                </button>
                            </div>
                        )}
                      <select value={expiration ?? ''} onChange={e => setExpiration(e.target.value ? Number(e.target.value) : null)} className="rounded-lg bg-black/20 dark:bg-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                          <option value="" disabled>{t('expiration')}</option>
                          {expirationOptions.map(opt => <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>)}
                      </select>
                   </div>
                   <button onClick={handleSaveLayout} className="w-full rounded-lg bg-green-500/80 text-white px-4 py-2 font-semibold hover:bg-green-500/100 transition-colors">{t('saveLayout')}</button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-2 flex flex-col justify-center">
                  <label className="block text-sm font-medium">{t('enterCode')}</label>
                  <div className="flex items-center gap-2">
                      <input type="text" value={codeToApply} onChange={e => setCodeToApply(e.target.value)} placeholder={t('pasteCode')} className="flex-grow w-full py-2 px-3 bg-black/5 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-white/5 dark:placeholder-gray-400" />
                      <button onClick={() => handleApplyCode(codeToApply)} className="rounded-lg bg-gray-500/80 text-white px-4 py-2 font-semibold hover:bg-gray-500/100 transition-colors">{t('applyCode')}</button>
                  </div>
              </div>
          </div>
          {savedLayouts.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">{t('savedLayouts')}</h3>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {savedLayouts.map(layout => (
                          <li 
                              key={layout.id} 
                              className={`flex items-center justify-between gap-2 p-2 rounded-lg bg-black/10 dark:bg-white/5 transition-all duration-300 ${deletingLayoutId === layout.id ? 'animate-item-pop-out' : ''}`}
                          >
                              <span className="font-medium truncate">{layout.name}</span>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => handleApplyCode(layout.code)} className="text-xs font-semibold hover:underline">{t('load')}</button>
                                  <button 
                                    onClick={() => handleDeleteLayout(layout.id, layout.name)} 
                                    className="p-1 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
                                    title={t('delete')}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                              </div>
                          </li>
                      ))}
                  </ul>
              </div>
          )}
      </div>
    );
};