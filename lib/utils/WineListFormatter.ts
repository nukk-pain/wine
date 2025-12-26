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

export type PairingMode = 'food-to-wine' | 'wine-to-food' | 'wine-only';

export interface PairingOptions {
  mode: PairingMode;
  foodInput?: string;
  selectedWines?: WineRow[];
}

/**
 * Generate complete pairing prompt for LLM
 */
export function generatePairingPrompt(wines: WineRow[], options: PairingOptions): string {
  const wineListText = formatWineListForLLM(wines);
  const wineCount = wines.length;

  // Base context
  const baseContext = `You are a professional sommelier. I have ${wineCount} wine${wineCount !== 1 ? 's' : ''} in my collection, ALL stored in the refrigerator.

MY WINE COLLECTION (In Stock):

${wineListText}

IMPORTANT CONTEXT:
- All wines are currently refrigerated
- I will drink only ONE bottle today`;

  // Mode-specific instructions
  if (options.mode === 'food-to-wine') {
    return `${baseContext}

SCENARIO: I am planning to serve the following dish:
"${options.foodInput || 'Not specified'}"

INSTRUCTIONS:
- Recommend THE BEST 1 wine from my collection that pairs perfectly with this dish
- You may suggest up to 2 alternative options, but clearly indicate your TOP recommendation
- Explain WHY each wine complements the dish (flavor profile, tannins, acidity, etc.)
- If the dish has multiple courses, focus on the main course
- For ONLY the recommended wine(s), provide serving preparation:
  * How many minutes before serving to remove from refrigerator
  * Ideal serving temperature
  * Decanting time if needed
  * When to open the bottle
- Remember: I will only open ONE bottle`;
  }

  if (options.mode === 'wine-to-food') {
    const selectedWinesList = options.selectedWines && options.selectedWines.length > 0
      ? formatWineListForLLM(options.selectedWines)
      : wineListText;

    const hasMultipleWines = options.selectedWines && options.selectedWines.length > 1;

    return `${baseContext}

SCENARIO: I want to enjoy the following wine(s) and need food pairing suggestions:

${selectedWinesList}

INSTRUCTIONS:
${hasMultipleWines ? '- First, recommend which ONE wine I should drink today based on versatility and food pairing potential' : ''}
- Suggest 3-5 specific dishes that pair perfectly with ${hasMultipleWines ? 'the recommended wine' : 'this wine'}
- Include cooking methods and key ingredients
- Explain why each dish complements the wine
- For ONLY the recommended wine, provide serving preparation:
  * How many minutes before serving to remove from refrigerator
  * Ideal serving temperature
  * Decanting time if needed
  * When to open the bottle
- Remember: I will only open ONE bottle today`;
  }

  // wine-only mode
  return `${baseContext}

SCENARIO: I want to enjoy wine without food pairing.

INSTRUCTIONS:
- Recommend THE BEST 1 wine from my collection for drinking today
- Consider current season, time of day, and general enjoyment
- Provide detailed information:
  * Tasting notes and characteristics
  * What to expect in terms of aroma, flavor, and finish
  * Optimal drinking window (is it ready now or better to age?)
- For the recommended wine, provide serving preparation:
  * How many minutes before serving to remove from refrigerator
  * Ideal serving temperature
  * Decanting time if needed
  * When to open the bottle
- Suggest simple accompaniments if any (cheese, crackers, nuts, water)
- Remember: I will only open ONE bottle today`;

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
