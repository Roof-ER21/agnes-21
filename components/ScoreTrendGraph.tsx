import React, { useState, useEffect, useMemo } from 'react';
import { getSessions, SessionData } from '../utils/sessionStorage';
import { DifficultyLevel, PitchMode } from '../types';
import { TrendingUp, TrendingDown, Filter } from 'lucide-react';

interface ScoreTrendGraphProps {
  className?: string;
  maxDataPoints?: number;
}

const ScoreTrendGraph: React.FC<ScoreTrendGraphProps> = ({
  className = '',
  maxDataPoints = 20
}) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<PitchMode | 'all'>('all');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const allSessions = getSessions();
    setSessions(allSessions);
  };

  // Filter and prepare data
  const graphData = useMemo(() => {
    let filtered = sessions.filter(s => s.finalScore !== undefined);

    // Apply filters
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(s => s.difficulty === difficultyFilter);
    }
    if (modeFilter !== 'all') {
      filtered = filtered.filter(s => s.mode === modeFilter);
    }

    // Sort by timestamp and take last N sessions
    filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const recent = filtered.slice(-maxDataPoints);

    return recent.map((session, idx) => ({
      sessionNumber: idx + 1,
      score: session.finalScore || 0,
      timestamp: session.timestamp,
      difficulty: session.difficulty,
      mode: session.mode
    }));
  }, [sessions, difficultyFilter, modeFilter, maxDataPoints]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (graphData.length === 0) {
      return { average: 0, trend: 0, highest: 0, lowest: 0, improvement: 0 };
    }

    const scores = graphData.map(d => d.score);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Calculate trend (comparing first half vs second half)
    const midpoint = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, midpoint);
    const secondHalf = scores.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    const trend = secondAvg - firstAvg;

    // Calculate improvement from first to last
    const improvement = scores[scores.length - 1] - scores[0];

    return { average, trend, highest, lowest, improvement };
  }, [graphData]);

  // SVG dimensions
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number) => {
    return padding.left + (index / (Math.max(graphData.length - 1, 1))) * graphWidth;
  };

  const yScale = (score: number) => {
    return padding.top + graphHeight - (score / 100) * graphHeight;
  };

  // Generate line path
  const linePath = graphData.length > 0
    ? graphData.map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.score);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ')
    : '';

  // Generate area path (for gradient fill)
  const areaPath = graphData.length > 0
    ? `${linePath} L ${xScale(graphData.length - 1)} ${height - padding.bottom} L ${xScale(0)} ${height - padding.bottom} Z`
    : '';

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.ROOKIE: return 'text-green-500';
      case DifficultyLevel.PRO: return 'text-yellow-500';
      case DifficultyLevel.ELITE: return 'text-red-500';
    }
  };

  const getTrendColor = () => {
    if (stats.trend > 5) return 'text-green-500';
    if (stats.trend < -5) return 'text-red-500';
    return 'text-neutral-400';
  };

  const getTrendIcon = () => {
    if (stats.trend > 5) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (stats.trend < -5) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <div className="w-5 h-5 bg-neutral-600 rounded-full" />;
  };

  if (sessions.filter(s => s.finalScore !== undefined).length === 0) {
    return (
      <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-8 ${className}`}>
        <div className="text-center text-neutral-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-neutral-700" />
          <p className="text-lg font-medium">No score data yet</p>
          <p className="text-sm mt-2">Complete some training sessions to see your progress graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-red-500" />
            <span>Score Trend</span>
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            Last {graphData.length} sessions {difficultyFilter !== 'all' && `• ${difficultyFilter}`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as DifficultyLevel | 'all')}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value={DifficultyLevel.ROOKIE}>Rookie</option>
            <option value={DifficultyLevel.PRO}>PRO</option>
            <option value={DifficultyLevel.ELITE}>Elite</option>
          </select>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as PitchMode | 'all')}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Modes</option>
            <option value={PitchMode.COACH}>Coach</option>
            <option value={PitchMode.ROLEPLAY}>Roleplay</option>
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Average</div>
          <div className="text-2xl font-bold text-white">{Math.round(stats.average)}</div>
        </div>
        <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Trend</div>
          <div className={`text-2xl font-bold flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{stats.trend > 0 ? '+' : ''}{Math.round(stats.trend)}</span>
          </div>
        </div>
        <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Highest</div>
          <div className="text-2xl font-bold text-green-400">{stats.highest}</div>
        </div>
        <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Lowest</div>
          <div className="text-2xl font-bold text-red-400">{stats.lowest}</div>
        </div>
        <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Change</div>
          <div className={`text-2xl font-bold ${stats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.improvement > 0 ? '+' : ''}{Math.round(stats.improvement)}
          </div>
        </div>
      </div>

      {/* Graph */}
      {graphData.length > 0 && (
        <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800">
          <svg width={width} height={height} className="w-full h-auto">
            <defs>
              {/* Gradient for area fill */}
              <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((score) => (
              <g key={score}>
                <line
                  x1={padding.left}
                  y1={yScale(score)}
                  x2={width - padding.right}
                  y2={yScale(score)}
                  stroke="#404040"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={yScale(score) + 4}
                  textAnchor="end"
                  className="text-xs fill-neutral-500"
                >
                  {score}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#scoreGradient)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="rgb(239, 68, 68)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {graphData.map((d, i) => (
              <g key={i}>
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.score)}
                  r="5"
                  fill="rgb(239, 68, 68)"
                  stroke="#000"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-7 transition-all"
                >
                  <title>{`Session ${d.sessionNumber}: ${d.score} (${d.difficulty})`}</title>
                </circle>
                {/* X-axis labels */}
                {i % Math.ceil(graphData.length / 10) === 0 && (
                  <text
                    x={xScale(i)}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    className="text-xs fill-neutral-500"
                  >
                    {d.sessionNumber}
                  </text>
                )}
              </g>
            ))}

            {/* Axes labels */}
            <text
              x={width / 2}
              y={height - 5}
              textAnchor="middle"
              className="text-xs fill-neutral-400 font-medium"
            >
              Session Number
            </text>
            <text
              x={-height / 2}
              y={15}
              textAnchor="middle"
              transform={`rotate(-90 15 ${height / 2})`}
              className="text-xs fill-neutral-400 font-medium"
            >
              Score
            </text>
          </svg>
        </div>
      )}

      {/* Insights */}
      {graphData.length >= 5 && (
        <div className="mt-4 p-4 bg-neutral-800/30 rounded-lg border border-neutral-700">
          <div className="text-sm text-neutral-300">
            {stats.trend > 10 && (
              <p className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span><strong className="text-green-400">Great progress!</strong> Your scores are trending upward. Keep practicing!</span>
              </p>
            )}
            {stats.trend < -10 && (
              <p className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span><strong className="text-red-400">Scores declining.</strong> Try reviewing feedback from your best sessions.</span>
              </p>
            )}
            {stats.trend >= -10 && stats.trend <= 10 && (
              <p className="text-neutral-400">
                <strong>Consistent performance.</strong> Try increasing difficulty to challenge yourself.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreTrendGraph;
