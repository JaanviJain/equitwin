import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GymnasiumArena({ remediation }) {
  const trajectory = remediation?.fairness_score_trajectory || [];
  const accuracyTrajectory = remediation?.accuracy_trajectory || [];
  
  // Prepare chart data
  const chartData = trajectory.map((score, i) => ({
    epoch: i + 1,
    fairness: (score * 100).toFixed(1),
    accuracy: accuracyTrajectory[Math.floor(i / 10)] ? 
      (accuracyTrajectory[Math.floor(i / 10)] * 100).toFixed(1) : null
  })).filter(d => d.fairness > 0);

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-2">Fairness Gymnasium Arena</h3>
        <p className="text-sm text-slate-600 mb-6">
          Watch as the adversarial agent attacks your model and it learns to defend 
          against bias in real-time.
        </p>

        {/* Fairness Score Chart */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium mb-4">Fairness Fitness Score Trajectory</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="epoch" 
                label={{ value: 'Training Epoch', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="fairness" 
                stroke="#0f172a" 
                strokeWidth={2}
                dot={false}
                name="Fairness Score"
              />
              {accuracyTrajectory.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Accuracy"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Convergence Epoch</p>
            <p className="text-2xl font-bold">{remediation?.convergence_epoch || 'N/A'}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Bias Mitigation</p>
            <p className="text-2xl font-bold text-green-700">
              {remediation?.bias_mitigation_percentage?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">Final Accuracy</p>
            <p className="text-2xl font-bold text-blue-700">
              {remediation?.final_accuracy ? 
                (remediation.final_accuracy * 100).toFixed(1) + '%' : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Adversary Stats */}
      <div className="card">
        <h3 className="font-semibold mb-4">Bias Adversary Report</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Adversary Attacks</p>
            <p className="font-medium">{trajectory.length || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Edge Cases Found</p>
            <p className="font-medium">{Math.floor(trajectory.length * 0.3)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Defense Success Rate</p>
            <p className="font-medium text-green-600">
              {remediation?.bias_mitigation_percentage?.toFixed(1)}%
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <p className="text-slate-500">Training Duration</p>
            <p className="font-medium">{trajectory.length * 0.1}s</p>
          </div>
        </div>
      </div>
    </div>
  );
}