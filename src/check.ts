import { config } from 'dotenv';
import { scrapeNews } from './scraper';
import { sendNotification } from './notifier';
import { MqttConfig } from './types';

config({ override: false }); // only load .env if env vars are missing

const required = ["MQTT_HOST", "MQTT_PORT", "MQTT_USERNAME", "MQTT_PASSWORD", "MQTT_TOPIC"];

// Initialize MQTT config
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// After validation, we can safely assert these values exist
const mqttConfig: MqttConfig = {
  host: process.env.MQTT_HOST!,
  port: parseInt(process.env.MQTT_PORT!),
  username: process.env.MQTT_USERNAME!,
  password: process.env.MQTT_PASSWORD!,
  topic: process.env.MQTT_TOPIC!  // Add non-null assertion here
};

// Main function
async function main() {
  try {
    // Validate MQTT port is a valid number
    if (isNaN(mqttConfig.port)) {
      console.error('ERROR: Invalid MQTT port number. Check your .env file.');
      process.exit(1);
    }

    const newsItems = await scrapeNews();
    
    if (newsItems.length === 0) {
      console.log('No news items found from the last two days');
      process.exit(0);
    }

    // Send notification for each news item (newest first)
    for (const newsItem of newsItems) {
      // Process each update in the news item
      for (const update of newsItem.updates) {
        console.log('Processing update type:', update.type);
        const color = 
          update.type === 'degradation' ? '#ffff00' :  // Yellow for degradation
          update.type === 'destruction' ? '#ff0000' :  // Red for destruction
          (update.type === 'addition' || update.type === 'reactivation') ? '#00ff00' :  // Green for addition/reactivation
          undefined;  // Default color for other types
        
        // Send one notification per invader in the update
        for (const invader of update.invaders) {
          // Format the date like "31 Oct: "
          const date = new Date(newsItem.date);
          const day = date.getDate();
          const month = date.toLocaleString('en-US', { month: 'short' });
          const formattedMessage = `${day} ${month}: ${invader}`;
          
          console.log(`Sending notification for ${update.type} of ${formattedMessage}, color: ${color}`);
          await sendNotification(mqttConfig, formattedMessage, color);
        }
      }
    }

    console.log('Successfully sent all notifications');
    process.exit(0);
  } catch (error) {
    console.error('Error checking for updates:', error);
    process.exit(1);
  }
}

// Run the script
main();