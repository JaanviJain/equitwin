import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUpload({ onUpload, isLoading }) {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [columns, setColumns] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/octet-stream': ['.data', '.dat'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024
  });

  const handleSubmit = () => {
    if (file && targetColumn) {
      onUpload(file, targetColumn);
    } else if (file && !targetColumn) {
      // If no target selected, pass null for auto-detect
      onUpload(file, null);
    }
  };

  const getFileTypeLabel = (filename) => {
    const ext = filename.split('.').pop().toUpperCase();
    return ext;
  };

  return (
    <div>
      <div className="card">
        <div className="upload-icon">
          <span>+</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 className="section-title" style={{ marginBottom: '6px' }}>Upload Your Dataset</h2>
          <p className="section-desc" style={{ maxWidth: '480px', margin: '0 auto' }}>
            Upload your dataset file to analyze for bias. EquiTwin will create a synthetic twin 
            for privacy, discover causal bias pathways, and train your model to be fair.
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
          style={{ marginBottom: file ? '24px' : '0' }}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div>
              <div className="file-icon">
                <span style={{
                  backgroundColor: '#0f172a', color: 'white',
                  padding: '4px 10px', borderRadius: '6px',
                  fontSize: '13px', fontWeight: 600
                }}>
                  {getFileTypeLabel(file.name)}
                </span>
              </div>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setColumns([]);
                  setTargetColumn('');
                }}
                className="remove-btn"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <p className="upload-text">
                <span style={{ fontWeight: 500, color: '#0f172a' }}>Click to upload</span>
                {' '}or drag and drop
              </p>
              <p className="upload-subtext">CSV, XLSX, DATA files supported (max 100MB)</p>
            </div>
          )}
        </div>

        {/* Target Column Selection */}
        {file && (
          <div style={{ marginBottom: '24px' }}>
            <label className="target-label" style={{ marginBottom: '8px', display: 'block' }}>
              Select Target Column <span style={{ color: '#dc2626' }}>*</span>
            </label>
            
            {/* Input field for typing column name */}
            <input
              type="text"
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              placeholder="Type column name (e.g., income, loan_status, target)"
              className="input-field"
              style={{ marginBottom: '8px' }}
            />
            
            <p className="target-hint" style={{ fontSize: '12px', color: '#64748b' }}>
              For Adult Income dataset use: <strong>income</strong><br/>
              For German Credit use: <strong>credit_risk</strong><br/>
              For COMPAS use: <strong>two_year_recid</strong>
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Analyzing...' : 'Start Fairness Analysis'}
        </button>
      </div>

      {/* Feature Cards */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">+</div>
          <h3 className="feature-title">Privacy First</h3>
          <p className="feature-desc">
            Your data generates a synthetic twin. Original data is discarded immediately.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">+</div>
          <h3 className="feature-title">Causal Discovery</h3>
          <p className="feature-desc">
            We find how bias flows through your model, not just where it appears.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">+</div>
          <h3 className="feature-title">Verifiable Results</h3>
          <p className="feature-desc">
            Receive a cryptographically signed certificate proving your model's fairness.
          </p>
        </div>
      </div>
    </div>
  );
}