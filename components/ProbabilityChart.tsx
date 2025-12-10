import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  homeName: string;
  awayName: string;
  homeProb: number;
  drawProb: number;
  awayProb: number;
}

const ProbabilityChart: React.FC<Props> = ({ homeName, awayName, homeProb, drawProb, awayProb }) => {
  const data = [
    { name: homeName, value: homeProb, color: '#10b981' }, // Emerald 500
    { name: 'Match Nul', value: drawProb, color: '#94a3b8' }, // Slate 400
    { name: awayName, value: awayProb, color: '#3b82f6' }, // Blue 500
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProbabilityChart;