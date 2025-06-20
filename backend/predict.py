# -*- coding: utf-8 -*-
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import numpy as np

app = Flask(__name__)
CORS(app)

# --- Loading Models ---
backend_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(backend_dir, 'model.pkl')
scaler_path = os.path.join(backend_dir, 'scaler.pkl')
encoder_path = os.path.join(backend_dir, 'label_encoder.pkl')

try:
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    label_encoder = joblib.load(encoder_path)
except FileNotFoundError as e:
    print(f"Error loading model files: {e}")
    print("Please run 'python backend/notebook.py' first.")
    exit()

feature_names = [
    'Packet_Length', 'Duration', 'Bytes_Sent', 'Bytes_Received', 
    'Flow_Packets/s', 'Flow_Bytes/s', 'Avg_Packet_Size', 'Total_Fwd_Packets', 
    'Total_Bwd_Packets', 'Fwd_Header_Length', 'Bwd_Header_Length', 
    'Sub_Flow_Fwd_Bytes', 'Sub_Flow_Bwd_Bytes'
]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        features_dict = data['features']
        
        # FIX: Directly create the DataFrame from the features sent by the frontend.
        # The old "bridge" logic has been removed.
        df = pd.DataFrame([features_dict], columns=feature_names)
        
        # Ensure all columns are present, fill missing with 0 if any
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0
        df = df[feature_names] # Ensure correct column order

        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        scaled_features = scaler.transform(df)
        prediction_encoded = model.predict(scaled_features)
        prediction_proba = model.predict_proba(scaled_features)
        prediction_label = label_encoder.inverse_transform(prediction_encoded)[0]
        probabilities = dict(zip(label_encoder.classes_, prediction_proba[0]))
        return jsonify({'prediction': prediction_label, 'probabilities': probabilities})
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and file.filename.endswith('.csv'):
        try:
            df = pd.read_csv(file)
            df.columns = df.columns.str.strip()
            
            if not all(col in df.columns for col in feature_names):
                missing = [col for col in feature_names if col not in df.columns]
                return jsonify({'error': f'CSV is missing required columns: {missing}'}), 400

            X_batch = df[feature_names]
            X_batch.replace([np.inf, -np.inf], 0, inplace=True)
            X_batch.fillna(0, inplace=True)

            scaled_features = scaler.transform(X_batch)
            predictions_encoded = model.predict(scaled_features)
            df['prediction'] = label_encoder.inverse_transform(predictions_encoded)
            df.reset_index(inplace=True)
            results = df.to_dict(orient='records')
            summary = df['prediction'].value_counts().to_dict()
            summary['total_rows'] = len(df)
            return jsonify({'results': results, 'summary': summary})
        except Exception as e:
            return jsonify({'error': f'Batch processing error: {str(e)}'}), 500
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)