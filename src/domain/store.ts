import { reactive, watch } from "vue";
import { createDefaultState, createEmptyQuarterReport } from "./defaultState";
import type { AppState } from "./types";

const STORAGE_KEY = "taima-decision-state-v1";
const SAVE_INTERVAL_MS = 10000;

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

const normalizeState = (parsed: unknown): AppState => {
  const merged = mergeDeep(createDefaultState(), parsed);
  Object.values(merged.modelConfigs).forEach((config) => {
    const legacyConfig = config as unknown as Record<string, unknown>;
    delete legacyConfig.apiKey;
    delete legacyConfig.baseUrl;
    delete legacyConfig.endpoint;
  });
  if (!isRecord(parsed) || !isRecord(parsed.modelConfigs)) return merged;

  const legacyConfig = Object.values(parsed.modelConfigs).find(
    (value) =>
      isRecord(value) &&
      (typeof value.apiKey === "string" || typeof value.baseUrl === "string" || typeof value.endpoint === "string"),
  );
  if (!isRecord(legacyConfig)) return merged;

  if (!merged.modelGateway.apiKey && typeof legacyConfig.apiKey === "string") {
    merged.modelGateway.apiKey = legacyConfig.apiKey;
  }
  if (!merged.modelGateway.baseUrl && typeof legacyConfig.baseUrl === "string") {
    merged.modelGateway.baseUrl = legacyConfig.baseUrl;
  }
  if (
    (!merged.modelGateway.endpoint || merged.modelGateway.endpoint === "/v1/chat/completions") &&
    typeof legacyConfig.endpoint === "string"
  ) {
    merged.modelGateway.endpoint = legacyConfig.endpoint || "/v1/chat/completions";
  }
  return merged;
};

const queryQuarter = () => {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("q") ?? params.get("quarter");
  const quarter = Number(raw);
  return Number.isInteger(quarter) && quarter > 0 ? quarter : undefined;
};

const applyUrlOverrides = (value: AppState): AppState => {
  const quarter = queryQuarter();
  if (quarter) value.currentQuarter = quarter;
  return value;
};

const loadState = (): AppState => {
  const defaults = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return applyUrlOverrides(defaults);
    return applyUrlOverrides(normalizeState(JSON.parse(raw)));
  } catch {
    return applyUrlOverrides(defaults);
  }
};

export const state = reactive(loadState()) as AppState;

let hasPendingSave = false;

const persistState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  hasPendingSave = false;
};

watch(
  state,
  () => {
    hasPendingSave = true;
  },
  { deep: true },
);

if (typeof window !== "undefined") {
  window.setInterval(() => {
    if (hasPendingSave) persistState();
  }, SAVE_INTERVAL_MS);
  window.addEventListener("beforeunload", persistState);
}

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
  const merged = normalizeState(parsed);
  Object.assign(state, merged);
  persistState();
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
  persistState();
};

export const resetModelConfigs = () => {
  state.modelGateway = createDefaultState().modelGateway;
  state.modelConfigs = createDefaultState().modelConfigs;
  persistState();
};

export const resetPromptTemplates = () => {
  state.promptTemplates = createDefaultState().promptTemplates;
  persistState();
};

export const resetCostTable = () => {
  state.costTable = createDefaultState().costTable;
  persistState();
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
