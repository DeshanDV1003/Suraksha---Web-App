import pdfplumber
import sys

pdf_path = sys.argv[1]

print(f"Reading {pdf_path}...")
with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        print(f"Page {i+1}: Found {len(tables)} tables")
        for j, table in enumerate(tables):
            print(f"  Table {j+1}:")
            for row in table[:5]: # Print first 5 rows
                print(f"    {row}")
            if len(table) > 5:
                print(f"    ... and {len(table) - 5} more rows")
