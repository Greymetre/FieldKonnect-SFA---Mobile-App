import axiosClient from './AxiosClient';
import { API_ENDPOINT } from './ApiUrls';
import type { LiveLocationQueueItem } from '../storage/liveLocationQueue';

export interface UpdateLiveLocationPayload {
  locations: Array<{
    latitude: string;
    longitude: string;
    time: string;
  }>;
}

export const buildLiveLocationPayload = (
  locations: LiveLocationQueueItem[],
): UpdateLiveLocationPayload => ({
  locations: locations.map(item => ({
    latitude: String(item.latitude),
    longitude: String(item.longitude),
    time: item.time,
  })),
});

export const updateLiveLocation = (locations: LiveLocationQueueItem[]) =>
  axiosClient.post(
    API_ENDPOINT.UPDATE_LIVE_LOCATION,
    buildLiveLocationPayload(locations),
  );
