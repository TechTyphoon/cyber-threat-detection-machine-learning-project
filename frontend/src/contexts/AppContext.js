import React, { createContext, useReducer, useContext } from 'react';

// Define initial state
const initialState = {
  prediction: null,
  probabilities: null,
  singlePredictionError: '',
  initialFormFeatures: null, // For "Test with Bot"

  file: null,
  batchResults: null,
  batchError: '',

  // Potentially add loading states for single/batch predictions if needed globally
  // isLoadingSingle: false,
  // isLoadingBatch: false,
};

// Define action types
const ActionTypes = {
  SET_SINGLE_PREDICTION_RESULT: 'SET_SINGLE_PREDICTION_RESULT',
  RESET_SINGLE_PREDICTION: 'RESET_SINGLE_PREDICTION',
  SET_INITIAL_FORM_FEATURES: 'SET_INITIAL_FORM_FEATURES',
  SET_FILE: 'SET_FILE',
  SET_BATCH_RESULTS: 'SET_BATCH_RESULTS',
  RESET_BATCH_STATE: 'RESET_BATCH_STATE',
  SET_BATCH_ERROR: 'SET_BATCH_ERROR',
  SET_SINGLE_PREDICTION_ERROR: 'SET_SINGLE_PREDICTION_ERROR',
};

// Define reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_SINGLE_PREDICTION_RESULT:
      return {
        ...state,
        prediction: action.payload.prediction,
        probabilities: action.payload.probabilities,
        singlePredictionError: action.payload.error || '',
      };
    case ActionTypes.RESET_SINGLE_PREDICTION:
      return {
        ...state,
        prediction: null,
        probabilities: null,
        singlePredictionError: '',
        initialFormFeatures: null,
      };
    case ActionTypes.SET_INITIAL_FORM_FEATURES:
      return {
        ...state,
        initialFormFeatures: action.payload,
        // Clear previous results when new bot data is loaded
        prediction: null,
        probabilities: null,
        singlePredictionError: '',
      };
    case ActionTypes.SET_FILE:
      return {
        ...state,
        file: action.payload,
        batchError: '', // Reset error when new file is selected
        batchResults: null, // Reset results when new file is selected
      };
    case ActionTypes.SET_BATCH_RESULTS:
      return {
        ...state,
        batchResults: action.payload.results,
        batchError: action.payload.error || '',
      };
    case ActionTypes.RESET_BATCH_STATE:
      return {
        ...state,
        file: null,
        batchResults: null,
        batchError: '',
      };
    case ActionTypes.SET_BATCH_ERROR:
      return { ...state, batchError: action.payload };
    case ActionTypes.SET_SINGLE_PREDICTION_ERROR:
      return { ...state, singlePredictionError: action.payload, prediction: null, probabilities: null };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext({
  state: initialState,
  dispatch: () => null,
});

// Create provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use AppContext
export const useAppContext = () => {
  return useContext(AppContext);
};

export { ActionTypes };
