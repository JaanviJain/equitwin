import React from 'react';

export default function BiosMode({ results }) {
  const metrics = results?.fairness_metrics || {};
  const remediation = results?.remediation_results || {};
  const biasedPathways = results?.biased_pathways || [];
  const datasetInfo = results?.dataset_info || {};

  return (
    <div className="bios-terminal">
      <pre className="whitespace-pre-wrap">
{`> EQUITY SCAN INITIATED...
> 
> Loading dataset: ${datasetInfo.original_rows?.toLocaleString() || 'N/A'} rows, ${datasetInfo.features || 'N/A'} features
> [OK] Data validated.
> 
> Generating Synthetic Digital Twin...
> [OK] Twin generated. Privacy preserved. Original data discarded.
>    Synthetic rows: ${datasetInfo.synthetic_rows?.toLocaleString() || 'N/A'}
>    Quality score: ${datasetInfo.synthetic_quality?.quality_score?.toFixed(3) || 'N/A'}
> 
> Running Causal Discovery...
> [OK] Causal graph constructed.
>    Nodes: ${results?.causal_graph?.nodes?.length || 0}
>    Edges: ${results?.causal_graph?.edges?.length || 0}
${biasedPathways.map((p, i) => 
`> [VIOLATION] Causal Pathway ${i + 1}: ${p.pathway?.map(e => e.source).join(' → ')} → ${p.pathway?.[p.pathway.length - 1]?.target}
>              Effect size: ${p.effect_size?.toFixed(3)}
>              Risk: ${p.regulatory_concern || 'Potential proxy discrimination'}
`).join('')}
> Activating Fairness Gymnasium...
> [TRAINING] Adversarial agent probing for bias edge cases...
${remediation.fairness_score_trajectory?.map((score, i) => {
  if (i % 10 === 0 || i === (remediation.fairness_score_trajectory?.length - 1)) {
    return `> [TRAINING] Iteration ${i + 1}... Fitness Score: ${(score * 100).toFixed(1)}%\n`;
  }
  return '';
}).join('')}
> [CONVERGED] Model hardened. 
>    Final FFS: ${(metrics.overall_fairness_score * 100).toFixed(1)}%
>    Bias Mitigation: ${remediation.bias_mitigation_percentage?.toFixed(1)}%
>    Model Accuracy: ${remediation.final_accuracy ? (remediation.final_accuracy * 100).toFixed(1) + '%' : 'N/A'}
> 
> === FAIRNESS AUDIT RESULTS ===
> 
> [METRIC] Demographic Parity:     ${(metrics.demographic_parity * 100).toFixed(1)}%  ${metrics.demographic_parity >= 0.8 ? '[PASS]' : '[WARN]'}
> [METRIC] Equalized Odds:         ${(metrics.equalized_odds * 100).toFixed(1)}%  ${metrics.equalized_odds >= 0.8 ? '[PASS]' : '[WARN]'}
> [METRIC] Counterfactual Fairness: ${(metrics.counterfactual_fairness * 100).toFixed(1)}%  ${metrics.counterfactual_fairness >= 0.8 ? '[PASS]' : '[WARN]'}
> [METRIC] Causal Pathway Score:   ${(metrics.causal_pathway_bias * 100).toFixed(1)}%  ${metrics.causal_pathway_bias >= 0.8 ? '[PASS]' : '[WARN]'}
> 
> === VERDICT ===
> Model Fairness Score: ${(metrics.overall_fairness_score * 100).toFixed(1)}%
> Status: ${metrics.overall_fairness_score >= 0.8 ? 'CERTIFIED FAIR' : 'REMEDIATION REQUIRED'}
> 
> Ready for certification. Run 'certify' to issue Verifiable Credential.
> 
> _`}
      </pre>
    </div>
  );
}