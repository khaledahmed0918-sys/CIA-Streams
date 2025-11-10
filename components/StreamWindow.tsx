import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Channel } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { WindowData } from './ShareStreamView';

interface StreamWindowProps {
    windowData: WindowData;
    liveStreamers: Channel[];
    onClose: (id: string) => void;
    onFocus: (id: string) => void;
    onUpdate: (id: string, data: Partial<WindowData>) => void;
}

const MIN_WIDTH = 480;
const MIN_HEIGHT = 360;

export const StreamWindow: React.FC<StreamWindowProps> = ({ windowData, liveStreamers, onClose, onFocus, onUpdate }) => {
    const { t } = useLocalization();
    const { id, zIndex, position, size, streamerUsername, isChatVisible, isPlayerMaximized, isWindowMaximized } = windowData;
    
    const [isNarrow, setIsNarrow] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    
    const preMaximizeStateRef = useRef<{ size: { width: number; height: number; }; position: { x: number; y: number; }; } | null>(null);

    const dragRef = useRef<{ x: number, y: number } | null>(null);
    const resizeRef = useRef<{
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        startLeft: number;
        startTop: number;
        handle: 'r' | 'b' | 'l' | 'br';
    } | null>(null);
    const windowRef = useRef<HTMLDivElement>(null);

    const selectedStreamer = liveStreamers.find(s => s.username === streamerUsername) || null;

    useEffect(() => {
        const element = windowRef.current;
        if (!element) return;
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            const threshold = 550; 
            if (entry) {
                setIsNarrow(entry.contentRect.width < threshold);
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    
    useEffect(() => {
        if (isInteracting) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [isInteracting]);

    const handleInteractionEnd = useCallback(() => {
        setIsInteracting(false);
        dragRef.current = null;
        resizeRef.current = null;
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleInteractionEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleInteractionEnd);
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('touchmove', handleResizeMove);
    }, []);

    const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        onFocus(id);
        setIsInteracting(true);
        const touch = 'touches' in e ? e.touches[0] : null;
        const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;

        dragRef.current = {
            x: clientX - position.x,
            y: clientY - position.y,
        };
        
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleInteractionEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleInteractionEnd);
    }, [id, onFocus, position.x, position.y, handleInteractionEnd]);

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragRef.current || !windowRef.current?.parentElement) return;
        if ('touches' in e) e.preventDefault();
        
        const parent = windowRef.current.parentElement;
        const touch = 'touches' in e ? e.touches[0] : null;
        const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;
        
        let newX = clientX - dragRef.current.x;
        let newY = clientY - dragRef.current.y;
        
        newX = Math.max(0, Math.min(newX, parent.clientWidth - size.width));
        newY = Math.max(0, Math.min(newY, parent.clientHeight - size.height));
        
        onUpdate(id, { position: { x: newX, y: newY } });
    }, [id, size, onUpdate]);

    const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, handle: 'r' | 'b' | 'l' | 'br') => {
        e.stopPropagation();
        onFocus(id);
        setIsInteracting(true);
        const touch = 'touches' in e ? e.touches[0] : null;
        const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;

        resizeRef.current = {
            startX: clientX,
            startY: clientY,
            startWidth: size.width,
            startHeight: size.height,
            startLeft: position.x,
            startTop: position.y,
            handle,
        };
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleInteractionEnd);
        document.addEventListener('touchmove', handleResizeMove, { passive: false });
        document.addEventListener('touchend', handleInteractionEnd);
    }, [id, onFocus, size, position, handleInteractionEnd]);

    const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!resizeRef.current || !windowRef.current?.parentElement) return;
        if ('touches' in e) e.preventDefault();
        
        const touch = 'touches' in e ? e.touches[0] : null;
        const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;

        const { handle, startX, startY, startWidth, startHeight, startLeft, startTop } = resizeRef.current;
        const parent = windowRef.current.parentElement;

        const dx = clientX - startX;
        const dy = clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startLeft;

        if (handle.includes('r')) {
            newWidth = Math.max(MIN_WIDTH, Math.min(startWidth + dx, parent.clientWidth - startLeft));
        }
        if (handle.includes('b')) {
            newHeight = Math.max(MIN_HEIGHT, Math.min(startHeight + dy, parent.clientHeight - startTop));
        }
        if (handle.includes('l')) {
            const potentialNewWidth = startWidth - dx;
            if (potentialNewWidth > MIN_WIDTH) {
                newWidth = potentialNewWidth;
                newX = startLeft + dx;
            } else {
                newWidth = MIN_WIDTH;
                newX = startLeft + startWidth - MIN_WIDTH;
            }
            if (newX < 0) {
                newWidth += newX;
                newX = 0;
            }
        }
        
        onUpdate(id, { size: { width: newWidth, height: newHeight }, position: { x: newX, y: position.y }});

    }, [id, position.y, onUpdate]);

    const handleMaximizeWindow = () => {
        if (!windowRef.current?.parentElement) return;
        onFocus(id);

        if (isWindowMaximized) {
            // Restore
            if (preMaximizeStateRef.current) {
                onUpdate(id, { ...preMaximizeStateRef.current, isWindowMaximized: false });
                preMaximizeStateRef.current = null;
            } else {
                 onUpdate(id, { isWindowMaximized: false });
            }
        } else {
            // Maximize
            preMaximizeStateRef.current = { size, position };

            const parent = windowRef.current.parentElement;
            const parentWidth = parent.clientWidth;
            const parentHeight = parent.clientHeight;
            const aspectRatio = 16 / 9;

            let newWidth = parentWidth;
            let newHeight = newWidth / aspectRatio;

            if (newHeight > parentHeight) {
                newHeight = parentHeight;
                newWidth = newHeight * aspectRatio;
            }

            const newX = (parentWidth - newWidth) / 2;
            const newY = (parentHeight - newHeight) / 2;
            
            onUpdate(id, {
                size: { width: newWidth, height: newHeight },
                position: { x: newX, y: newY },
                isWindowMaximized: true
            });
        }
    };
    
    const handleMakeBigger = () => {
        if (!windowRef.current?.parentElement) return;
        onUpdate(id, {
            size: {
                width: Math.min(size.width + 50, windowRef.current.parentElement.clientWidth - position.x),
                height: Math.min(size.height + 40, windowRef.current.parentElement.clientHeight - position.y)
            }
        });
    };

    const handleMakeSmaller = () => {
        onUpdate(id, {
            size: {
                width: Math.max(MIN_WIDTH, size.width - 50),
                height: Math.max(MIN_HEIGHT, size.height - 40)
            }
        });
    };

    useEffect(() => {
        if (streamerUsername && !liveStreamers.some(s => s.username === streamerUsername)) {
             onUpdate(id, { streamerUsername: liveStreamers[0]?.username || null });
        }
        if (!streamerUsername && liveStreamers.length > 0) {
            onUpdate(id, { streamerUsername: liveStreamers[0].username });
        }
    }, [id, liveStreamers, streamerUsername, onUpdate]);

    const playerSrc = selectedStreamer ? `https://player.kick.com/${selectedStreamer.username}?autoplay=true&muted=true` : '';
    const chatSrc = selectedStreamer ? `https://kick.com/popout/${selectedStreamer.username}/chat` : '';
    const windowClasses = `stream-window ${isPlayerMaximized ? 'player-maximized' : ''} ${isNarrow ? 'is-narrow' : ''} ${isWindowMaximized ? 'transition-all duration-300' : ''}`;

    return (
        <div 
            ref={windowRef}
            className={windowClasses}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`, 
                width: `${size.width}px`, 
                height: `${size.height}px`,
                zIndex 
            }}
            onMouseDown={() => onFocus(id)}
            onTouchStart={() => onFocus(id)}
        >
            <header className="stream-window-header" onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
                <div className="stream-window-header-title">
                    {selectedStreamer && <img src={selectedStreamer.profile_pic || ''} alt="" />}
                    <p>{selectedStreamer ? selectedStreamer.display_name : 'CIA Streams'}</p>
                </div>
                <div className="stream-window-header-buttons">
                    <button onClick={(e) => { e.stopPropagation(); handleMakeSmaller(); }} title={t('windowZoomOut')}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleMakeBigger(); }} title={t('windowZoomIn')}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    </button>
                     <button onClick={(e) => { e.stopPropagation(); handleMaximizeWindow(); }} title={isWindowMaximized ? t('restoreWindow') : t('maximizeWindow')}>
                        {isWindowMaximized ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 2.5a.5.5 0 0 0-1 0v2A.5.5 0 0 0 5 5h2a.5.5 0 0 0 0-1H5.5V2.5zm-2 9a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-1 0v1.5H3.5zm8.5-2a.5.5 0 0 0-1 0v1.5h-1.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5v-2zm-1.5-6.5a.5.5 0 0 0 0-1h-2a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 1 0V3.5h1.5z"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 2.5a.5.5 0 0 1 .5.5v1.5H5.5a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5zm8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1H10.5V3a.5.5 0 0 1 .5-.5zM2.5 12a.5.5 0 0 1 .5-.5h1.5v-1.5a.5.5 0 0 1 1 0V12a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5zm10 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-1.5h-1.5a.5.5 0 0 1-.5-.5z"/></svg>
                        )}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdate(id, { isPlayerMaximized: !isPlayerMaximized }) }} title={isPlayerMaximized ? t('restorePlayer') : t('maximizePlayer')}>
                        {isPlayerMaximized ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10 4 4 4 4 10"></polyline><polyline points="14 20 20 20 20 14"></polyline><line x1="20" y1="4" x2="14" y2="10"></line><line x1="4" y1="20" x2="10" y2="14"></line></svg>
                        )}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdate(id, { isChatVisible: !isChatVisible }) }} title={t('chat')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm6 12.787L7.096 11.5a2 2 0 0 0-1.6-.8H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1.5a2 2 0 0 0-1.6.8L8 12.787zM3.5 3.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/></svg>
                    </button>
                    <button onClick={(e) => {e.stopPropagation(); onClose(id)}} title={t('close')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>
                    </button>
                </div>
            </header>
            <div className="stream-window-content">
                <aside className="stream-window-sidebar">
                    <h4>{t('liveChannels')}</h4>
                    <div className="streamer-list">
                    {liveStreamers.map(streamer => (
                        <div key={streamer.username} className={`streamer-list-item ${selectedStreamer?.username === streamer.username ? 'active' : ''}`} onClick={() => onUpdate(id, { streamerUsername: streamer.username })}>
                            <img src={streamer.profile_pic || ''} alt={streamer.display_name} />
                            <div className="streamer-list-item-info">
                                <p>{streamer.display_name}</p>
                                <p className="category">{streamer.live_category || '...'}</p>
                            </div>
                            <div className="streamer-list-live-info">
                                <div className="streamer-list-live-dot"></div>
                                <p>{streamer.viewer_count?.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </aside>
                <main className="stream-window-main">
                    <div className="stream-player-area">
                        {selectedStreamer ? (
                            <>
                                <div className="player-iframe-container">
                                    <iframe 
                                        key={selectedStreamer.username}
                                        title={`Kick player - ${selectedStreamer.username}`}
                                        src={playerSrc}
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
                                    ></iframe>
                                </div>
                                <div className="player-info-bar">
                                  <div className="player-info">
                                    <img src={selectedStreamer.profile_pic || ''} alt={selectedStreamer.display_name} />
                                    <div className="player-info-text">
                                        <h3 className="name">{selectedStreamer.display_name}</h3>
                                        <p className="title">{selectedStreamer.live_title}</p>
                                        <p className="category">{selectedStreamer.live_category}</p>
                                    </div>
                                  </div>
                                </div>
                            </>
                        ) : (
                            <div className="stream-offline-view">
                                <h3>{liveStreamers.length > 0 ? t('channelOffline') : t('noLiveStreamers')}</h3>
                                {liveStreamers.length > 0 && selectedStreamer &&
                                    <button onClick={() => window.open(selectedStreamer.profile_url, '_blank')}>{t('openOnKick')}</button>
                                }
                            </div>
                        )}
                    </div>
                    <aside className={`stream-chat-area ${!isChatVisible ? 'hidden' : ''}`}>
                        {selectedStreamer && isChatVisible && (
                            <iframe
                                key={`${selectedStreamer.username}-chat`}
                                title={`Kick chat - ${selectedStreamer.username}`}
                                src={chatSrc}
                                allow="clipboard-read clipboard-write"
                                sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                            />
                        )}
                    </aside>
                </main>
            </div>
            {/* Resizing handles */}
            <>
                <div className="resize-handle resize-handle-left" onMouseDown={(e) => handleResizeStart(e, 'l')} onTouchStart={(e) => handleResizeStart(e, 'l')}></div>
                <div className="resize-handle resize-handle-right" onMouseDown={(e) => handleResizeStart(e, 'r')} onTouchStart={(e) => handleResizeStart(e, 'r')}></div>
                <div className="resize-handle resize-handle-bottom" onMouseDown={(e) => handleResizeStart(e, 'b')} onTouchStart={(e) => handleResizeStart(e, 'b')}></div>
                <div className="resize-handle resize-handle-br" onMouseDown={(e) => handleResizeStart(e, 'br')} onTouchStart={(e) => handleResizeStart(e, 'br')}></div>
            </>
        </div>
    );
};
