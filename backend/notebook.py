import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.svm import SVC
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
feature_names = [
    'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
    'Total Length of Fwd Packets', 'Total Length of Bwd Packets', 'Fwd Packet Length Max',
    'Fwd Packet Length Min', 'Fwd Packet Length Mean', 'Fwd Packet Length Std',
    'Bwd Packet Length Max', 'Bwd Packet Length Min', 'Bwd Packet Length Mean',
    'Bwd Packet Length Std', 'Flow Bytes/s', 'Flow Packets/s', 'Flow IAT Mean',
    'Flow IAT Std', 'Flow IAT Max', 'Flow IAT Min', 'Fwd IAT Total'
]
target_name = 'Attack Type'

if not all(col in df.columns for col in feature_names + [target_name]):
    print("FATAL ERROR: The dataset is missing one or more required columns.")
    exit()

X = df[feature_names]
y = df[target_name]
le = LabelEncoder()
y_encoded = le.fit_transform(y)
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
print("Preprocessing complete.")

# --- 3. Model Training ---
print("Training the SVM model...")
model = SVC(kernel='rbf', probability=True, random_state=42)
model.fit(X_train_scaled, y_train)
print("Model training complete.")

# --- 4. Save the Artifacts ---
print("Saving model, scaler, and encoder...")
joblib.dump(model, MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)
joblib.dump(le, ENCODER_PATH)
print("--- Script Finished Successfully ---")