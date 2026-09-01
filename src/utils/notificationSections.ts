import {AppNotification} from '../api/query/NotificationApi';

export type NotificationSection = {
  title: 'Today' | 'Yesterday' | 'Last 7 days' | 'Older';
  data: AppNotification[];
};

export const groupNotificationsByDate = (items: AppNotification[]): NotificationSection[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;
  const groups: Record<NotificationSection['title'], AppNotification[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    Older: [],
  };

  items.forEach(item => {
    const createdAt = new Date(item.created_at);
    const itemDay = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()).getTime();
    const difference = Number.isNaN(itemDay) ? Number.POSITIVE_INFINITY : Math.floor((today - itemDay) / day);

    if (difference <= 0) groups.Today.push(item);
    else if (difference === 1) groups.Yesterday.push(item);
    else if (difference <= 7) groups['Last 7 days'].push(item);
    else groups.Older.push(item);
  });

  return (Object.keys(groups) as NotificationSection['title'][])
    .filter(title => groups[title].length > 0)
    .map(title => ({title, data: groups[title]}));
};
