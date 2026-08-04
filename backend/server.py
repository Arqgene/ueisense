import os
import sys
import pickle
import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# 1. Resolve workspace root path for imports and weights loading
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.append(root_dir)

from backend.models.neurofuzzy import NeuroFuzzyNet
from backend.utils.preprocessing import extract_row_fuzzy_features
from backend.utils.explainability import generate_explanations

app = FastAPI(
    title="Research-Grade Neuro-Fuzzy Uveitis screening API",
    description="Multi-task neural network combining clinical fuzzy reasoning layers and explainability models.",
    version="1.0.0"
)

# Enable CORS for convenience
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths to artifacts
model_path = os.path.join(root_dir, "backend", "artifacts", "model.pth")
scaler_path = os.path.join(root_dir, "backend", "artifacts", "scaler.pkl")

# Verify artifacts exist
if not os.path.exists(model_path) or not os.path.exists(scaler_path):
    raise FileNotFoundError("Model weights or scaler artifacts missing. Run backend/train.py first.")

# Load StandardScaler
with open(scaler_path, "rb") as f:
    scaler = pickle.load(f)

# Load NeuroFuzzy model on CPU for server stability
device = torch.device("cpu")
model = NeuroFuzzyNet()
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

@app.post("/predict")
async def predict(payload: dict):
    try:
        # 1. Extract 6 fuzzy features (0.0 to 1.0)
        fuzzy_feats = extract_row_fuzzy_features(payload)
        
        # 2. Standardize features
        feats_arr = np.array([fuzzy_feats], dtype=np.float32)
        feats_scaled = scaler.transform(feats_arr)
        
        # 3. PyTorch Model Inference
        feats_t = torch.tensor(feats_scaled, dtype=torch.float32).to(device)
        with torch.no_grad():
            prob_t, sev_t, class_logits_t = model(feats_t)
            
        prob = float(prob_t.item())
        sev = float(sev_t.item())
        
        # 4. Format normalized fuzzy indices to dict
        fuzzy_indices = {
            "inflammation": float(fuzzy_feats[0]),
            "visual": float(fuzzy_feats[1]),
            "autoimmune": float(fuzzy_feats[2]),
            "infectious": float(fuzzy_feats[3]),
            "recurrence": float(fuzzy_feats[4]),
            "urgency": float(fuzzy_feats[5])
        }
        
        # Override severity score based on clinical fuzzy indicators
        clinical_severity_score = (
            0.35 * fuzzy_indices["inflammation"] +
            0.30 * fuzzy_indices["visual"] +
            0.20 * fuzzy_indices["urgency"] +
            0.10 * fuzzy_indices["recurrence"] +
            0.05 * fuzzy_indices["autoimmune"]
        ) * 100.0
        
        sev = max(sev, clinical_severity_score)
        
        if sev >= 65.0:
            severity_class = "Severe"
        elif sev >= 35.0:
            severity_class = "Moderate"
        else:
            severity_class = "Mild"
            
        # Clinical Safety Layer overrides:
        uveitis_yes_no = 1 if prob >= 0.5 else 0
        force_referral = False
        if (fuzzy_indices["recurrence"] >= 0.8 and fuzzy_indices["visual"] >= 0.8) or (fuzzy_indices["urgency"] >= 0.7):
            force_referral = True
            uveitis_yes_no = 1

        # Determine clinical risk tier
        if uveitis_yes_no == 1 or force_referral or prob >= 0.7 or fuzzy_indices["urgency"] >= 0.7:
            clinical_risk = "High"
        elif prob >= 0.35 or fuzzy_indices["urgency"] >= 0.4 or fuzzy_indices["inflammation"] >= 0.4:
            clinical_risk = "Moderate"
        else:
            clinical_risk = "Low"
        
        # 5. Generate natural language explainability items
        explanations = generate_explanations(payload, fuzzy_indices)
        
        if force_referral:
            explanations.insert(0, "Clinical Safety Alert: High urgency or visual impairment flags suggest immediate ophthalmic assessment is required.")

        return {
            "uveitis_probability": prob,
            "uveitis_yes_no": uveitis_yes_no,
            "severity_score": sev,
            "severity_class": severity_class,
            "clinical_risk": clinical_risk,
            "fuzzy_indices": fuzzy_indices,
            "explanation": explanations
        }
        
    except Exception as e:
        # Print stack trace to stderr for server debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction pipeline error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Start server on standard API port 8000
    uvicorn.run("backend.server:app", host="127.0.0.1", port=8000, reload=False)
