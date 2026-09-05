import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seeds for reproducibility
np.random.seed(42)
random.seed(42)

NUM_RECORDS = 2000

# We want a reasonably balanced dataset to avoid heavy SMOTE
# CRITICAL: 400, HIGH: 500, MEDIUM: 600, LOW: 500
TARGET_LABELS = ['CRITICAL'] * 400 + ['HIGH'] * 500 + ['MEDIUM'] * 600 + ['LOW'] * 500
random.shuffle(TARGET_LABELS)

DISTRICTS = {
    'Colombo': 0.9, 'Gampaha': 0.85, 'Kalutara': 0.8,
    'Galle': 0.75, 'Matara': 0.7, 'Hambantota': 0.65,
    'Kandy': 0.6, 'Ratnapura': 0.85, 'Kegalle': 0.8,
    'Kurunegala': 0.55, 'Puttalam': 0.6, 'Anuradhapura': 0.5,
    'Polonnaruwa': 0.5, 'Badulla': 0.65, 'Monaragala': 0.6,
    'Nuwara Eliya': 0.7, 'Trincomalee': 0.55, 'Batticaloa': 0.55,
    'Ampara': 0.55, 'Vavuniya': 0.45, 'Mullaitivu': 0.45,
    'Kilinochchi': 0.45, 'Mannar': 0.5, 'Jaffna': 0.5, 'Matale': 0.55
}

INCIDENTS = ['Flood', 'Landslide', 'Drought', 'High Winds/Cyclone', 'Forest Fire', 'Medical Emergency', 'Building Collapse']

def random_date(start, end):
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start + timedelta(seconds=random_second)

records = []
start_date = datetime(2020, 1, 1)
end_date = datetime(2026, 5, 1)

for i in range(NUM_RECORDS):
    label = TARGET_LABELS[i]
    date = random_date(start_date, end_date)
    
    # 1. District selection (Probabilistic based on label)
    if label == 'CRITICAL':
        district = random.choices(list(DISTRICTS.keys()), weights=[DISTRICTS[d]**2 for d in DISTRICTS.keys()])[0]
    elif label == 'HIGH':
        district = random.choices(list(DISTRICTS.keys()), weights=[DISTRICTS[d]**1.5 for d in DISTRICTS.keys()])[0]
    else:
        district = random.choice(list(DISTRICTS.keys()))
        
    # 2. Incident Type
    if label == 'CRITICAL':
        incident = random.choices(INCIDENTS, weights=[0.4, 0.3, 0.05, 0.1, 0.05, 0.05, 0.05])[0]
    elif label == 'HIGH':
        incident = random.choices(INCIDENTS, weights=[0.3, 0.2, 0.1, 0.2, 0.1, 0.05, 0.05])[0]
    elif label == 'MEDIUM':
        incident = random.choices(INCIDENTS, weights=[0.2, 0.1, 0.3, 0.2, 0.1, 0.05, 0.05])[0]
    else:
        incident = random.choices(INCIDENTS, weights=[0.1, 0.05, 0.4, 0.1, 0.15, 0.15, 0.05])[0]
        
    # 3. Affected Population (Gaussian noise based on label to look realistic)
    if label == 'CRITICAL':
        affected = int(np.random.normal(loc=1200, scale=400))
    elif label == 'HIGH':
        affected = int(np.random.normal(loc=600, scale=200))
    elif label == 'MEDIUM':
        affected = int(np.random.normal(loc=200, scale=100))
    else:
        affected = int(np.random.normal(loc=50, scale=30))
    affected = max(0, affected) # No negative population
    
    # 4. Has Media (more likely for higher priority)
    media_prob = {'CRITICAL': 0.9, 'HIGH': 0.7, 'MEDIUM': 0.4, 'LOW': 0.2}[label]
    has_photo = np.random.rand() < media_prob
    has_video = np.random.rand() < (media_prob * 0.5)
    
    # 5. Vulnerability Flags (New features!)
    vuln_prob = {'CRITICAL': 0.8, 'HIGH': 0.6, 'MEDIUM': 0.3, 'LOW': 0.1}[label]
    has_children = np.random.rand() < vuln_prob
    has_elderly = np.random.rand() < vuln_prob
    has_disabled = np.random.rand() < (vuln_prob * 0.5)
    
    # 6. Hour of Day (Slightly more critical incidents at night)
    if label in ['CRITICAL', 'HIGH'] and np.random.rand() < 0.6:
        hour = random.choice(list(range(18, 24)) + list(range(0, 6)))
    else:
        hour = random.randint(0, 23)
        
    record = {
        'Incident_ID': f"INC-{date.year}-{str(i+1).zfill(4)}",
        'Timestamp': date.isoformat(),
        'District': district,
        'Zone': 'WET', # Simplified
        'Incident_Type': incident,
        'Severity_Level': {'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}[label],
        'Priority_Label': label,
        'Affected_Population': affected,
        'Casualties': int(affected * np.random.uniform(0.01, 0.1)) if label in ['CRITICAL', 'HIGH'] else 0,
        'Required_Resources': 'Rescue Teams|Medical Kits',
        'Response_Time_Mins': random.randint(15, 120),
        'Status': 'RESOLVED',
        'Reported_By': 'CITIZEN',
        'Report_Channel': 'MOBILE_APP',
        'Report_Language': random.choice(['SINHALA', 'ENGLISH', 'TAMIL']),
        'Weather_Condition': 'RAIN',
        'Has_Photo_Evidence': has_photo,
        'Has_Video_Evidence': has_video,
        'Offline_Submission': False,
        'Is_Verified': True,
        'Verified_By': 'OFFICER-01',
        'Volunteers_Dispatched': random.randint(0, 10),
        'Tasks_Created': random.randint(0, 5),
        'Tasks_Completed': random.randint(0, 5),
        'Relief_Tokens_Issued': random.randint(0, 100),
        'Psych_Support_Needed': False,
        'Damage_Category': 'MODERATE',
        'Estimated_Loss_LKR': 0,
        'Is_Monsoon_Season': True,
        'Month': date.month,
        'Hour_Of_Day': hour,
        'Day_Of_Week': date.weekday(),
        'Has_Children': has_children,
        'Has_Elderly': has_elderly,
        'Has_Disabled': has_disabled
    }
    records.append(record)

df = pd.DataFrame(records)
df.to_csv('d:/Suraksha - Web App/scratch/suraksha_dmc_dataset_v3.csv', index=False)
print(f"Generated v3 dataset with {len(df)} records at d:/Suraksha - Web App/scratch/suraksha_dmc_dataset_v3.csv")
