import { load } from 'cheerio';
import { NewsItem, Update, UpdateType } from './types';

// Map French action words to update types
const actionToUpdateType: Record<string, UpdateType> = {
  'Ajout': 'addition',
  'Réactivation': 'reactivation',
  'Destruction': 'destruction',
  'Dégradation': 'degradation'
};

const extractInvadersForAction = (action: string, text: string): string[] => {
  // First find where this action appears in the text
  const actionIndex = text.indexOf(action);
  if (actionIndex === -1) return [];

  // Get text from after the action word until the next action word or the end
  let sectionStart = actionIndex + action.length;
  let sectionEnd = text.length;

  // Find the next action word that appears after this one
  Object.keys(actionToUpdateType).forEach(nextAction => {
    const nextIndex = text.indexOf(nextAction, sectionStart);
    if (nextIndex !== -1 && nextIndex < sectionEnd) {
      sectionEnd = nextIndex;
    }
  });

  // Extract SI codes from just this section
  const section = text.substring(sectionStart, sectionEnd);
  const matches = section.match(/[A-Z]+_\d+/g) || [];
  return matches;
};

const createUpdates = (content: string): Update[] => {
  const updates: Update[] = [];

  // Find all action words in order of appearance 
  const actionWords = Object.keys(actionToUpdateType);
  console.log('Looking for action words:', actionWords);
  console.log('In content:', content);

  // Create case-insensitive regex to match action words
  const actionRegex = new RegExp(actionWords.map(word => word.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).join('|'), 'gi');
  const actions = content.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(actionRegex) || [];
  
  console.log('Found actions:', actions);

  // Process each action in order
  for (const action of actions) {
    // Find the original action word with accents
    const originalAction = actionWords.find(word => 
      word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 
      action.toLowerCase()
    );
    
    if (originalAction) {
      const type = actionToUpdateType[originalAction];
      console.log(`Mapped action ${originalAction} to type ${type}`);
      const invaders = extractInvadersForAction(originalAction, content);
      
      if (invaders.length > 0) {
        console.log(`Found invaders for ${type}:`, invaders);
        updates.push({ type, invaders });
      }
    }
  }

  // Get all invaders from the content
  const allInvaders = content.match(/[A-Z]+_\d+/g) || [];

  // If no specific updates were found but we have invaders, add them as 'other'
  if (updates.length === 0 && allInvaders.length > 0) {
    updates.push({
      type: 'other',
      invaders: [...new Set(allInvaders)]
    });
  }

  return updates;
};

// Convert month names to numbers
const monthMap: Record<string, string> = {
  'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
};

export async function scrapeNews(): Promise<NewsItem[]> {
  console.log('Starting to scrape news...');
  
  const response = await fetch('https://www.invader-spotter.art/news.php');
  const html = await response.text();
  console.log('Fetched HTML content length:', html.length);
  
  const $ = load(html);
  const newsItems: NewsItem[] = [];

  // Find the most recent month div (format: moisYYYYMM)
  const monthDivs = $('div[id^="mois"]').toArray();
  const latestMonthDiv = monthDivs[0]; // First div should be the most recent month

  if (!latestMonthDiv) {
    console.log('No month div found');
    return newsItems;
  }

  console.log('Found month div:', latestMonthDiv.attribs.id);

  // Get the first two p elements from this month
  $(latestMonthDiv).find('p').slice(0, 2).each((_, element) => {
    const text = $(element).text().trim();
    if (!text) return;

    console.log('Processing entry:', text);

    // Extract day and content
    const dayMatch = text.match(/^(\d{1,2})\s*:/);
    if (!dayMatch) return;

    const day = dayMatch[1].padStart(2, '0');
    const content = text.substring(text.indexOf(':') + 1).trim();
    
    if (content) {
      // Extract month and year from div id (format: moisYYYYMM)
      const idMatch = latestMonthDiv.attribs.id.match(/mois(\d{4})(\d{2})/);
      if (!idMatch) return;

      const [, year, month] = idMatch;
      const date = `${year}-${month}-${day}`;
      
      const allInvaders = [...new Set(content.match(/[A-Z]{2,}_\d+/g) || [])];
      const updates = createUpdates(content);

      const newsItem: NewsItem = {
        date,
        content,
        invaders: allInvaders,
        updates
      };

      console.log('Created news item:', newsItem);
      newsItems.push(newsItem);
    }
  });

  console.log(`Found ${newsItems.length} news items`);
  
  // Sort by date, oldest first
  newsItems.sort((a, b) => a.date.localeCompare(b.date));
  return newsItems;
}