import type { ScheduledStream } from '../types';

const STORAGE_KEY = 'kick-scheduled-streams';

/**
 * Retrieves scheduled streams from localStorage, filters out any that are expired (start time is in the past).
 * @returns An array of active ScheduledStream objects.
 */
export const getScheduledStreams = (): ScheduledStream[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return [];
    const streams: ScheduledStream[] = JSON.parse(storedData);
    
    // Filter out streams that have already started
    const now = new Date().getTime();
    return streams.filter(stream => new Date(stream.startTime).getTime() > now)
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } catch (error) {
    console.error('Failed to parse scheduled streams from localStorage', error);
    // If parsing fails, clear the invalid data to prevent future errors
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

/**
 * Adds a new scheduled stream to localStorage.
 * @param stream The new stream data to add (without an id).
 */
export const addScheduledStream = (stream: Omit<ScheduledStream, 'id'>): void => {
  const currentStreams = getScheduledStreams(); // getScheduledStreams already filters expired ones
  const newStream: ScheduledStream = {
    ...stream,
    id: new Date().toISOString() + Math.random().toString(36).substring(2, 9),
  };
  const updatedStreams = [...currentStreams, newStream];
  
  // Sort by start time ascending
  updatedStreams.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStreams));
};

/**
 * Deletes a scheduled stream from localStorage by its id.
 * @param id The id of the stream to delete.
 */
export const deleteScheduledStream = (id: string): void => {
  let streams = getScheduledStreams();
  streams = streams.filter(stream => stream.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(streams));
};
