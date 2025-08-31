// components/ResultDisplay.tsx
import React from 'react';

export interface WineData {
  name: string;
  vintage?: number;
  'Region/Producer'?: string;
  'Varietal(품종)'?: string | string[];
  price?: number;
  quantity?: number;
  'Country(국가)'?: string;
  'Appellation(원산지명칭)'?: string;
  'Notes(메모)'?: string;
}

export interface ReceiptData {
  store: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}

export interface WineResultDisplayProps {
  data: WineData | ReceiptData;
  type: 'wine_label' | 'receipt';
  loading?: boolean;
  success?: boolean;
  error?: string;
  onSave?: () => void;
}

export function WineResultDisplay({ 
  data, 
  type, 
  loading = false, 
  success = false, 
  error, 
  onSave 
}: WineResultDisplayProps) {
  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  const renderWineData = (wineData: WineData) => (
    <div className="wine-data" data-testid="processing-complete">
      <h3>와인 정보</h3>
      <div className="wine-details">
        <div className="wine-name" data-testid="wine-name">{wineData.name}</div>
        {wineData.vintage && (
          <div className="wine-vintage" data-testid="wine-vintage">{wineData.vintage}</div>
        )}
        {wineData['Region/Producer'] && (
          <div className="wine-region">{wineData['Region/Producer']}</div>
        )}
        {wineData['Varietal(품종)'] && (
          <div className="wine-varietal">
            {Array.isArray(wineData['Varietal(품종)']) 
              ? wineData['Varietal(품종)'].join(', ')
              : wineData['Varietal(품종)']}
          </div>
        )}
        {wineData['Country(국가)'] && (
          <div className="wine-country">{wineData['Country(국가)']}</div>
        )}
        {wineData['Appellation(원산지명칭)'] && (
          <div className="wine-appellation">{wineData['Appellation(원산지명칭)']}</div>
        )}
        {wineData.price && (
          <div className="wine-price">{formatPrice(wineData.price)}</div>
        )}
        {wineData.quantity && (
          <div className="wine-quantity">수량: {wineData.quantity}</div>
        )}
        {wineData['Notes(메모)'] && (
          <div className="wine-notes">{wineData['Notes(메모)']}</div>
        )}
      </div>
    </div>
  );

  const renderReceiptData = (receiptData: ReceiptData) => (
    <div className="receipt-data" data-testid="processing-complete">
      <h3>영수증 정보</h3>
      <div className="receipt-details">
        <div className="store-name" data-testid="store-name">{receiptData.store}</div>
        <div className="receipt-items">
          {receiptData.items.map((item, index) => (
            <div key={index} className="receipt-item" data-testid="wine-item">
              <span className="item-name">{item.name}</span>
              <span className="item-price">{formatPrice(item.price)}</span>
              <span className="item-quantity">수량: {item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="receipt-total" data-testid="receipt-total">
          총액: {formatPrice(receiptData.total)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="result-display">
      {type === 'wine_label' && renderWineData(data as WineData)}
      {type === 'receipt' && renderReceiptData(data as ReceiptData)}
      
      <div className="action-section">
        {loading && <div className="loading-message">저장 중...</div>}
        {success && <div className="success-message">저장 완료!</div>}
        {error && <div className="error-message" role="alert">{error}</div>}
        
        {!loading && !success && (
          <button 
            className="save-button" 
            onClick={onSave}
            type="button"
          >
            Notion에 저장
          </button>
        )}
      </div>
    </div>
  );
}