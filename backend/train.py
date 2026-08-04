import os
import pickle
import json
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.preprocessing import StandardScaler

# Import custom modules
from models.neurofuzzy import NeuroFuzzyNet
from utils.preprocessing import extract_row_fuzzy_features

def main():
    print("Starting Research-Grade Neuro-Fuzzy Pipeline Training...")
    
    # 1. Paths
    dataset_path = "backend/data/uveitis_fuzzy_dataset_100k.csv"
    artifacts_dir = "backend/artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found at: {dataset_path}")
        
    # 2. Load dataset
    print(f"Loading dataset from: {dataset_path}...")
    df = pd.read_csv(dataset_path)
    print(f"Loaded {len(df)} patient rows.")
    
    # 3. Compute 6 Fuzzy features
    print("Computing 6 clinical fuzzy indices for all rows...")
    records = df.to_dict("records")
    X_list = [extract_row_fuzzy_features(row) for row in records]
    X = np.array(X_list, dtype=np.float32)
    print(f"Fuzzy feature shape: {X.shape}")
    
    # 4. Standardize features
    print("Standardizing fuzzy features using StandardScaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Save scaler
    scaler_path = os.path.join(artifacts_dir, "scaler.pkl")
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    print(f"Saved fitted scaler to: {scaler_path}")
    
    # 5. Extract multi-task targets
    print("Extracting multi-task labels...")
    # Head 1: Probability (0.0 to 1.0)
    y_prob = (df["uveitis_probability"].fillna(0.0).values.astype(np.float32) / 100.0).reshape(-1, 1)
    y_prob = np.clip(y_prob, 0.0, 1.0)
    
    # Head 2: Severity Score (0.0 to 100.0)
    y_sev = df["severity_score"].fillna(0.0).values.astype(np.float32).reshape(-1, 1)
    
    # Head 3: Severity Class (Mild -> 0, Moderate -> 1, Severe -> 2)
    class_map = {"Mild": 0, "Moderate": 1, "Severe": 2}
    y_class = df["severity_class"].fillna("Mild").map(class_map).values.astype(np.int64)
    
    # 6. Convert to PyTorch tensors
    X_t = torch.tensor(X_scaled, dtype=torch.float32)
    y_prob_t = torch.tensor(y_prob, dtype=torch.float32)
    y_sev_t = torch.tensor(y_sev, dtype=torch.float32)
    y_class_t = torch.tensor(y_class, dtype=torch.long)
    
    # Create DataLoader
    dataset = TensorDataset(X_t, y_prob_t, y_sev_t, y_class_t)
    loader = DataLoader(dataset, batch_size=1024, shuffle=True)
    
    # 7. Model definition
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training using device: {device}")
    
    model = NeuroFuzzyNet().to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Loss functions
    bce = nn.BCELoss()
    mse = nn.MSELoss()
    ce = nn.CrossEntropyLoss()
    
    epochs = 25
    print(f"Training Neuro-Fuzzy Multi-Task model for {epochs} epochs...")
    
    for epoch in range(1, epochs + 1):
        model.train()
        epoch_loss = 0.0
        
        for batch_x, batch_y_prob, batch_y_sev, batch_y_class in loader:
            batch_x = batch_x.to(device)
            batch_y_prob = batch_y_prob.to(device)
            batch_y_sev = batch_y_sev.to(device)
            batch_y_class = batch_y_class.to(device)
            
            optimizer.zero_grad()
            
            pred_prob, pred_sev, pred_class_logits = model(batch_x)
            
            # Loss calculations
            loss_prob = bce(pred_prob, batch_y_prob)
            loss_sev = mse(pred_sev, batch_y_sev)
            loss_class = ce(pred_class_logits, batch_y_class)
            
            # Normalized loss balance weighting
            loss = (10.0 * loss_prob) + (loss_sev / 100.0) + loss_class
            
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item() * batch_x.size(0)
            
        epoch_loss /= len(loader.dataset)
        if epoch == 1 or epoch % 5 == 0:
            print(f"Epoch {epoch}/{epochs} | Average Weighted Loss: {epoch_loss:.4f}")
            
    # 8. Save artifacts
    model_path = os.path.join(artifacts_dir, "model.pth")
    torch.save(model.state_dict(), model_path)
    print(f"Saved model weights to: {model_path}")
    
    feature_names = ["inflammation", "visual_impairment", "autoimmune", "infection", "recurrence", "urgency"]
    features_path = os.path.join(artifacts_dir, "feature_names.json")
    with open(features_path, "w") as f:
        json.dump(feature_names, f)
        
    config = {
        "epochs": epochs,
        "features_count": len(feature_names),
        "dataset_rows": len(df),
        "loss": float(epoch_loss)
    }
    config_path = os.path.join(artifacts_dir, "config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
        
    print("Training pipeline run completed successfully.")

if __name__ == "__main__":
    # Ensure working directory is workspace root
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    main()
