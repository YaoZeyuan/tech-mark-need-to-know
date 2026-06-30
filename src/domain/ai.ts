import md5 from "md5";
import type { ModelConfig } from "./types";

const DB_NAME = "taima-ai-cache";
const STORE_NAME = "responses";

const openCacheDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const readCache = async (key: string) => {
  const db = await openCacheDb();
  return new Promise<string | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result as string | undefined);
    request.onerror = () => reject(request.error);
  });
};

const writeCache = async (key: string, value: string) => {
  const db = await openCacheDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearAiCache = async () => {
  const db = await openCacheDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const endpointUrl = (config: ModelConfig) => {
  const base = config.baseUrl.replace(/\/$/, "");
  const endpoint = (config.endpoint || "/v1/chat/completions").startsWith("/")
    ? config.endpoint || "/v1/chat/completions"
    : `/${config.endpoint}`;
  return `${base}${endpoint}`;
};

export const callModel = async (config: ModelConfig, prompt: string) => {
  if (!config.apiKey || !config.baseUrl || !config.model) {
    throw new Error(`${config.label} 缺少 API_KEY、baseUrl 或 model。`);
  }
  const cacheKey = md5(JSON.stringify({ config: { baseUrl: config.baseUrl, endpoint: config.endpoint, model: config.model }, prompt }));
  const cached = await readCache(cacheKey);
  if (cached) return { content: cached, cached: true };
  const response = await fetch(endpointUrl(config), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!response.ok) {
    throw new Error(`${config.label} 请求失败：${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "";
  await writeCache(cacheKey, content);
  return { content, cached: false };
};
