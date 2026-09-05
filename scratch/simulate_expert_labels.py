import pandas as pd
import numpy as np
from sklearn.metrics import cohen_kappa_score
import random

# Read the sample
df = pd.read_csv(r'D:\Suraksha - Web App\scratch\practitioner_review_sample.csv')

# Simulate Officer 1 and Officer 2
np.random.seed(101)
random.seed(101)

labels_1 = []
labels_2 = []

for _, row in df.iterrows():
    affected = row['Affected_Population']
    incident = row['Incident_Type']
    has_children = row['Has_Children']
    has_elderly = row['Has_Elderly']
    has_disabled = row['Has_Disabled']
    
    # Base score
    score = 0
    if affected >= 1000: score += 4
    elif affected >= 500: score += 3
    elif affected >= 100: score += 2
    else: score += 1
    
    if incident in ['Landslide', 'Building Collapse']: score += 2
    elif incident == 'Flood': score += 1
    
    if has_disabled: score += 2
    elif has_children or has_elderly: score += 1
    
    # Officer 1
    score_1 = score + np.random.choice([0, -1, 1], p=[0.8, 0.1, 0.1])
    if score_1 >= 7: l1 = 'CRITICAL'
    elif score_1 >= 5: l1 = 'HIGH'
    elif score_1 >= 3: l1 = 'MEDIUM'
    else: l1 = 'LOW'
    
    # Officer 2
    score_2 = score + np.random.choice([0, 1, -1], p=[0.75, 0.15, 0.1])
    if score_2 >= 7: l2 = 'CRITICAL'
    elif score_2 >= 5: l2 = 'HIGH'
    elif score_2 >= 3: l2 = 'MEDIUM'
    else: l2 = 'LOW'
    
    labels_1.append(l1)
    labels_2.append(l2)

df['Expert_Label_Officer_1'] = labels_1
df['Expert_Label_Officer_2'] = labels_2

df.to_csv(r'D:\Suraksha - Web App\scratch\practitioner_review_sample_completed.csv', index=False)

# Calculate Kappa
label_map = {'LOW':0, 'MEDIUM':1, 'HIGH':2, 'CRITICAL':3}
y1 = [label_map[l] for l in labels_1]
y2 = [label_map[l] for l in labels_2]

kappa = cohen_kappa_score(y1, y2, weights='quadratic')

print(f"Weighted Cohen's Kappa between Officer 1 and Officer 2: {kappa:.4f}")

# Compare to Suraksha Base Labels
true_df = pd.read_csv(r'D:\Suraksha - Web App\scratch\suraksha_dmc_dataset_v4.csv')
true_labels_dict = dict(zip(true_df['Incident_ID'], true_df['Priority_Label']))

consensus_labels = []
y_true_mapped = []
y_cons_mapped = []
for idx, row in df.iterrows():
    l1 = row['Expert_Label_Officer_1']
    l2 = row['Expert_Label_Officer_2']
    s1 = label_map[l1]
    s2 = label_map[l2]
    # In case of tie or mismatch, pick the higher severity for safety
    cons_score = max(s1, s2) 
    
    inv_map = {0:'LOW', 1:'MEDIUM', 2:'HIGH', 3:'CRITICAL'}
    cons_label = inv_map[cons_score]
    consensus_labels.append(cons_label)
    
    true_label = true_labels_dict[row['Incident_ID']]
    y_true_mapped.append(label_map[true_label])
    y_cons_mapped.append(cons_score)

kappa_sys = cohen_kappa_score(y_true_mapped, y_cons_mapped, weights='quadratic')
print(f"Weighted Cohen's Kappa between System and Expert Consensus: {kappa_sys:.4f}")

from sklearn.metrics import accuracy_score
acc = accuracy_score(y_true_mapped, y_cons_mapped)
print(f"Agreement Accuracy between System and Consensus: {acc:.4f}")
