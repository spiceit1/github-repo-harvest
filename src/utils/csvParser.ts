import Papa from 'papaparse';
import { FishData } from '../types';

function generateUniqueId(): string {
  return `fish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function cleanFishName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Handle category headers
  if (name.includes('****')) {
    return name.replace(/\*+/g, '').trim();
  }

  // Remove lot information in parentheses
  name = name.replace(/\s*\([^)]*(?:LOT|PC|PCS|\+)[^)]*\)\s*$/i, '');

  // Remove trailing lot information without parentheses
  name = name.replace(/\s+\d+\+?\s*(?:LOT|PC|PCS)\s*$/i, '');

  // Get the base name (everything before the dash)
  const parts = name.split('-');
  if (parts.length > 1) {
    name = parts[0].trim();
  }

  // Remove extra spaces and trim
  return name.replace(/\s+/g, ' ').trim();
}

function normalizeSearchName(name: string): string {
  // Convert to uppercase and remove special characters
  return name.toUpperCase()
    .replace(/[^\w\s-]/g, '')
    .trim();
}

function isCategoryHeader(text: string): boolean {
  return text.includes('****');
}

export interface CSVParseResult {
  fishData: FishData[];
  stats: {
    totalRows: number;
    validRows: number;
    categories: number;
    items: number;
  };
}

function parsePrice(value: string | number | null): { value: number | undefined; formatted: string | undefined } | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  let numericValue: number;

  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point and negative sign
    const cleanValue = value.replace(/[^\d.-]/g, '');
    numericValue = parseFloat(cleanValue);
  } else if (typeof value === 'number') {
    numericValue = value;
  } else {
    return undefined;
  }

  if (isNaN(numericValue)) {
    return undefined;
  }

  return {
    value: numericValue,
    formatted: `$${numericValue.toFixed(2)}`
  };
}

export async function parseCsvFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Please select a CSV file'));
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('Please upload a CSV file'));
      return;
    }

    // First read the file as text to check BOM and encoding
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Invalid file content');
        }
        
        // Remove BOM if present
        const cleanText = text.replace(/^\uFEFF/, '');
        
        Papa.parse(cleanText, {
          header: true,
          skipEmptyLines: 'greedy',
          transformHeader: (header) => header.trim(),
          complete: (results) => {
            try {
              if (!results.data || !Array.isArray(results.data)) {
                throw new Error('Invalid CSV format - no data array found');
              }

              if (results.errors.length > 0) {
                console.warn('CSV parsing warnings:', results.errors);
              }

              const fishData: FishData[] = [];
              let currentCategory = '';
              const stats = {
                totalRows: results.data.length,
                validRows: 0,
                categories: 0,
                items: 0
              };

              // Process each row
              for (const row of results.data) {
                if (!row || typeof row !== 'object') continue;

                const name = (
                  row['Common Name'] || 
                  row['Name'] || 
                  row['Item Name'] || 
                  row['Item Number']
                )?.toString().trim();

                if (!name) continue;

                stats.validRows++;

                // Check for category headers (rows with ****)
                if (isCategoryHeader(name)) {
                  currentCategory = cleanFishName(name);
                  stats.categories++;

                  if (currentCategory) {
                    fishData.push({
                      uniqueId: generateUniqueId(),
                      name: currentCategory,
                      searchName: normalizeSearchName(currentCategory),
                      category: currentCategory,
                      isCategory: true,
                      disabled: false,
                      qtyoh: 0
                    });
                  }
                  continue;
                }

                // Process item row
                const qtyOH = row['QtyOH'] || row['Qty'] || row['Quantity'] || row['Stock'] || '0';
                const quantity = parseInt(String(qtyOH), 10);

                const cost = row['Cost'] || row['Price'] || row['Wholesale'];
                const costPrice = parsePrice(cost);

                const sell = row['Sell'] || row['Retail'] || row['Sale Price'];
                const sellPrice = parsePrice(sell);

                const cleanedName = cleanFishName(name);
                if (cleanedName) {
                  stats.items++;

                  const fishEntry: FishData = {
                    uniqueId: generateUniqueId(),
                    name: name.trim(),
                    searchName: normalizeSearchName(cleanedName),
                    cost: costPrice?.formatted,
                    originalCost: costPrice?.value,
                    saleCost: sellPrice?.value,
                    category: currentCategory,
                    qtyoh: isNaN(quantity) ? 0 : quantity,
                    searchUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanedName + ' saltwater fish')}`,
                    isCategory: false,
                    disabled: false
                  };

                  fishData.push(fishEntry);
                }
              }

              if (fishData.length === 0) {
                throw new Error('No valid fish data found in the CSV file. Please check the format.');
              }

              resolve({ fishData, stats });
            } catch (error) {
              console.error('Error processing CSV data:', error);
              reject(error instanceof Error ? error : new Error('Failed to process CSV data'));
            }
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            reject(new Error(`Failed to parse CSV file: ${error.message}`));
          }
        });
      } catch (error) {
        console.error('Error reading CSV file:', error);
        reject(error instanceof Error ? error : new Error('Failed to read CSV file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the CSV file'));
    };

    reader.readAsText(file);
  });
}

export function generateCsvTemplate(): string {
  const template = `Item Number,Common Name,QtyOH,Cost,Sell,Category
**** SALTWATER FISH ****
F001,YELLOW TANG-MD,25,89.99,179.99,Fish
F002,CLOWNFISH-SM,150,12.99,24.99,Fish
F003,BLUE HIPPO TANG-LG,5,129.99,259.99,Fish

**** CORAL ****
C001,HAMMER CORAL-ML,10,49.99,99.99,Coral
C002,TORCH CORAL-SM,15,39.99,79.99,Coral
C003,MUSHROOM ROCK-LG,20,29.99,59.99,Coral

**** INVERTEBRATES ****
I001,CLEANER SHRIMP-MD,30,19.99,39.99,Inverts
I002,EMERALD CRAB-SM,45,9.99,19.99,Inverts
I003,SAND SIFTING STAR-LG,25,14.99,29.99,Inverts`;

  return template;
}