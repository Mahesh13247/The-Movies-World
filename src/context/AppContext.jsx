import React, { createContext, useContext, useState } from 'react';
import useLocalStorage from '../utils/useLocalStorage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  // Profile
  const [profile, setProfile] = useLocalStorage('profile', { name: 'Guest', avatar: '' });
  // Watchlist
  const [watchlist, setWatchlist] = useLocalStorage('watchlist', []);
  // Favorites
  const [favorites, setFavorites] = useLocalStorage('favorites', []);
  // Reviews
  const [reviews, setReviews] = useLocalStorage('reviews', {});
  // PIN
  const [pin, setPin] = useLocalStorage('appPin', '');
  const [pinUnlocked, setPinUnlocked] = useLocalStorage('appPinUnlocked', false);

  const value = {
    theme, setTheme,
    profile, setProfile,
    watchlist, setWatchlist,
    favorites, setFavorites,
    reviews, setReviews,
    pin, setPin,
    pinUnlocked, setPinUnlocked,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext); 