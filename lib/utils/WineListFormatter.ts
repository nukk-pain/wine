import { WineRow } from '../google-sheets';

/**
 * Format wine list for LLM consumption
 * Converts WineRow[] to readable text optimized for ChatGPT/Gemini
 */
export function formatWineListForLLM(wines: WineRow[]): string {
  if (wines.length === 0) {
    return 'No wines available in cellar.';
  }

  const wineListText = wines
    .map((wine, index) => {
      const parts = [`${index + 1}. ${wine.name}${wine.vintage ? ` (${wine.vintage})` : ''}`];

      if (wine.producer) parts.push(`   - Producer: ${wine.producer}`);
      if (wine.region || wine.country) {
        const location = [wine.region, wine.country].filter(Boolean).join(', ');
        parts.push(`   - Region: ${location}`);
      }
      if (wine.appellation) parts.push(`   - Appellation: ${wine.appellation}`);
      if (wine.varietal) parts.push(`   - Varietal: ${wine.varietal}`);
      if (wine.notes) {
        // Truncate notes to 100 characters for token efficiency
        const truncatedNotes = wine.notes.length > 100
          ? wine.notes.substring(0, 100) + '...'
          : wine.notes;
        parts.push(`   - Notes: ${truncatedNotes}`);
      }

      return parts.join('\n');
    })
    .join('\n\n');

  return wineListText;
}

/**
 * Generate complete pairing prompt for LLM
 */
export function generatePairingPrompt(wines: WineRow[]): string {
  const wineListText = formatWineListForLLM(wines);
  const wineCount = wines.length;

  return `You are a professional sommelier. I have the following wines in my cellar.
Please suggest food pairings for a dinner party.

MY WINE COLLECTION (In Stock: ${wineCount} wine${wineCount !== 1 ? 's' : ''}):

${wineListText}

INSTRUCTIONS:
- Suggest 3-5 complete meal pairings using wines from my collection
- Consider wine order (aperitif → white → red → dessert)
- Include specific dishes and cooking methods
- Explain why each wine complements the dish
- Be creative but practical with your recommendations`;
}

/**
 * Get ChatGPT web URL
 */
export function getChatGPTUrl(): string {
  return 'https://chat.openai.com/';
}

/**
 * Get Gemini web URL
 */
export function getGeminiUrl(): string {
  return 'https://gemini.google.com/';
}
