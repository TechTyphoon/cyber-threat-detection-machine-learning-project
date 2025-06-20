import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const featureNames = [
  'Packet_Length', 'Duration', 'Bytes_Sent', 'Bytes_Received', 
  'Flow_Packets/s', 'Flow_Bytes/s', 'Avg_Packet_Size', 'Total_Fwd_Packets', 
  'Total_Bwd_Packets', 'Fwd_Header_Length', 'Bwd_Header_Length', 
  'Sub_Flow_Fwd_Bytes', 'Sub_Flow_Bwd_Bytes'
];

// NEW: Predefined data sets for the "Test with Bot" button.
// Each object represents a different potential scenario.
const demoData = [
  { // Profile 1: Potential DDoS Attack (High packets/sec, short duration)
    'Packet_Length': 50, 'Duration': 1500, 'Bytes_Sent': 3000, 'Bytes_Received': 0, 
    'Flow_Packets/s': 20000, 'Flow_Bytes/s': 1000000, 'Avg_Packet_Size': 50, 'Total_Fwd_Packets': 30, 
    'Total_Bwd_Packets': 0, 'Fwd_Header_Length': 600, 'Bwd_Header_Length': 0, 
    'Sub_Flow_Fwd_Bytes': 3000, 'Sub_Flow_Bwd_Bytes': 0
  },
  { // Profile 2: Potential Port Scan (Very short duration, minimal data)
    'Packet_Length': 40, 'Duration': 50, 'Bytes_Sent': 40, 'Bytes_Received': 40, 
    'Flow_Packets/s': 20, 'Flow_Bytes/s': 800, 'Avg_Packet_Size': 40, 'Total_Fwd_Packets': 1, 
    'Total_Bwd_Packets': 1, 'Fwd_Header_Length': 20, 'Bwd_Header_Length': 20, 
    'Sub_Flow_Fwd_Bytes': 40, 'Sub_Flow_Bwd_Bytes': 40
  },
  { // Profile 3: Normal-looking Traffic (Long duration, balanced data)
    'Packet_Length': 1200, 'Duration': 60000, 'Bytes_Sent': 80000, 'Bytes_Received': 120000, 
    'Flow_Packets/s': 3, 'Flow_Bytes/s': 3333, 'Avg_Packet_Size': 1100, 'Total_Fwd_Packets': 100, 
    'Total_Bwd_Packets': 100, 'Fwd_Header_Length': 2000, 'Bwd_Header_Length': 2000, 
    'Sub_Flow_Fwd_Bytes': 80000, 'Sub_Flow_Bwd_Bytes': 120000
  },
  { // Profile 4: Idle/Low Traffic
    'Packet_Length': 0, 'Duration': 11264210, 'Bytes_Sent': 0, 'Bytes_Received': 0, 
    'Flow_Packets/s': 0.17, 'Flow_Bytes/s': 0, 'Avg_Packet_Size': 0, 'Total_Fwd_Packets': 2, 
    'Total_Bwd_Packets': 0, 'Fwd_Header_Length': 64, 'Bwd_Header_Length': 0, 
    'Sub_Flow_Fwd_Bytes': 0, 'Sub_Flow_Bwd_Bytes': 0
  }
];

function App() {
  const [features, setFeatures] = useState(featureNames.reduce((acc, name) => ({ ...acc, [name]: '' }), {}));
  const [prediction, setPrediction] = useState(null);
  const [probabilities, setProbabilities] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [batchError, setBatchError] = useState('');
  const [explanation, setExplanation] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFeatures(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFeatures(featureNames.reduce((acc, name) => ({ ...acc, [name]: '' }), {}));
    setPrediction(null);
    setProbabilities(null);
    setError('');
    setExplanation(null);
  };

  const handlePredict = async () => {
    setError('');
    setPrediction(null);
    setProbabilities(null);
    try {
      const numericFeatures = Object.fromEntries(
        Object.entries(features).map(([key, value]) => [key, Number(value) || 0])
      );
      const response = await axios.post('http://127.0.0.1:5000/predict', { features: numericFeatures });
      setPrediction(response.data.prediction);
      setProbabilities(response.data.probabilities);
    } catch (err) {
      setError('An error occurred during prediction.');
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setBatchError('');
    setBatchResults(null);
  };

  const handleBatchPredict = async () => {
    if (!file) {
      setBatchError('Please select a file first.');
      return;
    }
    setBatchError('');
    setBatchResults(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict_batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBatchResults(response.data);
    } catch (err) {
      setBatchError(err.response?.data?.error || 'An error occurred during batch prediction.');
      console.error(err);
    }
  };

  // UPDATED: This function now uses the predefined demo data.
  const handleTestWithBot = () => {
    // Select a random data set from the demoData array
    const randomIndex = Math.floor(Math.random() * demoData.length);
    const botFeatures = demoData[randomIndex];
    
    // Ensure all feature values are strings for the input fields
    const botFeaturesAsString = Object.fromEntries(
      Object.entries(botFeatures).map(([key, value]) => [key, String(value)])
    );

    setFeatures(botFeaturesAsString);
    // Clear previous results
    setPrediction(null);
    setProbabilities(null);
    setError('');
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
          <div className="features-grid">
            {featureNames.map(name => (
              <div className="input-group" key={name}>
                <label>{name.replace(/_/g, ' ')}</label>
                <input
                  type="number"
                  name={name}
                  value={features[name]}
                  onChange={handleInputChange}
                  placeholder="0.0"
                />
              </div>
            ))}
          </div>
          <div className="button-group">
            <button onClick={handleTestWithBot} className="btn-secondary">Test with Bot</button>
            <button onClick={handleReset} className="btn-secondary">Reset</button>
            <button onClick={handlePredict} className="btn-primary">Predict</button>
          </div>
          {error && <p className="error-message">{error}</p>}
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
            <input type="file" accept=".csv" onChange={handleFileChange} />
          </div>
          <div className="button-group">
            <button onClick={() => { setFile(null); setBatchResults(null); setBatchError(''); document.querySelector('input[type="file"]').value = ''; }} className="btn-secondary">Reset</button>
            <button onClick={handleBatchPredict} className="btn-primary" disabled={!file}>Process File</button>
          </div>
          {file && <p>Selected: {file.name}</p>}
          {batchError && <p className="error-message">{batchError}</p>}
          {batchResults && (
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
                      {Object.keys(batchResults.results[0]).map(key => <th key={key}>{key.replace(/_/g, ' ')}</th>)}
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