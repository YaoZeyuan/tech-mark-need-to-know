import { reactive, watch } from "vue";
import { createDefaultState, createEmptyQuarterReport } from "./defaultState";
import type { AppState } from "./types";

const STORAGE_KEY = "taima-decision-state-v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeDeep = <T>(base: T, patch: unknown): T => {
  if (Array.isArray(base)) {
    return (Array.isArray(patch) ? patch : base) as T;
  }
  if (!isRecord(base) || !isRecord(patch)) {
    return (patch === undefined ? base : patch) as T;
  }
  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    next[key] = key in base ? mergeDeep((base as Record<string, unknown>)[key], value) : value;
  }
  return next as T;
};

const loadState = (): AppState => {
  const defaults = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return mergeDeep(defaults, JSON.parse(raw));
  } catch {
    return defaults;
  }
};

export const state = reactive(loadState()) as AppState;

watch(
  state,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true },
);

export const ensureQuarterReport = () => {
  const quarterKey = String(state.currentQuarter);
  if (!state.reports[quarterKey]) {
    state.reports[quarterKey] = createEmptyQuarterReport();
  }
  return state.reports[quarterKey];
};

export const exportStateJson = () => JSON.stringify(state, null, 2);

export const importStateJson = (json: string) => {
  const parsed = JSON.parse(json) as unknown;
  const merged = mergeDeep(createDefaultState(), parsed);
  Object.assign(state, merged);
};

export const resetBusinessData = () => {
  const defaults = createDefaultState();
  state.currentQuarter = defaults.currentQuarter;
  state.companyGoal = defaults.companyGoal;
  state.roleHeadcount = defaults.roleHeadcount;
  state.productParameters = defaults.productParameters;
  state.marketIdealValues = defaults.marketIdealValues;
  state.decisionBook = defaults.decisionBook;
  state.reports = defaults.reports;
  state.aiRuns = defaults.aiRuns;
};

export const resetModelConfigs = () => {
  state.modelConfigs = createDefaultState().modelConfigs;
};

export const resetPromptTemplates = () => {
  state.promptTemplates = createDefaultState().promptTemplates;
};

export const resetCostTable = () => {
  state.costTable = createDefaultState().costTable;
};

export const downloadTextFile = (filename: string, content: string, type = "text/plain;charset=utf-8") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
