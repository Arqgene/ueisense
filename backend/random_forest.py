import os
import pickle

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_PATH = os.path.join(PROJECT_DIR, "artifacts", "random_forest_pipeline.pkl")
MODELS_PKL_PATH = os.path.join(PROJECT_DIR, "models", "random_forest_uveitis_model.pkl")
REPOSITORY_DATASET_PATH = os.path.join(PROJECT_DIR, "data", "uveitis_fuzzy_dataset_100k.csv")
DOWNLOADS_DATASET_PATH = os.path.join(os.path.expanduser("~"), "Downloads", "uveitis_synthetic_dataset.csv")
MODEL_PATH = os.getenv("UVEITIS_MODEL_PATH", ARTIFACT_PATH)
RANDOM_STATE = 42


def _build_pipeline(dataframe, target_column):
    leakage_columns = [
        "patient_id",
        "uveitis_type",
        "severity_band",
        "ocular_severity_score",
        "uveitis_probability",
        "severity_score",
        "severity_class",
        "uveitis_yes_no",
    ]
    X = dataframe.drop(columns=[target_column] + [column for column in leakage_columns if column in dataframe], errors="ignore")
    numeric_columns = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_columns = X.select_dtypes(include=["object"]).columns.tolist()

    preprocessor = ColumnTransformer(transformers=[
        ("num", Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]), numeric_columns),
        ("cat", Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Missing")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]), categorical_columns),
    ])

    pipeline = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("clf", RandomForestClassifier(
            n_estimators=300,
            max_depth=8,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )),
    ])
    return pipeline, X.columns.tolist()


def load_or_train_random_forest():
    # 1. Try configured MODEL_PATH if it exists
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as artifact:
                return pickle.load(artifact)
        except Exception:
            try:
                return joblib.load(MODEL_PATH)
            except Exception:
                pass

    # 2. Try pre-trained pipeline in backend/artifacts
    if os.path.exists(ARTIFACT_PATH):
        with open(ARTIFACT_PATH, "rb") as artifact:
            return pickle.load(artifact)

    # 3. Try pre-trained model in backend/models
    if os.path.exists(MODELS_PKL_PATH):
        with open(MODELS_PKL_PATH, "rb") as artifact:
            return pickle.load(artifact)

    # 4. Fall back to training from dataset
    dataset_path = os.getenv("UVEITIS_DATASET_PATH")
    if not dataset_path or not os.path.exists(dataset_path):
        if os.path.exists(REPOSITORY_DATASET_PATH):
            dataset_path = REPOSITORY_DATASET_PATH
        elif os.path.exists(DOWNLOADS_DATASET_PATH):
            dataset_path = DOWNLOADS_DATASET_PATH
        else:
            raise FileNotFoundError(f"Training dataset not found at {REPOSITORY_DATASET_PATH}")

    dataframe = pd.read_csv(dataset_path)
    if "uveitis_diagnosis" in dataframe:
        target_column = "uveitis_diagnosis"
        target = dataframe[target_column].map({"Yes": 1, "No": 0})
    elif "uveitis_yes_no" in dataframe:
        target_column = "uveitis_yes_no"
        target = pd.to_numeric(dataframe[target_column], errors="coerce")
    else:
        raise ValueError("Dataset must contain uveitis_diagnosis or uveitis_yes_no")

    if target.isna().any():
        raise ValueError("Dataset contains unknown uveitis target values")

    pipeline, feature_columns = _build_pipeline(dataframe, target_column)
    training_data = dataframe.drop(columns=[target_column])
    pipeline.fit(training_data[feature_columns], target.astype(np.int64))

    os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
    with open(ARTIFACT_PATH, "wb") as artifact:
        pickle.dump({"pipeline": pipeline, "feature_columns": feature_columns}, artifact)
    return {"pipeline": pipeline, "feature_columns": feature_columns}


def _yes_no(value, not_sure=False):
    if isinstance(value, (int, float)):
        if value == 0.5 and not_sure:
            return "Not sure"
        return "Yes" if value > 0 else "No"
    if value in ("Yes", "No", "Not sure"):
        return value
    return "No"


def _model_input(payload, feature_columns):
    age = float(payload.get("age", 0) or 0)
    if age < 12 or age > 60:
        age_risk_weight = 2.0
    elif age >= 40:
        age_risk_weight = 1.5
    else:
        age_risk_weight = 1.0

    sex = {"M": "Male", "F": "Female"}.get(payload.get("sex"), "Other")
    affected_eye = {
        "Left": "Left Eye",
        "Right": "Right Eye",
        "Both": "Both Eyes",
    }.get(payload.get("affected_eye"), "Left Eye")
    onset = "Suddenly" if payload.get("onset_type") == "Sudden" else "Gradually"
    meta = payload.get("meta", {})
    medication_text = payload.get("current_medications", "") or ""
    vision_blur = payload.get("subjective_visual_disturbance", "None")
    if isinstance(vision_blur, str):
        vision_blur = {
            "None": 0.0,
            "Mild": 2.5,
            "Moderate": 5.0,
            "Severe": 7.5,
            "Very severe": 10.0,
        }.get(vision_blur, 0.0)
    else:
        vision_blur = float(vision_blur or 0)

    values = {
        "age": age,
        "age_risk_weight": age_risk_weight,
        "biological_sex": sex,
        "affected_eye": affected_eye,
        "symptom_duration_days": float(payload.get("symptom_start_days", 0) or 0),
        "symptom_onset": onset,
        "pain_score_0_10": float(payload.get("pain_score", 0) or 0),
        "redness_score_0_10": float(payload.get("redness_score", 0) or 0),
        "photophobia_score_0_10": float(payload.get("photophobia_score", 0) or 0),
        "vision_blur": vision_blur,
        "floaters_present": _yes_no(payload.get("floaters"), not_sure=True),
        "scotoma_dark_spot": _yes_no(payload.get("peripheral_vision_loss"), not_sure=True),
        "metamorphopsia_distortion": _yes_no(payload.get("hazy_vision"), not_sure=True),
        "vision_description": meta.get("predominant_visual_problem", "Normal vision") or "Normal vision",
        "prior_uveitis_history": _yes_no(payload.get("previous_uveitis")),
        "prior_uveitis_episodes": float(payload.get("episode_count", 0) or 0),
        "eye_injury_surgery_history": "Yes" if any((payload.get("eye_trauma"), payload.get("eye_surgery"), payload.get("prior_treatment"))) else "No",
        "contact_lens_use": _yes_no(payload.get("contact_lens")),
        "autoimmune_disease": _yes_no(payload.get("autoimmune_disease"), not_sure=True),
        "recent_infection_or_TB_exposure": _yes_no(payload.get("recent_infection"), not_sure=True),
        "persistent_cough_breathing_difficulty": _yes_no(payload.get("cough"), not_sure=True),
        "unexplained_weight_loss": _yes_no(payload.get("weight_loss"), not_sure=True),
        "joint_pain_swelling": _yes_no(payload.get("joint_pain"), not_sure=True),
        "immunocompromised": _yes_no(payload.get("immunocompromised"), not_sure=True),
        "current_medications_eye_drops": "Yes" if payload.get("steroid_eye_drop_use", 0) or medication_text else "No",
        "occupation": meta.get("occupation", "") or "Unknown",
        "pet_contact": meta.get("pet_contact", "No") or "No",
        "environmental_exposure": meta.get("environmental_exposure", "") or "None",
        "other_exposure_lifestyle": meta.get("lifestyle_other_exposure", "") or "None",
        "additional_medications": meta.get("other_systemic_medications", "") or medication_text,
    }
    return pd.DataFrame([values]).reindex(columns=feature_columns)


def predict_uveitis(model_bundle, payload):
    if isinstance(model_bundle, dict):
        pipeline = model_bundle["pipeline"]
        feature_columns = model_bundle["feature_columns"]
    else:
        pipeline = model_bundle
        feature_columns = list(pipeline.feature_names_in_)
    model_input = _model_input(payload, feature_columns)
    probabilities = pipeline.predict_proba(model_input)[0]
    class_to_probability = dict(zip(pipeline.classes_, probabilities))
    probability = float(class_to_probability.get(1, 0.0))
    return probability