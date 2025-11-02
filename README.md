# si-notifier

A notification script that checks [invader-spotter.art](https://www.invader-spotter.art) for the latest [Space Invader](https://www.space-invaders.com) updates and sends notifications to an Awtrix3 (Ulanzi TC001) display via MQTT.


[![Watch the video](https://img.youtube.com/vi/lOuNOxOyad0/0.jpg)](https://www.youtube.com/watch?v=lOuNOxOyad0)


## Features

- Scrapes the latest Space Invader updates from invader-spotter.art
- Shows the last two daily updates
- Color-coded notifications:
  - 🟢 Green: New additions or reactivations
  - 🔴 Red: Destructions
  - 🟡 Yellow: Degradations
- Shows date and invader ID (e.g., "31 Oct: PA_1234")
- Uses icon 7555 (an animated space invader) for all notifications

## Setup

1. Clone the repository:
```bash
git clone https://github.com/jfix/si-notifier.git
cd si-notifier
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file with your MQTT configuration:
```env
MQTT_HOST=your.mqtt.host
MQTT_PORT=1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_TOPIC=awtrix_XXXXXX/notify
```

## Usage

Run the script manually:
```bash
bun run check
```

Or set up a cron job to check periodically:
```bash
0 * * * * cd /path/to/si-notifier && /path/to/bun run check
```

## How it Works

1. The script fetches the invader-spotter.art news page
2. Extracts the latest month's updates from the most recent `moisYYYYMM` div
3. Takes the first two updates (daily entries)
4. For each update:
   - Parses the update type (addition, destruction, etc.)
   - Extracts Space Invader IDs
   - Sends a color-coded notification for each invader
   - Prefixes each message with the date (e.g., "31 Oct: ")

## Development

The project uses:
- Bun as the runtime
- TypeScript for type safety
- Cheerio for HTML parsing
- MQTT for notifications

Main components:
- `src/check.ts`: Main script entry point
- `src/scraper.ts`: Website scraping logic
- `src/notifier.ts`: MQTT notification handling
- `src/types.ts`: TypeScript type definitions
