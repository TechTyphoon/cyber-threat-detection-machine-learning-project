import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier  # UPDATED: Import RandomForest
import joblib
import os

print("--- Starting Model Training Script ---")

# --- Configuration ---
backend_dir = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(backend_dir, 'data', 'cyberfeddefender_dataset.csv')
MODEL_PATH = os.path.join(backend_dir, 'model.pkl')
SCALER_PATH = os.path.join(backend_dir, 'scaler.pkl')
ENCODER_PATH = os.path.join(backend_dir, 'label_encoder.pkl')

# --- 1. Load Data ---
try:
    print(f"Loading dataset from: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    print("Dataset loaded successfully.")
except FileNotFoundError:
    print(f"FATAL ERROR: Dataset not found at {DATASET_PATH}")
    exit()

# --- 2. Preprocessing ---
print("Starting data preprocessing...")
df.columns = df.columns.str.strip()
print("Column names cleaned.")

feature_names = [
    'Packet_Length', 'Duration', 'Bytes_Sent', 'Bytes_Received', 
    'Flow_Packets/s', 'Flow_Bytes/s', 'Avg_Packet_Size', 'Total_Fwd_Packets', 
    'Total_Bwd_Packets', 'Fwd_Header_Length', 'Bwd_Header_Length', 
    'Sub_Flow_Fwd_Bytes', 'Sub_Flow_Bwd_Bytes'
]
target_name = 'Attack_Type'

if not all(col in df.columns for col in feature_names + [target_name]):
    print("FATAL ERROR: The dataset is still missing required columns.")
    missing_cols = [col for col in feature_names + [target_name] if col not in df.columns]
    print(f"Missing columns: {missing_cols}")
    exit()

df.dropna(subset=feature_names + [target_name], inplace=True)
X = df[feature_names]
y = df[target_name]
le = LabelEncoder()
y_encoded = le.fit_transform(y)
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
print("Preprocessing complete.")

# --- 3. Model Training ---
# UPDATED: Use the more powerful RandomForestClassifier
print("Training the RandomForest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train_scaled, y_train)
print("Model training complete.")

# --- 4. Save the Artifacts ---
print("Saving model, scaler, and encoder...")
joblib.dump(model, MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)
joblib.dump(le, ENCODER_PATH)
print("--- Script Finished Successfully ---")