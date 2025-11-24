import React, { useRef } from 'react';
import { SessionData } from '../utils/sessionStorage';
import { DifficultyLevel, PitchMode } from '../types';
import { Download, FileText } from 'lucide-react';

interface SessionPDFExportProps {
  session: SessionData;
  onClose?: () => void;
}

const SessionPDFExport: React.FC<SessionPDFExportProps> = ({ session, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDifficultyLabel = () => {
    switch (session.difficulty) {
      case DifficultyLevel.ROOKIE: return 'ROOKIE (Beginner Friendly)';
      case DifficultyLevel.PRO: return 'PRO (Realistic Scenarios)';
      case DifficultyLevel.ELITE: return 'ELITE (Expert Challenge)';
      default: return session.difficulty;
    }
  };

  const getModeLabel = () => {
    switch (session.mode) {
      case PitchMode.COACH: return 'Coaching Mode (Feedback Only)';
      case PitchMode.ROLEPLAY: return 'Roleplay Mode (Interactive)';
      default: return session.mode;
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (score?: number) => {
    if (!score) return 'N/A';
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pdf-export-content, #pdf-export-content * {
            visibility: visible;
          }
          #pdf-export-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
          h1 {
            color: #dc2626 !important;
          }
          .score-excellent {
            color: #16a34a !important;
          }
          .score-good {
            color: #ca8a04 !important;
          }
          .score-poor {
            color: #dc2626 !important;
          }
        }
        @page {
          margin: 1cm;
        }
      `}</style>

      {/* On-screen UI (hidden in print) */}
      <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Export Session Report</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Print Content */}
          <div id="pdf-export-content" ref={printRef} className="p-8 text-gray-900">
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
              <h1 className="text-4xl font-bold text-red-600 mb-2">AGNES 21</h1>
              <p className="text-xl text-gray-600">Training Session Report</p>
              <p className="text-sm text-gray-500 mt-2">{formatDate(session.timestamp)}</p>
            </div>

            {/* Session Overview */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Session Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Session ID</div>
                  <div className="font-mono text-sm text-gray-700">{session.sessionId}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Duration</div>
                  <div className="font-semibold text-gray-900">{formatDuration(session.duration)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Difficulty Level</div>
                  <div className="font-semibold text-gray-900">{getDifficultyLabel()}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Training Mode</div>
                  <div className="font-semibold text-gray-900">{getModeLabel()}</div>
                </div>
              </div>
            </div>

            {/* Performance Score */}
            {session.finalScore !== undefined && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                  Performance Score
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-sm text-gray-500 uppercase tracking-wider mb-2">Final Score</div>
                  <div className={`text-6xl font-bold ${getScoreColor(session.finalScore)}`}>
                    {session.finalScore}
                  </div>
                  <div className="text-xl text-gray-600 mt-2">
                    {getPerformanceLevel(session.finalScore)}
                  </div>
                </div>
              </div>
            )}

            {/* Script Used */}
            {session.script && session.script !== 'No script' && (
              <div className="mb-8 page-break">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                  Reference Script
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {session.script}
                  </pre>
                </div>
              </div>
            )}

            {/* Conversation Transcript */}
            {session.transcript && session.transcript.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                  Conversation Transcript
                </h2>
                <div className="space-y-4">
                  {session.transcript.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        msg.role === 'agnes'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-sm uppercase tracking-wider ${
                            msg.role === 'agnes' ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {msg.role === 'agnes' ? 'AGNES 21' : 'YOU'}
                          </span>
                          {msg.score && (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getScoreColor(msg.score)} bg-white border`}>
                              Score: {msg.score}/100
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-500">
              <p>Generated by AGNES 21 AI Pitch Trainer</p>
              <p className="mt-1">© 2025 Roof ER Training Platform • Confidential</p>
              <p className="mt-2">
                Report ID: {session.sessionId} • Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionPDFExport;
