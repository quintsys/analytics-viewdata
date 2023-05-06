export interface AnalyticsData {
  clientId: string;
  adGroup?: string;
  adContent?: string;
  adMatchedQuery?: string;
  campaign?: string;
  source?: string;
  medium?: string;
  keyword?: string;
}
export interface Dimensions {
  ad: string;
  origin: string;
}
export type Row = string[];
export interface RowFormatter {
  (row: Row): AnalyticsData;
}
