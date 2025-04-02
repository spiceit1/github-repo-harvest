
import { pdfjs } from 'react-pdf';
import { FishData } from '../types/fish';

// Set up PDF.js worker
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ExtractOptions {
  startPage?: number;
  endPage?: number;
  searchTerms?: string[];
  excludeTerms?: string[];
}

/**
 * Extract fish data from PDF content 
 */
export const extractFishDataFromPdf = async (
  pdfUrl: string,
  options: ExtractOptions = {}
): Promise<FishData[]> => {
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    
    const { startPage = 1, endPage = pdf.numPages } = options;
    const fishData: FishData[] = [];
    
    // Process each page in the range
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items.map(item => (item as any).str).join(' ');
      
      // Parse the text for fish data based on the format
      const extractedItems = parsePdfText(text);
      fishData.push(...extractedItems);
    }
    
    // Apply any filtering based on options
    return filterFishData(fishData, options);
  } catch (error) {
    console.error('Error extracting fish data from PDF:', error);
    return [];
  }
};

/**
 * Parse PDF text into structured fish data
 */
const parsePdfText = (text: string): FishData[] => {
  const result: FishData[] = [];
  
  // Remove excess whitespace
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  // Different PDFs may have different formats, so we need to detect and handle each
  
  // Format 1: Common for wholesale lists
  if (cleanedText.includes('Item#') && cleanedText.includes('Description')) {
    return parseWholesaleFormat(cleanedText);
  }
  
  // Format 2: Common for retail price lists
  if (cleanedText.includes('Price List') || cleanedText.includes('Retail Price')) {
    return parseRetailFormat(cleanedText);
  }
  
  // Fallback to generic parsing
  return parseGenericFormat(cleanedText);
};

/**
 * Parse wholesale format PDF text (common vendor format)
 */
const parseWholesaleFormat = (text: string): FishData[] => {
  const result: FishData[] = [];
  
  // Look for patterns like:
  // Item# Description Size Price
  const lines = text.split(/\n|(?<=\d)(?=[A-Z])/);
  
  let currentCategory = '';
  
  for (const line of lines) {
    // Check if this is a category header
    if (line.toUpperCase() === line && !line.includes(' ')) {
      currentCategory = line.trim();
      continue;
    }
    
    // Try to match a fish entry
    // Example: "1234 Blue Tang - Medium $24.99"
    const itemMatch = line.match(/(\d+)\s+(.+?)\s+(\$?\d+\.\d+|\$?\d+)/);
    
    if (itemMatch) {
      const [_, itemId, name, priceText] = itemMatch;
      const cost = parseFloat(priceText.replace('$', ''));
      
      // Extract size if present
      let fishName = name.trim();
      let size = '';
      
      const sizeMatch = fishName.match(/-\s*(Small|Medium|Large|X-Large|XL)/i);
      if (sizeMatch) {
        size = sizeMatch[1];
        fishName = fishName.replace(sizeMatch[0], '').trim();
      }
      
      const uniqueId = `${fishName.toLowerCase().replace(/[^\w\s]/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const searchName = fishName.toLowerCase().replace(/[^\w\s]/g, '');
      
      result.push({
        uniqueId,
        name: fishName,
        searchName,
        size,
        category: currentCategory,
        cost: cost.toString(),
        description: `Item #${itemId}`
      });
    }
  }
  
  return result;
};

/**
 * Parse retail format PDF text
 */
const parseRetailFormat = (text: string): FishData[] => {
  const result: FishData[] = [];
  
  // Split into lines
  const lines = text.split('\n');
  
  let currentCategory = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for category headers
    if (trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 3) {
      currentCategory = trimmedLine;
      continue;
    }
    
    // Match patterns like "Blue Tang Small $49.99"
    const priceMatch = trimmedLine.match(/(.+?)(?:\s+-\s+(Small|Medium|Large|XL))?\s+\$?(\d+\.?\d*)/i);
    
    if (priceMatch) {
      const [_, name, size, priceText] = priceMatch;
      const cost = parseFloat(priceText);
      
      const fishName = name.trim();
      const uniqueId = `${fishName.toLowerCase().replace(/[^\w\s]/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const searchName = fishName.toLowerCase().replace(/[^\w\s]/g, '');
      
      result.push({
        uniqueId,
        name: fishName,
        searchName,
        size: size || '',
        category: currentCategory,
        cost: cost.toString()
      });
    }
  }
  
  return result;
};

/**
 * Parse generic format as a fallback
 */
const parseGenericFormat = (text: string): FishData[] => {
  const result: FishData[] = [];
  
  // Split by what seems like paragraphs
  const chunks = text.split(/\n\s*\n/);
  
  for (const chunk of chunks) {
    // Look for anything that seems like a fish name and price
    const nameMatch = chunk.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    const priceMatch = chunk.match(/\$?(\d+\.?\d*)/);
    
    if (nameMatch && priceMatch) {
      const name = nameMatch[1];
      const cost = priceMatch[0];
      
      const uniqueId = `${name.toLowerCase().replace(/[^\w\s]/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const searchName = name.toLowerCase().replace(/[^\w\s]/g, '');
      
      result.push({
        uniqueId,
        name,
        searchName,
        cost
      });
    } else if (chunk.length > 10 && chunk.split(' ').length >= 2) {
      // Try to extract anything that looks like a fish
      const words = chunk.split(' ');
      if (words.some(w => w.length > 3 && /^[A-Z]/.test(w))) {
        const name = words.slice(0, 3).join(' ');
        const uniqueId = `${name.toLowerCase().replace(/[^\w\s]/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const searchName = name.toLowerCase().replace(/[^\w\s]/g, '');
        
        result.push({
          uniqueId,
          name,
          searchName,
          category: 'Unknown',
          searchUrl: chunk
        });
      }
    }
  }
  
  return result;
};

/**
 * Filter fish data based on options
 */
const filterFishData = (data: FishData[], options: ExtractOptions): FishData[] => {
  let filtered = [...data];
  
  // Filter by search terms if provided
  if (options.searchTerms && options.searchTerms.length > 0) {
    filtered = filtered.filter(fish => 
      options.searchTerms!.some(term => 
        fish.name.toLowerCase().includes(term.toLowerCase()) ||
        (fish.description && fish.description.toLowerCase().includes(term.toLowerCase()))
      )
    );
  }
  
  // Filter out excluded terms if provided
  if (options.excludeTerms && options.excludeTerms.length > 0) {
    filtered = filtered.filter(fish => 
      !options.excludeTerms!.some(term => 
        fish.name.toLowerCase().includes(term.toLowerCase()) ||
        (fish.description && fish.description.toLowerCase().includes(term.toLowerCase()))
      )
    );
  }
  
  return filtered;
};
