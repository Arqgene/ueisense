import os
import sys
from io import BytesIO

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision.models import vit_b_16
from torchvision.transforms import Compose, Normalize, Resize, ToTensor

# 1. Resolve workspace root path for imports and weights loading
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.append(root_dir)
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from backend.utils.preprocessing import extract_row_fuzzy_features
from backend.utils.explainability import generate_explanations
from backend.random_forest import load_or_train_random_forest, predict_uveitis

EYE_DISEASE_CLASSES = ["Cataract", "Conjunctivitis", "Eyelid", "Normal", "Uveitis"]

def resolve_eye_model_path():
    env_path = os.getenv("EYE_MODEL_PATH")
    if env_path and os.path.isfile(env_path):
        return os.path.abspath(env_path)

    repo_model = os.path.join(backend_dir, "models", "best_model.pth")
    if os.path.isfile(repo_model):
        return os.path.abspath(repo_model)

    user_downloads = os.path.join(os.path.expanduser("~"), "Downloads", "best_model.pth")
    if os.path.isfile(user_downloads):
        return os.path.abspath(user_downloads)

    return repo_model

EYE_MODEL_PATH = resolve_eye_model_path()
eye_model = None
eye_transform = Compose([
    Resize((224, 224)),
    ToTensor(),
    Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

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

# Train once on first startup, then reuse the persisted Random Forest pipeline.
random_forest = load_or_train_random_forest()


def load_eye_model():
    global eye_model, EYE_MODEL_PATH
    if eye_model is None:
        model_path = resolve_eye_model_path()
        if not os.path.isfile(model_path):
            raise FileNotFoundError(
                f"Eye disease model not found. Searched at:\n"
                f" - {model_path}\n"
                f"Please ensure best_model.pth exists in 'backend/models/' or set EYE_MODEL_PATH."
            )
        EYE_MODEL_PATH = model_path
        print(f"Loading eye disease model from: {EYE_MODEL_PATH}")
        model = vit_b_16(weights=None, num_classes=len(EYE_DISEASE_CLASSES))
        checkpoint = torch.load(EYE_MODEL_PATH, map_location="cpu", weights_only=True)
        model.load_state_dict(checkpoint)
        model.eval()
        eye_model = model
        print("Eye disease model loaded successfully.")
    return eye_model

@app.post("/predict")
async def predict(payload: dict):
    try:
        # 1. Extract 6 fuzzy features (0.0 to 1.0)
        fuzzy_feats = extract_row_fuzzy_features(payload)
        
        # The screening confidence is the positive-class probability from the
        # Random Forest pipeline, not a client-side heuristic.
        prob = predict_uveitis(random_forest, payload)
        sev = 0.0
        
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


@app.post("/predict-image")
async def predict_eye_image(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg", "image/png", "image/webp", "image/bmp"}:
        raise HTTPException(status_code=415, detail="Please upload a JPEG, PNG, WEBP, or BMP eye image.")

    try:
        image_bytes = await image.read()
        pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")
        tensor = eye_transform(pil_image).unsqueeze(0)
        model = load_eye_model()

        with torch.inference_mode():
            probabilities = torch.softmax(model(tensor), dim=1)[0]
            predicted_index = int(torch.argmax(probabilities).item())

        return {
            "probable_disease": EYE_DISEASE_CLASSES[predicted_index],
            "confidence": float(probabilities[predicted_index].item()),
            "class_probabilities": {
                label: float(probabilities[index].item())
                for index, label in enumerate(EYE_DISEASE_CLASSES)
            },
            "model": "best_model.pth",
        }
    except HTTPException:
        raise
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Eye image classification failed: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    # Start server on standard API port 8000
    uvicorn.run("backend.server:app", host="127.0.0.1", port=8000, reload=False)
