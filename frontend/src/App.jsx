import React, { useRef } from 'react'; // Removed useState
import axios from 'axios';
import './App.css';
import InputForm from './components/InputForm';
import { useAppContext, ActionTypes } from './contexts/AppContext';

// demoData remains the same
const demoData = [
  {
    'Packet_Length': 50, 'Duration': 1500, 'Bytes_Sent': 3000, 'Bytes_Received': 0, 
    'Flow_Packets/s': 20000, 'Flow_Bytes/s': 1000000, 'Avg_Packet_Size': 50, 'Total_Fwd_Packets': 30, 
    'Total_Bwd_Packets': 0, 'Fwd_Header_Length': 600, 'Bwd_Header_Length': 0, 
    'Sub_Flow_Fwd_Bytes': 3000, 'Sub_Flow_Bwd_Bytes': 0
  },
  {
    'Packet_Length': 40, 'Duration': 50, 'Bytes_Sent': 40, 'Bytes_Received': 40, 
    'Flow_Packets/s': 20, 'Flow_Bytes/s': 800, 'Avg_Packet_Size': 40, 'Total_Fwd_Packets': 1, 
    'Total_Bwd_Packets': 1, 'Fwd_Header_Length': 20, 'Bwd_Header_Length': 20, 
    'Sub_Flow_Fwd_Bytes': 40, 'Sub_Flow_Bwd_Bytes': 40
  },
  {
    'Packet_Length': 1200, 'Duration': 60000, 'Bytes_Sent': 80000, 'Bytes_Received': 120000, 
    'Flow_Packets/s': 3, 'Flow_Bytes/s': 3333, 'Avg_Packet_Size': 1100, 'Total_Fwd_Packets': 100, 
    'Total_Bwd_Packets': 100, 'Fwd_Header_Length': 2000, 'Bwd_Header_Length': 2000, 
    'Sub_Flow_Fwd_Bytes': 80000, 'Sub_Flow_Bwd_Bytes': 120000
  },
  {
    'Packet_Length': 0, 'Duration': 11264210, 'Bytes_Sent': 0, 'Bytes_Received': 0, 
    'Flow_Packets/s': 0.17, 'Flow_Bytes/s': 0, 'Avg_Packet_Size': 0, 'Total_Fwd_Packets': 2, 
    'Total_Bwd_Packets': 0, 'Fwd_Header_Length': 64, 'Bwd_Header_Length': 0, 
    'Sub_Flow_Fwd_Bytes': 0, 'Sub_Flow_Bwd_Bytes': 0
  }
];


function App() {
  const { state, dispatch } = useAppContext();
  const {
    prediction,
    probabilities,
    singlePredictionError,
    initialFormFeatures,
    file,
    batchResults,
    batchError
  } = state;

  const inputFormRef = useRef();
  const fileInputRef = useRef(); // For resetting file input

  const handleSinglePredictionResult = (data) => {
    dispatch({
      type: ActionTypes.SET_SINGLE_PREDICTION_RESULT,
      payload: {
        prediction: data.prediction,
        probabilities: data.probabilities,
        error: data.error
      }
    });
  };

  const handleResetSinglePrediction = () => {
    if (inputFormRef.current) {
      inputFormRef.current.resetFormFields();
    }
    dispatch({ type: ActionTypes.RESET_SINGLE_PREDICTION });
  };

  const handleTestWithBot = () => {
    const randomIndex = Math.floor(Math.random() * demoData.length);
    const botFeatures = demoData[randomIndex];

    const botFeaturesAsString = Object.fromEntries(
      Object.entries(botFeatures).map(([key, value]) => [key, String(value)])
    );
    // Dispatch action to set initial features and clear previous single prediction state
    dispatch({ type: ActionTypes.SET_INITIAL_FORM_FEATURES, payload: botFeaturesAsString });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    dispatch({ type: ActionTypes.SET_FILE, payload: selectedFile || null });
  };

  const handleBatchPredict = async () => {
    if (!file) {
      dispatch({ type: ActionTypes.SET_BATCH_ERROR, payload: 'Please select a file first.' });
      return;
    }
    // Reset previous error/results for batch
    dispatch({ type: ActionTypes.SET_BATCH_ERROR, payload: '' });
    dispatch({ type: ActionTypes.SET_BATCH_RESULTS, payload: { results: null, error: '' } });


    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/predict_batch`;
      const response = await axios.post(apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch({ type: ActionTypes.SET_BATCH_RESULTS, payload: { results: response.data, error: null } });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'An error occurred during batch prediction.';
      dispatch({ type: ActionTypes.SET_BATCH_RESULTS, payload: { results: null, error: errorMsg } });
      console.error(err);
    }
  };

  const handleResetBatch = () => {
    dispatch({ type: ActionTypes.RESET_BATCH_STATE });
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input field
    }
  };


  return (
    <div className="App">
      <header>
        <h1>Cyber Attack Predictor 2.0</h1>
      </header>
      <main>
        <div className="card">
          <h2>Single Prediction</h2>
          <p>Enter network traffic features manually to predict activity type.</p>

          <InputForm
            ref={inputFormRef}
            onPrediction={handleSinglePredictionResult}
            // onReset prop for InputForm's internal reset is not strictly needed by App.jsx anymore
            // as App.jsx's handleResetSinglePrediction now calls the ref method.
            initialFeatures={initialFormFeatures}
          />

          <div className="button-group">
            <button onClick={handleTestWithBot} className="btn-secondary">Test with Bot</button>
            <button onClick={handleResetSinglePrediction} className="btn-secondary">Reset Form & Results</button>
          </div>

          {singlePredictionError && <p className="error-message">{singlePredictionError}</p>}
          {prediction && (
            <div className="results">
              <h3>Prediction Result: <span className={`prediction-${prediction?.toLowerCase()}`}>{prediction}</span></h3>
              {probabilities && (
                <div className="probabilities">
                  <h4>Probabilities:</h4>
                  <ul>
                    {Object.entries(probabilities).sort(([, a], [, b]) => b - a).map(([label, prob]) => (
                      <li key={label}>
                        {label}: {(prob * 100).toFixed(2)}%
                        <div className="prob-bar-container">
                          <div className="prob-bar" style={{ width: `${prob * 100}%` }}></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Batch Prediction</h2>
          <p>Upload a CSV file with network data to process multiple rows at once.</p>
          <div className="input-group">
            <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
          </div>
          <div className="button-group">
            <button onClick={handleResetBatch} className="btn-secondary">Reset</button>
            <button onClick={handleBatchPredict} className="btn-primary" disabled={!file}>Process File</button>
          </div>
          {file && <p>Selected: {file.name}</p>}
          {batchError && <p className="error-message">{batchError}</p>}
          {batchResults && batchResults.results && ( // Ensure batchResults.results exists
            <div className="results">
              <h3>Batch Results</h3>
              <div className="summary">
                <p>Total Rows: {batchResults.summary.total_rows}</p>
                <ul>
                  {Object.entries(batchResults.summary).filter(([key]) => key !== 'total_rows').map(([type, count]) => (
                    <li key={type}>{type}: {count}</li>
                  ))}
                </ul>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {batchResults.results.length > 0 && Object.keys(batchResults.results[0]).map(key => <th key={key}>{key.replace(/_/g, ' ')}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.results.map((row, index) => (
                      <tr key={index}>
                        {Object.entries(row).map(([key, value]) => (
                          <td key={key} data-label={key.replace(/_/g, ' ')}>{typeof value === 'number' ? value.toFixed(2) : value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;