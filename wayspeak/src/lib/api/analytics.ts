import { apiRequest } from './client';
import { AnalyticsData, DateRange } from '@/lib/types/analytics';

export const getMessageAnalytics = async (
  dateRange: DateRange = 'week'
): Promise<AnalyticsData> => {
  return await apiRequest<AnalyticsData>('GET', '/analytics/messages', undefined, {
    params: { dateRange },
  });
};

export const getEngagementAnalytics = async (
  dateRange: DateRange = 'week'
): Promise<AnalyticsData> => {
  return await apiRequest<AnalyticsData>('GET', '/analytics/engagement', undefined, {
    params: { dateRange },
  });
};

export const getDeliveryStats = async (): Promise<{
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}> => {
  return await apiRequest<{
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }>('GET', '/analytics/delivery-stats');
};
