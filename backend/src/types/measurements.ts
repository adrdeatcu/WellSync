export interface IncomingPerMinuteMeasurement {
  timestamp_minute_utc: string;
  steps_total_today: number;
  avg_heart_rate_bpm?: number | null;
  min_heart_rate_bpm?: number | null;
  max_heart_rate_bpm?: number | null;
  avg_spo2?: number | null;
  avg_air_quality_index?: number | null;
  avg_temperature_c?: number | null;
  avg_humidity_percent?: number | null;
  avg_pressure_hpa?: number | null;
}