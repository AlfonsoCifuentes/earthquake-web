"use client";
/* lib/hooks/useFilters.ts — Global filter state with Zustand */
import { create } from "zustand";
import type { FilterState } from "../types";

interface FiltersStore extends FilterState {
  set: (patch: Partial<FilterState>) => void;
  reset: () => void;
}

function getDefaults(): FilterState {
  return {
    minMag: 0,
    maxMag: 10,
    minDepth: 0,
    maxDepth: 700,
    startDate: "2005-01-01",
    endDate: new Date().toISOString().slice(0, 10),
    regions: [],
    eventTypes: [],
  };
}

export const useFilters = create<FiltersStore>((set) => ({
  ...getDefaults(),
  set: (patch) => set((s) => ({ ...s, ...patch })),
  reset: () => set(getDefaults()),
}));
