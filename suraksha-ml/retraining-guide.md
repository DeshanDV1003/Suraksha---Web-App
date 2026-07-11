# Suraksha ML Model Retraining Guide

## Overview
The ML model now utilizes a continuous retraining pipeline. Every time the system accumulates **50 new verified incidents**, a new model is trained automatically using the updated dataset which includes live environmental features (Rainfall & River Water Levels).

## Validation Gates
To prevent model degradation, the automated pipeline implements a gating mechanism:
1. The new model is evaluated on a holdout test set.
2. The model is only promoted to production if its **F1 Score >= 0.80** AND it is greater than or equal to the current model's F1 Score.
3. If the new model fails this check, the retraining event is logged as `SKIPPED` and the system continues to use the existing model.

## Manual Fallback Strategy
If a newly promoted model begins misclassifying incidents in production (e.g., users notice Priority mismatches), follow these steps to manually rollback:

### 1. Identify the previous stable model
Look in the `suraksha-ml/models/` directory. Models are versioned by timestamp (e.g., `classifier_20260611_120000.pkl`).

### 2. Restore the model
Copy the known good model and replace the active `classifier.pkl`:
```bash
cp models/classifier_YYYYMMDD_HHMMSS.pkl models/classifier.pkl
```

### 3. Restart the ML Service
Restart the Python FastAPI service to load the restored model into memory.
```bash
sudo systemctl restart suraksha-ml
# OR
docker restart suraksha-ml-container
```

### 4. Pause Automated Retraining (Optional)
If you need to investigate the data drift causing the degradation, you can pause automated retraining by setting the environment variable in your backend `.env`:
```
ML_AUTO_RETRAIN_ENABLED=false
```
Once you have cleaned the incident dataset or adjusted the features, re-enable it by setting it to `true`.
