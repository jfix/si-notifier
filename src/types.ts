export type UpdateType = 'addition' | 'degradation' | 'destruction' | 'status_update' | 'reactivation' | 'restoration' | 'alert' | 'other';

export interface Update {
  type: UpdateType;
  invaders: string[];
}

export interface NewsItem {
  date: string;
  content: string;
  invaders: string[];  // All invaders mentioned in the news item
  updates: Update[];   // Different types of updates with their associated invaders
}

export interface AwtrixNotification {
  text: string;
  icon?: number;
  color?: string;  // Hex color value
  client: string;
}

export interface MqttConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  topic: string;
}