/**
 * Utility functions for calculating price statistics
 * Used for market price analysis in chatbot
 */

export interface PriceStats {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  count: number;
  mean: number;
}

/**
 * Calculate percentile from sorted array
 */
export function calculatePercentile(sortedData: number[], percentile: number): number {
  if (sortedData.length === 0) return 0;
  if (sortedData.length === 1) return sortedData[0];
  
  const index = (percentile / 100) * (sortedData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sortedData[lower];
  }

  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

/**
 * Compute comprehensive price statistics from array of prices
 */
export function computePriceStats(prices: number[]): PriceStats | null {
  if (!prices || prices.length === 0) return null;

  // Filter out invalid prices
  const validPrices = prices
    .map(Number)
    .filter((n) => !Number.isNaN(n) && n > 0)
    .sort((a, b) => a - b);

  if (validPrices.length === 0) return null;

  const sum = validPrices.reduce((acc, price) => acc + price, 0);
  const mean = sum / validPrices.length;

  return {
    min: validPrices[0],
    p25: calculatePercentile(validPrices, 25),
    median: calculatePercentile(validPrices, 50),
    p75: calculatePercentile(validPrices, 75),
    max: validPrices[validPrices.length - 1],
    count: validPrices.length,
    mean: Math.round(mean),
  };
}

/**
 * Format price to VND currency
 */
export function formatPriceVND(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

/**
 * Format price to compact VND (e.g., 320 triệu)
 */
export function formatPriceCompactVND(price: number): string {
  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (price >= 1_000_000) {
    return `${Math.round(price / 1_000_000)} triệu`;
  }
  return formatPriceVND(price);
}

/**
 * Determine confidence level based on sample size
 */
export function getConfidenceLevel(sampleCount: number): 'cao' | 'trung bình' | 'thấp' {
  if (sampleCount >= 10) return 'cao';
  if (sampleCount >= 5) return 'trung bình';
  return 'thấp';
}
