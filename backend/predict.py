# -*- coding: utf-8 -*-
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app)

# --- Loading Models ---
backend_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(backend_dir, 'model.pkl') # Corrected filename
scaler_path = os.path.join(backend_dir, 'scaler.pkl')
encoder_path = os.path.join(backend_dir, 'label_encoder.pkl')

try:
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    label_encoder = joblib.load(encoder_path)
except FileNotFoundError as e:
    print(f"Error loading model files: {e}")
    print("Please ensure 'model.pkl', 'scaler.pkl', and 'label_encoder.pkl' are in the 'backend' directory.")
    print("You may need to run 'python backend/notebook.py' first.")
    exit()

feature_names = [
    'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
    'Total Length of Fwd Packets', 'Total Length of Bwd Packets', 'Fwd Packet Length Max',
    'Fwd Packet Length Min', 'Fwd Packet Length Mean', 'Fwd Packet Length Std',
    'Bwd Packet Length Max', 'Bwd Packet Length Min', 'Bwd Packet Length Mean',
    'Bwd Packet Length Std', 'Flow Bytes/s', 'Flow Packets/s', 'Flow IAT Mean',
    'Flow IAT Std', 'Flow IAT Max', 'Flow IAT Min', 'Fwd IAT Total'
]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        features_list = data['features']
        df = pd.DataFrame([features_list], columns=feature_names)
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
            if not all(col in df.columns for col in feature_names):
                return jsonify({'error': 'CSV is missing required columns'}), 400
            X_batch = df[feature_names]
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

@app.route('/explain', methods=['POST'])
def explain():
    try:
        data = request.get_json()
        features_dict = data['features']
        sorted_features = sorted(features_dict.items(), key=lambda item: abs(float(item[1])), reverse=True)
        explanation = {feature: "high" for feature, value in sorted_features[:3]}
        return jsonify({'explanation': explanation})
    except Exception as e:
        return jsonify({'error': f'Explanation error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)