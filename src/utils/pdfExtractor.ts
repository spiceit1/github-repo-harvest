import { pdfjs } from 'react-pdf';
import { FishData } from '../types';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export async function extractFishData(file: File, startPage: number, endPage: number): Promise<FishData[]> {
  const fishData: FishData[] = [];
  
  try {
    // Load the PDF document
    const fileArrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: fileArrayBuffer }).promise;
    
    // Process each page in the specified range
    for (let pageNum = startPage; pageNum <= endPage && pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing page ${pageNum}...`);
      const page = await pdf.getPage(pageNum);
      
      // Get text content with positions
      const textContent = await page.getTextContent();
      
      // Get text items with their positions
      const textItems = textContent.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4], // x position
        y: item.transform[5], // y position
        height: item.height,
        width: item.width
      }));
      
      // Log all text items for debugging
      console.log(`Page ${pageNum} has ${textItems.length} text items`);
      textItems.forEach((item, i) => {
        if (i < 20) { // Log first 20 items to avoid console flood
          console.log(`Item ${i}: "${item.text}" at x=${item.x.toFixed(1)}, y=${item.y.toFixed(1)}`);
        }
      });
      
      // Get full page text
      const pageText = textItems.map(item => item.text).join(' ');
      console.log(`Page ${pageNum} text sample: ${pageText.substring(0, 200)}...`);
      
      // Determine category
      let currentCategory = determineCategory(pageNum, pageText);
      console.log(`Detected category: ${currentCategory}`);
      
      // Try multiple extraction methods
      let extractedItems: FishData[] = [];
      
      // Method 1: Look for "Common Name" column
      console.log("Trying Common Name column extraction...");
      extractedItems = extractFromCommonNameColumn(textItems, currentCategory);
      console.log(`Method 1 found ${extractedItems.length} items`);
      
      // Method 2: Look for dash-separated names
      if (extractedItems.length === 0) {
        console.log("Trying dash-separated names extraction...");
        extractedItems = extractDashSeparatedNames(textItems, currentCategory);
        console.log(`Method 2 found ${extractedItems.length} items`);
      }
      
      // Method 3: Extract from table-like structures
      if (extractedItems.length === 0) {
        console.log("Trying table structure extraction...");
        extractedItems = extractFromTableStructure(textItems, currentCategory);
        console.log(`Method 3 found ${extractedItems.length} items`);
      }
      
      // Method 4: Extract capitalized words that might be fish names
      if (extractedItems.length === 0) {
        console.log("Trying capitalized words extraction...");
        extractedItems = extractCapitalizedNames(textItems, currentCategory);
        console.log(`Method 4 found ${extractedItems.length} items`);
      }
      
      // Method 5: Last resort - extract any potential fish names from raw text
      if (extractedItems.length === 0) {
        console.log("Trying raw text extraction...");
        extractedItems = extractFromRawText(pageText, currentCategory);
        console.log(`Method 5 found ${extractedItems.length} items`);
      }
      
      fishData.push(...extractedItems);
    }
    
    // Remove duplicates and filter out invalid entries
    const uniqueFishData = fishData
      .filter(fish => fish.name && fish.name.length > 2)
      .filter((fish, index, self) => 
        index === self.findIndex((f) => f.name.toLowerCase() === fish.name.toLowerCase())
      );
    
    console.log(`Total unique fish data extracted: ${uniqueFishData.length}`);
    
    // Sort alphabetically by name
    uniqueFishData.sort((a, b) => a.name.localeCompare(b.name));
    
    return uniqueFishData;
  } catch (error) {
    console.error('Error extracting PDF data:', error);
    throw error;
  }
}

// Method 1: Extract from Common Name column
function extractFromCommonNameColumn(textItems: any[], currentCategory: string): FishData[] {
  const result: FishData[] = [];
  
  // Find items containing "Common Name" or similar text
  const commonNameHeaders = textItems.filter(item => 
    /common\s*name/i.test(item.text)
  );
  
  if (commonNameHeaders.length === 0) {
    return result;
  }
  
  console.log(`Found ${commonNameHeaders.length} "Common Name" headers`);
  
  // For each Common Name header, try to extract fish names
  for (const header of commonNameHeaders) {
    const headerY = header.y;
    const headerX = header.x;
    
    console.log(`Processing Common Name header at x=${headerX.toFixed(1)}, y=${headerY.toFixed(1)}`);
    
    // Find all text items below the header (lower y value in PDF coordinates)
    const itemsBelowHeader = textItems.filter(item => 
      item.y < headerY - 10 && // Must be below header with some margin
      Math.abs(item.x - headerX) < 150 && // Must be roughly in the same column
      item.text.trim().length > 0 // Must have text
    );
    
    console.log(`Found ${itemsBelowHeader.length} items below the Common Name header`);
    
    // Group items by approximate rows (items with similar y coordinates)
    const rows: any[][] = [];
    let currentRow: any[] = [];
    let prevY = -1;
    
    // Sort by y position (top to bottom)
    const sortedItems = [...itemsBelowHeader].sort((a, b) => b.y - a.y);
    
    for (const item of sortedItems) {
      if (prevY === -1 || Math.abs(item.y - prevY) < 10) {
        // Same row
        currentRow.push(item);
      } else {
        // New row
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
        }
        currentRow = [item];
      }
      prevY = item.y;
    }
    
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    console.log(`Grouped items into ${rows.length} rows`);
    
    // Process each row to extract fish names
    for (const row of rows) {
      // Sort items in the row by x position (left to right)
      row.sort((a: any, b: any) => a.x - b.x);
      
      // Combine text in the row
      const rowText = row.map(item => item.text).join(' ').trim();
      
      console.log(`Row text: "${rowText}"`);
      
      // Extract name before dash if present
      let name = rowText;
      if (rowText.includes('-')) {
        name = rowText.split('-')[0].trim();
        console.log(`Extracted name before dash: "${name}"`);
      }
      
      // Skip if name is too short or contains unwanted terms
      if (name.length < 3 || /page|special|supply|equipment|^\d+$|^[A-Z\s]+$/i.test(name)) {
        continue;
      }
      
      // Look for price in the row
      const priceMatch = rowText.match(/\$\d+\.\d+/);
      const price = priceMatch ? priceMatch[0].trim() : undefined;
      
      const fishEntry: FishData = {
        name,
        price,
        category: currentCategory,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' saltwater fish')}`
      };
      
      result.push(fishEntry);
    }
  }
  
  return result;
}

// Method 2: Extract dash-separated names
function extractDashSeparatedNames(textItems: any[], currentCategory: string): FishData[] {
  const result: FishData[] = [];
  
  // Find items containing a dash
  const dashItems = textItems.filter(item => 
    item.text.includes('-') && item.text.length > 5
  );
  
  console.log(`Found ${dashItems.length} items containing dashes`);
  
  for (const item of dashItems) {
    const parts = item.text.split('-');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      
      // Skip if name is too short or contains unwanted terms
      if (name.length < 3 || /page|special|supply|equipment|^\d+$|^[A-Z\s]+$/i.test(name)) {
        continue;
      }
      
      // Look for price near this item
      const nearbyItems = textItems.filter(nearby => 
        Math.abs(nearby.y - item.y) < 15 && // Same row approximately
        nearby.x > item.x && // To the right of the name
        /\$\d+\.\d+/.test(nearby.text) // Contains price
      );
      
      const price = nearbyItems.length > 0 ? nearbyItems[0].text.trim() : undefined;
      
      const fishEntry: FishData = {
        name,
        price,
        category: currentCategory,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' saltwater fish')}`
      };
      
      result.push(fishEntry);
    }
  }
  
  return result;
}

// Method 3: Extract from table-like structures
function extractFromTableStructure(textItems: any[], currentCategory: string): FishData[] {
  const result: FishData[] = [];
  
  // Group items by approximate rows (items with similar y coordinates)
  const rows: any[][] = [];
  let currentRow: any[] = [];
  let prevY = -1;
  
  // Sort by y position (top to bottom)
  const sortedItems = [...textItems].sort((a, b) => b.y - a.y);
  
  for (const item of sortedItems) {
    if (prevY === -1 || Math.abs(item.y - prevY) < 10) {
      // Same row
      currentRow.push(item);
    } else {
      // New row
      if (currentRow.length > 0) {
        rows.push([...currentRow]);
      }
      currentRow = [item];
    }
    prevY = item.y;
  }
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  console.log(`Grouped items into ${rows.length} rows for table extraction`);
  
  // Process each row
  for (const row of rows) {
    // Skip rows with too few items (likely not table rows)
    if (row.length < 2) continue;
    
    // Sort items in the row by x position (left to right)
    row.sort((a: any, b: any) => a.x - b.x);
    
    // First column might be the fish name
    const firstItem = row[0];
    let name = firstItem.text.trim();
    
    // Extract name before dash if present
    if (name.includes('-')) {
      name = name.split('-')[0].trim();
    }
    
    // Skip if name is too short or contains unwanted terms
    if (name.length < 3 || 
        /page|special|supply|equipment|^\d+$|^[A-Z\s]+$/i.test(name) ||
        /common|scientific|name|price|size/i.test(name)) {
      continue;
    }
    
    // Look for price in the row
    const priceItems = row.filter(item => /\$\d+\.\d+/.test(item.text));
    const price = priceItems.length > 0 ? priceItems[0].text.trim() : undefined;
    
    const fishEntry: FishData = {
      name,
      price,
      category: currentCategory,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' saltwater fish')}`
    };
    
    result.push(fishEntry);
  }
  
  return result;
}

// Method 4: Extract capitalized words that might be fish names
function extractCapitalizedNames(textItems: any[], currentCategory: string): FishData[] {
  const result: FishData[] = [];
  
  // Find items that start with a capital letter and might be fish names
  const potentialNameItems = textItems.filter(item => {
    const text = item.text.trim();
    return (
      text.length > 3 &&
      /^[A-Z]/.test(text) && // Starts with capital letter
      !/page|special|supply|equipment|^\d+$|^[A-Z\s]+$/i.test(text) && // Not unwanted terms
      !/common|scientific|name|price|size/i.test(text) // Not column headers
    );
  });
  
  console.log(`Found ${potentialNameItems.length} potential capitalized fish names`);
  
  for (const item of potentialNameItems) {
    let name = item.text.trim();
    
    // Extract name before dash if present
    if (name.includes('-')) {
      name = name.split('-')[0].trim();
    }
    
    // Look for price near this item
    const nearbyItems = textItems.filter(nearby => 
      Math.abs(nearby.y - item.y) < 15 && // Same row approximately
      nearby.x > item.x && // To the right of the name
      /\$\d+\.\d+/.test(nearby.text) // Contains price
    );
    
    const price = nearbyItems.length > 0 ? nearbyItems[0].text.trim() : undefined;
    
    const fishEntry: FishData = {
      name,
      price,
      category: currentCategory,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' saltwater fish')}`
    };
    
    result.push(fishEntry);
  }
  
  return result;
}

// Method 5: Extract from raw text using regex patterns
function extractFromRawText(pageText: string, currentCategory: string): FishData[] {
  const result: FishData[] = [];
  
  // Try multiple regex patterns to find fish names
  
  // Pattern 1: Look for "Common Name" pattern with dash
  const commonNameRegex = /Common\s*Name[^-]*-\s*([^$\n]+)/gi;
  let match;
  
  while ((match = commonNameRegex.exec(pageText)) !== null) {
    const name = match[1]?.trim();
    
    // Skip if name is too short or contains unwanted terms
    if (!name || name.length < 3 || /page|special|supply|equipment|^\d+$/i.test(name)) {
      continue;
    }
    
    const fishEntry: FishData = {
      name,
      category: currentCategory,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' saltwater fish')}`
    };
    
    result.push(fishEntry);
  }
  
  // Pattern 2: Look for capitalized words followed by a price
  if (result.length === 0) {
    const capitalizedWithPriceRegex = /([A-Z][a-z]+(?:\s+[A-Za-z]+){0,5})\s+(\$\d+\.\d+)/g;
    
    while ((match = capitalizedWithPriceRegex.exec(pageText)) !== null) {
      let name = match[1]?.trim() || '';
      
      // Extract name before dash if present
      if (name.includes('-')) {
        name = name.split('-')[0].trim();
      }
      
      const price = match[2]?.trim();
      
      // Skip if name is too short or contains unwanted terms
      if (!name || name.length < 3 || /page|special|supply|equipment|^\d+$/i.test(name)) {
        continue;
      }
      
      const fishEntry: FishData = {
        name,
        price,
        category: currentCategory,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' saltwater fish')}`
      };
      
      result.push(fishEntry);
    }
  }
  
  // Pattern 3: Look for any capitalized words that might be fish names
  if (result.length === 0) {
    const capitalizedWordsRegex = /([A-Z][a-z]+(?:\s+[A-Za-z]+){0,3})/g;
    const foundNames = new Set<string>();
    
    while ((match = capitalizedWordsRegex.exec(pageText)) !== null) {
      let name = match[1]?.trim() || '';
      
      // Extract name before dash if present
      if (name.includes('-')) {
        name = name.split('-')[0].trim();
      }
      
      // Skip if name is too short or contains unwanted terms
      if (!name || name.length < 3 || 
          /page|special|supply|equipment|^\d+$/i.test(name) ||
          /common|scientific|name|price|size/i.test(name)) {
        continue;
      }
      
      // Skip if we already found this name
      if (foundNames.has(name.toLowerCase())) {
        continue;
      }
      
      foundNames.add(name.toLowerCase());
      
      const fishEntry: FishData = {
        name,
        category: currentCategory,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' saltwater fish')}`
      };
      
      result.push(fishEntry);
    }
  }
  
  return result;
}

function determineCategory(pageNum: number, pageText: string): string {
  // Try to determine category from page text
  if (/special/i.test(pageText)) return 'Specials';
  if (/fish list/i.test(pageText)) return 'Fish';
  if (/coral/i.test(pageText)) return 'Coral';
  if (/invert/i.test(pageText)) return 'Invertebrates';
  if (/supply|equipment/i.test(pageText)) return 'Supplies';
  
  // Default category based on page number
  if (pageNum === 8) return 'Specials';
  if (pageNum === 9) return 'Fish';
  if (pageNum === 10) return 'Coral';
  if (pageNum === 11) return 'Invertebrates';
  if (pageNum === 12) return 'Supplies';
  
  return 'Other';
}