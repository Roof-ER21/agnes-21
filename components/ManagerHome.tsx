/**
 * Manager Home - Dashboard with navigation tiles
 * Provides quick access to all manager features
 */

import React from 'react';
import {
  BarChart3,
  Users,
  FileText,
  Globe,
  Video,
  Trophy,
  History,
  Settings,
  Mic,
  Sparkles,
  Home,
  ShoppingCart,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ManagerHomeProps {
  onNavigate: (view: string) => void;
}

interface NavigationTile {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  borderColor: string;
}

const ManagerHome: React.FC<ManagerHomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const tiles: NavigationTile[] = [
    {
      id: 'dashboard',
      title: 'Analytics Dashboard',
      description: 'Team performance, stats & insights',
      icon: <BarChart3 className="w-8 h-8" />,
      color: 'text-blue-400',
      hoverColor: 'hover:bg-blue-900/30',
      borderColor: 'hover:border-blue-500/50'
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage reps, roles & permissions',
      icon: <Users className="w-8 h-8" />,
      color: 'text-green-400',
      hoverColor: 'hover:bg-green-900/30',
      borderColor: 'hover:border-green-500/50'
    },
    {
      id: 'scripts',
      title: 'Script Editor',
      description: 'Create & edit training scripts',
      icon: <FileText className="w-8 h-8" />,
      color: 'text-purple-400',
      hoverColor: 'hover:bg-purple-900/30',
      borderColor: 'hover:border-purple-500/50'
    },
    {
      id: 'translate',
      title: 'Field Translator',
      description: 'Real-time translation tool',
      icon: <Globe className="w-8 h-8" />,
      color: 'text-cyan-400',
      hoverColor: 'hover:bg-cyan-900/30',
      borderColor: 'hover:border-cyan-500/50'
    },
    {
      id: 'demos',
      title: 'Demo Library',
      description: 'Training videos & examples',
      icon: <Video className="w-8 h-8" />,
      color: 'text-pink-400',
      hoverColor: 'hover:bg-pink-900/30',
      borderColor: 'hover:border-pink-500/50'
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'Team rankings & achievements',
      icon: <Trophy className="w-8 h-8" />,
      color: 'text-yellow-400',
      hoverColor: 'hover:bg-yellow-900/30',
      borderColor: 'hover:border-yellow-500/50'
    },
    {
      id: 'history',
      title: 'All Sessions',
      description: 'View team training history',
      icon: <History className="w-8 h-8" />,
      color: 'text-red-400',
      hoverColor: 'hover:bg-red-900/30',
      borderColor: 'hover:border-red-500/50'
    },
    {
      id: 'training',
      title: 'Start Training',
      description: 'Practice with Agnes 21',
      icon: <Mic className="w-8 h-8" />,
      color: 'text-orange-400',
      hoverColor: 'hover:bg-orange-900/30',
      borderColor: 'hover:border-orange-500/50'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-3">
            <div className="inline-flex items-center px-4 py-2 bg-neutral-900/80 rounded-full border border-yellow-500/30">
              <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-yellow-300 font-mono text-xs tracking-widest uppercase">Manager Dashboard</span>
            </div>

            {/* Division Badge */}
            {user?.role === 'manager' ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg bg-gradient-to-r from-yellow-600 to-amber-500 text-white shadow-yellow-500/25">
                <Shield className="w-4 h-4" />
                <span>All Divisions</span>
              </div>
            ) : (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg ${
                user?.division === 'retail' || user?.role === 'retail_manager'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/25'
              }`}>
                {user?.division === 'retail' || user?.role === 'retail_manager' ? (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Retail</span>
                  </>
                ) : (
                  <>
                    <Home className="w-4 h-4" />
                    <span>Insurance</span>
                  </>
                )}
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome, <span className="text-red-500">{user?.name}</span>
          </h1>

          <p className="text-neutral-400 max-w-lg mx-auto">
            Manage your team, track performance, and oversee training operations
          </p>
        </div>

        {/* Navigation Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => onNavigate(tile.id)}
              className={`group p-6 bg-neutral-900/80 border border-neutral-800 rounded-xl text-left transition-all duration-300 ${tile.hoverColor} ${tile.borderColor}`}
            >
              <div className={`${tile.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {tile.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{tile.title}</h3>
              <p className="text-xs text-neutral-400">{tile.description}</p>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">24</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Active Reps</div>
          </div>
          <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">156</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Sessions Today</div>
          </div>
          <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">78%</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Avg Score</div>
          </div>
          <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">12</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">New Achievements</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerHome;
