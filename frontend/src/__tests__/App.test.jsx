import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { AppProvider } from '../contexts/AppContext'; // Required by App

// Mock InputForm component as its internals are tested separately
// and it makes an API call on submit which we don't want in App.test.jsx
jest.mock('../components/InputForm', () => {
  const MockInputForm = React.forwardRef(({ onPrediction, initialFeatures }, ref) => {
    // Mock ref methods if App.jsx calls them directly during render or basic interactions
    React.useImperativeHandle(ref, () => ({
      resetFormFields: jest.fn(),
      setFormFields: jest.fn(),
    }));
    return <div data-testid="mock-input-form">Mock Input Form</div>;
  });
  return MockInputForm;
});

// Mock axios
global.axios = {
  post: jest.fn(() => Promise.resolve({ data: {} })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
};


describe('App Component', () => {
  test('renders main heading', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );
    const headingElement = screen.getByText(/Cyber Attack Predictor 2.0/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders Single Prediction and Batch Prediction sections', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );
    expect(screen.getByText('Single Prediction')).toBeInTheDocument();
    expect(screen.getByText('Batch Prediction')).toBeInTheDocument();
  });

  test('renders MockInputForm', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );
    expect(screen.getByTestId('mock-input-form')).toBeInTheDocument();
  });
});
