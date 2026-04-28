import uuid
import hashlib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
import os

def generate_task_id() -> str:
    return str(uuid.uuid4())

def hash_model(model_bytes: bytes) -> str:
    return hashlib.sha256(model_bytes).hexdigest()

# Known dataset schemas
ADULT_COLUMNS = [
    'age', 'workclass', 'fnlwgt', 'education', 'education_num',
    'marital_status', 'occupation', 'relationship', 'race', 'sex',
    'capital_gain', 'capital_loss', 'hours_per_week', 'native_country', 'income'
]

GERMAN_COLUMNS = [
    'existing_checking', 'duration', 'credit_history', 'purpose', 'credit_amount',
    'savings', 'employment_since', 'installment_rate', 'personal_status', 'other_debtors',
    'residence_since', 'property', 'age', 'other_installment', 'housing',
    'existing_credits', 'job', 'num_dependents', 'telephone', 'foreign_worker', 'credit_risk'
]

def smart_read_file(file_path: str) -> pd.DataFrame:
    """Smart file reader with known dataset schema detection."""
    
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext in ['.xlsx', '.xls']:
        return pd.read_excel(file_path, engine='openpyxl')
    
    # Read raw text
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        raw_text = f.read()
    
    lines = raw_text.strip().split('\n')
    if len(lines) < 2:
        raise ValueError("File too short")
    
    first_line = lines[0].strip()
    
    # Detect delimiter
    delimiters = [',', ';', '\t', '|']
    best_delim = ','
    best_count = 0
    
    for delim in delimiters:
        count = len(first_line.split(delim))
        if count > 1:
            if count > best_count:
                best_count = count
                best_delim = delim
    
    if best_count <= 1:
        space_count = len(first_line.split())
        if space_count > 1:
            best_delim = ' '
            best_count = space_count
    
    print(f"Detected: delimiter='{best_delim}', fields={best_count}")
    
    # Check if first line is a header or data
    first_fields = [f.strip().strip('"').strip("'") for f in first_line.split(best_delim)]
    
    # Try to see if first field is a number (likely data, not header)
    first_field_is_number = False
    try:
        float(first_fields[0])
        first_field_is_number = True
    except:
        pass
    
    # Check for known datasets by field count
    is_adult = (best_count == 15)
    is_german = (best_count == 21)
    
    if first_field_is_number:
        # NO HEADER - first row is data
        print("First field is numeric → NO HEADER detected")
        
        if is_adult:
            df = pd.read_csv(file_path, header=None, names=ADULT_COLUMNS,
                           na_values=['?', 'NA', ''], skipinitialspace=True)
            print("→ Applied UCI Adult column names")
        elif is_german:
            df = pd.read_csv(file_path, header=None, names=GERMAN_COLUMNS, sep=best_delim,
                           na_values=['?', 'NA', ''], skipinitialspace=True)
            print("→ Applied German Credit column names")
        else:
            df = pd.read_csv(file_path, header=None, sep=best_delim,
                           na_values=['?', 'NA', ''], skipinitialspace=True)
            df.columns = [f'feature_{i}' for i in range(df.shape[1] - 1)] + ['target']
            print(f"→ Applied generic names for {df.shape[1]} columns")
    else:
        # HAS HEADER
        print("First field is text → HEADER detected")
        df = pd.read_csv(file_path, sep=best_delim,
                       na_values=['?', 'NA', ''], skipinitialspace=True)
    
    # Clean column names
    df.columns = [str(c).strip().lower().replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '') 
                  for c in df.columns]
    
    # SPECIAL: Clean Adult income column
    if 'income' in df.columns:
        df['income'] = df['income'].astype(str).str.strip().str.rstrip('.')
        df['income'] = df['income'].map({'<=50K': 0, '>50K': 1, '<=50k': 0, '>50k': 1})
        df = df.dropna(subset=['income'])
        df['income'] = df['income'].astype(int)
    
    # SPECIAL: Clean German Credit target
    if 'credit_risk' in df.columns:
        df['credit_risk'] = df['credit_risk'].astype(str).str.strip()
        df['credit_risk'] = df['credit_risk'].map({'good': 1, 'bad': 0, '1': 1, '0': 0, '2': 0})
        df = df.dropna(subset=['credit_risk'])
        df['credit_risk'] = df['credit_risk'].astype(int)
    
    # Drop fully empty columns
    df = df.dropna(axis=1, how='all')
    
    print(f"Final: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"Columns: {list(df.columns)}")
    
    return df


def validate_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """Validate and detect sensitive columns."""
    
    df.columns = [str(c).strip().lower().replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '') 
                  for c in df.columns]
    
    df = df.dropna(axis=1, how='all')
    for col in list(df.columns):
        if df[col].nunique() <= 1:
            df = df.drop(columns=[col])
    
    # Fill missing
    for col in df.columns:
        if df[col].isnull().sum() > 0:
            if df[col].dtype in ['int64', 'float64', 'int32', 'float32']:
                df[col] = df[col].fillna(df[col].median())
            else:
                mode_vals = df[col].mode()
                df[col] = df[col].fillna(mode_vals[0] if len(mode_vals) > 0 else 'unknown')
    
    # Known sensitive columns for Adult dataset
    known_sensitive = {
        'adult': ['sex', 'race', 'marital_status', 'relationship', 'native_country', 'age'],
        'german': ['age', 'sex', 'personal_status', 'foreign_worker']
    }
    
    detected = []
    columns_lower = [c.lower() for c in df.columns]
    
    # Check Adult schema
    if 'income' in columns_lower and 'education' in columns_lower:
        for col in known_sensitive['adult']:
            if col in columns_lower:
                detected.append(df.columns[columns_lower.index(col)])
    
    # Check German schema  
    elif 'credit_risk' in columns_lower:
        for col in known_sensitive['german']:
            matches = [c for c in df.columns if col in c.lower()]
            detected.extend(matches)
    
    # Generic detection
    if not detected:
        sensitive_keywords = ['sex', 'gender', 'race', 'ethnicity', 'marital', 'age', 'religion']
        for col in df.columns:
            for keyword in sensitive_keywords:
                if keyword in col.lower():
                    detected.append(col)
                    break
    
    detected = list(set(detected))
    
    # Remove target from sensitive
    for target_name in ['income', 'credit_risk', 'target', 'label']:
        if target_name in [d.lower() for d in detected]:
            detected = [d for d in detected if d.lower() != target_name]
    
    print(f"Sensitive columns: {detected}")
    
    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "dtypes": {str(k): str(v) for k, v in df.dtypes.items()},
        "numeric_columns": df.select_dtypes(include=[np.number]).columns.tolist(),
        "categorical_columns": df.select_dtypes(include=['object', 'category']).columns.tolist(),
        "detected_sensitive_columns": detected,
        "memory_usage_mb": 0,
        "issues": [],
        "warnings": []
    }


def preprocess_dataset(df: pd.DataFrame, target_col: str = None, 
                       sensitive_cols: List[str] = None) -> pd.DataFrame:
    """Preprocess for analysis."""
    processed = df.copy()
    
    if sensitive_cols is None:
        sensitive_cols = []
    
    if target_col and target_col in processed.columns:
        processed = processed.dropna(subset=[target_col])
    
    # Encode target (already done for income/credit_risk in smart_read_file)
    if target_col and target_col in processed.columns:
        if processed[target_col].dtype == 'object':
            unique_vals = processed[target_col].unique()
            if len(unique_vals) == 2:
                processed[target_col] = (processed[target_col] == unique_vals[1]).astype(int)
            else:
                processed[target_col] = pd.factorize(processed[target_col])[0]
    
    # Encode categorical features
    for col in processed.columns:
        if col == target_col:
            continue
        if processed[col].dtype == 'object':
            processed[col] = pd.factorize(processed[col])[0]
    
    processed = processed.fillna(0)
    
    return processed