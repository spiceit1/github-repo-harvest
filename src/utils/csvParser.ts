
// Import necessary dependencies and types
import Papa from 'papaparse';

// Define a type for CSV row data
interface CSVRowData {
  [key: string]: string;
}

// Helper function to parse CSV data
export const parseCSV = (csvText: string): Promise<CSVRowData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRowData[];
        resolve(data);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

// Helper to normalize fish data from CSV
export const normalizeFishData = (csvData: CSVRowData[]): FishData[] => {
  return csvData.map((row) => {
    // Get name from various possible column names
    const name = 
      row["Common Name"] || 
      row["Name"] || 
      row["Item Name"] || 
      row["Item Number"] || 
      "";
    
    // Create a search-friendly name
    const searchName = name.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Extract quantity information
    const qtyoh = parseInt(
      row["QtyOH"] || 
      row["Qty"] || 
      row["Quantity"] || 
      row["Stock"] || 
      "0"
    );
    
    // Extract cost information
    const cost = 
      row["Cost"] || 
      row["Price"] || 
      row["Wholesale"] || 
      "";
    
    // Extract sale price information
    const salePrice = 
      row["Sell"] || 
      row["Retail"] || 
      row["Sale Price"] || 
      "";
    
    // Create a unique ID for this fish
    const uniqueId = `${searchName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      uniqueId,
      name,
      searchName,
      cost,
      price: salePrice,
      qtyoh,
      category: row["Category"] || "",
      size: row["Size"] || "",
      description: row["Description"] || ""
    };
  });
};

// Add any other helper functions related to CSV parsing
export const exportToCSV = (data: any[], filename: string) => {
  try {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting CSV:', error);
  }
};
