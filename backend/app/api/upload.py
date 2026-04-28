from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import os
import uuid
from ..config import settings
from ..models.schemas import UploadResponse, AnalysisStatus
from ..models.database import db
from ..utils.helpers import generate_task_id, validate_dataset, smart_read_file

router = APIRouter()

ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.data', '.txt', '.dat'}

@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    target_column: str = Form(None),
):
    """Upload a dataset file for fairness analysis."""
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: CSV, XLSX, DATA, TXT"
        )
    
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 100MB)")
    
    task_id = generate_task_id()
    file_path = os.path.join(settings.UPLOAD_DIR, f"{task_id}{file_ext}")
    
    with open(file_path, 'wb') as f:
        f.write(contents)
    
    print(f"\n{'='*50}")
    print(f"UPLOAD: {file.filename}")
    print(f"User typed target column: '{target_column}'")
    
    try:
        # Smart file reading
        df = smart_read_file(file_path)
        
        if df is None or df.empty:
            raise ValueError("Could not read file")
        
        if df.shape[1] <= 1:
            raise ValueError(f"File has only {df.shape[1]} column")
        
        # Clean column names
        df.columns = [str(col).strip().lower().replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '') 
                      for col in df.columns]
        
        # Drop bad columns
        df = df.dropna(axis=1, how='all')
        for col in list(df.columns):
            if df[col].nunique() <= 1:
                df = df.drop(columns=[col])
        
        print(f"Available columns: {list(df.columns)}")
        
        # Validate dataset
        dataset_info = validate_dataset(df)
        
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # =============================================
    # HANDLE TARGET COLUMN - PRIORITY TO USER INPUT
    # =============================================
    user_target = target_column.strip().lower() if target_column else None
    
    if user_target:
        # USER specified a target column - try to match it
        matched = None
        
        # Exact match
        for col in df.columns:
            if col.lower() == user_target:
                matched = col
                break
        
        # Partial match
        if not matched:
            for col in df.columns:
                if user_target in col.lower():
                    matched = col
                    break
        
        if matched:
            target_column = matched
            print(f"✓ Matched user target: '{target_column}'")
        else:
            # User's target not found - show error
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail=f"Column '{target_column}' not found! Available columns: {', '.join(df.columns)}"
            )
    else:
        # No user target - auto detect income/target/class
        target_candidates = ['income', 'target', 'class', 'label', 'y', 'credit_risk', 'default']
        found = False
        for candidate in target_candidates:
            for col in df.columns:
                if candidate in col.lower():
                    target_column = col
                    found = True
                    print(f"✓ Auto-detected target: '{target_column}'")
                    break
            if found:
                break
        
        if not found:
            target_column = df.columns[-1]
            print(f"⚠ Using last column: '{target_column}'")
    
    # Store task
    task_data = {
        "task_id": task_id,
        "filename": file.filename,
        "file_size": len(contents),
        "file_type": file_ext,
        "columns": df.columns.tolist(),
        "target_column": target_column,
        "sensitive_columns": dataset_info.get("detected_sensitive_columns", []),
        "status": AnalysisStatus.PENDING,
        "message": f"Ready. Target: '{target_column}'"
    }
    
    db.create_task(task_id, task_data)
    
    print(f"✓ Task {task_id[:8]}... created with target='{target_column}'")
    print(f"{'='*50}\n")
    
    return UploadResponse(
        task_id=task_id,
        filename=file.filename,
        file_size=len(contents),
        columns=df.columns.tolist(),
        status=AnalysisStatus.PENDING,
        message=f"Loaded {len(df)} rows, {df.shape[1]} columns. Target column: '{target_column}'"
    )