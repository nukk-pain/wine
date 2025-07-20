import { render, screen, fireEvent } from '@testing-library/react';
import ImageUpload from '@/components/ImageUpload';

describe('ImageUpload Component', () => {
  it('should render upload area', () => {
    render(<ImageUpload onUpload={jest.fn()} />);
    expect(screen.getByText(/와인 라벨 촬영하기/i)).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const mockOnUpload = jest.fn();
    render(<ImageUpload onUpload={mockOnUpload} />);
    
    const fileInput = screen.getByLabelText(/파일 선택/i);
    const file = new File(['wine'], 'wine.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });

  it('should show preview after file selection', async () => {
    render(<ImageUpload onUpload={jest.fn()} />);
    
    const fileInput = screen.getByLabelText(/파일 선택/i);
    const file = new File(['wine'], 'wine.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(screen.getByAltText(/미리보기/i)).toBeInTheDocument();
  });

  it('should validate file type and size', () => {
    const mockOnUpload = jest.fn();
    render(<ImageUpload onUpload={mockOnUpload} />);
    
    const fileInput = screen.getByLabelText(/파일 선택/i);
    const invalidFile = new File(['invalid'], 'document.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    expect(screen.getByText(/이미지 파일만 업로드 가능합니다/i)).toBeInTheDocument();
    expect(mockOnUpload).not.toHaveBeenCalled();
  });
});