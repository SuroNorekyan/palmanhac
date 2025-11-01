import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

type FavoritesStore = {
  ids: number[];
  toggle: (productId: number) => void;
  add: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  has: (productId: number) => boolean;
  setAll: (ids: number[]) => void;
};

const storageFactory = (): StateStorage => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }

  return localStorage;
};

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) => {
        const { ids } = get();
        if (ids.includes(productId)) {
          set({ ids: ids.filter((id) => id !== productId) });
        } else {
          set({ ids: [...ids, productId] });
        }
      },
      add: (productId) =>
        set((state) =>
          state.ids.includes(productId) ? state : { ids: [...state.ids, productId] },
        ),
      remove: (productId) =>
        set((state) => ({
          ids: state.ids.filter((id) => id !== productId),
        })),
      clear: () => set({ ids: [] }),
      has: (productId) => get().ids.includes(productId),
      setAll: (incoming) =>
        set({
          ids: Array.from(new Set(incoming)).filter((value) => Number.isFinite(value)),
        }),
    }),
    {
      name: "palmanhac-favorites",
      skipHydration: true,
      storage: createJSONStorage(storageFactory),
    },
  ),
);
