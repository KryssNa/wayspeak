export type DateRange = 'day' | 'week' | 'month' | 'year';

export interface AnalyticsData {
  labels: string[];
  datasets: AnalyticsDataset[];
}

export interface AnalyticsDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
}

export interface DeliveryStats {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface EngagementMetrics {
  totalMessages: number;
  totalContacts: number;
  responseRate: number;
  averageResponseTime: number;
}
