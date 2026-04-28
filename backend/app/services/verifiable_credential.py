import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from jose import jws
import uuid

class VerifiableCredentialService:
    """
    Issues and verifies W3C Verifiable Credentials for certified fair models.
    """
    
    def __init__(self):
        # Generate issuer keys (in production, these would be properly managed)
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
        self.issuer_did = "did:web:equitwin.dev"
        
    def issue_credential(self, 
                        model_hash: str,
                        fairness_score: float,
                        dataset_fingerprint: str,
                        analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Issue a W3C Verifiable Credential for a certified model.
        
        Args:
            model_hash: SHA-256 hash of the model
            fairness_score: Final fairness fitness score
            dataset_fingerprint: Hash of the dataset used
            analysis_results: Full analysis results
            
        Returns:
            Signed W3C Verifiable Credential
        """
        credential_id = f"urn:uuid:{uuid.uuid4()}"
        
        # Build the credential
        credential = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://equitwin.dev/credentials/v1"
            ],
            "id": credential_id,
            "type": ["VerifiableCredential", "EquiTwinFairnessCertification"],
            "issuer": {
                "id": self.issuer_did,
                "name": "EquiTwin Fairness Gymnasium"
            },
            "issuanceDate": datetime.now(timezone.utc).isoformat(),
            "credentialSubject": {
                "id": f"model:sha256:{model_hash}",
                "type": "MachineLearningModel",
                "fairnessFitnessScore": fairness_score,
                "certificationLevel": self._determine_level(fairness_score),
                "datasetFingerprint": dataset_fingerprint,
                "metrics": {
                    "demographicParity": analysis_results.get("demographic_parity", {}).get("score", 0),
                    "equalizedOdds": analysis_results.get("equalized_odds", {}).get("score", 0),
                    "disparateImpact": analysis_results.get("disparate_impact", {}).get("score", 0)
                },
                "standardsCompliance": [
                    "W3C Verifiable Credentials Data Model v1.1",
                    "EU AI Act Article 10(2)(f)",
                    "IEEE 7000-2021"
                ]
            },
            "proof": None  # Will be filled after signing
        }
        
        # Sign the credential
        signed_credential = self._sign_credential(credential)
        
        return {
            "credential_id": credential_id,
            "signed_credential": signed_credential,
            "verification_method": f"{self.issuer_did}#key-1",
            "issued_at": datetime.now(timezone.utc).isoformat()
        }
    
    def _sign_credential(self, credential: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cryptographically sign the credential.
        """
        # Create the payload to sign
        payload = json.dumps({
            "id": credential["id"],
            "issuer": credential["issuer"],
            "issuanceDate": credential["issuanceDate"],
            "credentialSubject": credential["credentialSubject"]
        }, sort_keys=True)
        
        # Sign with RSA
        signature = self.private_key.sign(
            payload.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        # Add proof to credential
        credential["proof"] = {
            "type": "RsaSignature2018",
            "created": datetime.now(timezone.utc).isoformat(),
            "verificationMethod": f"{self.issuer_did}#key-1",
            "proofPurpose": "assertionMethod",
            "jws": signature.hex()
        }
        
        return credential
    
    def verify_credential(self, credential: Dict[str, Any]) -> bool:
        """
        Verify a signed credential.
        """
        try:
            if "proof" not in credential:
                return False
            
            proof = credential["proof"]
            signature = bytes.fromhex(proof["jws"])
            
            # Recreate the payload
            payload = json.dumps({
                "id": credential["id"],
                "issuer": credential["issuer"],
                "issuanceDate": credential["issuanceDate"],
                "credentialSubject": credential["credentialSubject"]
            }, sort_keys=True)
            
            # Verify signature
            self.public_key.verify(
                signature,
                payload.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            # Check expiration (if present)
            if "expirationDate" in credential:
                exp_date = datetime.fromisoformat(credential["expirationDate"])
                if datetime.now(timezone.utc) > exp_date:
                    return False
            
            return True
            
        except Exception as e:
            print(f"Credential verification failed: {str(e)}")
            return False
    
    def _determine_level(self, fairness_score: float) -> str:
        """Determine certification level based on fairness score"""
        if fairness_score >= 0.95:
            return "Platinum"
        elif fairness_score >= 0.90:
            return "Gold"
        elif fairness_score >= 0.80:
            return "Silver"
        else:
            return "Bronze"
    
    def generate_verification_url(self, credential_id: str) -> str:
        """Generate a verification URL for the credential"""
        return f"https://equitwin.dev/verify/{credential_id}"