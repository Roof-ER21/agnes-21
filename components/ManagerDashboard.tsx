import React, { useState, useEffect, useMemo } from 'react';
import { getManagerAnalytics, ManagerAnalytics, getSessions } from '../utils/sessionStorage';
import { analyticsApi } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { DifficultyLevel, PitchMode } from '../types';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Clock,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ManagerDashboardProps {
  onBack: () => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');
  const [analytics, setAnalytics] = useState<ManagerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      // Try to fetch from API first
      const [teamStats, sessionStats, trends] = await Promise.all([
        analyticsApi.getTeamStats(),
        analyticsApi.getSessionStats(),
        analyticsApi.getTrends()
      ]);

      // Transform API data to ManagerAnalytics format
      const apiAnalytics: ManagerAnalytics = {
        totalSessions: teamStats.totalSessions,
        averageScore: teamStats.averageScore,
        totalTrainingHours: 0, // Will be calculated from sessions if needed
        activeUsers: teamStats.activeUsersLast7Days,
        sessionsByDifficulty: {
          [DifficultyLevel.BEGINNER]: sessionStats.byDifficulty.find(d => d.difficulty === 'BEGINNER')?.count || 0,
          [DifficultyLevel.ROOKIE]: sessionStats.byDifficulty.find(d => d.difficulty === 'ROOKIE')?.count || 0,
          [DifficultyLevel.PRO]: sessionStats.byDifficulty.find(d => d.difficulty === 'PRO')?.count || 0,
          [DifficultyLevel.ELITE]: sessionStats.byDifficulty.find(d => d.difficulty === 'ELITE')?.count || 0,
          [DifficultyLevel.NIGHTMARE]: sessionStats.byDifficulty.find(d => d.difficulty === 'NIGHTMARE')?.count || 0,
        },
        sessionsByMode: {
          [PitchMode.COACH]: sessionStats.byMode.find(m => m.mode === 'COACH')?.count || 0,
          [PitchMode.ROLEPLAY]: sessionStats.byMode.find(m => m.mode === 'ROLEPLAY')?.count || 0,
        },
        scoresByDate: trends.dailySessions.map(d => ({
          date: d.date,
          averageScore: d.avgScore,
          count: d.count
        })),
        sessionsOverTime: trends.dailySessions.map(d => ({
          date: d.date,
          count: d.count
        })),
        topPerformers: trends.topPerformers.map(p => ({
          userId: p.userId,
          averageScore: p.avgScore,
          sessionCount: p.sessionsCount
        })),
        mostImproved: [],
        mostActive: trends.topPerformers.map(p => ({
          userId: p.userId,
          sessionCount: p.sessionsCount,
          totalHours: 0 // Not available from API
        })),
        completionRateByDifficulty: {
          [DifficultyLevel.BEGINNER]: { completed: 0, total: 0, rate: 100 },
          [DifficultyLevel.ROOKIE]: { completed: 0, total: 0, rate: 100 },
          [DifficultyLevel.PRO]: { completed: 0, total: 0, rate: 100 },
          [DifficultyLevel.ELITE]: { completed: 0, total: 0, rate: 100 },
          [DifficultyLevel.NIGHTMARE]: { completed: 0, total: 0, rate: 100 },
        },
        peakTrainingHours: [],
        peakTrainingDays: []
      };

      setAnalytics(apiAnalytics);
    } catch (error) {
      console.warn('Failed to fetch analytics from API, using localStorage:', error);
      setApiError('Using offline data');

      // Fallback to localStorage
      const endDate = new Date();
      let startDate: Date | undefined;

      if (dateRange !== 'all') {
        startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(dateRange));
      }

      const data = getManagerAnalytics(startDate, endDate, user?.id);
      setAnalytics(data);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnalytics = useMemo(() => {
    if (!analytics || difficultyFilter === 'all') return analytics;

    // Get all sessions and filter by difficulty
    const allSessions = getSessions(user?.id);

    // Apply date range filter
    const endDate = new Date();
    let startDate: Date | undefined;
    if (dateRange !== 'all') {
      startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));
    }

    let filteredSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.timestamp);
      if (startDate && sessionDate < startDate) return false;
      if (endDate && sessionDate > endDate) return false;
      return session.difficulty === difficultyFilter;
    });

    // Recalculate metrics
    const totalSessions = filteredSessions.length;
    const sessionsWithScores = filteredSessions.filter(s => s.finalScore !== undefined);
    const averageScore = sessionsWithScores.length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.finalScore || 0), 0) / sessionsWithScores.length)
      : 0;

    const totalTrainingSeconds = filteredSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalTrainingHours = Math.round((totalTrainingSeconds / 3600) * 10) / 10;

    const activeUsers = filteredSessions.length > 0 ? 1 : 0;

    const sessionsByDifficulty = {
      [DifficultyLevel.ROOKIE]: filteredSessions.filter(s => s.difficulty === DifficultyLevel.ROOKIE).length,
      [DifficultyLevel.PRO]: filteredSessions.filter(s => s.difficulty === DifficultyLevel.PRO).length,
      [DifficultyLevel.ELITE]: filteredSessions.filter(s => s.difficulty === DifficultyLevel.ELITE).length,
    };

    const sessionsByMode = {
      [PitchMode.COACH]: filteredSessions.filter(s => s.mode === PitchMode.COACH).length,
      [PitchMode.ROLEPLAY]: filteredSessions.filter(s => s.mode === PitchMode.ROLEPLAY).length,
    };

    // Note: scoresByDate, sessionsOverTime, peakTrainingHours, peakTrainingDays
    // are not recalculated as they are complex and would require importing helper functions
    // For now, we'll use the unfiltered versions for these charts
    // Future improvement: extract helper functions to shared utility

    return {
      ...analytics,
      totalSessions,
      averageScore,
      totalTrainingHours,
      activeUsers,
      sessionsByDifficulty,
      sessionsByMode,
      topPerformers: [{ userId: 'current-user', averageScore, sessionCount: totalSessions }],
      mostActive: [{ userId: 'current-user', sessionCount: totalSessions, totalHours: totalTrainingHours }],
      completionRateByDifficulty: {
        [DifficultyLevel.ROOKIE]: {
          completed: sessionsByDifficulty[DifficultyLevel.ROOKIE],
          total: sessionsByDifficulty[DifficultyLevel.ROOKIE],
          rate: 100
        },
        [DifficultyLevel.PRO]: {
          completed: sessionsByDifficulty[DifficultyLevel.PRO],
          total: sessionsByDifficulty[DifficultyLevel.PRO],
          rate: 100
        },
        [DifficultyLevel.ELITE]: {
          completed: sessionsByDifficulty[DifficultyLevel.ELITE],
          total: sessionsByDifficulty[DifficultyLevel.ELITE],
          rate: 100
        }
      }
    };
  }, [analytics, difficultyFilter, dateRange]);

  const handleExport = () => {
    if (!analytics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      ...analytics
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manager-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 mx-auto mb-4 animate-spin" />
          <p className="text-neutral-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto bg-black text-white p-8 print:p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 print:mb-4">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={onBack}
            className="group flex items-center space-x-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-900/50 rounded-full transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-red-500" />
            <span className="text-sm font-mono uppercase tracking-wider text-neutral-400 group-hover:text-white">
              Back
            </span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-blue-900/50 rounded-full transition-all duration-300"
            >
              <Download className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-mono uppercase tracking-wider text-neutral-400">Export</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-green-900/50 rounded-full transition-all duration-300"
            >
              <Download className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-mono uppercase tracking-wider text-neutral-400">Print</span>
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3 print:text-3xl">
          <BarChart3 className="w-10 h-10 text-red-500" />
          <span>Manager Analytics</span>
        </h1>
        <p className="text-neutral-400 text-lg print:text-base">
          Team performance overview and insights
          {apiError && (
            <span className="ml-2 text-yellow-500 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {apiError}
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6 print:hidden">
        <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-400 font-medium">Filters:</span>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-neutral-400">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-neutral-400">Difficulty:</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
              >
                <option value="all">All Levels</option>
                <option value={DifficultyLevel.ROOKIE}>Rookie</option>
                <option value={DifficultyLevel.PRO}>PRO</option>
                <option value={DifficultyLevel.ELITE}>Elite</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <MetricCard
            icon={<Trophy className="w-6 h-6" />}
            label="Total Sessions"
            value={analytics.totalSessions.toString()}
            color="text-red-500"
          />
          <MetricCard
            icon={<Target className="w-6 h-6" />}
            label="Average Score"
            value={analytics.averageScore.toString()}
            subValue="/100"
            color="text-yellow-500"
          />
          <MetricCard
            icon={<Clock className="w-6 h-6" />}
            label="Training Hours"
            value={analytics.totalTrainingHours.toString()}
            subValue="hrs"
            color="text-blue-500"
          />
          <MetricCard
            icon={<Users className="w-6 h-6" />}
            label="Active Users"
            value={analytics.activeUsers.toString()}
            color="text-green-500"
          />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4">
          {/* Score Trend Over Time */}
          <ChartCard title="Score Trend Over Time" icon={<TrendingUp className="w-5 h-5 text-red-500" />}>
            <ScoreTrendChart data={analytics.scoresByDate} />
          </ChartCard>

          {/* Sessions Over Time */}
          <ChartCard title="Sessions Over Time" icon={<Calendar className="w-5 h-5 text-red-500" />}>
            <SessionsOverTimeChart data={analytics.sessionsOverTime} />
          </ChartCard>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4">
          {/* Sessions by Difficulty */}
          <ChartCard title="Sessions by Difficulty" icon={<PieChart className="w-5 h-5 text-red-500" />}>
            <DifficultyPieChart data={analytics.sessionsByDifficulty} />
          </ChartCard>

          {/* Sessions by Mode */}
          <ChartCard title="Sessions by Mode" icon={<BarChart3 className="w-5 h-5 text-red-500" />}>
            <ModeBarChart data={analytics.sessionsByMode} />
          </ChartCard>
        </div>
      </div>

      {/* Peak Training Times */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4">
          {/* Peak Hours Heatmap */}
          <ChartCard title="Peak Training Hours" icon={<Clock className="w-5 h-5 text-red-500" />}>
            <PeakHoursChart data={analytics.peakTrainingHours} />
          </ChartCard>

          {/* Peak Days */}
          <ChartCard title="Peak Training Days" icon={<Calendar className="w-5 h-5 text-red-500" />}>
            <PeakDaysChart data={analytics.peakTrainingDays} />
          </ChartCard>
        </div>
      </div>

      {/* Performance Tables */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:gap-4">
          {/* Top Performers */}
          <PerformanceCard
            title="Top Performers"
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            data={analytics.topPerformers}
            renderRow={(item) => (
              <div className="flex justify-between items-center">
                <span className="text-neutral-300">User</span>
                <span className="font-bold text-yellow-400">{item.averageScore}</span>
              </div>
            )}
          />

          {/* Most Improved */}
          <PerformanceCard
            title="Most Improved"
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            data={analytics.mostImproved}
            renderRow={(item) => (
              <div className="flex justify-between items-center">
                <span className="text-neutral-300">User</span>
                <span className={`font-bold ${item.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.improvement >= 0 ? '+' : ''}{item.improvement}
                </span>
              </div>
            )}
          />

          {/* Most Active */}
          <PerformanceCard
            title="Most Active"
            icon={<Users className="w-5 h-5 text-blue-500" />}
            data={analytics.mostActive}
            renderRow={(item) => (
              <div className="flex justify-between items-center">
                <span className="text-neutral-300">User</span>
                <span className="font-bold text-blue-400">{item.sessionCount} sessions</span>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, subValue, color }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 print:p-3">
    <div className="flex items-center justify-between mb-3">
      <div className={color}>{icon}</div>
    </div>
    <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2 print:text-[10px]">{label}</div>
    <div className="text-3xl font-bold text-white print:text-2xl">
      {value}
      {subValue && <span className="text-lg text-neutral-400 ml-1 print:text-sm">{subValue}</span>}
    </div>
  </div>
);

// Chart Card Component
interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, icon, children }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 print:p-3">
    <div className="flex items-center space-x-2 mb-4 print:mb-2">
      {icon}
      <h3 className="text-lg font-bold text-white print:text-base">{title}</h3>
    </div>
    {children}
  </div>
);

// Performance Card Component
interface PerformanceCardProps {
  title: string;
  icon: React.ReactNode;
  data: any[];
  renderRow: (item: any) => React.ReactNode;
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({ title, icon, data, renderRow }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 print:p-3">
    <div className="flex items-center space-x-2 mb-4 print:mb-2">
      {icon}
      <h3 className="text-lg font-bold text-white print:text-base">{title}</h3>
    </div>
    {data.length === 0 ? (
      <div className="text-center text-neutral-500 py-8 print:py-4">
        <p className="text-sm">No data available</p>
      </div>
    ) : (
      <div className="space-y-3 print:space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="p-3 bg-neutral-800 rounded-lg print:p-2">
            {renderRow(item)}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Score Trend Chart Component
interface ScoreTrendChartProps {
  data: Array<{ date: string; averageScore: number; count: number }>;
}

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ data }) => {
  const width = 500;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const filteredData = data.filter(d => d.count > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        <p>No score data available</p>
      </div>
    );
  }

  const maxScore = 100;
  const minScore = 0;

  const xScale = (index: number) => {
    return padding.left + (index / (Math.max(filteredData.length - 1, 1))) * graphWidth;
  };

  const yScale = (score: number) => {
    return padding.top + graphHeight - ((score - minScore) / (maxScore - minScore)) * graphHeight;
  };

  const linePath = filteredData
    .map((d, i) => {
      const x = xScale(i);
      const y = yScale(d.averageScore);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800">
      <svg width={width} height={height} className="w-full h-auto">
        <defs>
          <linearGradient id="scoreTrendGradient" x1="0" x2="0" y1="0" y2="1">
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
            <text x={padding.left - 10} y={yScale(score) + 4} textAnchor="end" className="text-xs fill-neutral-500">
              {score}
            </text>
          </g>
        ))}

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
        {filteredData.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.averageScore)}
            r="4"
            fill="rgb(239, 68, 68)"
            stroke="#000"
            strokeWidth="2"
          >
            <title>{`${d.date}: ${d.averageScore}`}</title>
          </circle>
        ))}

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="text-xs fill-neutral-400 font-medium"
        >
          Date
        </text>
      </svg>
    </div>
  );
};

// Sessions Over Time Chart Component
interface SessionsOverTimeChartProps {
  data: Array<{ date: string; count: number }>;
}

const SessionsOverTimeChart: React.FC<SessionsOverTimeChartProps> = ({ data }) => {
  const width = 500;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const barWidth = Math.max(graphWidth / data.length - 4, 2);

  return (
    <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800">
      <svg width={width} height={height} className="w-full h-auto">
        {/* Grid lines */}
        {[0, Math.ceil(maxCount / 2), maxCount].map((count) => (
          <g key={count}>
            <line
              x1={padding.left}
              y1={padding.top + graphHeight - (count / maxCount) * graphHeight}
              x2={width - padding.right}
              y2={padding.top + graphHeight - (count / maxCount) * graphHeight}
              stroke="#404040"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={padding.top + graphHeight - (count / maxCount) * graphHeight + 4}
              textAnchor="end"
              className="text-xs fill-neutral-500"
            >
              {count}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padding.left + (i / data.length) * graphWidth;
          const barHeight = (d.count / maxCount) * graphHeight;
          const y = padding.top + graphHeight - barHeight;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={d.count > 0 ? 'rgb(239, 68, 68)' : '#404040'}
              opacity={d.count > 0 ? 0.8 : 0.3}
            >
              <title>{`${d.date}: ${d.count} sessions`}</title>
            </rect>
          );
        })}

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="text-xs fill-neutral-400 font-medium"
        >
          Date
        </text>
      </svg>
    </div>
  );
};

// Difficulty Pie Chart Component
interface DifficultyPieChartProps {
  data: Record<DifficultyLevel, number>;
}

const DifficultyPieChart: React.FC<DifficultyPieChartProps> = ({ data }) => {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        <p>No session data available</p>
      </div>
    );
  }

  const colors = {
    [DifficultyLevel.ROOKIE]: '#22c55e',
    [DifficultyLevel.PRO]: '#eab308',
    [DifficultyLevel.ELITE]: '#ef4444'
  };

  const radius = 100;
  const centerX = 150;
  const centerY = 130;

  let currentAngle = -90;
  const slices: Array<{ difficulty: DifficultyLevel; percentage: number; path: string; color: string }> = [];

  Object.entries(data).forEach(([difficulty, count]) => {
    const percentage = (count / total) * 100;
    const sliceAngle = (count / total) * 360;

    const startAngle = (currentAngle * Math.PI) / 180;
    const endAngle = ((currentAngle + sliceAngle) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    slices.push({
      difficulty: difficulty as DifficultyLevel,
      percentage,
      path,
      color: colors[difficulty as DifficultyLevel]
    });

    currentAngle += sliceAngle;
  });

  return (
    <div className="flex items-center justify-center">
      <svg width={300} height={280} className="w-full h-auto max-w-md">
        {slices.map((slice, i) => (
          <g key={i}>
            <path d={slice.path} fill={slice.color} opacity={0.8} stroke="#000" strokeWidth="2">
              <title>{`${slice.difficulty}: ${slice.percentage.toFixed(1)}%`}</title>
            </path>
          </g>
        ))}
      </svg>
      <div className="ml-6 space-y-2">
        {Object.entries(data).map(([difficulty, count]) => (
          <div key={difficulty} className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: colors[difficulty as DifficultyLevel] }}
            />
            <span className="text-sm text-neutral-300">
              {difficulty}: <span className="font-bold">{count}</span>{' '}
              <span className="text-neutral-500">({((count / total) * 100).toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mode Bar Chart Component
interface ModeBarChartProps {
  data: Record<PitchMode, number>;
}

const ModeBarChart: React.FC<ModeBarChartProps> = ({ data }) => {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(data), 1);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        <p>No session data available</p>
      </div>
    );
  }

  const colors = {
    [PitchMode.COACH]: '#3b82f6',
    [PitchMode.ROLEPLAY]: '#8b5cf6'
  };

  return (
    <div className="space-y-4 p-4">
      {Object.entries(data).map(([mode, count]) => {
        const percentage = (count / maxCount) * 100;
        return (
          <div key={mode} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-300">{mode}</span>
              <span className="text-sm font-bold text-white">
                {count} <span className="text-neutral-500">({((count / total) * 100).toFixed(1)}%)</span>
              </span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-6">
              <div
                className="h-6 rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[mode as PitchMode]
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Peak Hours Chart Component
interface PeakHoursChartProps {
  data: Array<{ hour: number; count: number }>;
}

const PeakHoursChart: React.FC<PeakHoursChartProps> = ({ data }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  // Show top 8 hours
  const topHours = data.slice(0, 8);

  return (
    <div className="space-y-2 p-4">
      {topHours.map(({ hour, count }) => {
        const percentage = (count / maxCount) * 100;
        const intensity = count > 0 ? Math.min((count / maxCount) * 100, 100) : 0;

        return (
          <div key={hour} className="flex items-center space-x-3">
            <span className="text-xs font-mono text-neutral-400 w-12">{formatHour(hour)}</span>
            <div className="flex-1 bg-neutral-800 rounded h-8 relative overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: `rgb(239, 68, 68, ${intensity / 100})`
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {count} sessions
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Peak Days Chart Component
interface PeakDaysChartProps {
  data: Array<{ day: string; count: number }>;
}

const PeakDaysChart: React.FC<PeakDaysChartProps> = ({ data }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="space-y-2 p-4">
      {data.map(({ day, count }) => {
        const percentage = (count / maxCount) * 100;
        const intensity = count > 0 ? Math.min((count / maxCount) * 100, 100) : 0;

        return (
          <div key={day} className="flex items-center space-x-3">
            <span className="text-xs font-medium text-neutral-300 w-20">{day}</span>
            <div className="flex-1 bg-neutral-800 rounded h-8 relative overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: `rgb(239, 68, 68, ${intensity / 100})`
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {count} sessions
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ManagerDashboard;
