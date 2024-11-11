import { createContext, FC, PropsWithChildren, useEffect, useRef } from 'react';
import { createStore, StoreApi } from 'zustand';
import { useGallery } from './hooks';

export interface GalleryStore {
  slides: string[];
  current?: string;
  register: (id: string) => void;
  unregister: (id: string) => void;
  next: () => void;
  previous: () => void;
}

interface GalleryProviderProps {
  loop?: boolean;
}

export const GalleryContext = createContext<StoreApi<GalleryStore> | null>(null);
export const GalleryProvider: FC<PropsWithChildren<GalleryProviderProps>> = ({ children, loop = false }) => {
  const store = useRef(
    createStore<GalleryStore>((set, get) => {
      return {
        slides: [],
        current: undefined,
        register: (id: string) => {
          const { current } = get();
          set(state => ({ slides: [...state.slides, id] }));
          if (!current) {
            set({ current: id });
          }
        },
        unregister: (id: string) => {
          set(state => ({ slides: state.slides.filter(slide => slide !== id) }));
        },
        next: () => {
          const { current, slides } = get();
          if (!current) return;
          const next = slides[slides.indexOf(current) + 1];
          if (!next) {
            if (loop) {
              set({ current: slides[0] });
            }
            return;
          }
          set({ current: next });
        },
        previous: () => {
          const { current, slides } = get();
          if (!current) return;
          const previous = slides[slides.indexOf(current) - 1];
          if (!previous) {
            if (loop) {
              set({ current: slides[slides.length - 1] });
            }
            return;
          }
          set({ current: previous });
        }
      };
    })
  );

  return <GalleryContext.Provider value={store.current}>{children}</GalleryContext.Provider>;
};

interface SlideProps {
  id: string;
}

export const Slide: FC<PropsWithChildren<SlideProps>> = ({ id, children }) => {
  const [register, unregister, current] = useGallery(state => [state.register, state.unregister, state.current]);
  useEffect(() => {
    register(id);
    return () => {
      unregister(id);
    };
  }, [register, unregister, id]);

  if (current === id) {
    return <>{children}</>;
  }
  return null;
};
