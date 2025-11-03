# -*- coding: utf-8 -*-
import pandas as pd
import sys

try:
    # Read Excel file
    excel_file = r'C:\Users\virgi\BOR.xlsx'

    # Get all sheet names
    xls = pd.ExcelFile(excel_file)
    print(f"Excel bestand: {excel_file}")
    print(f"Aantal sheets: {len(xls.sheet_names)}")
    print(f"Sheet namen: {xls.sheet_names}\n")

    # Process each sheet
    for sheet_name in xls.sheet_names:
        print(f"\n{'='*80}")
        print(f"SHEET: '{sheet_name}'")
        print(f"{'='*80}")

        df = pd.read_excel(excel_file, sheet_name=sheet_name)

        print(f"\nAantal rijen: {len(df)}")
        print(f"Aantal kolommen: {len(df.columns)}")
        print(f"\nKolomnamen:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i}. {col}")

        print(f"\nEerste 3 rijen als voorbeeld:")
        print(df.head(3).to_string())

        print(f"\nEerste rij als dictionary:")
        if len(df) > 0:
            first_row = df.iloc[0].to_dict()
            for key, value in first_row.items():
                print(f"  '{key}': {repr(value)}")

        print("\n")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
