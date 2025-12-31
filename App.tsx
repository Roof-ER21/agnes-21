import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import PitchTrainer from './components/PitchTrainer';
import SessionHistory from './components/SessionHistory';
import TeamLeaderboard from './components/TeamLeaderboard';
import ManagerDashboard from './components/ManagerDashboard';
import AllUsersView from './components/AllUsersView';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import MiniModules, { MiniModule } from './components/MiniModules';
import TrainingGoals from './components/TrainingGoals';
import TeamContests from './components/TeamContests';
import SkillTree from './components/SkillTree';
import PerfectWeekChallenge from './components/PerfectWeekChallenge';
import FieldTranslator from './components/FieldTranslator';
import RoleplayDemo from './components/RoleplayDemo';
import ManagerHome from './components/ManagerHome';
import RepHome from './components/RepHome';
import ScriptEditor from './components/ScriptEditor';
import RepHistory from './components/RepHistory';
import { SessionConfig, PitchMode, DifficultyLevel } from './types';
import { Mic, Users, Play, Sparkles, FileText, Edit3, Zap, Shield, Skull, History, Trophy, BarChart3, LogOut, User as UserIcon, Phone, Lock, Globe, Video, ArrowLeft, Home, ShoppingCart, Medal, Headphones } from 'lucide-react';
import { registerServiceWorker } from './utils/pwa';
import { getScriptsByDivision } from './utils/phoneScripts';
import { getUserProgress, isDifficultyUnlocked, getLevelRequiredForDifficulty, isManagerMode, activateManagerMode, deactivateManagerMode } from './utils/gamification';
import { getMiniModulePrompt } from './utils/miniModulePrompts';

const INITIAL_PITCH = `Initial Pitch

5 Non-negotiables with every pitch
• Who you are
• Who we are and what we do (Roof ER)
• Make it relatable
• What you’re there to do (an inspection)
• Go for the close (them agreeing to the inspection)

Knock on door/ring doorbell 
As they are opening the door, smile and wave. 
• "Hi, how are you? My Name is ________ with Roof- ER we’re a local roofing company that specializes in helping homeowners get their roof and/or siding replaced, paid for by their insurance!"

• Generic
• "We’ve had a lot of storms here in Northern Virginia/Maryland over the past few months that have done a lot of damage! 
• "We’re working with a lot of your neighbors in the area. We’ve been able to help them get fully approved through their insurance company to have their roof (and/or siding) replaced."
• OR
• Specific
• "Were you home for the storm we had in ___. Wait for answer
• If yes "It was pretty crazy right?! Wait for answer 
• If no: "Oh no worries at all, we get that all the time.
• If yes move on to next line
• "We’re working with a lot of your neighbors in the area. We’ve been able to help them get fully approved through their insurance company to have their roof (and/or siding) replaced."

• "While I’m here, in the neighborhood, I am conducting a completely free inspection to see if you have similar, qualifiable damage. If you do, I’ll take a bunch of photos and walk you through the rest of the process. If you don’t, I wouldn’t want to waste your time, I wouldn’t want to waste mine! I will at least leave giving you peace of mind that you’re in good shape."
• Once they agree to let you do the inspection:, "Alright! It will take me about 10 - 15 minutes. I’m gonna take a look around the perimeter of your home, then grab the ladder, and take a look at your roof.
• Go in for a handshake. What was your name again? [Their name] great to meet you, again I am (your name). Oh and by the way do you know who your insurance company is"? Wait for their answer, "Great! We work with those guys all the time."
• "I will give you a knock when I finish up and show you what I’ve found."`;

const POST_INSPECTION_PITCH = `Post-Inspection Pitch

• Knock on the door 

• "Hey _______, so I have a bunch of photos to show you. First I walked around the INTEGRITY

• Start showing the pictures of damage to screens, gutters, downspouts, and soft metals

• "While this damage functionally isn’t a big deal, it really helps build a story. Think of us like lawyers and this collateral damage is the evidence that builds the case which helps us get the roof and/or siding approved."
• QUALITY

• "Here are the photos of the damage to your shingles. Anything I have circled means its hail damage (IF there were any wind damaged shingles or missing shingles say:) and anything I have slashed means its wind damage. 

• Remain on a photo of hail damage as you explain the following

• "This is exactly what we look for when we're looking for hail damage. If you notice, the divot is circular in nature. Even if this damage doesn’t look like a big deal, what happens over time, these hail divots fill with water, freeze…., when water freezes it expands and breaks apart the shingle which will eventually lead to leaks. That is why your insurance company is responsible and your policy covers this type of damage." 

• Start slowly swiping through all the pictures of hail. 
SIMPLICITY
• "As you can see there is quite a bit of damage. 

• Start slowly swiping through all the pictures of hail. 

• If there was wind damage or missing shingles, say the following:
• "Now here are the wind damaged shingles. You have both shingles that are creased from the wind lifting them up and shingles that have completely been blown off."

• Show the pictures of wind damaged and/or missing shingles (if applicable)

• "This is very similar to damage to ________ home and/or the rest of the approvals we’ve gotten in the area". 

• "With that being said, insurance companies are always looking for ways to mitigate their losses. It’s unfortunate but that’s how they make money. The most important part of this process is that when your insurance company comes out to run their inspection, we are here as storm experts to make sure you as a homeowner get a fair shake. If they are missing anything we make sure they see all the damage that I just showed you." 

• "What I’m going to do now is run to my car, grab my iPad and we can get this INTEGRITY

• As you approach back to the house/homeowner ask "Is there a place we could sit down for 5-10 Minutes"?
• Once you are in the house, spend some time building rapport as you get settled. 

• "Okay, so first I am going to grab some of your basic information for our system. QUALITY

• Gather information from the homeowner:
• Full name
• Address
• Phone Number 
• E-mail
• Insurance Company

• "Do you happen to know your deductible? If not, no big deal at all"!`;

// Inner component that uses auth context
// View types for role-based navigation
type AppView = 'home' | 'training' | 'history' | 'leaderboard' | 'dashboard' | 'users' | 'translate' | 'demos' | 'scripts';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, viewingDivision, setViewingDivision, isManager } = useAuth();
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showRepHistory, setShowRepHistory] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showManagerDashboard, setShowManagerDashboard] = useState<boolean>(false);
  const [showAllUsers, setShowAllUsers] = useState<boolean>(false);
  const [showTranslator, setShowTranslator] = useState<boolean>(false);
  const [showRoleplayDemo, setShowRoleplayDemo] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<PitchMode>(PitchMode.COACH);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');  // Will be set by useEffect based on division
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.BEGINNER);
  const [customScript, setCustomScript] = useState<string>('');
  const [managerModeActive, setManagerModeActive] = useState<boolean>(isManagerMode());
  const [completedMiniModulesToday, setCompletedMiniModulesToday] = useState<string[]>(() => {
    // Load completed mini-modules from today
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`agnes_mini_modules_${today}`);
    return stored ? JSON.parse(stored) : [];
  });

  const isSuperManager = user?.role === 'manager';
  const activeDivision = (isSuperManager ? viewingDivision : user?.division) || 'insurance';

  // Handle navigation from home pages
  const handleNavigation = (view: string) => {
    switch (view) {
      case 'training':
        setCurrentView('training');
        break;
      case 'history':
        // Managers see all sessions, reps see their personal history
        if (isManager) {
          setShowHistory(true);
        } else {
          setShowRepHistory(true);
        }
        break;
      case 'leaderboard':
        setShowLeaderboard(true);
        break;
      case 'dashboard':
        setShowManagerDashboard(true);
        break;
      case 'users':
        setShowAllUsers(true);
        break;
      case 'translate':
        setShowTranslator(true);
        break;
      case 'demos':
        setShowRoleplayDemo(true);
        break;
      case 'scripts':
        setCurrentView('scripts');
        break;
      default:
        setCurrentView('home');
    }
  };

  // Go back to home
  const goHome = () => {
    setCurrentView('home');
    setShowHistory(false);
    setShowRepHistory(false);
    setShowLeaderboard(false);
    setShowManagerDashboard(false);
    setShowAllUsers(false);
    setShowTranslator(false);
    setShowRoleplayDemo(false);
  };

  // Handle mini-module selection
  const handleMiniModuleSelect = (module: MiniModule) => {
    // Start a mini-module session
    const miniModulePrompt = getMiniModulePrompt(
      module.id,
      selectedDifficulty,
      activeDivision as 'insurance' | 'retail'
    );
    setSessionConfig({
      mode: PitchMode.ROLEPLAY, // Mini-modules are roleplay style
      script: miniModulePrompt,
      difficulty: selectedDifficulty,
      isMiniModule: true,
      miniModuleId: module.id,
      division: activeDivision as 'insurance' | 'retail'
    });
  };

  // Mark mini-module as completed (called from PitchTrainer on session end)
  const markMiniModuleComplete = (moduleId: string) => {
    const today = new Date().toDateString();
    const updated = [...completedMiniModulesToday, moduleId];
    setCompletedMiniModulesToday(updated);
    localStorage.setItem(`agnes_mini_modules_${today}`, JSON.stringify(updated));
  };

  // Handle manager mode toggle
  const handleManagerLogin = () => {
    const code = prompt('Enter manager access code:');
    if (code && activateManagerMode(code)) {
      setManagerModeActive(true);
      alert('Manager mode activated! All difficulty levels are now unlocked.');
    } else if (code) {
      alert('Invalid access code.');
    }
  };

  const handleManagerLogout = () => {
    deactivateManagerMode();
    setManagerModeActive(false);
  };

  // Get user progress for difficulty unlocking
  const userProgress = getUserProgress(user?.id);
  const currentLevel = userProgress.currentLevel;

  // Get scripts filtered by active division (admins switch via toggle)
  const filteredPhoneScripts = useMemo(
    () => getScriptsByDivision(activeDivision as 'insurance' | 'retail'),
    [activeDivision]
  );

  // Built-in scripts (Insurance division only)
  const insuranceBuiltInScripts = [
    {
      id: 'initial',
      title: 'Initial Pitch',
      category: 'Door-to-Door',
      summary: 'The first pitch at the door. Covers the 5 non-negotiables: who you are, who we are, make it relatable, purpose (inspection), and going for the close. Includes both generic and specific storm approaches.',
      content: INITIAL_PITCH
    },
    {
      id: 'post',
      title: 'Post-Inspection Pitch',
      category: 'Follow-Up',
      summary: 'After completing the inspection. Show damage photos, explain hail/wind damage, discuss insurance process, gather homeowner information, and explain next steps with iPad.',
      content: POST_INSPECTION_PITCH
    }
  ];

  // All available scripts with summaries - filter by division
  const allScripts = useMemo(() => [
    // Only include built-in scripts for insurance division
    ...(activeDivision === 'insurance' ? insuranceBuiltInScripts : []),
    // Phone scripts filtered by division
    ...filteredPhoneScripts.map(script => ({
      id: script.id,
      title: script.title,
      category: script.category,
      summary: script.description,
      content: script.content
    })),
    {
      id: 'custom',
      title: 'Custom Script',
      category: 'Custom',
      summary: 'Write or paste your own custom script for specialized training scenarios.',
      content: customScript
    }
  ], [activeDivision, filteredPhoneScripts, customScript]);

  const selectedScript = allScripts.find(s => s.id === selectedScriptId) || allScripts[0];

  // Keep script selection aligned to active division
  useEffect(() => {
    if (!allScripts.length) {
      setSelectedScriptId('');
      return;
    }
    const existsInDivision = allScripts.some(s => s.id === selectedScriptId);
    if (!existsInDivision) {
      setSelectedScriptId(allScripts[0].id);
    }
  }, [allScripts, selectedScriptId]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const getActiveScript = () => {
    if (selectedScriptId === 'custom') {
      return customScript;
    }
    return selectedScript.content;
  };

  const startSession = () => {
    setSessionConfig({
      mode: selectedMode,
      script: getActiveScript().trim() || undefined,
      difficulty: selectedDifficulty,
      division: activeDivision as 'insurance' | 'retail'
    });
  };

  const resetSession = () => {
    setSessionConfig(null);
  };

  if (sessionConfig) {
    return (
      <PitchTrainer
        config={sessionConfig}
        onEndSession={resetSession}
        onMiniModuleComplete={sessionConfig.isMiniModule ? markMiniModuleComplete : undefined}
      />
    );
  }

  if (showTranslator) {
    return <FieldTranslator onBack={goHome} />;
  }

  if (showRoleplayDemo) {
    return <RoleplayDemo onBack={goHome} />;
  }

  if (showHistory) {
    return <SessionHistory onBack={goHome} />;
  }

  if (showRepHistory) {
    return <RepHistory onBack={goHome} />;
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={goHome}
            className="group flex items-center space-x-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-900/50 rounded-full transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-white" />
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-white">Home</span>
          </button>
        </div>
        <TeamLeaderboard currentUserId="user_0" />
      </div>
    );
  }

  if (showManagerDashboard) {
    return <ManagerDashboard onBack={goHome} />;
  }

  if (showAllUsers) {
    return <AllUsersView onBack={goHome} />;
  }

  // Script Editor (managers only)
  if (currentView === 'scripts') {
    return <ScriptEditor onBack={goHome} />;
  }

  // Role-based home pages
  if (currentView === 'home') {
    // Common header for home pages
    const homeHeader = (
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        {/* Manager Division Toggle */}
        {isSuperManager && (
          <div className="flex items-center bg-neutral-900/90 rounded-full border border-neutral-700 p-1">
            <button
              onClick={() => setViewingDivision('insurance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                viewingDivision === 'insurance'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Home className="w-3 h-3" />
              <span>Insurance</span>
            </button>
            <button
              onClick={() => setViewingDivision('retail')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                viewingDivision === 'retail'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3 h-3" />
              <span>Retail</span>
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2 px-3 py-2 bg-neutral-900/80 rounded-full border border-neutral-800">
          <span className="text-lg">{user?.avatar}</span>
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">{user?.name}</span>
        </div>
        <button
          onClick={logout}
          className="p-2 bg-neutral-900 hover:bg-red-900/30 border border-neutral-700 hover:border-red-500/50 rounded-full transition-all duration-300"
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-neutral-400 hover:text-red-500" />
        </button>
      </div>
    );

    if (isManager) {
      return (
        <>
          {homeHeader}
          <ManagerHome onNavigate={handleNavigation} />
        </>
      );
    } else {
      return (
        <>
          {homeHeader}
          <RepHome onNavigate={handleNavigation} />
        </>
      );
    }
  }

  // Training configuration view (accessible from home navigation)
  if (currentView !== 'training') {
    // Fallback to training view for unknown views
    setCurrentView('training');
  }

  // Training configuration screen
  return (
    <div className="min-h-screen bg-black text-neutral-100 overflow-y-auto font-sans selection:bg-red-600/40 selection:text-white">
      {/* Back to Home button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={goHome}
          className="group flex items-center space-x-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-900/50 rounded-full transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-white" />
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-white">Home</span>
        </button>
      </div>

      {/* Skip to main content link - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <div id="main-content" className="max-w-6xl w-full mx-auto space-y-12 py-10 px-6">
        {/* Header */}
        <div className="text-center space-y-6">
          {/* Centered Badge with Division */}
            <div className="flex justify-center items-center gap-3">
              <div className="inline-flex items-center justify-center px-4 py-1.5 bg-neutral-900 rounded-full border border-red-900/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]">
                 <Sparkles className="w-4 h-4 text-red-500 mr-2" />
                 <span className="text-red-200 font-mono text-xs tracking-widest uppercase">Agnes 21 // AI Trainer</span>
              </div>
              {/* Division Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg ${
              activeDivision === 'retail'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/25'
                : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/25'
            }`}>
              {activeDivision === 'retail' ? (
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
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
            TRD <span className="text-red-600">AGNES 21</span>
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto font-light">
            Master your delivery with Agnes 21. <br/>
            <span className="text-neutral-500 text-base">Real-time analysis. Brutally honest feedback.</span>
          </p>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Column 1: Mode Selection */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-[0.2em] ml-1">01 // Objective</h2>
            <div className="grid gap-4">
              <button 
                onClick={() => setSelectedMode(PitchMode.COACH)}
                className={`relative group p-5 rounded-xl border-2 text-left transition-all duration-300 ${selectedMode === PitchMode.COACH ? 'border-red-600 bg-neutral-900 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : 'border-neutral-800 bg-black hover:border-neutral-600'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg transition-colors ${selectedMode === PitchMode.COACH ? 'bg-red-600 text-white' : 'bg-neutral-900 text-neutral-500'}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Feedback</h3>
                    <p className="text-neutral-400 text-xs mt-1">Real-time coaching & tips.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMode(PitchMode.ROLEPLAY)}
                className={`relative group p-5 rounded-xl border-2 text-left transition-all duration-300 ${selectedMode === PitchMode.ROLEPLAY ? 'border-red-600 bg-neutral-900 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : 'border-neutral-800 bg-black hover:border-neutral-600'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg transition-colors ${selectedMode === PitchMode.ROLEPLAY ? 'bg-red-600 text-white' : 'bg-neutral-900 text-neutral-500'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Roleplay</h3>
                    <p className="text-neutral-400 text-xs mt-1">Interactive simulation.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMode(PitchMode.JUST_LISTEN)}
                className={`relative group p-5 rounded-xl border-2 text-left transition-all duration-300 ${selectedMode === PitchMode.JUST_LISTEN ? 'border-red-600 bg-neutral-900 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : 'border-neutral-800 bg-black hover:border-neutral-600'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg transition-colors ${selectedMode === PitchMode.JUST_LISTEN ? 'bg-red-600 text-white' : 'bg-neutral-900 text-neutral-500'}`}>
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Just Listen</h3>
                    <p className="text-neutral-400 text-xs mt-1">Full run-through, scored at end.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

           {/* Column 2: Difficulty Selection */}
           <div className="space-y-6">
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-[0.2em] ml-1">02 // Difficulty</h2>
            <div className="grid gap-3">
              {/* Beginner */}
              <button
                onClick={() => setSelectedDifficulty(DifficultyLevel.BEGINNER)}
                className={`p-4 rounded-xl border-l-4 text-left transition-all duration-300 flex items-center justify-between ${selectedDifficulty === DifficultyLevel.BEGINNER ? 'border-l-cyan-500 bg-neutral-900 border-y border-r border-neutral-800' : 'border-l-neutral-700 bg-black border-y border-r border-neutral-900 hover:bg-neutral-900'}`}
              >
                 <div>
                   <div className="flex items-center space-x-2">
                      <Sparkles className={`w-4 h-4 ${selectedDifficulty === DifficultyLevel.BEGINNER ? 'text-cyan-500' : 'text-neutral-500'}`} />
                      <h3 className="font-bold text-sm text-white">BEGINNER</h3>
                   </div>
                   <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">Learning • No Pressure • Guided</p>
                 </div>
                 {selectedDifficulty === DifficultyLevel.BEGINNER && <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>}
              </button>

              {/* Rookie */}
              <button
                onClick={() => setSelectedDifficulty(DifficultyLevel.ROOKIE)}
                className={`p-4 rounded-xl border-l-4 text-left transition-all duration-300 flex items-center justify-between ${selectedDifficulty === DifficultyLevel.ROOKIE ? 'border-l-green-500 bg-neutral-900 border-y border-r border-neutral-800' : 'border-l-neutral-700 bg-black border-y border-r border-neutral-900 hover:bg-neutral-900'}`}
              >
                 <div>
                   <div className="flex items-center space-x-2">
                      <Shield className={`w-4 h-4 ${selectedDifficulty === DifficultyLevel.ROOKIE ? 'text-green-500' : 'text-neutral-500'}`} />
                      <h3 className="font-bold text-sm text-white">ROOKIE</h3>
                   </div>
                   <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">Friendly • Patient • Helpful</p>
                 </div>
                 {selectedDifficulty === DifficultyLevel.ROOKIE && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
              </button>

              {/* Pro */}
              <button
                onClick={() => setSelectedDifficulty(DifficultyLevel.PRO)}
                className={`p-4 rounded-xl border-l-4 text-left transition-all duration-300 flex items-center justify-between ${selectedDifficulty === DifficultyLevel.PRO ? 'border-l-yellow-500 bg-neutral-900 border-y border-r border-neutral-800' : 'border-l-neutral-700 bg-black border-y border-r border-neutral-900 hover:bg-neutral-900'}`}
              >
                 <div>
                   <div className="flex items-center space-x-2">
                      <Zap className={`w-4 h-4 ${selectedDifficulty === DifficultyLevel.PRO ? 'text-yellow-500' : 'text-neutral-500'}`} />
                      <h3 className="font-bold text-sm text-white">PRO</h3>
                   </div>
                   <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">Busy • Realistic • Standard</p>
                 </div>
                 {selectedDifficulty === DifficultyLevel.PRO && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>}
              </button>

              {/* Veteran */}
              <button
                onClick={() => setSelectedDifficulty(DifficultyLevel.VETERAN)}
                className={`p-4 rounded-xl border-l-4 text-left transition-all duration-300 flex items-center justify-between ${selectedDifficulty === DifficultyLevel.VETERAN ? 'border-l-orange-500 bg-neutral-900 border-y border-r border-neutral-800' : 'border-l-neutral-700 bg-black border-y border-r border-neutral-900 hover:bg-neutral-900'}`}
              >
                 <div>
                   <div className="flex items-center space-x-2">
                      <Medal className={`w-4 h-4 ${selectedDifficulty === DifficultyLevel.VETERAN ? 'text-orange-500' : 'text-neutral-500'}`} />
                      <h3 className="font-bold text-sm text-white">VETERAN</h3>
                   </div>
                   <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">Challenging • Skeptical • Fair</p>
                 </div>
                 {selectedDifficulty === DifficultyLevel.VETERAN && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>}
              </button>

              {/* Elite */}
              <button
                onClick={() => setSelectedDifficulty(DifficultyLevel.ELITE)}
                className={`p-4 rounded-xl border-l-4 text-left transition-all duration-300 flex items-center justify-between ${selectedDifficulty === DifficultyLevel.ELITE ? 'border-l-red-600 bg-neutral-900 border-y border-r border-neutral-800' : 'border-l-neutral-700 bg-black border-y border-r border-neutral-900 hover:bg-neutral-900'}`}
              >
                 <div>
                   <div className="flex items-center space-x-2">
                      <Skull className={`w-4 h-4 ${selectedDifficulty === DifficultyLevel.ELITE ? 'text-red-600' : 'text-neutral-500'}`} />
                      <h3 className="font-bold text-sm text-white">ELITE</h3>
                   </div>
                   <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">Hostile • Expert • One Chance</p>
                 </div>
                 {selectedDifficulty === DifficultyLevel.ELITE && <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>}
              </button>
            </div>
          </div>

          {/* Column 3: Script Selection */}
          <div className="space-y-6">
             <h2 className="text-xs font-bold text-red-500 uppercase tracking-[0.2em] ml-1">03 // Script</h2>
             <div className="flex flex-col h-[260px] bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden">
                {/* Script Dropdown */}
                <div className="border-b border-neutral-800 bg-black p-3">
                  <select
                    value={selectedScriptId}
                    onChange={(e) => setSelectedScriptId(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                  >
                    {/* Door-to-Door scripts (Insurance only) */}
                    {activeDivision === 'insurance' && (
                      <optgroup label="Door-to-Door">
                        <option value="initial">Initial Pitch</option>
                        <option value="post">Post-Inspection Pitch</option>
                      </optgroup>
                    )}
                    <optgroup label="Phone Scripts">
                      {filteredPhoneScripts.map(script => (
                        <option key={script.id} value={script.id}>{script.title}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Custom">
                      <option value="custom">Custom Script</option>
                    </optgroup>
                  </select>
                </div>

                {/* Script Preview/Editor */}
                <div className="flex-1 p-4 overflow-y-auto scrollbar-hide bg-neutral-950">
                  {selectedScriptId === 'custom' ? (
                    <textarea
                      value={customScript}
                      onChange={(e) => setCustomScript(e.target.value)}
                      placeholder="Write or paste your custom script here..."
                      className="w-full h-full bg-transparent text-neutral-300 placeholder-neutral-700 focus:outline-none resize-none text-xs font-mono leading-relaxed"
                    />
                  ) : (
                    <div className="space-y-3">
                      {/* Script Title */}
                      <div className="flex items-center space-x-2 pb-2 border-b border-neutral-800">
                        <FileText className="w-4 h-4 text-red-500" />
                        <h3 className="text-sm font-bold text-white">{selectedScript.title}</h3>
                      </div>

                      {/* Category Badge */}
                      <div className="inline-block px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 uppercase tracking-wider">
                        {selectedScript.category}
                      </div>

                      {/* Summary */}
                      <p className="text-neutral-300 text-xs leading-relaxed">
                        {selectedScript.summary}
                      </p>

                      {/* Full script hint */}
                      <div className="pt-2 border-t border-neutral-800">
                        <p className="text-neutral-500 text-xs italic flex items-center space-x-1">
                          <Play className="w-3 h-3" />
                          <span>Full script will be available during training session</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Quick Practice - Mini Modules */}
        <div className="mt-8 px-4">
          <MiniModules
            onSelectModule={handleMiniModuleSelect}
            completedToday={completedMiniModulesToday}
            division={activeDivision as 'insurance' | 'retail'}
          />
        </div>

        {/* Perfect Week Challenge */}
        <div className="mt-8 px-4">
          <PerfectWeekChallenge userId={user?.id || 'guest'} />
        </div>

        {/* Training Goals */}
        <div className="mt-8 px-4">
          <TrainingGoals userId={user?.id || 'guest'} />
        </div>

        {/* Team Contests */}
        <div className="mt-8 px-4">
          <TeamContests
            userId={user?.id || 'guest'}
            userName={user?.name || 'Guest'}
            isManager={managerModeActive}
          />
        </div>

        {/* Skill Tree */}
        <div className="mt-8 px-4">
          <SkillTree userId={user?.id || 'guest'} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 pt-8 px-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>
          <span className="text-neutral-600 text-xs uppercase tracking-widest">Or Full Session</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>
        </div>

        {/* Start Button */}
        <div className="flex flex-col items-center pt-6">
          <button
            onClick={startSession}
            className="group relative inline-flex items-center justify-center px-20 py-6 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-full hover:from-red-700 hover:to-red-600 hover:border-red-500 hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:scale-105"
          >
            <span className="tracking-[0.2em] uppercase text-sm">Initialize Agnes 21</span>
            <Play className="w-4 h-4 ml-3 fill-white" />
          </button>
          <p className="mt-4 text-neutral-600 text-xs uppercase tracking-widest">Camera & Microphone Permissions Required</p>
        </div>

      </div>
      
      <footer className="mt-16 text-neutral-800 text-[10px] font-mono uppercase tracking-widest">
        Agnes 21 v3.0 // Gamified Pitch Training Engine
      </footer>
    </div>
  );
};

// Main App component wrapped with AuthProvider
const App: React.FC = () => {
  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <AuthProvider>
      <AppContent />
      <PWAInstallPrompt />
    </AuthProvider>
  );
};

export default App;
