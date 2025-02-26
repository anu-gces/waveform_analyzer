import { create } from "zustand";

type StoreState = {
  songFile: File | null;
  setSongFile: (file: File | null) => void;
  visibleKeys: number;
  setVisibleKeys: (keys: number) => void;
};

export const useStore = create<StoreState>((set) => ({
  songFile: null,
  setSongFile: (file) => set({ songFile: file }),
  visibleKeys: 2.3263,
  setVisibleKeys: (keys) => set({ visibleKeys: keys }),
}));
