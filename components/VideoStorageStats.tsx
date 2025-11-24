import React, { useState, useEffect } from 'react';
import { getStorageStats, getAllVideoMetadata, formatBytes } from '../utils/videoStorage';
import { HardDrive, Video, Database, RefreshCw, AlertTriangle, Settings } from 'lucide-react';

interface VideoStorageStatsProps {
  className?: string;
  onManageStorage?: () => void;
}

const VideoStorageStats: React.FC<VideoStorageStatsProps> = ({
  className = '',
  onManageStorage
}) => {
  const [stats, setStats] = useState<{
    videoCount: number;
    totalSize: number;
    quota?: number;
    usage?: number;
    available?: number;
  } | null>(null);
  const [oldestDate, setOldestDate] = useState<Date | null>(null);
  const [newestDate, setNewestDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const storageStats = await getStorageStats();
      const metadata = await getAllVideoMetadata();

      setStats(storageStats);

      // Get oldest and newest video dates
      if (metadata.length > 0) {
        const sorted = [...metadata].sort((a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );
        setOldestDate(sorted[0].recordedAt);
        setNewestDate(sorted[sorted.length - 1].recordedAt);
      } else {
        setOldestDate(null);
        setNewestDate(null);
      }
    } catch (err) {
      console.error('Failed to load storage stats:', err);
      setError('Failed to load storage statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleManageStorage = () => {
    if (onManageStorage) {
      onManageStorage();
    } else {
      console.log('Manage Storage clicked - feature coming soon');
    }
  };

  // Calculate usage percentage
  const usagePercentage = stats?.quota && stats?.usage
    ? Math.round((stats.usage / stats.quota) * 100)
    : 0;

  // Determine warning/danger states
  const isWarning = usagePercentage >= 80 && usagePercentage < 95;
  const isDanger = usagePercentage >= 95;

  // Get progress bar color
  const getProgressColor = () => {
    if (isDanger) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get border color for card
  const getCardBorderColor = () => {
    if (isDanger) return 'border-red-800/50';
    if (isWarning) return 'border-yellow-800/50';
    return 'border-neutral-800';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <HardDrive className="w-6 h-6 text-purple-500 animate-pulse" />
          <h3 className="text-xl font-bold text-white">Video Storage</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-neutral-800 rounded animate-pulse" />
          <div className="h-4 bg-neutral-800 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-neutral-800 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-neutral-900 border border-red-800/50 rounded-xl p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-bold text-white">Video Storage</h3>
        </div>
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-neutral-900 border ${getCardBorderColor()} rounded-xl p-6 ${className} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <HardDrive className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold text-white">Video Storage</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all duration-300 ${
            refreshing ? 'cursor-not-allowed' : ''
          }`}
          title="Refresh stats"
        >
          <RefreshCw className={`w-4 h-4 text-neutral-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Warning Banner */}
      {(isWarning || isDanger) && (
        <div className={`mb-4 p-3 rounded-lg border ${
          isDanger
            ? 'bg-red-900/20 border-red-800/50'
            : 'bg-yellow-900/20 border-yellow-800/50'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 ${isDanger ? 'text-red-400' : 'text-yellow-400'}`} />
            <p className={`text-sm font-medium ${isDanger ? 'text-red-400' : 'text-yellow-400'}`}>
              {isDanger
                ? 'Storage almost full! Consider deleting old videos.'
                : 'Storage running low. Consider managing your videos.'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Video Count */}
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center space-x-2 mb-1">
            <Video className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">Videos</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.videoCount || 0}</div>
        </div>

        {/* Total Size */}
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center space-x-2 mb-1">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">Used</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatBytes(stats?.totalSize || 0)}
          </div>
        </div>
      </div>

      {/* Storage Quota Progress */}
      {stats?.quota && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-400">Storage Quota</span>
            <span className={`text-sm font-bold ${
              isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'
            }`}>
              {usagePercentage}%
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden mb-2">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-500`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{formatBytes(stats.usage || 0)} used</span>
            <span>{formatBytes(stats.available || 0)} available</span>
          </div>
        </div>
      )}

      {/* Date Range */}
      {oldestDate && newestDate && (
        <div className="mb-5 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-neutral-500 mb-1">Oldest</div>
              <div className="text-neutral-300 font-medium">{formatDate(oldestDate)}</div>
            </div>
            <div>
              <div className="text-neutral-500 mb-1">Newest</div>
              <div className="text-neutral-300 font-medium">{formatDate(newestDate)}</div>
            </div>
          </div>
        </div>
      )}

      {/* No Videos State */}
      {stats?.videoCount === 0 && (
        <div className="text-center py-6">
          <Video className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">No videos stored yet</p>
          <p className="text-neutral-600 text-xs mt-1">Videos will appear here when recorded</p>
        </div>
      )}

      {/* Manage Storage Button */}
      {stats && stats.videoCount > 0 && (
        <button
          onClick={handleManageStorage}
          className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-purple-900/50 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
        >
          <Settings className="w-4 h-4 text-neutral-400 group-hover:text-purple-400 transition-colors" />
          <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
            Manage Storage
          </span>
        </button>
      )}
    </div>
  );
};

export default VideoStorageStats;
