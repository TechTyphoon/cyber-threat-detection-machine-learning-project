# -*- coding: utf-8 -*-
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import numpy as np

app = Flask(__name__)
CORS(app)

# --- Logging Setup ---
import logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s',
                    handlers=[logging.StreamHandler()]) # Log to console
logger = logging.getLogger(__name__)


# --- Swagger UI Setup ---
# Using flask-swagger-ui
from flask_swagger_ui import get_swaggerui_blueprint
SWAGGER_URL = '/api/docs'  # URL for exposing Swagger UI (without trailing '/')
API_URL = '/static/swagger.yaml'  # Our API definition must be static

# Call factory function to create our blueprint
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={  # Swagger UI config overrides
        'app_name': "Cyber Threat Detection API"
    }
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# Serve swagger.yaml statically
import yaml
@app.route('/static/swagger.yaml')
def send_swagger_yaml():
    backend_dir_for_swagger = os.path.dirname(os.path.abspath(__file__))
    swagger_file_path = os.path.join(backend_dir_for_swagger, 'swagger.yaml')
    # Opted not to use send_from_directory to avoid potential complexities with blueprint/static folder setup
    # Instead, just read and return the yaml content with correct mimetype.
    try:
        with open(swagger_file_path, 'r') as f:
            swagger_content = yaml.safe_load(f) # Validate YAML content
        # In a more complex app, you might serve the raw file.
        # For flask-swagger-ui, it often fetches this URL itself.
        # The blueprint above serves the UI, which then makes a request to API_URL.
        # So, this route needs to return the YAML content.
        return jsonify(swagger_content)
    except Exception as e:
        return jsonify({"error": f"Could not load swagger.yaml: {str(e)}"}), 500


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
    logger.info(f"Received request for /predict from {request.remote_addr}")
    try:
        data = request.get_json()
        if not data or 'features' not in data:
            logger.warning("Malformed request to /predict: 'features' key missing or no JSON data.")
            return jsonify({'error': "Invalid input: 'features' key missing or no JSON data."}), 400

        features_dict = data['features']
        if not isinstance(features_dict, dict):
            logger.warning("Malformed request to /predict: 'features' is not a dictionary.")
            return jsonify({'error': "'features' must be a dictionary."}), 400

        logger.debug(f"Features received for prediction: {features_dict}")

        df = pd.DataFrame([features_dict], columns=feature_names)
        
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0 # Default missing features to 0
        df = df[feature_names]

        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        scaled_features = scaler.transform(df)
        prediction_encoded = model.predict(scaled_features)
        prediction_proba = model.predict_proba(scaled_features)
        prediction_label = label_encoder.inverse_transform(prediction_encoded)[0]
        probabilities = dict(zip(label_encoder.classes_, prediction_proba[0]))

        logger.info(f"Prediction successful for {request.remote_addr}: {prediction_label}")
        return jsonify({'prediction': prediction_label, 'probabilities': probabilities}), 200
    except ValueError as ve:
        logger.error(f"ValueError during prediction: {ve}", exc_info=True)
        return jsonify({'error': f'Invalid data provided for prediction: {str(ve)}'}), 400
    except Exception as e:
        logger.error(f"An unexpected error occurred during prediction: {e}", exc_info=True)
        return jsonify({'error': f'An unexpected server error occurred.'}), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    logger.info(f"Received request for /predict_batch from {request.remote_addr}")
    if 'file' not in request.files:
        logger.warning("Malformed request to /predict_batch: 'file' part missing.")
        return jsonify({'error': 'No file part in the request.'}), 400

    file = request.files['file']
    if file.filename == '':
        logger.warning("Malformed request to /predict_batch: No file selected.")
        return jsonify({'error': 'No file selected for upload.'}), 400

    if file and file.filename.endswith('.csv'):
        try:
            logger.info(f"Processing batch file: {file.filename}")
            df = pd.read_csv(file)
            df.columns = df.columns.str.strip()
            
            missing_cols = [col for col in feature_names if col not in df.columns]
            if missing_cols:
                logger.warning(f"CSV file {file.filename} is missing columns: {missing_cols}")
                return jsonify({'error': f'CSV is missing required columns: {", ".join(missing_cols)}'}), 400

            X_batch = df[feature_names].copy() # Use .copy() to avoid SettingWithCopyWarning
            X_batch.replace([np.inf, -np.inf], 0, inplace=True)
            X_batch.fillna(0, inplace=True)

            scaled_features = scaler.transform(X_batch)
            predictions_encoded = model.predict(scaled_features)
            df['prediction'] = label_encoder.inverse_transform(predictions_encoded)

            # df.reset_index(inplace=True) # Not strictly necessary if index isn't used later
            results = df.to_dict(orient='records')
            summary = df['prediction'].value_counts().to_dict()
            summary['total_rows'] = len(df)

            logger.info(f"Batch prediction successful for file {file.filename}. Summary: {summary}")
            return jsonify({'results': results, 'summary': summary}), 200
        except pd.errors.EmptyDataError:
            logger.error(f"Pandas EmptyDataError for file {file.filename}", exc_info=True)
            return jsonify({'error': 'Provided CSV file is empty.'}), 400
        except Exception as e:
            logger.error(f"An unexpected error occurred during batch prediction for {file.filename}: {e}", exc_info=True)
            return jsonify({'error': f'An unexpected server error occurred during batch processing.'}), 500
    else:
        logger.warning(f"Invalid file type uploaded by {request.remote_addr}: {file.filename}")
        return jsonify({'error': 'Invalid file type. Please upload a CSV file.'}), 400

if __name__ == '__main__':
    # Note: When running with Gunicorn, these app.run settings are not used.
    # Gunicorn (or other WSGI server) will handle host/port binding.
    # This is for local development only (python predict.py)
    logger.info("Starting Flask development server...")
    app.run(debug=True, port=5000) # debug=True is not recommended for production