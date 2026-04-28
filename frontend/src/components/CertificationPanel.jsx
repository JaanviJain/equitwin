import React, { useState } from 'react';
import { certifyModel } from '../utils/api';

export default function CertificationPanel({ taskId, metrics }) {
  const [isCertifying, setIsCertifying] = useState(false);
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState(null);

  const handleCertify = async () => {
    setIsCertifying(true);
    setError(null);
    
    try {
      // Generate a model hash (in production, this would be the actual model hash)
      const modelHash = `sha256:${taskId}:${Date.now()}`;
      
      const result = await certifyModel(taskId, modelHash);
      setCredential(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Certification failed');
    } finally {
      setIsCertifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {!credential ? (
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Issue Verifiable Credential</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Generate a cryptographically signed W3C Verifiable Credential 
              proving your model has passed the EquiTwin Fairness Gymnasium.
            </p>
          </div>

          {metrics.overall_fairness_score < 0.6 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              Your fairness score is below the recommended threshold. 
              Consider running more training epochs.
            </div>
          )}

          <button
            onClick={handleCertify}
            disabled={isCertifying}
            className="btn-primary"
          >
            {isCertifying ? 'Issuing Credential...' : 'Certify Model'}
          </button>

          {error && (
            <p className="text-red-600 text-sm mt-4">{error}</p>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-800">Model Certified</h3>
            <p className="text-sm text-slate-600 mt-1">
              Credential ID: {credential.credential_id?.slice(0, 16)}...
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium mb-2">Credential Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Issuer</span>
                <span className="font-mono">EquiTwin Fairness Gymnasium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issued</span>
                <span className="font-mono">
                  {new Date(credential.issued_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification URL</span>
                <a 
                  href={credential.verification_url}
                  className="text-blue-600 hover:underline font-mono text-xs truncate max-w-[200px]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {credential.verification_url}
                </a>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify(credential.signed_credential, null, 2)],
                  { type: 'application/json' }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `equitwin-credential-${credential.credential_id.slice(0, 8)}.json`;
                a.click();
              }}
              className="btn-secondary flex-1 text-sm"
            >
              Download Credential
            </button>
            <button
              onClick={() => setCredential(null)}
              className="btn-secondary text-sm"
            >
              Issue New
            </button>
          </div>
        </div>
      )}

      {/* W3C Standard Info */}
      <div className="card">
        <h4 className="text-sm font-semibold mb-2">About Verifiable Credentials</h4>
        <p className="text-sm text-slate-600">
          EquiTwin issues W3C-compliant Verifiable Credentials that can be independently 
          verified without contacting our servers. This provides cryptographic proof 
          that your model has been tested and certified for fairness.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="text-xs bg-slate-100 px-2 py-1 rounded">W3C VC v1.1</span>
          <span className="text-xs bg-slate-100 px-2 py-1 rounded">RSA-SHA256</span>
          <span className="text-xs bg-slate-100 px-2 py-1 rounded">DID:WEB</span>
        </div>
      </div>
    </div>
  );
}