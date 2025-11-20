/**
 * Gemini AI API Service
 * Handles API calls to Google Gemini using the official SDK
 */

import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from '../config/gemini';
import { Product, Auction } from '../types';
import { computePriceStats } from '../utils/priceCalculator';
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseGeminiResponse,
  GeminiResponse,
  GeminiContext,
} from '../utils/geminiPrompts';

export interface MarketAdviceRequest {
  query: string;
  listingSamples: Product[];
  auctionSamples: Auction[];
  context?: GeminiContext;
}

export interface MarketAdviceResponse {
  success: boolean;
  data?: GeminiResponse;
  priceStats?: ReturnType<typeof computePriceStats>;
  error?: string;
  bestMatchId?: string;
  queryType?: 'consultation' | 'price_analysis';
}

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Generate market advice using Gemini AI
 */
export async function generateMarketAdvice(
  request: MarketAdviceRequest
): Promise<MarketAdviceResponse> {
  try {
    // Validate API key
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        error: 'Gemini API key chưa được cấu hình. Vui lòng thêm VITE_GEMINI_API_KEY vào file .env',
      };
    }

    // Detect query type: consultation vs price analysis
    const queryLower = request.query.toLowerCase();
    const isPriceAnalysis = queryLower.includes('giá') || 
                           queryLower.includes('price') || 
                           queryLower.includes('phân tích') ||
                           queryLower.includes('so sánh giá') ||
                           queryLower.includes('đắt') ||
                           queryLower.includes('rẻ');
    
    const queryType: 'consultation' | 'price_analysis' = isPriceAnalysis ? 'price_analysis' : 'consultation';

    // Build prompts (Pass FULL samples to Gemini so it can see everything, but we use filtered stats for UI)
    const systemPrompt = buildSystemPrompt(queryType);
    const userPrompt = buildUserPrompt(
      request.query,
      request.listingSamples,
      request.auctionSamples,
      queryType
    );

    // Calculate price stats only for price analysis mode
    let priceStats: ReturnType<typeof computePriceStats> | undefined = undefined;
    if (queryType === 'price_analysis') {
    // 1. Filter samples relevant to the query for STATS calculation
    const relevantListings = filterRelevantProducts(request.listingSamples, request.query);
    const relevantAuctions = filterRelevantProducts(request.auctionSamples, request.query);

    // 2. Calculate price statistics on RELEVANT samples only
    let allPrices = [
      ...relevantListings.map((l) => l.price),
      ...relevantAuctions.map((a) => a.current_price || a.buy_now_price || 0),
    ].filter((p) => p > 0);

    // 3. Filter outliers (e.g. dummy prices like 1000 VND or accessories)
    allPrices = allPrices.filter(p => p > 10_000_000);
    
    // Optional: IQR filtering if we have enough samples
    if (allPrices.length > 4) {
      allPrices = filterOutliers(allPrices);
    }

      priceStats = computePriceStats(allPrices);
    }

    // Call Gemini API using SDK - Format theo tài liệu chính thức
    // Combine system prompt and user prompt into a single message
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    let response: any;
    try {
      // Thử format đơn giản trước (theo tài liệu chính thức)
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Sử dụng model có sẵn trong tài liệu
        contents: fullPrompt, // Theo tài liệu, contents có thể là string
      });
    } catch (error) {
      // Nếu format đơn giản không work, thử format với array
      console.warn('Simple format failed, trying array format:', error);
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
              parts: [{ text: fullPrompt }]
            }
          ],
        });
      } catch (arrayError) {
        // Nếu cả hai đều fail, throw error để catch block bên ngoài xử lý
        console.error('Both formats failed:', { simpleError: error, arrayError });
        throw arrayError;
      }
    }

    // Theo tài liệu chính thức: response.text là property trực tiếp
    let generatedText: string | undefined;
    
    // Method 1: Direct text property (theo tài liệu chính thức)
    if (response.text && typeof response.text === 'string') {
      generatedText = response.text;
    }
    // Method 2: Nếu text là function (một số version SDK)
    else if (typeof response.text === 'function') {
      try {
        generatedText = response.text();
      } catch (e) {
        console.warn('Failed to call response.text():', e);
      }
    }
    // Method 3: candidates array (fallback)
    else if (response.candidates && Array.isArray(response.candidates) && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate?.content?.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        if (part?.text && typeof part.text === 'string') {
          generatedText = part.text;
        }
      }
    }
    
    if (!generatedText) {
      // Log để debug
      console.error('Gemini API response structure:', {
        hasText: !!response.text,
        textType: typeof response.text,
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length,
        responseKeys: Object.keys(response || {}),
      });
      return {
        success: false,
        error: 'Không nhận được phản hồi từ Gemini AI. Vui lòng kiểm tra console để xem chi tiết.',
      };
    }

    // Parse response
    const parsedResponse = parseGeminiResponse(generatedText, queryType);

    return {
      success: true,
      data: parsedResponse || undefined,
      priceStats: priceStats,
      queryType: queryType,
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định từ Gemini SDK',
    };
  }
}

/**
 * Helper: Filter products based on query keywords
 */
function filterRelevantProducts<T extends { title?: string; name?: string }>(products: T[], query: string): T[] {
  const stopWords = ['mua', 'bán', 'tìm', 'xe', 'giá', 'bao', 'nhiêu', 'ở', 'đâu', 'tại', 'vnđ', 'vnd', 'đồng', 'triệu', 'tỷ', 'phân', 'tích', 'thị', 'trường', 'cho'];
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));

  if (queryWords.length === 0) return products; // No specific keywords, return all

  return products.filter(p => {
    const title = (p.title || p.name || '').toLowerCase();
    // Require at least one significant keyword match
    // For better precision, maybe require 50% of keywords?
    // Let's try: match count > 0. If query is "VinFast VF8", matches "VinFast" OR "VF8".
    // Better: Sort by match count?
    // Simple approach: Check if title contains the most specific keywords.
    
    const matchCount = queryWords.filter(w => title.includes(w)).length;
    return matchCount >= Math.max(1, Math.ceil(queryWords.length * 0.5)); // Match at least 50% of keywords
  });
}

/**
 * Helper: Filter price outliers using IQR
 */
function filterOutliers(prices: number[]): number[] {
  if (prices.length < 4) return prices;
  
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const min = q1 - 1.5 * iqr;
  const max = q3 + 1.5 * iqr;
  
  return sorted.filter(p => p >= min && p <= max);
}

/**
 * Quick price analysis without full advisory
 */
export async function quickPriceAnalysis(
  title: string,
  prices: number[]
): Promise<{ stats: ReturnType<typeof computePriceStats>; summary: string }> {
  const stats = computePriceStats(prices);
  
  if (!stats) {
    return {
      stats: null,
      summary: 'Không đủ dữ liệu để phân tích giá',
    };
  }

  const summary = `Giá thị trường cho "${title}": ${stats.min.toLocaleString('vi-VN')} - ${stats.max.toLocaleString('vi-VN')} VND (median: ${stats.median.toLocaleString('vi-VN')} VND, dựa trên ${stats.count} mẫu)`;

  return { stats, summary };
}

const geminiApi = {
  generateMarketAdvice,
  quickPriceAnalysis,
};

export default geminiApi;
