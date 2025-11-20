/**
 * Gemini AI Prompt Templates for Vietnamese market advisory
 */

import { Product, Auction } from '../types';

export interface GeminiContext {
  userLocation?: string;
  currency: string;
}

/**
 * Build system prompt for Gemini (Vietnamese EV/Battery market advisor)
 */
export function buildSystemPrompt(queryType: 'consultation' | 'price_analysis'): string {
  if (queryType === 'consultation') {
    return `Bạn là một trợ lý bán hàng chuyên gia về xe điện và pin trên nền tảng "EV Trading Platform" tại Việt Nam.

NHIỆM VỤ: TƯ VẤN TÌM MUA SẢN PHẨM
- Khách hàng đang tìm kiếm sản phẩm theo tiêu chí (giá, hãng, loại xe, v.v.)
- Bạn cần lọc và đề xuất 3-5 sản phẩm phù hợp nhất từ danh sách listings/auctions được cung cấp
- Với mỗi sản phẩm đề xuất, nêu rõ lý do tại sao phù hợp với yêu cầu của khách hàng
- Nếu không có sản phẩm khớp hoàn toàn, hãy gợi ý sản phẩm gần đúng nhất
- KHÔNG phân tích giá chi tiết trong mode này, chỉ tập trung vào gợi ý sản phẩm

Quy tắc trả lời:
1. **Văn bản thân thiện**: Trả lời như một người tư vấn tận tâm, không liệt kê kiểu robot
2. **Tích hợp thông tin**: Lồng ghép thông tin sản phẩm vào câu trả lời văn bản (humanReadable)
3. **Call-to-action**: Khuyến khích user xem chi tiết sản phẩm

Format JSON trả về:
{
  "queryType": "consultation",
  "suggestedProducts": [
    {
      "id": "product_id_1",
      "title": "Tên sản phẩm",
      "price": 500000000,
      "type": "listing",
      "reason": "Lý do phù hợp"
    }
  ],
  "benefits": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "recommendations": "Lời khuyên tổng thể",
  "callToAction": ["Xem chi tiết sản phẩm"],
  "humanReadable": "Đây là phần QUAN TRỌNG NHẤT. Hãy viết câu trả lời hoàn chỉnh, thân thiện, có emoji, chia đoạn rõ ràng. Giới thiệu các sản phẩm gợi ý một cách tự nhiên."
}`;
  } else {
    return `Bạn là một trợ lý bán hàng chuyên gia về xe điện và pin trên nền tảng "EV Trading Platform" tại Việt Nam.

NHIỆM VỤ: PHÂN TÍCH GIÁ THỊ TRƯỜNG
- Khách hàng đang hỏi về giá của một sản phẩm cụ thể
- BẮT BUỘC: Bạn PHẢI sử dụng KIẾN THỨC CỦA BẠN về giá thị trường thực tế bên ngoài (từ web search, knowledge base, thông tin thị trường Việt Nam) để làm chuẩn so sánh
- KHÔNG được so sánh giá giữa các listings/auctions với nhau
- So sánh giá của sản phẩm trên sàn (nếu có trong dữ liệu) với giá thị trường thực tế bên ngoài mà bạn biết
- Đưa ra nhận định rõ ràng: Giá trên sàn đang ĐẮT, RẺ hay HỢP LÝ so với thị trường chung
- Nếu không có sản phẩm cụ thể trên sàn, vẫn phải research giá thị trường và đưa ra tư vấn

Quy tắc trả lời:
1. **Văn bản thân thiện**: Trả lời như một người tư vấn tận tâm, không liệt kê kiểu robot
2. **Tích hợp thông tin**: Lồng ghép phân tích giá, lợi ích, và cảnh báo vào câu trả lời văn bản (humanReadable)
3. **Call-to-action**: Khuyến khích user xem chi tiết hoặc liên hệ người bán
4. **DỮ LIỆU SỐ CHO UI**: BẮT BUỘC phải trả về thêm các trường số mô tả khoảng giá thị trường:
   - priceAnalysis.marketMin: Giá thị trường THẤP NHẤT (số nguyên VND, ví dụ 1700000000 cho 1.7 tỷ)
   - priceAnalysis.marketMax: Giá thị trường CAO NHẤT (số nguyên VND)
   - priceAnalysis.recommended: Mức giá KHUYẾN NGHỊ nên trả trong khoảng thị trường (số nguyên VND)
   - priceAnalysis.unit: Chuỗi "VND"
   => KHÔNG được format bằng dấu chấm / dấu phẩy trong JSON (chỉ dùng số nguyên).

Format JSON trả về:
{
  "queryType": "price_analysis",
  "priceAnalysis": {
    "summary": "Nhận định ngắn gọn về giá (ĐẮT/RẺ/HỢP LÝ so với thị trường)",
    "confidence": "cao|trung bình|thấp",
    "reasoning": "Lý do dựa trên research giá thị trường thực tế",
    "marketMin": 1700000000,
    "marketMax": 2000000000,
    "recommended": 1850000000,
    "unit": "VND"
  },
  "benefits": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "recommendations": "Lời khuyên mua bán",
  "callToAction": ["Xem chi tiết sản phẩm"],
  "warnings": ["Cảnh báo nếu có"],
  "humanReadable": "Đây là phần QUAN TRỌNG NHẤT. Hãy viết câu trả lời hoàn chỉnh, thân thiện, có emoji, chia đoạn rõ ràng. Phân tích giá dựa trên research thị trường thực tế, không chỉ so sánh giữa các listing."
}`;
  }
}

/**
 * Build user prompt with listing data and market samples
 */
export function buildUserPrompt(
  query: string,
  listingSamples: Product[],
  auctionSamples: Auction[],
  queryType: 'consultation' | 'price_analysis'
): string {
  // Prepare listing samples summary (limit to 30 items to fit context)
  const listingSummary = listingSamples.slice(0, 30).map((l) => ({
    id: l._id,
    title: l.title,
    price: l.price,
    condition: l.condition,
    location: typeof l.location === 'string' ? l.location : l.location?.city,
    year: l.year || l.ev_details?.year,
    mileage: l.mileage || l.ev_details?.mileage_km,
  }));

  // Prepare auction samples summary (limit to 20 items)
  const auctionSummary = auctionSamples.slice(0, 20).map((a) => ({
    id: a._id,
    title: a.title,
    currentPrice: a.current_price,
    buyNowPrice: a.buy_now_price,
    location: a.location,
    endTime: a.end_time,
  }));

  if (queryType === 'consultation') {
    return `Câu hỏi của khách hàng: "${query}"

**Dữ liệu sản phẩm hiện có trên sàn (${listingSamples.length} listings, ${auctionSamples.length} auctions):**

Listings (Xe/Pin đang bán):
${JSON.stringify(listingSummary, null, 2)}

Auctions (Đấu giá đang diễn ra):
${JSON.stringify(auctionSummary, null, 2)}

**YÊU CẦU:**
- Phân tích câu hỏi của khách hàng để hiểu tiêu chí tìm kiếm (giá, hãng, loại xe, v.v.)
- Lọc và đề xuất 3-5 sản phẩm phù hợp nhất từ danh sách trên
- Với mỗi sản phẩm, nêu rõ lý do tại sao phù hợp
- Trả về JSON với suggestedProducts array chứa id, title, price, type ("listing" hoặc "auction"), và reason

Trả về kết quả dưới dạng JSON.`;
  } else {
    return `Câu hỏi của khách hàng về giá: "${query}"

**Dữ liệu sản phẩm trên sàn (nếu có sản phẩm liên quan):**
${listingSamples.length > 0 || auctionSamples.length > 0 ? `
Listings (Xe/Pin đang bán):
${JSON.stringify(listingSummary.slice(0, 10), null, 2)}

Auctions (Đấu giá đang diễn ra):
${JSON.stringify(auctionSummary.slice(0, 10), null, 2)}
` : 'Không có sản phẩm liên quan trên sàn.'}

**YÊU CẦU QUAN TRỌNG:**
1. **BẮT BUỘC**: Bạn PHẢI sử dụng KIẾN THỨC CỦA BẠN về giá thị trường thực tế bên ngoài (từ web search, knowledge base, thông tin thị trường Việt Nam) để làm chuẩn so sánh
2. **KHÔNG** so sánh giá giữa các listings/auctions với nhau
3. Nếu có sản phẩm trên sàn: So sánh giá trên sàn với giá thị trường thực tế bên ngoài
4. Nếu không có sản phẩm trên sàn: Vẫn phải research và đưa ra giá thị trường thực tế
5. Đưa ra nhận định rõ ràng: ĐẮT/RẺ/HỢP LÝ so với thị trường chung
6. Giải thích lý do dựa trên research giá thị trường thực tế

Trả về kết quả dưới dạng JSON.`;
  }
}

/**
 * Parse Gemini response
 */
export interface SuggestedProduct {
  id: string;
  title: string;
  price: number;
  type: 'listing' | 'auction';
  reason: string;
}

export interface GeminiResponse {
  queryType: 'consultation' | 'price_analysis';
  suggestedProducts?: SuggestedProduct[];
  /**
   * priceAnalysis:
   * - summary/confidence/reasoning: mô tả text
   * - marketMin/marketMax: khoảng giá thị trường (VND, số nguyên, không format)
   * - recommended: giá khuyến nghị nên trả (trong khoảng [marketMin, marketMax])
   * - unit: đơn vị tiền tệ, luôn là "VND"
   */
  priceAnalysis?: {
    summary: string;
    confidence: 'cao' | 'trung bình' | 'thấp';
    reasoning: string;
    marketMin?: number;
    marketMax?: number;
    recommended?: number;
    unit?: string;
  };
  benefits: string[];
  recommendations: string;
  callToAction: string[];
  warnings?: string[];
  humanReadable: string;
}

/**
 * Fix JSON string by escaping control characters in string values.
 * Đi qua từng ký tự và chỉ escape control chars khi đang ở trong chuỗi.
 */
function fixJsonString(jsonString: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      const code = char.charCodeAt(0);
      // Escape common control characters
      if (code === 0x0a) {
        result += '\\n';
      } else if (code === 0x0d) {
        result += '\\r';
      } else if (code === 0x09) {
        result += '\\t';
      } else if (code === 0x0c) {
        result += '\\f';
      } else if (code === 0x08) {
        result += '\\b';
      } else if (code >= 0x00 && code <= 0x1f) {
        // Các control chars còn lại: thay bằng khoảng trắng
        result += ' ';
      } else {
        result += char;
      }
    } else {
      // Ngoài chuỗi: giữ nguyên
      result += char;
    }
  }
  
  return result;
}

export function parseGeminiResponse(
  responseText: string,
  queryType: 'consultation' | 'price_analysis'
): GeminiResponse | null {
  try {
    let cleaned = responseText.trim();
    
    // Step 1: Remove markdown code blocks if present
    if (cleaned.includes('```json')) {
      const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        cleaned = jsonMatch[1].trim();
      } else {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
    } else if (cleaned.includes('```')) {
      const codeMatch = cleaned.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch && codeMatch[1]) {
        cleaned = codeMatch[1].trim();
      } else {
        cleaned = cleaned.replace(/```\n?/g, '');
      }
    }

    // Step 2: Try to find JSON object in the text (in case there's text before/after JSON)
    // Look for the first { and last } to extract JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      // Extract JSON part
      let jsonPart = cleaned.substring(firstBrace, lastBrace + 1);
      
      try {
          jsonPart = fixJsonString(jsonPart);
        const parsed = JSON.parse(jsonPart);
        
        if (!parsed.queryType) {
          parsed.queryType = queryType;
        }
        
        if (!parsed.humanReadable) {
          const textBeforeJson = cleaned.substring(0, firstBrace).trim();
          const textAfterJson = cleaned.substring(lastBrace + 1).trim();
          parsed.humanReadable = (textBeforeJson + ' ' + textAfterJson).trim() || responseText;
        }
        
        return parsed as GeminiResponse;
      } catch (jsonError) {
        console.warn('Failed to parse extracted JSON, will try full text:', jsonError);
      }
    }

    // Step 3: Try parsing the whole cleaned text as JSON (with fixes)
    cleaned = fixJsonString(cleaned);
    const parsed = JSON.parse(cleaned);
    
    if (!parsed.queryType) {
      parsed.queryType = queryType;
    }
    
    // Chuẩn hoá kiểu dữ liệu số cho priceAnalysis nếu có
    if (parsed.priceAnalysis) {
      const pa = parsed.priceAnalysis as {
        marketMin?: unknown;
        marketMax?: unknown;
        recommended?: unknown;
        unit?: unknown;
      };
      if (pa.marketMin !== undefined) {
        pa.marketMin = Number(pa.marketMin);
      }
      if (pa.marketMax !== undefined) {
        pa.marketMax = Number(pa.marketMax);
      }
      if (pa.recommended !== undefined) {
        pa.recommended = Number(pa.recommended);
      }
      if (pa.unit === undefined) {
        pa.unit = 'VND';
      }
      parsed.priceAnalysis = pa;
    }
    
    if (!parsed.humanReadable) {
      parsed.humanReadable = responseText;
    }
    
    return parsed as GeminiResponse;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    console.error('Response text (first 500 chars):', responseText.substring(0, 500));
    
    // Return a fallback structure based on query type
    // Extract humanReadable from response (everything before first { or the whole text)
    let humanReadable = responseText;
    const firstBrace = responseText.indexOf('{');
    if (firstBrace > 0) {
      humanReadable = responseText.substring(0, firstBrace).trim();
    }
    
    if (queryType === 'consultation') {
      return {
        queryType: 'consultation',
        suggestedProducts: [],
        benefits: [],
        recommendations: humanReadable || 'Không thể phân tích phản hồi từ AI',
        callToAction: ['Xem chi tiết sản phẩm'],
        humanReadable: humanReadable || responseText,
      };
    } else {
      return {
        queryType: 'price_analysis',
        priceAnalysis: {
          summary: 'Không thể phân tích dữ liệu',
          confidence: 'thấp',
          reasoning: 'Lỗi xử lý dữ liệu từ AI',
        },
        benefits: [],
        recommendations: humanReadable || 'Không thể phân tích phản hồi từ AI',
        callToAction: ['Xem chi tiết sản phẩm'],
        warnings: ['Không thể phân tích chính xác, vui lòng tham khảo thêm'],
        humanReadable: humanReadable || responseText,
      };
    }
  }
}
