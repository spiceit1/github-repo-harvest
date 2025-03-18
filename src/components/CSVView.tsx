import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Package, DollarSign, Tag, Info } from 'lucide-react';
import { FishData } from '../types';

interface CSVViewProps {
  fishData: FishData[];
}

type SortField = 'name' | 'cost' | 'qtyoh' | 'category' | 'saleCost';
type SortDirection = 'asc' | 'desc';

const CSVView: React.FC<CSVViewProps> = ({ fishData }) => {
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (amount: string | number | undefined) => {
    if (!amount) return '-';
    if (typeof amount === 'string' && amount.startsWith('$')) return amount;
    if (typeof amount === 'number') return `$${amount.toFixed(2)}`;
    return `$${amount}`;
  };

  const organizedData = useMemo(() => {
    // First, get all unique categories
    const categories = Array.from(new Set(
      fishData
        .filter(fish => !fish.isCategory && fish.category)
        .map(fish => fish.category!)
    )).sort();

    // Create the organized list with category headers
    const organizedList: FishData[] = [];

    categories.forEach(category => {
      // Add category header
      organizedList.push({
        uniqueId: `header-${category}`,
        name: category,
        searchName: category,
        isCategory: true,
        category: category
      });

      // Add all fish in this category
      const categoryFish = fishData
        .filter(fish => !fish.isCategory && fish.category === category)
        .sort((a, b) => a.name.localeCompare(b.name));

      organizedList.push(...categoryFish);
    });

    // Add uncategorized items at the end
    const uncategorizedFish = fishData
      .filter(fish => !fish.isCategory && !fish.category)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (uncategorizedFish.length > 0) {
      organizedList.push({
        uniqueId: 'header-uncategorized',
        name: 'Uncategorized',
        searchName: 'Uncategorized',
        isCategory: true,
        category: 'Uncategorized'
      });
      organizedList.push(...uncategorizedFish);
    }

    return organizedList;
  }, [fishData]);

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="relative max-h-[calc(100vh-200px)] overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b shadow-sm">
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2 group relative">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">Name</span>
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 text-white text-sm rounded-lg p-2 z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                    From CSV columns: 'Item Number', 'Common Name', or 'Name'
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cost')}
              >
                <div className="flex items-center gap-2 group relative">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">Cost</span>
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 text-white text-sm rounded-lg p-2 z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                    From CSV columns: 'Cost' or 'Price'<br />
                    Original cost is preserved for reference
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('saleCost')}
              >
                <div className="flex items-center gap-2 group relative">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">Sale Cost</span>
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 text-white text-sm rounded-lg p-2 z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                    From database column: 'sale_cost'<br />
                    Price after markup calculations
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('qtyoh')}
              >
                <div className="flex items-center gap-2 group relative">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">QTY Available</span>
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 text-white text-sm rounded-lg p-2 z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                    From database column: 'qtyoh'<br />
                    Represents current quantity on hand
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {organizedData.map((item) => (
              item.isCategory ? (
                <tr key={item.uniqueId} className="bg-orange-50">
                  <td 
                    colSpan={4} 
                    className="px-6 py-3 text-lg font-semibold text-gray-800 border-l-4 border-orange-500"
                  >
                    {item.name}
                  </td>
                </tr>
              ) : (
                <tr 
                  key={item.uniqueId}
                  className="hover:bg-gray-50 transition-colors group/row"
                >
                  <td className="px-6 py-4">
                    <div className="relative group/name">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.searchName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative group/cost">
                      <div className="font-medium text-gray-900">{formatCurrency(item.cost)}</div>
                      {item.originalCost && (
                        <div className="text-sm text-gray-500">
                          Original: {formatCurrency(item.originalCost)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative group/sale">
                      <div className="font-medium text-gray-900">{formatCurrency(item.saleCost)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative group/qty">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                        !item.qtyoh || item.qtyoh === 0 ? 'bg-red-100 text-red-800' :
                        item.qtyoh < 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.qtyoh ?? 0}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CSVView;