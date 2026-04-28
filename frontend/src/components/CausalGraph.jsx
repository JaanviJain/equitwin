import React from 'react';

export default function CausalGraph({ graphData, biasedPathways }) {
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const hasVisualization = graphData?.visualization_base64;

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Causal Discovery Graph</h3>
      <p className="text-sm text-slate-600 mb-4">
        This graph shows how features causally influence each other. 
        Red edges indicate pathways where sensitive attributes influence decisions.
      </p>

      {/* Graph Visualization */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6 overflow-auto">
        {hasVisualization ? (
          <img 
            src={`data:image/png;base64,${hasVisualization}`}
            alt="Causal Discovery Graph"
            className="w-full max-w-2xl mx-auto"
          />
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>Graph visualization not available</p>
            <p className="text-sm mt-1">View node and edge details below</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-200 border border-red-400 rounded-full"></div>
          <span>Sensitive Attribute</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded-full"></div>
          <span>Regular Feature</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-red-400"></div>
          <span>Biased Pathway</span>
        </div>
      </div>

      {/* Nodes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Nodes ({nodes.length})</h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {nodes.map((node, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  node.is_sensitive ? 'bg-red-400' : 'bg-blue-400'
                }`}></span>
                <span className="font-mono text-xs">{node.label}</span>
                {node.is_sensitive && (
                  <span className="text-xs text-red-600">(sensitive)</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Edges ({edges.length})</h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {edges.map((edge, i) => (
              <div key={i} className="text-sm font-mono text-xs">
                <span className={edge.is_biased ? 'text-red-600' : 'text-slate-600'}>
                  {edge.source} → {edge.target}
                </span>
                {edge.is_biased && (
                  <span className="text-red-500 ml-1">⚠</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}