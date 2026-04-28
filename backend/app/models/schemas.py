from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class CausalPathway(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    pathway: List[Dict[str, str]]
    effect_size: float
    is_biased: bool
    bias_type: Optional[str] = None
    regulatory_concern: Optional[str] = None

class FairnessMetrics(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    demographic_parity: float = 0.0
    equalized_odds: float = 0.0
    counterfactual_fairness: float = 0.0
    causal_pathway_bias: float = 0.0
    overall_fairness_score: float = 0.0

class AnalysisResult(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    task_id: str
    status: AnalysisStatus
    dataset_info: Dict[str, Any] = {}
    causal_graph: Dict[str, Any] = {}
    biased_pathways: List[CausalPathway] = []
    fairness_metrics: FairnessMetrics = FairnessMetrics()
    remediation_results: Optional[Dict[str, Any]] = None
    credential: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class UploadResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    task_id: str
    filename: str
    file_size: int
    columns: List[str]
    status: AnalysisStatus
    message: str

class CertificationRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    task_id: str
    model_hash: str
    model_type: str = "sklearn"

class CertificationResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    credential_id: str
    signed_credential: Dict[str, Any]
    verification_url: str
    issued_at: str