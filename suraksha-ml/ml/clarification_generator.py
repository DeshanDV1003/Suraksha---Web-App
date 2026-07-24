"""
F4 — Intelligent Clarification Question Generation
Slot-filling model: identifies which information slots are missing
from a report and generates targeted follow-up questions.
Questions are conditioned on disaster type and missing slots.
"""
from typing import Optional
import re

# Required information slots per disaster type
REQUIRED_SLOTS = {
    "FLOOD": ["location_precise", "people_count", "water_depth", "access_route", "contact"],
    "LANDSLIDE": ["location_precise", "people_trapped", "road_blocked", "contact"],
    "FIRE": ["location_precise", "fire_source", "people_nearby", "contact"],
    "CYCLONE": ["location_precise", "structural_damage", "people_count", "contact"],
    "BUILDING_COLLAPSE": ["location_precise", "people_trapped", "structural_type", "contact"],
    "DEFAULT": ["location_precise", "people_count", "severity_detail", "contact"],
}

# Question templates per slot
SLOT_QUESTIONS = {
    "location_precise": {
        "en": "What is the exact location? (street name, nearby landmark, GPS coordinates)",
        "si": "නිශ්චිත ස්ථානය කුමක්ද? (වීදිය, ළඟාම ස්ථානය, GPS)",
        "ta": "சரியான இடம் என்ன? (தெரு பெயர், அருகில் உள்ள இடம், GPS)",
    },
    "people_count": {
        "en": "How many people are affected or need help?",
        "si": "කී දෙනෙකු අවශ්‍ය කරන්නේ හෝ බලපෑමට ලක් වී ඇත්ද?",
        "ta": "எத்தனை பேர் பாதிக்கப்பட்டுள்ளனர் அல்லது உதவி தேவைப்படுகிறது?",
    },
    "water_depth": {
        "en": "How deep is the water approximately? (knee-high, waist-high, above head)",
        "si": "ජලය ආසන්නව කොපමණ ගැඹුරු ද? (දණ-ඉහළ, 허리-ඉහළ)",
        "ta": "தண்ணீர் தோராயமாக எவ்வளவு ஆழம்? (முழங்கால், இடுப்பு, தலை அளவு)",
    },
    "access_route": {
        "en": "Is there a road or route to reach you, or is access blocked?",
        "si": "ඔබ වෙත ළඟා වීමට මාර්ගයක් තිබේද, නැතහොත් ප්‍රවේශය අවහිර වී ඇත්ද?",
        "ta": "உங்களை அடைய ஒரு சாலை அல்லது வழி உள்ளதா, அல்லது அணுகல் தடைசெய்யப்பட்டதா?",
    },
    "contact": {
        "en": "What phone number can rescuers call you on?",
        "si": "බේරාගන්නන් ඔබව ඇමතිය හැකි දුරකථන අංකය කුමක්ද?",
        "ta": "மீட்பர்கள் உங்களை அழைக்கக்கூடிய தொலைபேசி எண் என்ன?",
    },
    "people_trapped": {
        "en": "Are people trapped under debris? How many, and are any injured?",
        "si": "අවශේෂ යට කිසිවෙකු හසු වී ඇත්ද? කී දෙනෙකු, ඕනෑම කෙනෙකු තුවාල ලා ඇත්ද?",
        "ta": "யாரேனும் இடிபாடுகளுக்கு அடியில் சிக்கியுள்ளனரா? எத்தனை பேர், காயமடைந்தவர்கள் உள்ளனரா?",
    },
    "road_blocked": {
        "en": "Are any roads blocked by debris or landslide material?",
        "si": "කිසිදු මාර්ගයක් ඉලෙ හෝ ශිලා ලිස්සා යාමෙන් අවහිර ද?",
        "ta": "ஏதேனும் சாலைகள் இடிபாடுகளால் அல்லது நிலச்சரிவு தடுக்கப்பட்டுள்ளதா?",
    },
    "fire_source": {
        "en": "What is the source or cause of the fire? Is it spreading?",
        "si": "ගිනිදැල්ලේ මූලාශ්‍රය කුමක්ද? එය ව්‍යාප්ත වෙනවාද?",
        "ta": "தீயின் மூலம் அல்லது காரணம் என்ன? அது பரவுகிறதா?",
    },
    "people_nearby": {
        "en": "Are there people nearby who cannot evacuate?",
        "si": "ඉවත් කළ නොහැකි ජනතාව ළඟ ඇත්ද?",
        "ta": "வெளியேற முடியாத மக்கள் அருகில் இருக்கிறார்களா?",
    },
    "structural_damage": {
        "en": "Are buildings, roads, or other structures damaged? Can you describe the damage?",
        "si": "ගොඩනැගිලි, මාර්ග හෝ වෙනත් ව්‍යූහ හානිව ඇත්ද?",
        "ta": "கட்டிடங்கள், சாலைகள் அல்லது பிற கட்டமைப்புகள் சேதமடைந்துள்ளனவா?",
    },
    "structural_type": {
        "en": "What type of building collapsed? (house, commercial, school, other)",
        "si": "කුමන ආකාරයේ ගොඩනැගිල්ලක් කඩා වැටුණද? (නිවස, වාණිජ, පාසල)",
        "ta": "என்ன வகையான கட்டிடம் சரிந்தது? (வீடு, வணிக, பள்ளி, பிற)",
    },
    "severity_detail": {
        "en": "Can you describe the severity? (minor damage, major damage, life threatening)",
        "si": "බරපතලකම විස්තර කළ හැකිද? (සාමාන්‍ය, ප්‍රධාන, ජීවිතයට තර්ජනය)",
        "ta": "தீவிரத்தை விவரிக்க முடியுமா? (சிறு சேதம், பெரிய சேதம், உயிருக்கு ஆபத்து)",
    },
}


def _detect_slot_filled(text: str, slot: str) -> bool:
    lower = text.lower()
    if slot == "location_precise":
        return bool(re.search(r'\b(road|street|junction|village|town|no\.|#|\d+[a-z]?)\b', lower))
    if slot == "people_count":
        return bool(re.search(r'\b\d+\s*(person|people|family|families|adult|child)\b', lower))
    if slot == "water_depth":
        return bool(re.search(r'\b(knee|waist|neck|head|foot|metre|feet|cm|inch)\b', lower))
    if slot == "access_route":
        return bool(re.search(r'\b(road|route|path|accessible|blocked|closed)\b', lower))
    if slot == "contact":
        return bool(re.search(r'\b(\d{10}|\d{3}[-\s]\d{3}[-\s]\d{4}|phone|call|number)\b', lower))
    if slot == "people_trapped":
        return bool(re.search(r'\b(trapped|stuck|buried|under|inside)\b', lower))
    if slot == "road_blocked":
        return bool(re.search(r'\b(road|blocked|closed|debris|cannot pass)\b', lower))
    if slot == "fire_source":
        return bool(re.search(r'\b(kitchen|electric|gas|cooking|forest|factory)\b', lower))
    if slot == "people_nearby":
        return bool(re.search(r'\b(people|families|residents|neighbour|trapped)\b', lower))
    if slot == "structural_damage":
        return bool(re.search(r'\b(collapsed|damaged|broken|cracked|fallen)\b', lower))
    if slot == "structural_type":
        return bool(re.search(r'\b(house|home|school|shop|factory|building|hospital)\b', lower))
    if slot == "severity_detail":
        return bool(re.search(r'\b(minor|major|severe|critical|extensive|total)\b', lower))
    return False


def generate_clarification_questions(
    text: str,
    disaster_type: str,
    urgency: str,
    detected_language: str = "en",
    max_questions: int = 3,
) -> dict:
    lang = detected_language if detected_language in ("en", "si", "ta") else "en"

    required = REQUIRED_SLOTS.get(disaster_type, REQUIRED_SLOTS["DEFAULT"])

    # If CRITICAL urgency, always ask contact first
    if urgency == "CRITICAL" and "contact" in required:
        required = ["contact"] + [s for s in required if s != "contact"]

    missing_slots = [slot for slot in required if not _detect_slot_filled(text, slot)]
    selected = missing_slots[:max_questions]

    questions = []
    for slot in selected:
        q = SLOT_QUESTIONS.get(slot, {})
        questions.append({
            "slot": slot,
            "question": q.get(lang, q.get("en", "Please provide more details.")),
            "question_en": q.get("en", "Please provide more details."),
        })

    needs_followup = len(missing_slots) > 0

    return {
        "needs_followup": needs_followup,
        "missing_slots": missing_slots,
        "questions": questions,
        "language": lang,
        "note": (
            "Report appears complete — proceeding to classification."
            if not needs_followup
            else f"{len(missing_slots)} information slots missing. Follow-up recommended."
        ),
    }
