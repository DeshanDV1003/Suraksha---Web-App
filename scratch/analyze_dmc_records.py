import os
import glob
import pandas as pd
import json

base_dir = r"D:\Suraksha - Web App\DMC Records"

print("--- 1. DIRECTORY STRUCTURE & FILE COUNTS ---")
subdirs = ["River Water Level", "Situation Reports", "Weather Reports"]

dir_stats = {}
total_files = 0
total_bytes = 0

for root, dirs, files in os.walk(base_dir):
    rel_path = os.path.relpath(root, base_dir)
    count = len(files)
    size = sum(os.path.getsize(os.path.join(root, f)) for f in files)
    dir_stats[rel_path] = {"file_count": count, "size_mb": round(size / (1024*1024), 2)}
    total_files += count
    total_bytes += size

print(json.dumps(dir_stats, indent=2))
print(f"Total files in DMC Records: {total_files}")
print(f"Total size: {round(total_bytes / (1024*1024), 2)} MB")

print("\n--- 2. ANALYZING EXCEL FILE (DI_report105745.xls) ---")
xls_path = os.path.join(base_dir, "DI_report105745.xls")
if os.path.exists(xls_path):
    try:
        # Read excel
        df = pd.read_excel(xls_path)
        print(f"Excel Shape: {df.shape} (Rows: {len(df)}, Columns: {len(df.columns)})")
        print("Columns list:")
        for col in df.columns:
            print("  -", col)
            
        print("\nSample values summary:")
        print(df.head(3).to_dict(orient="records"))
        
        # Check non-null counts
        print("\nColumn summary:")
        print(df.describe(include='all').T[['count', 'unique', 'top', 'freq']])
        
    except Exception as e:
        print("Error reading XLS file:", e)

print("\n--- 3. PDF FILENAME PATTERN ANALYSIS ---")
for sdir in subdirs:
    sdir_path = os.path.join(base_dir, sdir)
    if os.path.exists(sdir_path):
        pdfs = glob.glob(os.path.join(sdir_path, "*.pdf"))
        print(f"\nFolder: '{sdir}' ({len(pdfs)} PDFs)")
        # Sample first 5 and last 5 filenames
        sample = [os.path.basename(p) for p in pdfs[:5]] + ["..."] + [os.path.basename(p) for p in pdfs[-5:]]
        print("  Sample files:", sample)
