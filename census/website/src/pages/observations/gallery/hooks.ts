import { useContext } from 'react';
import { useStore } from 'zustand';
import { GalleryContext, GalleryStore } from './GalleryProvider';

export const useGallery = <U>(selector: (store: GalleryStore) => U): U => {
  const client = useContext(GalleryContext);
  if (!client) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return useStore(client, selector);
};
