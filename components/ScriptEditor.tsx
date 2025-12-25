/**
 * Script Editor - Full CRUD for Training Scripts
 * Managers can create, edit, preview, and delete training scripts
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Save,
  X,
  Search,
  ArrowLeft,
  Tag,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PHONE_SCRIPTS } from '../utils/phoneScripts';

// Script type definition
interface Script {
  id: string;
  title: string;
  category: 'door-to-door' | 'phone' | 'objection' | 'follow-up' | 'custom';
  content: string;
  description: string;
  difficulty: 'all' | 'beginner' | 'rookie' | 'pro' | 'elite';
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Storage key
const SCRIPTS_STORAGE_KEY = 'agnes_custom_scripts';

// Default system scripts (read-only)
const SYSTEM_SCRIPTS: Script[] = [
  {
    id: 'sys-initial',
    title: 'Initial Door Pitch',
    category: 'door-to-door',
    content: `Initial Pitch

5 Non-negotiables with every pitch
• Who you are
• Who we are and what we do (Roof ER)
• Make it relatable
• What you're there to do (an inspection)
• Go for the close (them agreeing to the inspection)

Knock on door/ring doorbell
As they are opening the door, smile and wave.
• "Hi, how are you? My Name is ________ with Roof-ER we're a local roofing company that specializes in helping homeowners get their roof and/or siding replaced, paid for by their insurance!"

• Generic
• "We've had a lot of storms here in Northern Virginia/Maryland over the past few months that have done a lot of damage!
• "We're working with a lot of your neighbors in the area. We've been able to help them get fully approved through their insurance company to have their roof (and/or siding) replaced."
• OR
• Specific
• "Were you home for the storm we had in ___. Wait for answer
• If yes "It was pretty crazy right?! Wait for answer
• If no: "Oh no worries at all, we get that all the time.
• If yes move on to next line
• "We're working with a lot of your neighbors in the area. We've been able to help them get fully approved through their insurance company to have their roof (and/or siding) replaced."

• "While I'm here, in the neighborhood, I am conducting a completely free inspection to see if you have similar, qualifiable damage. If you do, I'll take a bunch of photos and walk you through the rest of the process. If you don't, I wouldn't want to waste your time, I wouldn't want to waste mine! I will at least leave giving you peace of mind that you're in good shape."
• Once they agree to let you do the inspection:, "Alright! It will take me about 10 - 15 minutes. I'm gonna take a look around the perimeter of your home, then grab the ladder, and take a look at your roof.
• Go in for a handshake. What was your name again? [Their name] great to meet you, again I am (your name). Oh and by the way do you know who your insurance company is"? Wait for their answer, "Great! We work with those guys all the time."
• "I will give you a knock when I finish up and show you what I've found."`,
    description: 'The primary door-to-door pitch covering the 5 non-negotiables',
    difficulty: 'all',
    tags: ['door-to-door', 'initial', 'core'],
    createdBy: 'system',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isActive: true
  },
  {
    id: 'sys-post-inspection',
    title: 'Post-Inspection Pitch',
    category: 'follow-up',
    content: `Post-Inspection Pitch

• Knock on the door
• "Hey _______, so I have a bunch of photos to show you. First I walked around the INTEGRITY

• Start showing the pictures of damage to screens, gutters, downspouts, and soft metals

• "While this damage functionally isn't a big deal, it really helps build a story. Think of us like lawyers and this collateral damage is the evidence that builds the case which helps us get the roof and/or siding approved."

• "Here are the photos of the damage to your shingles. Anything I have circled means its hail damage (IF there were any wind damaged shingles or missing shingles say:) and anything I have slashed means its wind damage.

• "This is exactly what we look for when we're looking for hail damage. If you notice, the divot is circular in nature. Even if this damage doesn't look like a big deal, what happens over time, these hail divots fill with water, freeze…., when water freezes it expands and breaks apart the shingle which will eventually lead to leaks. That is why your insurance company is responsible and your policy covers this type of damage."

• "As you can see there is quite a bit of damage.`,
    description: 'Follow-up pitch after completing the roof inspection',
    difficulty: 'pro',
    tags: ['follow-up', 'post-inspection', 'photos'],
    createdBy: 'system',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isActive: true
  }
];

// Convert phone scripts to Script format and merge with system scripts
const convertedPhoneScripts: Script[] = PHONE_SCRIPTS.map(ps => ({
  id: `sys-phone-${ps.id}`,
  title: ps.title,
  category: 'phone' as const,
  content: ps.content,
  description: ps.description,
  difficulty: 'all' as const,
  tags: [ps.category, 'phone'],
  createdBy: 'system',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  isActive: true
}));

// All system scripts (built-in + phone scripts)
const ALL_SYSTEM_SCRIPTS: Script[] = [...SYSTEM_SCRIPTS, ...convertedPhoneScripts];

// Helper functions
const generateId = (): string => `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getStoredScripts = (): Script[] => {
  try {
    const stored = localStorage.getItem(SCRIPTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveScripts = (scripts: Script[]): void => {
  localStorage.setItem(SCRIPTS_STORAGE_KEY, JSON.stringify(scripts));
};

interface ScriptEditorProps {
  onBack: () => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'custom' as Script['category'],
    content: '',
    description: '',
    difficulty: 'all' as Script['difficulty'],
    tags: ''
  });

  // Load scripts on mount
  useEffect(() => {
    const customScripts = getStoredScripts();
    setScripts([...ALL_SYSTEM_SCRIPTS, ...customScripts]);
  }, []);

  // Filter scripts
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || script.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Open editor for new script
  const handleNewScript = () => {
    setFormData({
      title: '',
      category: 'custom',
      content: '',
      description: '',
      difficulty: 'all',
      tags: ''
    });
    setCurrentScript(null);
    setIsEditing(true);
    setIsPreviewing(false);
  };

  // Open editor for existing script
  const handleEditScript = (script: Script) => {
    if (script.createdBy === 'system') {
      alert('System scripts cannot be edited. You can duplicate them instead.');
      return;
    }
    setFormData({
      title: script.title,
      category: script.category,
      content: script.content,
      description: script.description,
      difficulty: script.difficulty,
      tags: script.tags.join(', ')
    });
    setCurrentScript(script);
    setIsEditing(true);
    setIsPreviewing(false);
  };

  // Preview script
  const handlePreviewScript = (script: Script) => {
    setCurrentScript(script);
    setIsPreviewing(true);
    setIsEditing(false);
  };

  // Save script
  const handleSaveScript = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required.');
      return;
    }

    const now = new Date().toISOString();
    const customScripts = getStoredScripts();

    if (currentScript) {
      // Update existing script
      const updatedScripts = customScripts.map(s =>
        s.id === currentScript.id
          ? {
              ...s,
              title: formData.title,
              category: formData.category,
              content: formData.content,
              description: formData.description,
              difficulty: formData.difficulty,
              tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
              updatedAt: now
            }
          : s
      );
      saveScripts(updatedScripts);
      setScripts([...ALL_SYSTEM_SCRIPTS, ...updatedScripts]);
    } else {
      // Create new script
      const newScript: Script = {
        id: generateId(),
        title: formData.title,
        category: formData.category,
        content: formData.content,
        description: formData.description,
        difficulty: formData.difficulty,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdBy: user?.id || 'unknown',
        createdAt: now,
        updatedAt: now,
        isActive: true
      };
      const updatedScripts = [...customScripts, newScript];
      saveScripts(updatedScripts);
      setScripts([...ALL_SYSTEM_SCRIPTS, ...updatedScripts]);
    }

    setIsEditing(false);
    setCurrentScript(null);
  };

  // Delete script
  const handleDeleteScript = (script: Script) => {
    if (script.createdBy === 'system') {
      alert('System scripts cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${script.title}"?`)) {
      return;
    }

    const customScripts = getStoredScripts().filter(s => s.id !== script.id);
    saveScripts(customScripts);
    setScripts([...ALL_SYSTEM_SCRIPTS, ...customScripts]);
  };

  // Duplicate script
  const handleDuplicateScript = (script: Script) => {
    const now = new Date().toISOString();
    const newScript: Script = {
      ...script,
      id: generateId(),
      title: `${script.title} (Copy)`,
      createdBy: user?.id || 'unknown',
      createdAt: now,
      updatedAt: now
    };

    const customScripts = [...getStoredScripts(), newScript];
    saveScripts(customScripts);
    setScripts([...ALL_SYSTEM_SCRIPTS, ...customScripts]);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'door-to-door': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'phone': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'objection': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'follow-up': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default: return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/50';
    }
  };

  // Editor view
  if (isEditing) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Cancel</span>
            </button>
            <h1 className="text-xl font-bold">
              {currentScript ? 'Edit Script' : 'New Script'}
            </h1>
            <button
              onClick={handleSaveScript}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="Script title..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Script['category'] })}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                >
                  <option value="door-to-door">Door-to-Door</option>
                  <option value="phone">Phone</option>
                  <option value="objection">Objection Handling</option>
                  <option value="follow-up">Follow-Up</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Script['difficulty'] })}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="rookie">Rookie</option>
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="Brief description of the script..."
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="tag1, tag2, tag3..."
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full h-96 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500 font-mono text-sm"
                placeholder="Enter the full script content..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preview view
  if (isPreviewing && currentScript) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsPreviewing(false)}
              className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-2">
              {currentScript.createdBy !== 'system' && (
                <button
                  onClick={() => handleEditScript(currentScript)}
                  className="flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={() => handleDuplicateScript(currentScript)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Duplicate</span>
              </button>
            </div>
          </div>

          {/* Script Info */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{currentScript.title}</h1>

            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs border ${getCategoryColor(currentScript.category)}`}>
                {currentScript.category}
              </span>
              {currentScript.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400">
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-neutral-400">{currentScript.description}</p>

            <div className="flex items-center space-x-4 text-xs text-neutral-500">
              <span className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{currentScript.createdBy === 'system' ? 'System' : 'Custom'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Updated {new Date(currentScript.updatedAt).toLocaleDateString()}</span>
              </span>
            </div>

            {/* Script Content */}
            <div className="mt-6 p-6 bg-neutral-900/80 border border-neutral-800 rounded-xl">
              <pre className="whitespace-pre-wrap font-mono text-sm text-neutral-300 leading-relaxed">
                {currentScript.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                <FileText className="w-6 h-6 text-purple-400" />
                <span>Script Editor</span>
              </h1>
              <p className="text-sm text-neutral-500">{scripts.length} scripts available</p>
            </div>
          </div>

          <button
            onClick={handleNewScript}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Script</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="Search scripts..."
              />
            </div>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-red-500"
          >
            <option value="all">All Categories</option>
            <option value="door-to-door">Door-to-Door</option>
            <option value="phone">Phone</option>
            <option value="objection">Objection Handling</option>
            <option value="follow-up">Follow-Up</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Scripts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScripts.map(script => (
            <div
              key={script.id}
              className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 rounded text-xs border ${getCategoryColor(script.category)}`}>
                  {script.category}
                </span>
                {script.createdBy === 'system' && (
                  <span className="text-xs text-neutral-500">System</span>
                )}
              </div>

              <h3 className="text-lg font-bold mb-2">{script.title}</h3>
              <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{script.description}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {script.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-500">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <button
                  onClick={() => handlePreviewScript(script)}
                  className="flex items-center space-x-1 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center space-x-2">
                  {script.createdBy !== 'system' && (
                    <>
                      <button
                        onClick={() => handleEditScript(script)}
                        className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScript(script)}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDuplicateScript(script)}
                    className="p-2 text-neutral-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredScripts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-500">No scripts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptEditor;
