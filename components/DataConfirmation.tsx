// components/DataConfirmation.tsx
import { useState } from 'react';
import { WineInfo, ReceiptInfo } from '@/lib/gemini';

interface DataConfirmationProps {
  type: 'wine_label' | 'receipt';
  data: WineInfo | ReceiptInfo;
  loading: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (editedData: WineInfo | ReceiptInfo) => void;
}

const DataField = ({ 
  label, 
  value, 
  onChange,
  type = 'text'
}: { 
  label: string; 
  value: any; 
  onChange?: (value: any) => void;
  type?: 'text' | 'number';
}) => (
  <div className="mb-4">
    <label className="block text-sm font-bold text-gray-800 mb-2">
      {label}
    </label>
    {onChange ? (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      />
    ) : (
      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg">
        {value || <span className="text-gray-400">정보 없음</span>}
      </div>
    )}
  </div>
);

const WineDataDisplay = ({ 
  data, 
  isEditing, 
  onChange 
}: { 
  data: WineInfo; 
  isEditing: boolean; 
  onChange?: (field: string, value: any) => void;
}) => (
  <div className="space-y-4">
    <DataField
      label="와인 이름"
      value={data.name}
      onChange={isEditing ? (value) => onChange?.('name', value) : undefined}
    />
    <DataField
      label="생산자"
      value={data.producer}
      onChange={isEditing ? (value) => onChange?.('producer', value) : undefined}
    />
    <DataField
      label="빈티지 (년도)"
      value={data.vintage}
      type="number"
      onChange={isEditing ? (value) => onChange?.('vintage', value) : undefined}
    />
    <DataField
      label="지역"
      value={data.region}
      onChange={isEditing ? (value) => onChange?.('region', value) : undefined}
    />
    <DataField
      label="국가"
      value={data.country}
      onChange={isEditing ? (value) => onChange?.('country', value) : undefined}
    />
    <DataField
      label="포도 품종"
      value={data.grape_variety}
      onChange={isEditing ? (value) => onChange?.('grape_variety', value) : undefined}
    />
    <DataField
      label="알코올 도수"
      value={data.alcohol_content}
      onChange={isEditing ? (value) => onChange?.('alcohol_content', value) : undefined}
    />
    <DataField
      label="용량"
      value={data.volume}
      onChange={isEditing ? (value) => onChange?.('volume', value) : undefined}
    />
    <DataField
      label="와인 타입"
      value={data.wine_type}
      onChange={isEditing ? (value) => onChange?.('wine_type', value) : undefined}
    />
    <DataField
      label="어펠레이션"
      value={data.appellation}
      onChange={isEditing ? (value) => onChange?.('appellation', value) : undefined}
    />
    <DataField
      label="기타 정보"
      value={data.notes}
      onChange={isEditing ? (value) => onChange?.('notes', value) : undefined}
    />
  </div>
);

const ReceiptDataDisplay = ({ 
  data, 
  isEditing, 
  onChange 
}: { 
  data: ReceiptInfo; 
  isEditing: boolean; 
  onChange?: (field: string, value: any) => void;
}) => (
  <div className="space-y-4">
    <DataField
      label="매장명"
      value={data.store_name}
      onChange={isEditing ? (value) => onChange?.('store_name', value) : undefined}
    />
    <DataField
      label="구매일자"
      value={data.purchase_date}
      onChange={isEditing ? (value) => onChange?.('purchase_date', value) : undefined}
    />
    <DataField
      label="총 금액"
      value={data.total_amount}
      type="number"
      onChange={isEditing ? (value) => onChange?.('total_amount', value) : undefined}
    />
    <DataField
      label="통화"
      value={data.currency}
      onChange={isEditing ? (value) => onChange?.('currency', value) : undefined}
    />
    
    <div className="mt-4">
      <h4 className="text-lg font-medium text-gray-900 mb-3">구매 항목</h4>
      {data.items && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((item, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-md border">
              <DataField
                label="와인명"
                value={item.wine_name}
                onChange={isEditing ? (value) => {
                  const newItems = [...data.items];
                  newItems[index] = { ...item, wine_name: value };
                  onChange?.('items', newItems);
                } : undefined}
              />
              <div className="grid grid-cols-3 gap-2">
                <DataField
                  label="수량"
                  value={item.quantity}
                  type="number"
                  onChange={isEditing ? (value) => {
                    const newItems = [...data.items];
                    newItems[index] = { ...item, quantity: value };
                    onChange?.('items', newItems);
                  } : undefined}
                />
                <DataField
                  label="가격"
                  value={item.price}
                  type="number"
                  onChange={isEditing ? (value) => {
                    const newItems = [...data.items];
                    newItems[index] = { ...item, price: value };
                    onChange?.('items', newItems);
                  } : undefined}
                />
                <DataField
                  label="빈티지"
                  value={item.vintage}
                  type="number"
                  onChange={isEditing ? (value) => {
                    const newItems = [...data.items];
                    newItems[index] = { ...item, vintage: value };
                    onChange?.('items', newItems);
                  } : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">구매 항목이 없습니다.</p>
      )}
    </div>
  </div>
);

export const DataConfirmation = ({
  type,
  data,
  loading,
  error,
  onConfirm,
  onCancel,
  onEdit
}: DataConfirmationProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);

  const handleFieldChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editedData);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedData(data);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold text-gray-900">
            {type === 'wine_label' ? '🍷 와인 정보' : '🧾 영수증 정보'}
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              ✏️ 수정
            </button>
          )}
        </div>
        <p className="text-gray-600">정보를 확인하고 Notion에 저장하세요</p>
      </div>

      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <span className="text-red-500 text-xl">⚠️</span>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="p-6 max-h-80 overflow-y-auto">
        {type === 'wine_label' ? (
          <WineDataDisplay
            data={editedData as WineInfo}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        ) : (
          <ReceiptDataDisplay
            data={editedData as ReceiptInfo}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        )}
      </div>

      {/* Auto-added fields notification */}
      <div className="mx-6 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <h4 className="text-lg font-bold text-blue-800 mb-3">🤖 자동 추가 정보</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">📅</span>
            <span className="text-blue-700 font-medium">구매일자: {new Date().toLocaleDateString('ko-KR')} (분석 당일)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">📦</span>
            <span className="text-blue-700 font-medium">상태: 재고</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 space-y-3">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform active:scale-95"
            >
              ✅ 수정 저장
            </button>
            <button
              onClick={handleCancelEdit}
              className="w-full py-4 px-6 bg-gray-300 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-400 transition-colors"
            >
              ❌ 취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform active:scale-95"
            >
              {loading ? '🔄 Notion에 저장 중...' : '💾 Notion에 저장'}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-3 px-6 bg-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-400 transition-colors disabled:cursor-not-allowed"
            >
              🔙 다시 선택
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="p-6 pt-0 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-500"></div>
        </div>
      )}
    </div>
  );
};