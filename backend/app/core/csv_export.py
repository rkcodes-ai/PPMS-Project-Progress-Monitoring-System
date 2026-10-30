import csv
import io
from typing import List, Dict, Any
from fastapi import Response

def sanitize_csv_value(val: Any) -> str:
    """
    Sanitizes values against spreadsheet formula injection (CSV Injection).
    If a string starts with =, +, -, @, tab, or carriage return, prepends a single quote.
    """
    if val is None:
        return ""
    
    val_str = str(val)
    if val_str and val_str[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{val_str}"
    return val_str

def generate_csv_response(
    rows: List[Dict[str, Any]], 
    fieldnames: List[str], 
    filename: str
) -> Response:
    """
    Generates a secure, formula-safe CSV response with proper HTTP headers.
    """
    output = io.StringIO()
    writer = csv.DictWriter(
        output, 
        fieldnames=fieldnames, 
        quoting=csv.QUOTE_MINIMAL,
        lineterminator="\r\n"
    )
    writer.writeheader()
    
    for row in rows:
        sanitized_row = {
            k: sanitize_csv_value(row.get(k, ""))
            for k in fieldnames
        }
        writer.writerow(sanitized_row)
        
    csv_content = output.getvalue()
    
    # Safe filename with non-alphanumeric replacements
    safe_filename = "".join(c if c.isalnum() or c in ("-", "_", ".") else "_" for c in filename)
    if not safe_filename.endswith(".csv"):
        safe_filename += ".csv"
        
    return Response(
        content=csv_content.encode("utf-8-sig"),  # UTF-8 BOM for seamless Excel compatibility
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )
