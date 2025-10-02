import { useState } from "react";

export function useImagePreloader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const preloadImage = async (imageUrl) => {
    try {
      setIsLoaded(false);
      setError(null);

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      setIsLoaded(true);
      return imageUrl;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return { preloadImage, isLoaded, error };
}

export function useLazyImage(defaultImage = "") {
  const [src, setSrc] = useState(defaultImage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadImage = async (imageUrl) => {
    try {
      setIsLoading(true);
      setError(null);

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      setSrc(imageUrl);
      setIsLoading(false);
    } catch (err) {
      setError(err);
      setSrc(defaultImage);
      setIsLoading(false);
    }
  };

  return { src, isLoading, error, loadImage };
}

export function useImageCache() {
  const cache = new Map();

  const preloadAndCache = async (imageUrl) => {
    if (cache.has(imageUrl)) {
      return cache.get(imageUrl);
    }

    try {
      const img = new Image();
      const promise = new Promise((resolve, reject) => {
        img.onload = () => resolve(imageUrl);
        img.onerror = reject;
        img.src = imageUrl;
      });

      cache.set(imageUrl, promise);
      return await promise;
    } catch (error) {
      cache.delete(imageUrl);
      throw error;
    }
  };

  const clearCache = () => {
    cache.clear();
  };

  return { preloadAndCache, clearCache };
}
