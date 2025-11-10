import type { ScheduledStream } from '../types';

// Helper function to parse 'YYYY-MM-DD, h:mmA' into an ISO string.
// This assumes the input time is in the user's local timezone.
const parseDateTime = (dateTimeString: string): string => {
  const [datePart, timePart] = dateTimeString.split(', ');
  const [year, month, day] = datePart.split('-').map(Number);
  
  const timeRegex = /(\d{1,2}):(\d{2})(AM|PM)/i;
  const timeMatch = timePart.match(timeRegex);

  if (!timeMatch) {
    console.error(`Invalid time format for scheduling: ${timePart}`);
    // Return a date in the past to ensure it gets filtered out
    return new Date(0).toISOString();
  }

  let [, hoursStr, minutesStr, modifier] = timeMatch;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  modifier = modifier.toUpperCase();

  if (modifier === 'PM' && hours < 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) { // Midnight case: 12 AM is 00 hours
    hours = 0;
  }
  
  // JavaScript's Date constructor month is 0-indexed (0 for January, 11 for December)
  const date = new Date(year, month - 1, day, hours, minutes);
  return date.toISOString();
};


export const SCHEDULED_STREAMS: ScheduledStream[] = [
  {
      id: '1',
      streamerUsername: 'SXB',
      startTime: parseDateTime('2025-11-9, 9:00PM'),
      notes: 'Just Chatting, Playing MTRP in Grand Theft Auto V FiveM.',
       characters: ['Abdulsamad Alqurashi'],
  },
  {
      id: '2',
      streamerUsername: 'Zeeyadx',
      startTime: parseDateTime('2025-11-9, 3:30PM'),
      notes: 'CIA Academy Trainings, DO',
      characters: ['Agent Hunter'],
  },
  {
      id: '3',
      streamerUsername: 'Vilon',
      startTime: parseDateTime('2025-11-9, 3:30PM'),
      notes: 'CIA Academy Trainings, DO',
      characters: ['Agent Silver'],
  }
];
