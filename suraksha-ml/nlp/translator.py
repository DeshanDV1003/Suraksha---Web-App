from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL_NAME = "ai4bharat/indictrans2-indic-en-1B"

# Note: In a production environment, you might want to load these once at startup
tokenizer = None
model = None

def get_translator():
    global tokenizer, model
    if tokenizer is None or model is None:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True)
    return tokenizer, model

LANG_CODE_MAP = {
    "si": "sin_Sinh",
    "ta": "tam_Taml",
    "en": "eng_Latn"
}

def translate_to_english(text: str, source_lang: str) -> str:
    if source_lang == "en":
        return text  # no translation needed
    
    src_code = LANG_CODE_MAP.get(source_lang, "eng_Latn")
    
    tokenizer, model = get_translator()
    
    inputs = tokenizer(
        text,
        return_tensors="pt",
        padding=True,
        src_lang=src_code,
        tgt_lang="eng_Latn"
    )
    
    outputs = model.generate(**inputs, max_length=512)
    translated = tokenizer.batch_decode(outputs, skip_special_tokens=True)
    return translated[0]
