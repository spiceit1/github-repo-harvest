import { FishData } from '../types';
import ImageStorage from './imageStorage';

function cleanSearchTerm(name: string): string {
  // Remove everything after and including a quote character
  name = name.split('"')[0].trim();
  
  // List of known fish names that include numbers
  const commonNumberedFish = [
    '6-LINE', 'SIX-LINE',
    '8-LINE', 'EIGHT-LINE',
    '4-STRIPE', 'FOUR-STRIPE',
    '3-STRIPE', 'THREE-STRIPE',
    '7-STRIPE', 'SEVEN-STRIPE'
  ];

  // Check if the name contains any of the known numbered patterns
  const hasNumberedPattern = commonNumberedFish.some(pattern => 
    name.toUpperCase().includes(pattern)
  );

  if (hasNumberedPattern) {
    return name
      .replace(/\([^)]*\)/g, '')    // Remove anything in parentheses
      .replace(/inch(es)?/gi, '')   // Remove "inch" or "inches"
      .replace(/[^\w\s-]/g, '')     // Remove special characters except hyphen
      .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
      .trim();
  }

  // Remove size specifications at the start (e.g., "2.5-3" or "3-3.5" or "4-5")
  name = name.replace(/^\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?\s*(?:"|inch(?:es)?)?/i, '');

  // Remove common suffixes and size indicators
  return name
    .replace(/-(?:SM|MD|LG|ML|XL|GS|SMD|BIG|MDL|TRIG|[A-Z]+)(?:\s*\(?[\d+]?(?:LOT|PC|PCS)\)?)?$/i, '')
    .replace(/\s*\(\d+\+?\s*(?:LOT|PC|PCS)\)/i, '')
    .replace(/\s+\d+\+?\s*(?:LOT|PC|PCS)\s*$/i, '')
    .replace(/\s*-\s*(?:LOT|PC|PCS)\s*$/i, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchFishImage(fish: FishData): Promise<string | null> {
  if (!fish || fish.isCategory) {
    return null;
  }

  try {
    const searchName = cleanSearchTerm(fish.name);
    if (!searchName) {
      return null;
    }

    fish.searchName = searchName;

    // Initialize ImageStorage and get stored image
    const storedImage = await ImageStorage.getStoredImage(searchName);
    if (storedImage) {
      console.log(`Found stored image for ${searchName}`);
      return storedImage;
    }

    const googleImagesUrl = `https://www.google.com/search?q=${encodeURIComponent(searchName + ' fish')}&tbm=isch`;
    fish.searchUrl = googleImagesUrl;

    return null;
  } catch (error) {
    console.error('Error fetching image for', fish.name, error);
    return null;
  }
}