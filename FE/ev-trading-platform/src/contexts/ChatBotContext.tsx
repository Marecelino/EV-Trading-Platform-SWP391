/**
 * ChatBot Context - State management for AI chatbot
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product, Auction } from '../types';
import geminiApi, { MarketAdviceResponse } from '../api/geminiApi';
import listingApi from '../api/listingApi';
import auctionApi from '../api/auctionApi';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: MarketAdviceResponse;
}

interface ChatBotContextValue {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  toggleChatBot: () => void;
  sendMessage: (query: string) => Promise<void>;
  analyzeProduct: (query: string) => Promise<void>;
  clearHistory: () => void;
}

const ChatBotContext = createContext<ChatBotContextValue | undefined>(undefined);

export function useChatBot() {
  const context = useContext(ChatBotContext);
  if (!context) {
    throw new Error('useChatBot must be used within ChatBotProvider');
  }
  return context;
}

interface ChatBotProviderProps {
  children: ReactNode;
}

export function ChatBotProvider({ children }: ChatBotProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của EV Trading Platform. Tôi có thể giúp bạn:\n\n🔍 Tìm kiếm và tư vấn sản phẩm (ví dụ: "tìm xe điện tầm 500 triệu", "xe VinFast")\n💰 Phân tích giá thị trường cho sản phẩm cụ thể\n\nHãy cho tôi biết bạn cần gì nhé! 🚗⚡',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChatBot = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const analyzeProduct = useCallback(async (query: string) => {
    setIsLoading(true);

    // Add user message
    addMessage({
      role: 'user',
      content: query,
    });

    try {
      // Fetch active listings (fetch more to give AI better context for recommendations)
      const listingsResponse = await listingApi.getListings({
        status: 'active',
        page: 1,
        limit: 30,
      });

      let listings: Product[] = [];
      if ('data' in listingsResponse.data && Array.isArray(listingsResponse.data.data)) {
        listings = listingsResponse.data.data;
      } else if (Array.isArray(listingsResponse.data)) {
        listings = listingsResponse.data;
      }

      // Fetch active/live auctions
      const auctionsResponse = await auctionApi.getAllAuctions('live', 1, 20);
      let auctions: Auction[] = [];
      if ('data' in auctionsResponse.data && Array.isArray(auctionsResponse.data.data)) {
        auctions = auctionsResponse.data.data;
      } else if (Array.isArray(auctionsResponse.data)) {
        auctions = auctionsResponse.data;
      }

      // Note: We no longer filter by title here because the user might be asking for recommendations (e.g. "find car 500m")
      // We pass the raw list to Gemini and let it filter/match.
      
      // Generate market advice
      const adviceResponse = await geminiApi.generateMarketAdvice({
        query: query,
        listingSamples: listings,
        auctionSamples: auctions,
        context: {
          currency: 'VND',
          userLocation: 'Toàn quốc',
        },
      });

      if (adviceResponse.success && adviceResponse.data) {
        // For consultation mode, use the first suggested product as best match if available
        let bestMatchId: string | undefined = undefined;
        
        if (adviceResponse.queryType === 'consultation' && adviceResponse.data.suggestedProducts && adviceResponse.data.suggestedProducts.length > 0) {
          // Use the first suggested product ID
          bestMatchId = adviceResponse.data.suggestedProducts[0].id;
        } else if (adviceResponse.queryType === 'price_analysis') {
          // For price analysis, try to find matching product
          const queryLower = query.toLowerCase();
          const matchedListing = listings.find(l => queryLower.includes(l.title.toLowerCase()));
          const matchedAuction = auctions.find(a => (a.title || '').toLowerCase().includes(queryLower));
          
          if (matchedListing) bestMatchId = matchedListing._id;
          else if (matchedAuction) bestMatchId = matchedAuction._id;
        }
        
        addMessage({
          role: 'assistant',
          content: adviceResponse.data.humanReadable,
          data: {
            ...adviceResponse,
            bestMatchId: bestMatchId || adviceResponse.bestMatchId 
          },
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `Xin lỗi, tôi gặp lỗi khi xử lý: ${adviceResponse.error || 'Lỗi không xác định'}`,
        });
      }
    } catch (error) {
      console.error('Error analyzing product:', error);
      addMessage({
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      // For now, treat all messages as product analysis queries
      await analyzeProduct(query);
    },
    [analyzeProduct]
  );

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: 'Lịch sử chat đã được xóa. Tôi có thể giúp bạn tìm kiếm sản phẩm hoặc phân tích giá thị trường. Bạn cần gì? 🚗⚡',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const value: ChatBotContextValue = {
    isOpen,
    messages,
    isLoading,
    toggleChatBot,
    sendMessage,
    analyzeProduct,
    clearHistory,
  };

  return <ChatBotContext.Provider value={value}>{children}</ChatBotContext.Provider>;
}
