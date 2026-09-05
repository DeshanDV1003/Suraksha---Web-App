"""
MODEL 3 — Suraksha NER Model Trained on REAL DMC Situation Reports
====================================================================
Source: D:\\Suraksha - Web App\\DMC Records\\Situation Reports\\  (2,044 real PDFs)

Strategy:
  1. Extract text from real DMC situation report PDFs using pdfplumber
  2. Auto-annotate entity spans using curated Sri Lanka gazetteer + regex patterns
     for the following entity types used in the live Suraksha system:
       LOC      — Sri Lanka districts, divisions, towns, river names
       INCIDENT — Disaster type keywords
       COUNT    — Numeric counts (deaths, injured, families, people)
       DATE     — Date/time expressions
       DAMAGE   — Infrastructure / asset damage descriptions
  3. Train a spaCy NER model on the extracted + annotated corpus
  4. Evaluate on a held-out 20% split
  5. Save trained model to suraksha-ml/models/suraksha_ner/

Outputs:
  models/suraksha_ner/  (spaCy model directory)
  models/ner_model_info.json
"""

import os
import re
import json
import random
import time
from datetime import datetime
from typing import List, Tuple, Dict

import spacy
from spacy.training import Example
from spacy.util import minibatch, compounding

# ── Paths ─────────────────────────────────────────────────────────────────────
SITREP_DIR = r"D:\Suraksha - Web App\DMC Records\Situation Reports"
MODELS_DIR = r"D:\Suraksha - Web App\suraksha-ml\models"
NER_MODEL_PATH = os.path.join(MODELS_DIR, "suraksha_ner")

SEED = 42
random.seed(SEED)

print("=" * 65)
print("  MODEL 3 — NER (Named Entity Recognition) — REAL DMC SitReps")
print("=" * 65)

# ── Sri Lanka Gazetteer ─────────────────────────────────────────────────────
# All 25 districts, major DS divisions, major towns, rivers, and coastal areas
SL_DISTRICTS = [
    "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
    "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
    "Mullaitivu", "Vavuniya", "Anuradhapura", "Polonnaruwa", "Badulla",
    "Monaragala", "Ratnapura", "Kegalle", "Puttalam", "Kurunegala",
    "Trincomalee", "Batticaloa", "Ampara",
]

SL_TOWNS = [
    "Nugegoda", "Dehiwala", "Mount Lavinia", "Moratuwa", "Panadura", "Horana",
    "Negombo", "Ja-Ela", "Wattala", "Kelaniya", "Maharagama", "Kaduwela",
    "Hanwella", "Avissawella", "Kadugannawa", "Peradeniya", "Katugastota",
    "Nawalapitiya", "Hatton", "Nanu Oya", "Hikkaduwa", "Ambalangoda", "Balapitiya",
    "Weligama", "Tangalle", "Hambantota", "Tissamaharama", "Embilipitiya",
    "Ratnapura", "Kegalle", "Mawanella", "Alawwa", "Kurunegala", "Chilaw",
    "Puttalam", "Anuradhapura", "Mihintale", "Polonnaruwa", "Medirigiriya",
    "Batticaloa", "Kalmunai", "Ampara", "Trincomalee", "Nilaveli",
    "Jaffna", "Nallur", "Vavuniya", "Kilinochchi", "Mannar", "Mullaitivu",
    "Badulla", "Mahiyanganaya", "Bandarawela", "Wellawaya", "Monaragala",
    "Wellawaya", "Buttala", "Ella", "Haputale", "Passara",
]

SL_RIVERS = [
    "Kelani Ganga", "Kalu Ganga", "Mahaweli Ganga", "Nilwala Ganga",
    "Gin Ganga", "Attanagalu Oya", "Mee Oya", "Deduru Oya", "Ma Oya",
    "Malwathu Oya", "Yan Oya", "Kala Oya", "Walawe Ganga", "Gal Oya",
    "Menik Ganga", "Mundeni Aru", "Kuda Ganga", "Kelaniganga", "Kaluganga",
]

SL_DS_DIVISIONS = [
    "Homagama", "Kaduwela", "Kolonnawa", "Kesbewa", "Ratmalana", "Moratuwa",
    "Maharagama", "Seethawaka", "Panadura", "Beruwala", "Bandaragama",
    "Biyagama", "Wattala", "Negombo", "Divulapitiya", "Mirigama",
    "Gampaha", "Dompe", "Ja-Ela", "Katana", "Minuwangoda", "Attanagalla",
]

INCIDENT_TYPES = [
    "flood", "flooding", "flash flood", "inundation", "landslide", "land slide",
    "mudslide", "debris flow", "cyclone", "storm", "strong wind", "gale",
    "fire", "building collapse", "house collapse", "earthquake", "drought",
    "tsunami", "tidal wave", "lightning", "thunder storm",
]

DAMAGE_KEYWORDS = [
    "houses fully damaged", "houses partially damaged", "houses damaged",
    "house damages", "fully damaged", "partially damaged", "fully destroyed",
    "partially destroyed", "partly damaged", "other damages", "property damage",
    "infrastructure damage", "road damage", "bridge damage", "culvert damage",
    "roads damaged", "bridges damaged", "crops damaged", "paddy damaged",
    "washed away", "building collapse", "house collapse", "roof damage",
    "electricity disruption", "water supply disruption",
    "fully collapsed", "partially collapsed",
    "inundated", "submerged", "collapsed", "destroyed",
]
# Multi-word DAMAGE phrases are matched as literal spans; single strong words
# (inundated/submerged/collapsed/destroyed) are only kept when not already
# inside a longer LOC/INCIDENT/COUNT span (find_non_overlapping, longest-wins).

# ── Build gazetteer lookup sets for fast matching ─────────────────────────────
LOC_PHRASES = (
    [d + " District" for d in SL_DISTRICTS] +
    [d + " district" for d in SL_DISTRICTS] +
    SL_DISTRICTS + SL_TOWNS + SL_RIVERS + SL_DS_DIVISIONS
)
LOC_PHRASES_LOWER = {p.lower(): p for p in LOC_PHRASES}

# ── Step 1: Extract raw text from real PDFs ────────────────────────────────────
print("\n[1/6] Extracting text from real DMC Situation Report PDFs...")

try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("      pdfplumber not available — using synthetic corpus only")

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            return "\n".join(
                page.extract_text() or "" for page in pdf.pages
            )
    except Exception:
        return ""

raw_texts = []
if PDF_AVAILABLE and os.path.isdir(SITREP_DIR):
    pdf_files = sorted([
        os.path.join(SITREP_DIR, f) for f in os.listdir(SITREP_DIR)
        if f.lower().endswith('.pdf')
    ])
    # Sample PDFs for training (balance speed vs. coverage). Larger sample =>
    # more DAMAGE/COUNT instances survive into the held-out test split.
    sample_pdfs = random.sample(pdf_files, min(600, len(pdf_files)))
    print(f"      Sampling {len(sample_pdfs)} PDFs from {len(pdf_files)} total...")
    
    for i, pdf_path in enumerate(sample_pdfs, 1):
        text = extract_text_from_pdf(pdf_path)
        if len(text.strip()) > 100:
            raw_texts.append(text)
        if i % 50 == 0:
            print(f"      Extracted {i}/{len(sample_pdfs)}...")
    
    print(f"      Usable PDFs with text: {len(raw_texts)}")
else:
    print("      No PDF directory found. Using synthetic corpus.")

# ── Step 2: Auto-annotate entity spans ────────────────────────────────────────
print("\n[2/6] Auto-annotating NER spans with Sri Lanka gazetteer + regex rules...")

def find_non_overlapping(matches: List[Tuple]) -> List[Tuple]:
    """Remove overlapping spans, keeping the longest span."""
    if not matches:
        return []
    matches = sorted(matches, key=lambda x: (x[0], -(x[1]-x[0])))
    result = [matches[0]]
    for start, end, label in matches[1:]:
        if start >= result[-1][1]:
            result.append((start, end, label))
    return result

def annotate_text(text: str) -> Tuple[str, Dict]:
    """
    Annotate a snippet with entity spans.
    Returns (text, {"entities": [(start, end, label), ...]})
    """
    entities = []
    text_lower = text.lower()

    # LOC: district, town, river, DS division names
    for phrase_lower, phrase in LOC_PHRASES_LOWER.items():
        idx = 0
        while True:
            pos = text_lower.find(phrase_lower, idx)
            if pos == -1:
                break
            entities.append((pos, pos + len(phrase), "LOC"))
            idx = pos + 1

    # INCIDENT types
    for inc in INCIDENT_TYPES:
        idx = 0
        while True:
            pos = text_lower.find(inc, idx)
            if pos == -1:
                break
            entities.append((pos, pos + len(inc), "INCIDENT"))
            idx = pos + 1

    # COUNT: numeric patterns like "200 families", "5 deaths", "1,234 people"
    _count_nouns = (
        r'families|family|people|persons?|individuals?|deaths?|dead|casualties|'
        r'injured|injuries|missing|displaced|affected|evacuated|relocated|'
        r'houses?|housing units?|buildings?|structures?|safety centres?|'
        r'safety centers?|safe locations?|camps?|shelters?|villages?|'
        r'grama niladhari divisions?|gn divisions?|ds divisions?|schools?|acres?'
    )
    count_patterns = [
        r'\b(\d{1,3}(?:,\d{3})+)\s+(?:' + _count_nouns + r')\b',
        r'\b(\d+)\s+(?:' + _count_nouns + r')\b',
    ]
    for pattern in count_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            entities.append((m.start(), m.end(), "COUNT"))

    # DATE: date patterns common in DMC reports
    date_patterns = [
        r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b',
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b',
        r'\b\d{4}-\d{2}-\d{2}\b',
    ]
    for pattern in date_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            entities.append((m.start(), m.end(), "DATE"))

    # DAMAGE: damage value expressions
    damage_patterns = [
        r'\bLKR\s*[\d,]+(?:\.\d+)?\s*(?:million|billion|mn|bn)?\b',
        r'\bRs\.?\s*[\d,]+(?:\.\d+)?\s*(?:million|billion|mn|bn)\b',
        r'\b[\d,]+(?:\.\d+)?\s*(?:million|billion)\s*(?:LKR|rupees)\b',
        # "12 houses fully damaged", "3 houses partially destroyed"
        r'\b\d[\d,]*\s+(?:houses?|buildings?|structures?|shops?)\s+(?:fully|partially|partly)?\s*(?:damaged|destroyed|collapsed)\b',
    ]
    for pattern in damage_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            entities.append((m.start(), m.end(), "DAMAGE"))

    # DAMAGE: descriptive damage phrases from the curated keyword list
    for phrase in DAMAGE_KEYWORDS:
        idx = 0
        while True:
            pos = text_lower.find(phrase, idx)
            if pos == -1:
                break
            # word-boundary check so "collapsed" doesn't fire inside a longer word
            before_ok = pos == 0 or not text_lower[pos - 1].isalpha()
            after_i = pos + len(phrase)
            after_ok = after_i >= len(text_lower) or not text_lower[after_i].isalpha()
            if before_ok and after_ok:
                entities.append((pos, after_i, "DAMAGE"))
            idx = pos + 1

    # Remove overlapping spans
    entities = find_non_overlapping(sorted(entities))
    return (text, {"entities": entities})


def split_into_sentences(text: str, max_len: int = 300) -> List[str]:
    """Split DMC report text into sentence-length chunks for NER training."""
    sentences = re.split(r'(?<=[.!?\n])\s+', text)
    results = []
    for s in sentences:
        s = s.strip()
        if 20 <= len(s) <= max_len:
            results.append(s)
        elif len(s) > max_len:
            # Chunk long sentences
            for i in range(0, len(s), max_len):
                chunk = s[i:i+max_len].strip()
                if len(chunk) >= 20:
                    results.append(chunk)
    return results


# ── Step 3: Build training corpus ─────────────────────────────────────────────
# Real PDF text + curated seed examples from known DMC report patterns

SEED_EXAMPLES = [
    "Heavy flooding in Colombo District affected 1,234 families and 4,521 people.",
    "Landslide reported near Kandy road on 15th June 2025 destroyed 12 houses fully.",
    "Flash flood inundation observed in Ratnapura District Kegalle District and Kalutara District.",
    "The Kelani Ganga river exceeded the minor flood level at Hanwella gauging station.",
    "Strong winds and heavy rain caused roof damages in Gampaha District on 2025-05-12.",
    "3 deaths reported in Hambantota District due to flood and landslide.",
    "Kalu Ganga recorded 9.8m at Ellagawa exceeding the major flood level of 9.5m.",
    "200 families displaced in Batticaloa District and 50 in Ampara District.",
    "Direct loss estimated at LKR 2.5 million in Nuwara Eliya District.",
    "Relief operations ongoing in Monaragala District with 150 evacuated persons.",
    "Flood water receding in Galle District and Matara District as of 10 August 2025.",
    "Situation Report No. 01 — Flood and Landslide — 20th May 2025",
    "A total of 5 deaths and 18 injured reported in the Western Province.",
    "The Nilwala Ganga water level at Pitabeddara is 5.2m exceeding the watch level.",
    "14 houses fully collapsed in Ratnapura District due to heavy rainfall and landslide.",
    "River water levels of Mahaweli Ganga are gradually receding at Peradeniya station.",
    "Emergency relief provided to 320 families in Kurunegala District.",
    "Building collapse in Colombo 7 injured 3 persons on 12 July 2025.",
    "Flash flood in Puttalam District inundated 200 houses partially.",
    "Gin Ganga exceeded minor flood level at Baddegama station at 6.1m.",
    "Cyclone warning issued for Northern Province coastal areas on 15 November 2025.",
    "Attanagalu Oya at Mawaramandiya recorded 4.2m above the watch threshold of 3.0m.",
    "Drought conditions persist in Anuradhapura District and Vavuniya District.",
    "LKR 12.5 million worth of paddy crops destroyed in Polonnaruwa District floods.",
    "Fire damaged 3 houses fully in Horana DS Division Kalutara District.",
    "Walawe Ganga recorded 5.8m at Embilipitiya station on 18 August 2025.",
    "600 persons evacuated from low-lying areas in Trincomalee District.",
    "Infrastructure damage to roads and bridges worth LKR 8 million in Badulla District.",
    "Landslide risk areas mapped in Kegalle District and Kandy District.",
    "Missing 2 persons in Malwathu Oya flood in Anuradhapura District.",
    # DAMAGE-focused seeds (descriptive damage phrasing common in DMC SitReps)
    "In Kalutara District 45 houses were fully damaged and 210 houses partially damaged.",
    "Heavy rain caused road damage and bridge damage across Ratnapura District.",
    "A total of 18 houses fully collapsed and 32 houses partially collapsed in Kegalle District.",
    "Paddy fields were inundated and several culverts damaged in Polonnaruwa District.",
    "The flood submerged main roads in Gampaha District and washed away two footbridges.",
    "Other damages include electricity disruption and water supply disruption in Badulla District.",
    "Roof damage was reported to 120 houses in Matara District after strong winds.",
    "Property damage estimated at LKR 45 million with 300 houses damaged in Colombo District.",
    "12 houses fully destroyed and 8 shops partially damaged in Galle District.",
    "Infrastructure damage to roads and irrigation canals recorded in Hambantota District.",
    "Crops damaged over 500 acres and 75 houses partially damaged in Kurunegala District.",
    "Landslide destroyed 6 houses fully and left 15 houses partially damaged near Hatton.",
    # COUNT-focused seeds (varied unit nouns)
    "As of today 2,450 families and 9,870 people are affected in the Sabaragamuwa Province.",
    "Authorities opened 42 safety centres sheltering 3,100 individuals in Puttalam District.",
    "A total of 7 deaths, 4 missing and 23 injured were reported island-wide.",
    "1,180 people were evacuated from 12 grama niladhari divisions in Kalutara District.",
    "35 schools were closed and 900 families relocated in Kandy District.",
]

print(f"      {len(SEED_EXAMPLES)} curated seed examples loaded.")

# ── Step 3: Train / Test split at the PDF level, BEFORE sentence extraction ────
# IMPORTANT: splitting at the sentence level (as the previous version did)
# leaks near-duplicate boilerplate between train and test — DMC situation
# reports reuse the same header/footer phrasing ("Situation Report No. XX —
# Flood and Landslide — <date>") across many PDFs, and the curated
# SEED_EXAMPLES were repeated 5x and shuffled into both splits, so literally
# identical sentences could appear in both train and test. Splitting whole
# PDFs first (and keeping seeds train-only) means the test set contains no
# text the model could have memorised verbatim.
print("\n[3/6] Train/test split (80/20 at the PDF level, before sentence extraction)...")
random.shuffle(raw_texts)
pdf_split = int(len(raw_texts) * 0.8)
train_pdfs = raw_texts[:pdf_split]
test_pdfs  = raw_texts[pdf_split:]
print(f"      PDFs -> train: {len(train_pdfs)}  |  test: {len(test_pdfs)}")

def annotate_corpus(sentences):
    data, skipped = [], 0
    for text in sentences:
        try:
            annotated = annotate_text(text)
            data.append(annotated if annotated[1]["entities"] else (text, {"entities": []}))
        except Exception:
            skipped += 1
    return data, skipped

train_sentences = [s for text in train_pdfs for s in split_into_sentences(text)]
test_sentences  = [s for text in test_pdfs  for s in split_into_sentences(text)]

# Curated seeds only reinforce training — they must never appear in test.
train_sentences.extend(SEED_EXAMPLES * 5)

train_data, train_skipped = annotate_corpus(train_sentences)
test_data,  test_skipped  = annotate_corpus(test_sentences)
TRAIN_DATA = train_data + test_data
skipped = train_skipped + test_skipped

print(f"      Annotated examples: {len(TRAIN_DATA):,}  |  Skipped: {skipped}")
print(f"      Train: {len(train_data):,}  |  Test: {len(test_data):,} (no shared PDFs, silver-standard labels)")

# Count entity coverage
entity_counts = {"LOC": 0, "INCIDENT": 0, "COUNT": 0, "DATE": 0, "DAMAGE": 0}
for _, ann in TRAIN_DATA:
    for _, _, label in ann["entities"]:
        entity_counts[label] = entity_counts.get(label, 0) + 1
print("      Entity coverage:")
for label, count in entity_counts.items():
    print(f"        {label:10s}: {count:,}")

random.shuffle(train_data)

# ── Step 5: Build and train spaCy NER model ────────────────────────────────────
print("\n[4/6] Building spaCy NER model (blank English)...")
nlp = spacy.blank("en")
ner = nlp.add_pipe("ner")
for label in ["LOC", "INCIDENT", "COUNT", "DATE", "DAMAGE"]:
    ner.add_label(label)

optimizer = nlp.begin_training()
optimizer.learn_rate = 0.001

print("\n[5/6] Training NER (50 iterations with dropout=0.3)...")
N_ITER   = 50
PATIENCE = 5
best_loss = float("inf")
patience_count = 0
loss_history = []

for iteration in range(N_ITER):
    random.shuffle(train_data)
    losses = {}
    batches = list(minibatch(train_data, size=compounding(4.0, 32.0, 1.001)))
    
    for batch in batches:
        examples = []
        for text, annotations in batch:
            doc = nlp.make_doc(text)
            try:
                example = Example.from_dict(doc, annotations)
                examples.append(example)
            except Exception:
                pass
        if examples:
            nlp.update(examples, drop=0.3, losses=losses, sgd=optimizer)
    
    current_loss = losses.get("ner", float("inf"))
    loss_history.append(round(current_loss, 4))
    
    if iteration % 5 == 0 or iteration < 5:
        print(f"      Iter {iteration+1:3d}/{N_ITER} — NER Loss: {current_loss:.4f}")
    
    # Early stopping
    if current_loss < best_loss:
        best_loss = current_loss
        patience_count = 0
        # Save best model checkpoint
        os.makedirs(NER_MODEL_PATH, exist_ok=True)
        nlp.to_disk(NER_MODEL_PATH)
    else:
        patience_count += 1
        if patience_count >= PATIENCE:
            print(f"      Early stopping at iteration {iteration+1} (best loss: {best_loss:.4f})")
            break

# Reload best model
nlp = spacy.load(NER_MODEL_PATH)

# ── Step 6: Evaluate ──────────────────────────────────────────────────────────
print("\n[6/6] Evaluating on held-out test set...")

TP = {"LOC": 0, "INCIDENT": 0, "COUNT": 0, "DATE": 0, "DAMAGE": 0}
FP = {"LOC": 0, "INCIDENT": 0, "COUNT": 0, "DATE": 0, "DAMAGE": 0}
FN = {"LOC": 0, "INCIDENT": 0, "COUNT": 0, "DATE": 0, "DAMAGE": 0}

for text, ann in test_data:
    doc       = nlp(text)
    pred_ents = set((e.start_char, e.end_char, e.label_) for e in doc.ents)
    true_ents = set((s, e, l) for s, e, l in ann["entities"])
    
    for ent in pred_ents:
        lbl = ent[2]
        if ent in true_ents:
            TP[lbl] = TP.get(lbl, 0) + 1
        else:
            FP[lbl] = FP.get(lbl, 0) + 1
    for ent in true_ents:
        lbl = ent[2]
        if ent not in pred_ents:
            FN[lbl] = FN.get(lbl, 0) + 1

print("\n  Per-entity metrics (Precision / Recall / F1):")
print(f"  {'Entity':12s} {'Prec':>7s} {'Rec':>7s} {'F1':>7s}  TP    FP    FN")
print("  " + "-" * 60)

overall_tp = overall_fp = overall_fn = 0
per_class_metrics = {}
for label in ["LOC", "INCIDENT", "COUNT", "DATE", "DAMAGE"]:
    tp = TP.get(label, 0)
    fp = FP.get(label, 0)
    fn = FN.get(label, 0)
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec  = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1   = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
    print(f"  {label:12s} {prec:7.4f} {rec:7.4f} {f1:7.4f}  {tp:5d} {fp:5d} {fn:5d}")
    overall_tp += tp; overall_fp += fp; overall_fn += fn
    per_class_metrics[label] = {"precision": round(prec,4), "recall": round(rec,4), "f1": round(f1,4), "tp": tp, "fp": fp, "fn": fn}

macro_prec = sum(m["precision"] for m in per_class_metrics.values()) / len(per_class_metrics)
macro_rec  = sum(m["recall"]    for m in per_class_metrics.values()) / len(per_class_metrics)
macro_f1   = sum(m["f1"]        for m in per_class_metrics.values()) / len(per_class_metrics)
micro_prec = overall_tp / (overall_tp + overall_fp) if (overall_tp + overall_fp) > 0 else 0.0
micro_rec  = overall_tp / (overall_tp + overall_fn) if (overall_tp + overall_fn) > 0 else 0.0
micro_f1   = 2 * micro_prec * micro_rec / (micro_prec + micro_rec) if (micro_prec + micro_rec) > 0 else 0.0

print(f"\n  Macro  Prec={macro_prec:.4f}  Rec={macro_rec:.4f}  F1={macro_f1:.4f}")
print(f"  Micro  Prec={micro_prec:.4f}  Rec={micro_rec:.4f}  F1={micro_f1:.4f}")

# Save final model (best was already saved)
print(f"\n  OK NER model saved -> {NER_MODEL_PATH}")

# Save model info
model_info = {
    "version":           "v2.2_real_dmc_pdf_split_broader_damage_count",
    "trained_at":        datetime.now().isoformat(),
    "data_source":       "REAL_DMC_SITUATION_REPORTS_600_PDFs + Curated Seeds",
    "evaluation_methodology": (
        "Silver-standard: both train and test labels come from the same "
        "gazetteer/regex auto-annotation, not independent human annotation. "
        "Scores here measure whether the neural model learned to reproduce "
        "the rule-based labeller on unseen PDFs, not ground-truth extraction "
        "quality. The train/test split is done at the PDF level (not sentence "
        "level) so no boilerplate or curated-seed sentence is shared between "
        "splits — this removes the exact-duplicate leakage the previous "
        "version had, but does not remove the silver-label circularity. "
        "COUNT/DATE/DAMAGE are purely regex-defined, so high scores there "
        "mainly show the model imitates the regex; LOC/INCIDENT scores are "
        "more informative since they depend on context, not just pattern match."
    ),
    "total_examples":    len(TRAIN_DATA),
    "train_examples":    len(train_data),
    "test_examples":     len(test_data),
    "entity_labels":     ["LOC", "INCIDENT", "COUNT", "DATE", "DAMAGE"],
    "entity_coverage":   entity_counts,
    "iterations_run":    iteration + 1,
    "best_loss":         round(best_loss, 4),
    "macro_f1":          round(macro_f1, 4),
    "micro_f1":          round(micro_f1, 4),
    "macro_precision":   round(macro_prec, 4),
    "macro_recall":      round(macro_rec, 4),
    "per_class_metrics": per_class_metrics,
}
info_path = os.path.join(MODELS_DIR, "ner_model_info.json")
with open(info_path, "w") as f:
    json.dump(model_info, f, indent=2)
print(f"  OK ner_model_info.json saved")

print("\n" + "=" * 65)
print(f"  MODEL 3 COMPLETE — Macro-F1: {macro_f1:.4f}  Micro-F1: {micro_f1:.4f}")
print("=" * 65)
