import { createMMKV } from 'react-native-mmkv';

export const LIVE_LOCATION_QUEUE_KEY = 'live_location_queue_v1';
export const LIVE_LOCATION_TRACKING_STATE_KEY = 'live_location_tracking_state_v1';

export interface LiveLocationQueueItem {
  id: string;
  latitude: number;
  longitude: number;
  time: string;
  createdAt: string;
}

interface LiveLocationTrackingState {
  active: boolean;
  startedAt?: string;
  lastCapturedAt?: string;
}

const storage = createMMKV({ id: 'live-location-storage' });

const readJson = <T>(key: string, fallback: T): T => {
  const raw = storage.getString(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  storage.set(key, JSON.stringify(value));
};

export const getQueuedLiveLocations = (): LiveLocationQueueItem[] =>
  readJson<LiveLocationQueueItem[]>(LIVE_LOCATION_QUEUE_KEY, []);

export const enqueueLiveLocation = (item: Omit<LiveLocationQueueItem, 'id' | 'createdAt'>) => {
  const now = new Date();
  const location: LiveLocationQueueItem = {
    ...item,
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: now.toISOString(),
  };

  writeJson(LIVE_LOCATION_QUEUE_KEY, [...getQueuedLiveLocations(), location]);
  return location;
};

export const removeQueuedLiveLocations = (ids: string[]) => {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  writeJson(
    LIVE_LOCATION_QUEUE_KEY,
    getQueuedLiveLocations().filter(item => !idSet.has(item.id)),
  );
};

export const clearLiveLocationQueue = () => {
  storage.remove(LIVE_LOCATION_QUEUE_KEY);
};

export const getLiveLocationTrackingState = (): LiveLocationTrackingState =>
  readJson<LiveLocationTrackingState>(LIVE_LOCATION_TRACKING_STATE_KEY, { active: false });

export const setLiveLocationTrackingState = (state: LiveLocationTrackingState) => {
  writeJson(LIVE_LOCATION_TRACKING_STATE_KEY, state);
};

export const clearLiveLocationTrackingState = () => {
  storage.remove(LIVE_LOCATION_TRACKING_STATE_KEY);
};
