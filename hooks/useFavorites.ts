import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'favorite_streamers';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        try {
            const storedFavorites = localStorage.getItem(FAVORITES_KEY);
            if (storedFavorites) {
                setFavorites(JSON.parse(storedFavorites));
            }
        } catch (error) {
            console.error('Failed to parse favorites from localStorage', error);
            localStorage.removeItem(FAVORITES_KEY);
        }
    }, []);

    const saveFavorites = (newFavorites: string[]) => {
        setFavorites(newFavorites);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    };

    const toggleFavorite = useCallback((username: string) => {
        const isFav = favorites.includes(username);
        const newFavorites = isFav
            ? favorites.filter(fav => fav !== username)
            : [...favorites, username];
        saveFavorites(newFavorites);
    }, [favorites]);

    const clearFavorites = useCallback(() => {
        saveFavorites([]);
    }, []);

    const isFavorite = useCallback((username: string) => {
        return favorites.includes(username);
    }, [favorites]);
    
    return { favorites, toggleFavorite, clearFavorites, isFavorite, hasFavorites: favorites.length > 0 };
};
