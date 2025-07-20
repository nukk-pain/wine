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
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {onChange ? (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    ) : (
      <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
        {value || '정보 없음'}
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {type === 'wine_label' ? '와인 정보 확인' : '영수증 정보 확인'}
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            수정
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6 max-h-96 overflow-y-auto">
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
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">자동 추가될 정보:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 구매일자: {new Date().toLocaleDateString('ko-KR')} (분석 당일)</li>
          <li>• 상태: 재고</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              수정 저장
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Notion에 저장 중...' : 'Notion에 저장'}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:cursor-not-allowed"
            >
              취소
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        </div>
      )}
    </div>
  );
};