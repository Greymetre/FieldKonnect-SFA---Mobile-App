import axiosClient from '../AxiosClient';
import {API_ENDPOINT} from '../ApiUrls';

export type AppNotification = {
  id: number;
  type: string;
  data: string;
  image: string | null;
  read: boolean;
  model: string;
  model_id: number | null;
  from_date?: string | null;
  to_date?: string | null;
  delivery_status: string;
  sent_at: string | null;
  created_at: string;
};

export type NotificationPage = {
  data: AppNotification[];
  current_page: number;
  last_page: number;
  total: number;
};

export const getNotifications = async (page = 1, pageSize = 30, read?: boolean): Promise<NotificationPage> => {
  const response = await axiosClient.get(API_ENDPOINT.GET_NOTIFICATIONS, {
    params: {page, pageSize, ...(typeof read === 'boolean' ? {read: read ? 1 : 0} : {})},
  });
  const payload = response.data?.data;
  return {
    data: payload?.data ?? [],
    current_page: payload?.current_page ?? page,
    last_page: payload?.last_page ?? page,
    total: payload?.total ?? 0,
  };
};

export const getNews = async (
  page = 1,
  pageSize = 30,
  options: {read?: boolean; media?: boolean; search?: string} = {},
): Promise<NotificationPage> => {
  const response = await axiosClient.get(API_ENDPOINT.GET_NOTIFICATIONS, {
    params: {
      page,
      pageSize,
      model: 'general_notification',
      ...(typeof options.read === 'boolean' ? {read: options.read ? 1 : 0} : {}),
      ...(options.media ? {media: 1} : {}),
      ...(options.search?.trim() ? {search: options.search.trim()} : {}),
    },
  });
  const payload = response.data?.data;
  return {
    data: payload?.data ?? [],
    current_page: payload?.current_page ?? page,
    last_page: payload?.last_page ?? page,
    total: payload?.total ?? 0,
  };
};

export const markNotificationRead = (id: number) =>
  axiosClient.post(API_ENDPOINT.READ_NOTIFICATION, {id});
