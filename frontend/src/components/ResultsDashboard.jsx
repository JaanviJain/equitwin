import React, { useState } from 'react';
import CausalGraph from './CausalGraph';
import BiosMode from './BiosMode';
import GymnasiumArena from './GymnasiumArena';
import CertificationPanel from './CertificationPanel';

export default function ResultsDashboard({ results, taskId, onReset }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mode, setMode] = useState('visual'); // 'visual' | 'bios'

  const metrics = results?.fairness_metrics || {};
  const remediation = results?.remediation_results || {};
  const biasedPathways = results?.biased_pathways || [];
  const datasetInfo = results?.dataset_info || {};

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'causal', label: 'Causal Graph' },
    { id: 'arena', label: 'Gymnasium' },
    { id: 'certify', label: 'Certification' },
  ];

  const getScoreColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 0.9) return 'bg-green-50 border-green-200';
    if (score >= 0.7) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div>
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Analysis Results</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dataset: {datasetInfo.original_rows?.toLocaleString()} rows • 
            Task ID: {taskId?.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* BIOS Mode Toggle */}
          <button
            onClick={() => setMode(mode === 'visual' ? 'bios' : 'visual')}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${mode === 'bios' 
                ? 'bg-black text-green-400 border border-green-800' 
                : 'bg-white text-slate-700 border border-slate-300'
              }
            `}
          >
            {mode === 'bios' ? 'BIOS Mode' : 'Visual Mode'}
          </button>
          
          <button onClick={onReset} className="btn-secondary text-sm">
            New Analysis
          </button>
        </div>
      </div>

      {/* BIOS Mode */}
      {mode === 'bios' && <BiosMode results={results} />}

      {/* Visual Mode */}
      {mode === 'visual' && (
        <>
          {/* Fairness Score Card */}
          <div className={`card mb-6 ${getScoreBg(metrics.overall_fairness_score)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Fairness Fitness Score</p>
                <p className={`text-4xl font-bold mt-1 ${getScoreColor(metrics.overall_fairness_score)}`}>
                  {(metrics.overall_fairness_score * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  Bias Mitigation: {remediation.bias_mitigation_percentage?.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-600">
                  Model Accuracy: {remediation.final_accuracy ? 
                    (remediation.final_accuracy * 100).toFixed(1) + '%' : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-slate-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2.5 text-sm font-medium transition-colors relative
                  ${activeTab === tab.id 
                    ? 'text-slate-900' 
                    : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                  label="Demographic Parity" 
                  value={metrics.demographic_parity} 
                />
                <MetricCard 
                  label="Equalized Odds" 
                  value={metrics.equalized_odds} 
                />
                <MetricCard 
                  label="Counterfactual Fairness" 
                  value={metrics.counterfactual_fairness} 
                />
                <MetricCard 
                  label="Causal Pathway Score" 
                  value={metrics.causal_pathway_bias} 
                />
              </div>

              {/* Biased Pathways */}
              {biasedPathways.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-4">Detected Bias Pathways</h3>
                  <div className="space-y-3">
                    {biasedPathways.map((pathway, idx) => (
                      <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-sm font-medium text-red-800">
                            Bias Pathway {idx + 1}
                          </span>
                          <span className="text-xs text-red-600">
                            Effect: {pathway.effect_size?.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 flex-wrap">
                          {pathway.pathway?.map((edge, i) => (
                            <React.Fragment key={i}>
                              <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                {edge.source}
                              </span>
                              <span className="text-slate-400">→</span>
                              {i === pathway.pathway.length - 1 && (
                                <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                  {edge.target}
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        {pathway.regulatory_concern && (
                          <p className="text-xs text-slate-500 mt-1">
                            {pathway.regulatory_concern}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dataset Info */}
              <div className="card">
                <h3 className="font-semibold mb-3">Dataset Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Original Rows</p>
                    <p className="font-medium">{datasetInfo.original_rows?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Synthetic Rows</p>
                    <p className="font-medium">{datasetInfo.synthetic_rows?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Features</p>
                    <p className="font-medium">{datasetInfo.features}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sensitive Columns</p>
                    <p className="font-medium">
                      {datasetInfo.sensitive_columns?.join(', ') || 'None detected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'causal' && (
            <CausalGraph 
              graphData={results?.causal_graph} 
              biasedPathways={biasedPathways}
            />
          )}

          {activeTab === 'arena' && (
            <GymnasiumArena remediation={remediation} />
          )}

          {activeTab === 'certify' && (
            <CertificationPanel taskId={taskId} metrics={metrics} />
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  const percentage = value ? (value * 100).toFixed(1) : '0.0';
  const colorClass = value >= 0.8 ? 'text-green-600' : 
                     value >= 0.6 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="card">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{percentage}%</p>
    </div>
  );
}