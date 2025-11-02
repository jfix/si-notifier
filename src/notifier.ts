import { MqttConfig } from './types';
import mqtt from 'mqtt';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendNotification(
  config: MqttConfig,
  text: string,
  color?: string,
  retries = MAX_RETRIES
): Promise<void> {
  const notification: Record<string, any> = {
    text,
    icon: 7555,
    client: "invader-notifier"
  };
  
  if (color) {
    notification.color = color;
  }

  if (!config.host || !config.port || !config.topic) {
    console.warn('MQTT configuration missing. Skipping notification.');
    console.log('Would have sent notification:', notification);
    return;
  }

  const client = mqtt.connect(`mqtt://${config.host}:${config.port}`, {
    username: config.username,
    password: config.password
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          console.log('Sending MQTT notification:', JSON.stringify(notification, null, 2));
          client.publish(config.topic, JSON.stringify(notification), (err) => {
            client.end();
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });

        client.on('error', (err) => {
          client.end();
          reject(err);
        });
      });

      console.log('Notification sent successfully via MQTT');
      return;
    } catch (error) {
      console.error(`Error sending notification (attempt ${attempt}/${retries}):`, error);
      
      if (attempt < retries) {
        console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
        await wait(RETRY_DELAY);
      } else {
        console.log('Notification will be skipped due to persistent MQTT connectivity issues');
      }
    }
  }
}