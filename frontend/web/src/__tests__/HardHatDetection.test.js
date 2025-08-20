import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HardhatDetection from '../components/HardhatDetection';

// Mock the detection service/API
const mockDetectionService = jest.fn();

jest.mock('../services/detectionService', () => ({
  detectHardhat: mockDetectionService
}));

describe('Hardhat Detection Tests', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    mockDetectionService.mockClear();
  });

  test('should render upload button initially', () => {
    render(<HardhatDetection />);
    expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument();
  });

  test('should detect hardhat in test image', async () => {
    mockDetectionService.mockResolvedValueOnce({ 
      detected: true, 
      confidence: 0.95 
    });

    render(<HardhatDetection />);
    
    // Simulate file upload
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for detection results
    await waitFor(() => {
      expect(screen.getByTestId('detection-result')).toHaveTextContent('Hardhat detected');
    });
    expect(screen.getByTestId('confidence-score')).toHaveTextContent('95%');
  });

  test('should handle no hardhat in image', async () => {
    mockDetectionService.mockResolvedValueOnce({ 
      detected: false, 
      confidence: 0.82 
    });

    render(<HardhatDetection />);
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('detection-result')).toHaveTextContent('No hardhat detected');
    });
  });

  test('should handle invalid file type', () => {
    render(<HardhatDetection />);
    
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid file type');
  });

  test('should handle API errors', async () => {
    mockDetectionService.mockRejectedValueOnce(new Error('API Error'));

    render(<HardhatDetection />);
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Error processing image');
    });
  });

  test('should show loading state during detection', async () => {
    mockDetectionService.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<HardhatDetection />);
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('should allow multiple image uploads', async () => {
    mockDetectionService
      .mockResolvedValueOnce({ detected: true, confidence: 0.95 })
      .mockResolvedValueOnce({ detected: false, confidence: 0.82 });

    render(<HardhatDetection />);
    
    // First upload
    const file1 = new File(['dummy content'], 'test1.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file1] } });

    await waitFor(() => {
      expect(screen.getByTestId('detection-result')).toHaveTextContent('Hardhat detected');
    });

    // Second upload
    const file2 = new File(['dummy content'], 'test2.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file2] } });

    await waitFor(() => {
      expect(screen.getByTestId('detection-result')).toHaveTextContent('No hardhat detected');
    });
  });
});