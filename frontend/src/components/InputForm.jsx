import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import axios from "axios";

// This config should align with featureNames in App.jsx and backend model
const formFieldsConfig = [
  { name: 'Packet_Length', label: 'Packet Length', type: 'number', required: true, defaultValue: "" },
  { name: 'Duration', label: 'Duration', type: 'number', required: true, defaultValue: "" },
  { name: 'Bytes_Sent', label: 'Bytes Sent', type: 'number', required: true, defaultValue: "" },
  { name: 'Bytes_Received', label: 'Bytes Received', type: 'number', required: true, defaultValue: "" },
  { name: 'Flow_Packets/s', label: 'Flow Packets/s', type: 'number', required: true, defaultValue: "" },
  { name: 'Flow_Bytes/s', label: 'Flow Bytes/s', type: 'number', required: true, defaultValue: "" },
  { name: 'Avg_Packet_Size', label: 'Avg Packet Size', type: 'number', required: true, defaultValue: "" },
  { name: 'Total_Fwd_Packets', label: 'Total Fwd Packets', type: 'number', required: true, defaultValue: "" },
  { name: 'Total_Bwd_Packets', label: 'Total Bwd Packets', type: 'number', required: true, defaultValue: "" },
  { name: 'Fwd_Header_Length', label: 'Fwd Header Length', type: 'number', required: true, defaultValue: "" },
  { name: 'Bwd_Header_Length', label: 'Bwd Header Length', type: 'number', required: true, defaultValue: "" },
  { name: 'Sub_Flow_Fwd_Bytes', label: 'Sub Flow Fwd Bytes', type: 'number', required: true, defaultValue: "" },
  { name: 'Sub_Flow_Bwd_Bytes', label: 'Sub Flow Bwd Bytes', type: 'number', required: true, defaultValue: "" },
];

const InputForm = forwardRef(({ onPrediction, onReset, initialFeatures }, ref) => {
  const generateInitialFormData = (features) => {
    return formFieldsConfig.reduce((acc, field) => {
      acc[field.name] = features && features[field.name] !== undefined ? String(features[field.name]) : field.defaultValue;
      return acc;
    }, {});
  };

  const [formData, setFormData] = useState(generateInitialFormData(initialFeatures));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Removed local response state, parent (App.jsx) will handle displaying predictions

  useEffect(() => {
    setFormData(generateInitialFormData(initialFeatures));
  }, [initialFeatures]);

  useImperativeHandle(ref, () => ({
    resetFormFields() {
      setFormData(generateInitialFormData(null)); // Reset with default values
      setError('');
    },
    setFormFields(featuresToSet) {
      setFormData(generateInitialFormData(featuresToSet));
    }
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormResetInternal = () => {
    setFormData(generateInitialFormData(null)); // Reset with default values
    setError('');
    if (onReset) onReset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const numericFeatures = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        const fieldConfig = formFieldsConfig.find(f => f.name === key);
        if (fieldConfig && fieldConfig.type === 'number') {
          return [key, Number(value) || 0];
        }
        return [key, value]; // Should not happen if config is all numbers
      })
    );

    try {
      // API URL will be passed via prop or context in later steps
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/predict`;
      const response = await axios.post(apiUrl, { features: numericFeatures });
      if (onPrediction) onPrediction(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Error submitting data.";
      setError(errorMessage);
      if (onPrediction) onPrediction({ error: errorMessage, prediction: null, probabilities: null });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Removed outer div to allow App.jsx to control card styling if needed
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="features-grid"> {/* Using class from App.jsx for consistency */}
        {formFieldsConfig.map((field) => (
          <div className="input-group" key={field.name}> {/* Using class from App.jsx */}
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              required={field.required}
              placeholder="0.0" // Consistent placeholder
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="flex items-center justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={handleFormResetInternal}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200 text-sm"
        >
          Clear Fields
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-sm"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Predict"}
        </button>
      </div>
    </form>
  );
});

export default InputForm;
