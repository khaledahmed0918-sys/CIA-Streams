export const humanizeTime = (isoString: string | null, language: string): string => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    // Intl.RelativeTimeFormat is perfect for this
    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

    if (seconds < 60) {
        return rtf.format(-seconds, 'second');
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return rtf.format(-minutes, 'minute');
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return rtf.format(-hours, 'hour');
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
        return rtf.format(-days, 'day');
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
        return rtf.format(-months, 'month');
    }
    const years = Math.floor(months / 12);
    return rtf.format(-years, 'year');
}

export const formatFullDateTime = (isoString: string | null, language: string): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';
        return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'N/A';
    }
};