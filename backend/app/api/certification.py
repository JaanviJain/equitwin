from fastapi import APIRouter, HTTPException
from ..models.schemas import CertificationRequest, CertificationResponse
from ..models.database import db
from ..services.verifiable_credential import VerifiableCredentialService
from ..utils.helpers import hash_model
import hashlib

router = APIRouter()

@router.post("/certify", response_model=CertificationResponse)
async def certify_model(request: CertificationRequest):
    """
    Issue a Verifiable Credential for a certified model.
    """
    # Get analysis results
    task = db.get_task(request.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.get("status") != "completed":
        raise HTTPException(
            status_code=400, 
            detail="Analysis must be completed before certification"
        )
    
    results = task.get("results", {})
    
    # Create dataset fingerprint
    dataset_fingerprint = hashlib.sha256(
        str(results.get("dataset_info", {})).encode()
    ).hexdigest()
    
    # Issue credential
    vc_service = VerifiableCredentialService()
    
    credential = vc_service.issue_credential(
        model_hash=request.model_hash,
        fairness_score=results.get("fairness_metrics", {}).get("overall_fairness_score", 0),
        dataset_fingerprint=dataset_fingerprint,
        analysis_results=results.get("fairness_metrics", {})
    )
    
    # Store credential
    db.store_credential(credential["credential_id"], credential)
    
    return CertificationResponse(
        credential_id=credential["credential_id"],
        signed_credential=credential["signed_credential"],
        verification_url=vc_service.generate_verification_url(credential["credential_id"]),
        issued_at=credential["issued_at"]
    )

@router.get("/verify/{credential_id}")
async def verify_credential(credential_id: str):
    """
    Verify a previously issued credential.
    """
    credential_data = db.get_credential(credential_id)
    if not credential_data:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    vc_service = VerifiableCredentialService()
    is_valid = vc_service.verify_credential(credential_data["signed_credential"])
    
    return {
        "credential_id": credential_id,
        "is_valid": is_valid,
        "credential": credential_data["signed_credential"] if is_valid else None
    }