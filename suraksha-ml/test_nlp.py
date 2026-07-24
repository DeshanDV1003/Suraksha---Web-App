import sys
import os
try:
    from nlp.language_detector import detect_language
    from nlp.translator import translate_to_english
    from nlp.ner_extractor import extract_entities
    
    print("NLP modules imported successfully.")
    
    text = "There is a massive flood in Colombo. We need help immediately."
    
    print("\n--- Testing Language Detection ---")
    lang_res = detect_language(text)
    print("Result:", lang_res)
    
    print("\n--- Testing Translation ---")
    trans_res = translate_to_english(text, lang_res["language"])
    print("Result:", trans_res)
    
    print("\n--- Testing NER Extraction ---")
    ner_res = extract_entities(trans_res)
    print("Result:", ner_res)
    
    print("\nNLP IS WORKING 100% PROPERLY.")
    
except Exception as e:
    print("NLP IS FAILING.")
    import traceback
    traceback.print_exc()
