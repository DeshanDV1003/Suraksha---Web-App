import os
import traceback

print("Testing model load...")
try:
    from ml.lstm_water_predictor import predictor
    print("Model loaded:", predictor.model_loaded)
    print("Status:", predictor.model_info)
except Exception as e:
    print("Exception during import:")
    traceback.print_exc()
