/**
 * ChatBot Component - Main AI chatbot interface
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Trash2, Bot, TrendingUp, Tag, Gavel, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useChatBot } from '../../../contexts/ChatBotContext';
import { formatPriceCompactVND } from '../../../utils/priceCalculator';
import './ChatBot.scss';

const ChatBot: React.FC = () => {
  const { isOpen, messages, isLoading, toggleChatBot, sendMessage, clearHistory } = useChatBot();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    await sendMessage(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header__info">
            <Bot className="chatbot-header__icon" />
            <div>
              <h3 className="chatbot-header__title">Trợ lý AI</h3>
              <p className="chatbot-header__subtitle">Tư vấn giá thị trường</p>
            </div>
          </div>
          <div className="chatbot-header__actions">
            <button
              onClick={clearHistory}
              className="chatbot-header__btn"
              title="Xóa lịch sử"
              disabled={isLoading}
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={toggleChatBot}
              className="chatbot-header__btn"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chatbot-message ${message.role === 'user' ? 'chatbot-message--user' : 'chatbot-message--assistant'}`}
            >
              {message.role === 'assistant' && (
                <div className="chatbot-message__avatar">
                  <Bot size={20} />
                </div>
              )}
              <div className="chatbot-message__content">
                <div className="chatbot-message__text">
                  {message.content}
                </div>

                {/* Suggested Products (Consultation Mode) */}
                {message.data?.success && 
                 (message.data.queryType === 'consultation' || message.data.data?.queryType === 'consultation') && 
                 message.data.data?.suggestedProducts && 
                 Array.isArray(message.data.data.suggestedProducts) &&
                 message.data.data.suggestedProducts.length > 0 && (
                  <div className="suggested-products-card">
                    <div className="suggested-products-card__header">
                      <span>🎯 Sản phẩm gợi ý</span>
                      <span className="suggested-products-count">
                        {message.data.data.suggestedProducts.length} sản phẩm
                      </span>
                    </div>
                    <div className="suggested-products-grid">
                      {message.data.data.suggestedProducts.map((product, idx) => (
                        <div key={idx} className="suggested-product-card">
                          {/* Product Image Placeholder */}
                          <div className="suggested-product-card__image">
                            <ImageIcon size={32} />
                            <span>Hình ảnh</span>
                          </div>
                          
                          {/* Badge */}
                          <div className={`suggested-product-card__badge suggested-product-card__badge--${product.type}`}>
                            {product.type === 'auction' ? (
                              <>
                                <Gavel size={12} />
                                <span>Đấu giá</span>
                              </>
                            ) : (
                              <>
                                <Tag size={12} />
                                <span>Sản phẩm</span>
                              </>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="suggested-product-card__content">
                            <h4 className="suggested-product-card__title">{product.title}</h4>
                            <p className="suggested-product-card__price">
                              {formatPriceCompactVND(product.price)}
                            </p>
                            <p className="suggested-product-card__reason">
                              {product.reason}
                            </p>
                          </div>

                          {/* Action Button */}
                          <button
                            className="suggested-product-card__btn"
                            onClick={() => {
                              const route = product.type === 'auction' 
                                ? `/auctions/${product.id}` 
                                : `/products/${product.id}`;
                              navigate(route);
                              toggleChatBot();
                            }}
                          >
                            <ExternalLink size={14} />
                            <span>Xem chi tiết</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Analysis Card (Price Analysis Mode Only) */}
                {message.data?.success && 
                 message.data.queryType === 'price_analysis' && 
                 message.data.priceStats && (
                  <div className="price-analysis-card">
                    <div className="price-analysis-card__header">
                      <TrendingUp size={16} />
                      <span>Phân tích giá thị trường</span>
                    </div>
                    <div className="price-analysis-card__stats">
                      <div className="price-stat">
                        <span className="price-stat__label">Thấp nhất</span>
                        <span className="price-stat__value">
                          {formatPriceCompactVND(message.data.priceStats.min)}
                        </span>
                      </div>
                      <div className="price-stat price-stat--highlight">
                        <span className="price-stat__label">Trung vị</span>
                        <span className="price-stat__value">
                          {formatPriceCompactVND(message.data.priceStats.median)}
                        </span>
                      </div>
                      <div className="price-stat">
                        <span className="price-stat__label">Cao nhất</span>
                        <span className="price-stat__value">
                          {formatPriceCompactVND(message.data.priceStats.max)}
                        </span>
                      </div>
                    </div>
                    <div className="price-analysis-card__info">
                      <span className="sample-count">
                        Dựa trên {message.data.priceStats.count} tin đăng
                      </span>
                    </div>



                    {/* Call to Actions */}
                    {message.data.data?.callToAction && message.data.data.callToAction.length > 0 && (
                      <div className="cta-buttons">
                        {/* View Details Button */}
                        {message.data.bestMatchId && (
                          <button 
                            className="cta-button"
                            onClick={() => {
                              navigate(`/products/${message.data.bestMatchId}`);
                              toggleChatBot();
                            }}
                          >
                            Xem chi tiết sản phẩm
                          </button>
                        )}
                        
                        {/* Other CTAs from AI */}
                        {message.data.data.callToAction.filter(cta => !cta.toLowerCase().includes('xem chi tiết')).map((cta, idx) => (
                          <button key={idx} className="cta-button">
                            {cta}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <span className="chatbot-message__time">
                  {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="chatbot-message chatbot-message--assistant">
              <div className="chatbot-message__avatar">
                <Bot size={20} />
              </div>
              <div className="chatbot-message__content">
                <div className="chatbot-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tên sản phẩm cần tư vấn..."
            disabled={isLoading}
            className="chatbot-input__field"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="chatbot-input__btn"
            title="Gửi"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
