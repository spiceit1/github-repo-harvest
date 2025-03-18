// Map of size abbreviations to full text
const SIZE_ABBREVIATIONS: Record<string, string> = {
  'GT': 'Giant',     // Added GT = Giant
  'LG': 'Large',
  'MD': 'Medium', 
  'SM': 'Small',
  'MDL': 'Medium-Large',
  'ML': 'Medium-Large',
  'XL': 'Extra Large',
  'XXL': 'Extra Extra Large',
  'SMD': 'Small-Medium'
};

// Sort by length descending to handle longer abbreviations first
const sortedAbbreviations = Object.keys(SIZE_ABBREVIATIONS).sort((a, b) => b.length - a.length);

export function formatFishName(name: string): { displayName: string; size: string | null; gender: string | null } {
  if (!name) {
    return { displayName: name, size: null, gender: null };
  }

  // First trim any trailing hyphens and spaces
  let displayName = name.replace(/-+$/, '').trim();
  let size: string | null = null;
  let gender: string | null = null;

  // Check for size indicators in the name (with or without hyphens)
  for (const abbr of sortedAbbreviations) {
    // Create patterns to match size with various separators
    const patterns = [
      new RegExp(`\\b${abbr}\\b`, 'i'), // Whole word
      new RegExp(`-${abbr}\\b`, 'i'),   // Hyphenated
      new RegExp(`\\s${abbr}\\b`, 'i')  // Space separated
    ];

    for (const pattern of patterns) {
      if (pattern.test(displayName)) {
        size = SIZE_ABBREVIATIONS[abbr];
        // Remove the size indicator from the name
        displayName = displayName.replace(pattern, '').trim();
        break;
      }
    }
  }

  // Check for gender indicators
  const genderMatch = displayName.match(/-?(MALE|FEMALE)\\b/i);
  if (genderMatch) {
    gender = genderMatch[1].charAt(0) + genderMatch[1].slice(1).toLowerCase();
    displayName = displayName.replace(/-?(MALE|FEMALE)/i, '').trim();
  }

  // Clean up any remaining hyphens and extra spaces
  displayName = displayName
    .replace(/-+/g, ' ')      // Replace multiple hyphens with a space
    .replace(/\s+/g, ' ')     // Replace multiple spaces with a single space
    .trim();                  // Remove leading/trailing spaces

  return { 
    displayName,
    size,
    gender
  };
}