from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_NAME = "google/muril-base-cased"  # multilingual BERT for Indian languages

_tokenizer = None
_model = None

def get_bert():
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_NAME, num_labels=4  # CRITICAL, HIGH, MEDIUM, LOW
        )
    return _tokenizer, _model

LABEL_MAP = {0: "CRITICAL", 1: "HIGH", 2: "MEDIUM", 3: "LOW"}

def predict_with_bert(text: str) -> dict:
    tokenizer, model = get_bert()
    
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=256,
        padding=True
    )
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    probs = torch.softmax(outputs.logits, dim=1)
    predicted_class = torch.argmax(probs).item()
    confidence = probs[0][predicted_class].item()
    
    return {
        "priority": LABEL_MAP[predicted_class],
        "confidence": round(confidence, 4)
    }
