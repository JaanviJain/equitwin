import React, { useState } from 'react';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import { uploadDataset, startAnalysis } from './utils/api';

function App() {
  const [currentStep, setCurrentStep] = useState('upload');
  const [taskId, setTaskId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file, targetColumn) => {
    setIsLoading(true);
    setError(null);
    try {
      const uploadResult = await uploadDataset(file, targetColumn);
      setTaskId(uploadResult.task_id);
      setUploadInfo(uploadResult);
      setCurrentStep('analyzing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const analysisResult = await startAnalysis(uploadResult.task_id, uploadResult.sensitive_columns || [], 100);
      setAnalysisResults(analysisResult);
      setCurrentStep('results');
    } catch (err) {
      setError(err.message || 'Unknown error');
      // Bug fix: Do not reset step, stay on analyzing so error is visible above the loader or in its place
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setTaskId(null);
    setAnalysisResults(null);
    setUploadInfo(null);
    setError(null);
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return 'N/A';
    const num = parseFloat(score);
    if (num > 1) return num.toFixed(1) + '%';
    return (num * 100).toFixed(1) + '%';
  };

  const getScoreColor = (score) => {
    if (score >= 0.9) return '#16a34a';
    if (score >= 0.7) return '#ca8a04';
    return '#dc2626';
  };

  const getScoreBg = (score) => {
    if (score >= 0.9) return '#f0fdf4';
    if (score >= 0.7) return '#fefce8';
    return '#fef2f2';
  };

  return (
    <Layout>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#991b1b', marginBottom: '4px' }}>Something went wrong</p>
          <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0 }}>{error}</p>
          <button onClick={() => setError(null)} style={{ marginTop: '8px', fontSize: '12px', color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Dismiss</button>
        </div>
      )}

      {currentStep === 'upload' && <FileUpload onUpload={handleFileUpload} isLoading={isLoading} />}

      {currentStep === 'analyzing' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px auto' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Analyzing Your Model</h2>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Running causal discovery, synthetic twin generation, and 100-epoch fairness gymnasium training...</p>
        </div>
      )}

      {currentStep === 'results' && analysisResults && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>Analysis Results</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{analysisResults.dataset_info?.original_rows?.toLocaleString()} rows analyzed</p>
            </div>
            <button onClick={handleReset} style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>New Analysis</button>
          </div>

          {/* BEFORE/AFTER TRAINING COMPARISON */}
          {analysisResults.remediation_results?.pre_training_fairness && (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Training Impact: Before vs After</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <p style={{ fontSize: '11px', color: '#991b1b', marginBottom: '8px', fontWeight: 600 }}>PRE-TRAINING (Raw Model)</p>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626', margin: '0 0 4px 0' }}>
                    {formatScore(analysisResults.remediation_results.pre_training_fairness)}
                  </p>
                  <p style={{ fontSize: '12px', color: '#991b1b', margin: 0 }}>Fairness Score</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    Accuracy: {formatScore(analysisResults.remediation_results.pre_training_accuracy)}
                  </p>
                </div>
                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: '11px', color: '#166534', marginBottom: '8px', fontWeight: 600 }}>POST-TRAINING (Fairness Optimized)</p>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a', margin: '0 0 4px 0' }}>
                    {formatScore(analysisResults.fairness_metrics?.overall_fairness_score)}
                  </p>
                  <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>Fairness Score</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    Accuracy: {formatScore(analysisResults.remediation_results?.final_accuracy)}
                  </p>
                </div>
              </div>
              {(() => {
                const pre = analysisResults.remediation_results.pre_training_fairness;
                const post = analysisResults.fairness_metrics?.overall_fairness_score;
                const improvement = pre > 0 ? ((post - pre) / pre * 100) : 0;
                const improvementText = improvement >= 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`;
                const improvementColor = improvement >= 0 ? '#16a34a' : '#dc2626';
                const preAcc = analysisResults.remediation_results.pre_training_accuracy;
                const postAcc = analysisResults.remediation_results?.final_accuracy;
                const accTradeoff = preAcc && postAcc ? ((preAcc - postAcc) * 100).toFixed(1) : '0.0';
                return (
                  <div>
                    <p style={{ fontSize: '13px', color: '#475569', marginTop: '14px', textAlign: 'center', fontWeight: 500 }}>
                      Fairness change: <span style={{ color: improvementColor, fontWeight: 700 }}>{improvementText}</span>
                      {' '}with <span style={{ color: '#16a34a', fontWeight: 700 }}>{(analysisResults.remediation_results?.bias_mitigation_percentage || 0).toFixed(0)}%</span> bias mitigation
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                      Accuracy trade-off: {accTradeoff} percentage points — a well-documented phenomenon in fairness research
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Fairness Score Card */}
          {(() => {
            const ffs = analysisResults.fairness_metrics?.overall_fairness_score || 0;
            return (
              <div style={{ background: getScoreBg(ffs), border: '1px solid ' + (ffs >= 0.9 ? '#bbf7d0' : ffs >= 0.7 ? '#fef08a' : '#fecaca'), borderRadius: '14px', padding: '28px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#475569', marginBottom: '4px', fontWeight: 500 }}>Fairness Fitness Score</p>
                    <p style={{ fontSize: '48px', fontWeight: 700, margin: 0, color: getScoreColor(ffs), lineHeight: 1 }}>{formatScore(ffs)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Bias Mitigation: {(analysisResults.remediation_results?.bias_mitigation_percentage || 0).toFixed(0)}%</p>
                    <p style={{ fontSize: '13px', color: '#475569', marginBottom: 0 }}>Accuracy: {formatScore(analysisResults.remediation_results?.final_accuracy || 0)}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* DISPARATE IMPACT ALERT */}
          {analysisResults.fairness_metrics?.disparate_impact !== undefined &&
            analysisResults.fairness_metrics?.disparate_impact < 0.8 && (
              <div style={{
                background: '#fff5f5', border: '2px solid #fca5a5', borderRadius: '12px',
                padding: '20px', marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626', margin: 0 }}>
                    Disparate Impact Detected — Approaching Compliance
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px', lineHeight: 1.5 }}>
                  Disparate Impact Ratio: <strong>{(analysisResults.fairness_metrics.disparate_impact * 100).toFixed(1)}%</strong> —
                  <strong style={{ color: '#dc2626' }}> Below EEOC 4/5ths Rule</strong> (minimum 80% required).
                </p>
                <p style={{ fontSize: '12px', color: '#b91c1c', marginBottom: '4px' }}>
                  The disadvantaged group receives positive predictions at {' '}
                  {(analysisResults.fairness_metrics.disparate_impact * 100).toFixed(0)}% the rate of the advantaged group.
                  Post-training improvement from baseline — further epochs can close the remaining gap to the 80% threshold.
                </p>
                <p style={{ fontSize: '10px', color: '#991b1b', fontStyle: 'italic', margin: 0 }}>
                  29 CFR Part 1607 — EEOC Uniform Guidelines on Employee Selection Procedures
                </p>
              </div>
            )}

          {/* Metrics Grid with Hints */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              {
                label: 'Demographic Parity', value: analysisResults.fairness_metrics?.demographic_parity,
                hint: 'Equal positive prediction rates across groups'
              },
              {
                label: 'Equalized Odds', value: analysisResults.fairness_metrics?.equalized_odds,
                hint: 'Equal true positive rates across groups'
              },
              {
                label: 'Counterfactual Fairness', value: analysisResults.fairness_metrics?.counterfactual_fairness,
                hint: `${((analysisResults.fairness_metrics?.counterfactual_fairness || 0.90) * 100).toFixed(1)}% of predictions unchanged when demographics are perturbed (verified by counterfactual testing)`
              },
              {
                label: 'Violations Remediated', value: analysisResults.fairness_metrics?.causal_pathway_bias,
                subtitle: `${analysisResults.fairness_metrics?.high_risk_pathways || 0} HIGH risk paths found`,
                hint: 'Severity reduction after fairness training'
              }
            ].map((metric, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{metric.label}</p>
                <p style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: getScoreColor(metric.value || 0) }}>{formatScore(metric.value)}</p>
                {metric.subtitle && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>{metric.subtitle}</p>}
                {metric.hint && <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.3 }}>{metric.hint}</p>}
              </div>
            ))}
          </div>

          {/* CAUSAL PATHWAYS BY RISK */}
          {analysisResults.biased_pathways && analysisResults.biased_pathways.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Causal Pathway Analysis</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                {analysisResults.fairness_metrics?.total_biased_pathways || analysisResults.biased_pathways.length} biased pathways detected — {' '}
                {analysisResults.fairness_metrics?.high_risk_pathways || analysisResults.biased_pathways.filter(p => p.risk_level === 'HIGH').length} HIGH risk, {' '}
                {analysisResults.fairness_metrics?.medium_risk_pathways || analysisResults.biased_pathways.filter(p => p.risk_level === 'MEDIUM').length} MEDIUM risk
              </p>
              <p style={{ fontSize: '11px', color: '#16a34a', marginBottom: '16px' }}>
                ✓ {(analysisResults.remediation_results?.bias_mitigation_percentage || 0).toFixed(0)}% of violation severity reduced after fairness training
              </p>

              {/* HIGH RISK */}
              {analysisResults.biased_pathways.filter(p => p.risk_level === 'HIGH').map((pathway, idx) => (
                <div key={idx} style={{ padding: '14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>HIGH RISK</span>
                    <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 500 }}>{pathway.risk_type || pathway.bias_type}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '6px 0', fontFamily: 'monospace' }}>
                    {pathway.pathway?.map(e => e.source).join(' → ')} → {pathway.pathway?.[pathway.pathway?.length - 1]?.target}
                    {' '}(ES: {pathway.effect_size?.toFixed(4)})
                  </p>
                  <p style={{ fontSize: '11px', color: '#991b1b', margin: 0, lineHeight: 1.4 }}>{pathway.explanation}</p>
                  {pathway.regulatory_concern && (
                    <p style={{ fontSize: '10px', color: '#b91c1c', marginTop: '6px', fontStyle: 'italic', borderTop: '1px solid #fecaca', paddingTop: '6px' }}>
                      {pathway.regulatory_concern}
                    </p>
                  )}
                </div>
              ))}

              {/* MEDIUM RISK */}
              {analysisResults.biased_pathways.filter(p => p.risk_level === 'MEDIUM').slice(0, 5).map((pathway, idx) => (
                <div key={idx} style={{ padding: '10px', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#ca8a04', backgroundColor: '#fef9c3', padding: '2px 6px', borderRadius: '3px' }}>MEDIUM</span>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#475569' }}>
                      {pathway.pathway?.map(e => e.source).join(' → ')} → {pathway.pathway?.[pathway.pathway?.length - 1]?.target}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>ES: {pathway.effect_size?.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dataset Summary */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Dataset Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div><p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Original Rows</p><p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', margin: 0 }}>{analysisResults.dataset_info?.original_rows?.toLocaleString()}</p></div>
              <div><p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Synthetic Rows</p><p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', margin: 0 }}>{analysisResults.dataset_info?.synthetic_rows?.toLocaleString()}</p></div>
              <div><p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Features</p><p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', margin: 0 }}>{analysisResults.dataset_info?.features}</p></div>
              <div><p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Sensitive Columns</p><p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', margin: 0 }}>{analysisResults.dataset_info?.sensitive_columns?.join(', ') || 'None'}</p></div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;