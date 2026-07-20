import os
import glob
import pdfplumber
import pandas as pd
import numpy as np
import datetime
import re

PDF_DIR = os.path.join(os.path.dirname(__file__), 'dmc_data')
OUT_BASE_EXCEL = os.path.join(os.path.dirname(__file__), 'dmc_extracted_base_data.xlsx')
OUT_1YR_CSV = os.path.join(os.path.dirname(__file__), 'synthetic_flood_dataset_real_stations.csv')

def clean_text(text):
    if not text:
        return ""
    # Remove newlines and excess spaces
    text = re.sub(r'\s+', ' ', str(text)).strip()
    if text in ["-", "NA", ""]:
        return None
    return text

def parse_float(val):
    if val is None:
        return np.nan
    try:
        # Some numbers have commas or spaces
        clean = str(val).replace(',', '').replace(' ', '')
        return float(clean)
    except:
        return np.nan

def extract_dmc_data():
    all_stations = []
    
    pdf_files = glob.glob(os.path.join(PDF_DIR, 'Water_level_*.pdf'))
    if not pdf_files:
        print("No PDF files found.")
        return pd.DataFrame()
        
    print(f"Found {len(pdf_files)} PDF files. Processing...")
    
    # Just take the first valid PDF to extract the baseline static station info
    # (since the stations and threshold levels don't change between days)
    pdf_path = pdf_files[0]
    print(f"Extracting baseline stations from {os.path.basename(pdf_path)}...")
    
    with pdfplumber.open(pdf_path) as pdf:
        # Usually river gauge data is on the first page
        page = pdf.pages[0]
        tables = page.extract_tables()
        if not tables:
            return pd.DataFrame()
            
        main_table = tables[0]
        
        current_river = "Unknown"
        
        for row in main_table:
            if len(row) < 7:
                continue
                
            # Column mapping based on observation:
            # 0: River Basin (often merged/empty for subsequent rows)
            # 1: Tributary/River (often merged)
            # 2: Gauging Station
            # 3: Unit (ft/m)
            # 4: Alert Level
            # 5: Minor Flood
            # 6: Major Flood
            
            river_col = clean_text(row[1])
            if river_col:
                current_river = river_col
                
            station = clean_text(row[2])
            unit = clean_text(row[3])
            
            # Skip header rows
            if station and "Station" in station:
                continue
            
            # If there's no station name, skip
            if not station:
                continue
                
            alert_lvl = parse_float(clean_text(row[4]))
            minor_lvl = parse_float(clean_text(row[5]))
            major_lvl = parse_float(clean_text(row[6]))
            
            # We only care about rows that have actual thresholds
            if pd.isna(alert_lvl) or pd.isna(major_lvl):
                continue
                
            # Convert ft to meters if necessary
            conversion_factor = 0.3048 if (unit and 'ft' in unit.lower()) else 1.0
            
            all_stations.append({
                'riverName': current_river,
                'stationName': station,
                'watch_threshold_m': round(alert_lvl * conversion_factor, 2),
                'warning_threshold_m': round(minor_lvl * conversion_factor, 2),
                'critical_threshold_m': round(major_lvl * conversion_factor, 2)
            })

    # Drop duplicates in case of spanning rows
    df = pd.DataFrame(all_stations).drop_duplicates(subset=['stationName'])
    return df

def generate_1yr_data_for_real_stations(base_df, hours=8760):
    print(f"Generating {hours} hours of simulated data grounded on {len(base_df)} real DMC stations...")
    
    start_date = datetime.datetime.now() - datetime.timedelta(hours=hours)
    timestamps = [start_date + datetime.timedelta(hours=i) for i in range(hours)]
    
    all_data = []
    
    # We will generate a shared climate profile for the whole country first
    # to simulate monsoons
    months = np.array([t.month for t in timestamps])
    
    # Monsoon seasons: May-Sep (Southwest) and Nov-Jan (Northeast)
    is_monsoon = np.isin(months, [5, 6, 7, 8, 9, 11, 12, 1])
    
    # Generate base rainfall events
    base_rain = np.where(
        is_monsoon,
        np.random.choice([0, 0, 0, 5, 15, 30, 60, 100], size=hours, p=[0.6, 0.2, 0.05, 0.05, 0.04, 0.03, 0.02, 0.01]),
        np.random.choice([0, 0, 0, 5, 10, 20], size=hours, p=[0.8, 0.1, 0.05, 0.03, 0.01, 0.01])
    )
    
    for _, station in base_df.iterrows():
        river = station['riverName']
        station_name = station['stationName']
        watch = station['watch_threshold_m']
        warning = station['warning_threshold_m']
        critical = station['critical_threshold_m']
        
        # Add some localized randomness to rain
        local_rain = base_rain * np.random.uniform(0.5, 1.5, size=hours)
        local_rain = np.clip(local_rain, 0, 150)
        
        water_levels = np.zeros(hours)
        
        # Base water level is typically 20-30% of the watch threshold
        base_water = max(0.5, watch * 0.25)
        current_w = base_water
        
        for i in range(hours):
            # Natural fluctuation
            current_w += np.random.normal(0, 0.02)
            
            # Rain impact (delayed by a few hours)
            if i >= 3:
                recent_rain = local_rain[i-3:i].sum()
                if recent_rain > 50:
                    # Heavy rain causes spike
                    current_w += recent_rain * 0.015 * np.random.uniform(0.8, 1.2)
                elif recent_rain > 10:
                    current_w += recent_rain * 0.005
            
            # Gravity / Drainage - pull back to base level
            if current_w > base_water:
                current_w -= (current_w - base_water) * 0.08
                
            # Keep positive
            current_w = max(0.1, current_w)
            water_levels[i] = current_w
            
        # Create records
        for i in range(hours):
            all_data.append({
                'timestamp': timestamps[i].isoformat(),
                'month': months[i],
                'riverName': river,
                'stationName': station_name,
                'watch_threshold_m': watch,
                'warning_threshold_m': warning,
                'critical_threshold_m': critical,
                'rainfall_mm_hr': round(local_rain[i], 1),
                'rainfall_24h_total': round(local_rain[max(0, i-24):i].sum(), 1) if i > 0 else 0,
                'humidity_pct': round(np.random.uniform(60, 95), 1),
                'temp_c': round(np.random.uniform(22, 32), 1),
                'water_level_m': round(water_levels[i], 3)
            })
            
    return pd.DataFrame(all_data)


if __name__ == "__main__":
    print("--- Phase 1: Extracting Real DMC Baseline Data ---")
    base_df = extract_dmc_data()
    
    if base_df.empty:
        print("ERROR: Could not extract base stations. Exiting.")
        sys.exit(1)
        
    print(f"Successfully extracted {len(base_df)} stations.")
    print("Sample stations:")
    print(base_df.head())
    
    base_df.to_excel(OUT_BASE_EXCEL, index=False)
    print(f"Saved real extracted baseline data to {OUT_BASE_EXCEL}")
    
    print("\n--- Phase 2: Generating 1-Year Realistic Simulation ---")
    sim_df = generate_1yr_data_for_real_stations(base_df, hours=8760)
    
    sim_df.to_csv(OUT_1YR_CSV, index=False)
    print(f"Saved {len(sim_df)} simulated hourly records to {OUT_1YR_CSV}")
    print("\nProcess Complete!")
