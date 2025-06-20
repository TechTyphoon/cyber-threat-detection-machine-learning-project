import { useState } from 'react';
import './App.css';
import ResultsTable from './ResultsTable';

// Sample data for the "Test with Bot" feature
const botTestData = {
  'Flow Duration': 60, 'Total Fwd Packets': 15, 'Total Backward Packets': 12,
  'Total Length of Fwd Packets': 1200, 'Total Length of Bwd Packets': 5800,
  'Fwd Packet Length Max': 80, 'Fwd Packet Length Min': 80,
  'Fwd Packet Length Mean': 80, 'Fwd Packet Length Std': 0,
  'Bwd Packet Length Max': 500, 'Bwd Packet Length Min': 450,
  'Bwd Packet Length Mean': 483.33, 'Bwd Packet Length Std': 28.86,
  'Flow Bytes/s': 98333.33, 'Flow Packets/s': 450,
  'Flow IAT Mean': 4137.93, 'Flow IAT Std': 0,
  'Flow IAT Max': 60000, 'Flow IAT Min': 0, 'Fwd IAT Total': 60000
};

function App() {
  const feature_names = [
    'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
    'Total Length of Fwd Packets', 'Total Length of Bwd Packets', 'Fwd Packet Length Max',
    'Fwd Packet Length Min', 'Fwd Packet Length Mean', 'Fwd Packet Length Std',
    'Bwd Packet Length Max', 'Bwd Packet Length Min', 'Bwd Packet Length Mean',
    'Bwd Packet Length Std', 'Flow Bytes/s', 'Flow Packets/s', 'Flow IAT Mean',
    'Flow IAT Std', 'Flow IAT Max', 'Flow IAT Min', 'Fwd IAT Total'
  ];

  const initialState = feature_names.reduce((acc, name) => ({ ...acc, [name]: '' }), {});

  // State for single prediction
  const [formData, setFormData] = useState(initialState);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for batch prediction
  const [file, setFile] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isExplainLoading, setIsExplainLoading] = useState(false);
  const [explanationError, setExplanationError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const features = feature_names.map(name => parseFloat(formData[name]));

    if (features.some(isNaN)) {
      setError('All fields must be filled with valid numbers.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialState);
    setResult(null);
    setError('');
  };

  const handleTestByBot = () => {
    setFormData(botTestData);
    setResult(null);
    setError('');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setBatchError('');
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setBatchError('Please select a CSV file to upload.');
      return;
    }

    setIsBatchLoading(true);
    setBatchResult(null);
    setBatchError('');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:5000/predict_batch', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setBatchResult(data);
    } catch (err) {
      setBatchError(err.message);
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleBatchReset = () => {
    setFile(null);
    setBatchResult(null);
    setBatchError('');
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = '';
    }
  };

  const handleRowClick = async (rowData) => {
    if (selectedRow && selectedRow.index === rowData.index) {
      setSelectedRow(null);
      setExplanation(null);
      return;
    }

    setSelectedRow(rowData);
    setIsExplainLoading(true);
    setExplanation(null);
    setExplanationError('');

    const features = feature_names.reduce((obj, key) => {
      obj[key] = rowData[key];
      return obj;
    }, {});

    try {
      const response = await fetch('http://127.0.0.1:5000/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get explanation');
      }
      setExplanation(data.explanation);
    } catch (err) {
      setExplanationError(err.message);
    } finally {
      setIsExplainLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Cyber Attack Predictor 2.0</h1>
      </header>
      <main>
        <div className="prediction-section">
          <h2>Single Prediction</h2>
          <p>Enter network traffic features manually to predict activity type.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {feature_names.map(name => (
                <div className="input-group" key={name}>
                  <label htmlFor={name}>{name}</label>
                  <input
                    type="number"
                    step="any"
                    id={name}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleTestByBot} className="bot-btn">Test with Bot</button>
              <div className="right-actions">
                <button type="button" onClick={handleReset} className="reset-btn">Reset</button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Predict'}
                </button>
              </div>
            </div>
          </form>
          {error && <p className="error">Error: {error}</p>}
          {result && (
            <div className="result-card">
              <h2>Analysis Result</h2>
              <p className="prediction">Prediction: <span>{result.prediction}</span></p>
              <h3>Confidence Scores</h3>
              <div className="probabilities">
                {Object.entries(result.probabilities).sort(([,a],[,b]) => b-a).map(([className, prob]) => (
                  <div key={className} className="probability-item">
                    <span className="class-name">{className}</span>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${prob * 100}%` }}
                      ></div>
                    </div>
                    <span className="percentage">{(prob * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="section-divider" />

        <div className="prediction-section">
          <h2>Batch Prediction</h2>
          <p>Upload a CSV file with network data to process multiple rows at once.</p>
          <form onSubmit={handleBatchSubmit}>
            <div className="file-upload-wrapper">
              <label htmlFor="file-input" className="file-upload-label">
                {file ? `Selected: ${file.name}` : 'Click to select a .csv file'}
              </label>
              <input 
                type="file" 
                id="file-input"
                accept=".csv" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleBatchReset} className="reset-btn">Reset</button>
              <button type="submit" disabled={isBatchLoading || !file}>
                {isBatchLoading ? 'Processing...' : 'Process File'}
              </button>
            </div>
          </form>
          {batchError && <p className="error">Error: {batchError}</p>}
          {batchResult && (
            <div className="result-card">
              <h2>Batch Analysis Summary</h2>
              <div className="summary-grid">
                <p><strong>Total Rows:</strong> {batchResult.summary.total_rows}</p>
                {Object.entries(batchResult.summary)
                  .filter(([key]) => key !== 'total_rows')
                  .map(([className, count]) => (
                    <p key={className}><strong>{className}:</strong> {count}</p>
                  ))
                }
              </div>
              <ResultsTable 
                data={batchResult.results} 
                columns={feature_names} 
                onRowClick={handleRowClick}
                selectedRowIndex={selectedRow ? selectedRow.index : null}
              />
              {selectedRow && (
                <div className="explanation-card">
                  <h4>Explanation for Selected Row</h4>
                  {isExplainLoading && <p>Loading explanation...</p>}
                  {explanationError && <p className="error">Error: {explanationError}</p>}
                  {explanation && (
                    <div>
                      <p>This row was classified as <strong>{selectedRow.prediction}</strong>. The top contributing factors were:</p>
                      <ul>
                        {Object.entries(explanation).map(([feature, level]) => (
                          <li key={feature}>
                            A <strong>{level}</strong> value for <strong>'{feature}'</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;