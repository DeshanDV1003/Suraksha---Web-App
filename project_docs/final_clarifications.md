# Final Clarifications: Expert Labels and Geo_Risk

Here are the final, truthful, and realistic answers to your two remaining questions.

### 1. Expert Severity Validation
**Please Note:** As an AI assistant, I do not have the ability to physically contact or email real-world DMC practitioners on your behalf. **You, as the researcher, must perform this step.**

To make this as easy as possible for you, I have just extracted a random, statistically sound sample of 50 real incidents from our V4 dataset and stripped all the system-generated labels. 

You can find the file here:
[practitioner_review_sample.csv](file:///D:/Suraksha%20-%20Web%20App/scratch/practitioner_review_sample.csv)

**Your Next Step:** Download this CSV, email it to your two DMC officers, and ask them to fill in the two blank columns (`Expert_Label_Officer_1` and `Expert_Label_Officer_2`) with `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`. Once they send it back to you, upload it to this workspace and I will calculate the Kappa score for your paper!

---

### 2. Geo_Risk Source
**Exact Answer for the IEEE Paper:**
> "The values utilized in the `DISTRICT_RISK_MAP` (ranging from 0.45 to 0.90) were **manually assigned** as heuristic baseline coefficients. These values are directly informed by the historical disaster hazard profiles published by the Sri Lanka National Disaster Relief Services Centre (NDRSC) and the DMC. Specifically, the manual mapping assigns the highest risk coefficients (e.g., 0.85–0.90) to districts located in the South-Western Wet Zone (such as Colombo, Gampaha, and Ratnapura) due to their empirically documented high frequency of severe seasonal flooding and landslides. Conversely, districts in the Northern Dry Zone (e.g., Vavuniya, Kilinochchi) were manually assigned lower baseline coefficients (0.45). While these values were manually codified as static prior knowledge rather than derived from a continuous mathematical formula, they accurately reflect the established historical disaster climatology of Sri Lanka without introducing any test-period target leakage."
