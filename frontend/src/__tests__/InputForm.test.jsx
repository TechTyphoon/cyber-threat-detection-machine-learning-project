import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InputForm from '../components/InputForm';

// Mock axios for the API call within InputForm
global.axios = {
  post: jest.fn(() => Promise.resolve({ data: { prediction: 'Normal', probabilities: {} } })),
};

describe('InputForm Component', () => {
  const mockOnPrediction = jest.fn();
  const mockOnReset = jest.fn();

  beforeEach(() => {
    // Clear mocks before each test
    mockOnPrediction.mockClear();
    mockOnReset.mockClear();
    axios.post.mockClear();
  });

  test('renders all input fields defined in formFieldsConfig', () => {
    render(<InputForm onPrediction={mockOnPrediction} onReset={mockOnReset} />);

    // Check for a few sample fields based on the current config in InputForm.jsx
    // (Packet_Length, Duration, Bytes_Sent etc.)
    expect(screen.getByLabelText(/Packet Length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bytes Sent/i)).toBeInTheDocument();
    // Add more checks if necessary for all fields
  });

  test('allows typing into input fields', () => {
    render(<InputForm onPrediction={mockOnPrediction} onReset={mockOnReset} />);
    const packetLengthInput = screen.getByLabelText(/Packet Length/i);
    fireEvent.change(packetLengthInput, { target: { value: '123' } });
    expect(packetLengthInput.value).toBe('123');
  });

  test('calls onPrediction with processed data on submit', async () => {
    render(<InputForm onPrediction={mockOnPrediction} onReset={mockOnReset} />);

    // Fill in some data (example for Packet_Length)
    const packetLengthInput = screen.getByLabelText(/Packet Length/i);
    fireEvent.change(packetLengthInput, { target: { value: '100' } });
    // ... potentially fill other required fields ...

    const predictButton = screen.getByRole('button', { name: /Predict/i });
    fireEvent.click(predictButton);

    // Wait for the promise from axios.post to resolve and onPrediction to be called
    // expect(axios.post).toHaveBeenCalledTimes(1); // Check if API was called
    // Check that onPrediction was called. The exact payload check might be complex
    // due to all fields, so we're just checking if it's called.
    // For a more robust test, you could check specific parts of the payload.
    await screen.findByText('Predict'); // Ensures async operations complete

    expect(mockOnPrediction).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/predict',
      expect.objectContaining({
        features: expect.objectContaining({
          Packet_Length: 100, // Ensure numeric conversion happened
          // Other fields would be 0 or their default numeric conversion
        })
      })
    );
  });

  test('clears fields when "Clear Fields" button is clicked', () => {
    render(<InputForm onPrediction={mockOnPrediction} onReset={mockOnReset} />);
    const packetLengthInput = screen.getByLabelText(/Packet Length/i);
    fireEvent.change(packetLengthInput, { target: { value: '123' } });
    expect(packetLengthInput.value).toBe('123');

    const clearButton = screen.getByRole('button', { name: /Clear Fields/i });
    fireEvent.click(clearButton);
    expect(packetLengthInput.value).toBe(''); // Assuming default value is ""
  });

  test('updates fields when initialFeatures prop changes', () => {
    const initialFeatures = { 'Packet_Length': '500', 'Duration': '10' };
    const { rerender } = render(
      <InputForm
        onPrediction={mockOnPrediction}
        onReset={mockOnReset}
        initialFeatures={null}
      />
    );

    let packetLengthInput = screen.getByLabelText(/Packet Length/i);
    expect(packetLengthInput.value).toBe(''); // Initial default

    rerender(
      <InputForm
        onPrediction={mockOnPrediction}
        onReset={mockOnReset}
        initialFeatures={initialFeatures}
      />
    );

    packetLengthInput = screen.getByLabelText(/Packet Length/i);
    expect(packetLengthInput.value).toBe('500');
    const durationInput = screen.getByLabelText(/Duration/i);
    expect(durationInput.value).toBe('10');
  });

});
