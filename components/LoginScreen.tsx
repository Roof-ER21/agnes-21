/**
 * Login and Registration Screen for Agnes-21
 * Handles PIN-based authentication
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createUser,
  validatePIN,
  checkRateLimit,
  AVATAR_EMOJIS,
  getRandomAvatar
} from '../utils/auth';
import { Lock, UserPlus, LogIn, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

type Mode = 'login' | 'register';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [role, setRole] = useState<'trainee' | 'manager'>('trainee');
  const [avatar, setAvatar] = useState(getRandomAvatar());
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  // Manager access code
  const MANAGER_ACCESS_CODE = '212124';
  const isManagerUnlocked = accessCode === MANAGER_ACCESS_CODE;

  const nameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, [mode]);

  // Check rate limit on mount and update countdown
  useEffect(() => {
    const checkLimit = () => {
      const rateLimit = checkRateLimit();
      if (!rateLimit.allowed) {
        setLocked(true);
        setLockTimeRemaining(rateLimit.timeRemaining || 0);
      } else {
        setLocked(false);
        setLockTimeRemaining(0);
      }
    };

    checkLimit();
    const interval = setInterval(checkLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate name
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    // Validate PIN - only enforce strict rules during registration
    if (mode === 'register') {
      const pinValidation = validatePIN(pin);
      if (!pinValidation.valid) {
        setError(pinValidation.error || 'Invalid PIN');
        return;
      }
    } else {
      // For login, just check length
      if (pin.length < 4 || pin.length > 6) {
        setError('PIN must be 4-6 digits');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        // Registration
        if (pin !== confirmPin) {
          setError('PINs do not match');
          setLoading(false);
          return;
        }

        createUser(name.trim(), pin, role, avatar);
        setSuccess(`Account created! Welcome, ${name}!`);

        // Auto-login after registration
        setTimeout(async () => {
          const result = await login(name.trim(), pin);
          if (!result.success) {
            setError(result.error || 'Login failed after registration');
          }
          setLoading(false);
        }, 1500);
      } else {
        // Login
        const result = await login(name.trim(), pin);

        if (!result.success) {
          setError(result.error || 'Invalid username or PIN');
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const handlePinInput = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      setPin(numericValue);
    }
  };

  const handleConfirmPinInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      setConfirmPin(numericValue);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setName('');
    setPin('');
    setConfirmPin('');
    setAccessCode('');
    setRole('trainee');
    setError('');
    setSuccess('');
  };

  const getPinStrength = (pin: string): { label: string; color: string; width: string } => {
    if (pin.length < 4) return { label: '', color: '', width: '0%' };

    const validation = validatePIN(pin);
    if (!validation.valid) {
      return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    }

    if (pin.length === 4) {
      return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    }

    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const pinStrength = mode === 'register' ? getPinStrength(pin) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mb-2 tracking-tight">
            AGNES 21
          </h1>
          <p className="text-neutral-400 text-sm font-mono uppercase tracking-widest">
            AI Pitch Training Platform
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-neutral-900/80 backdrop-blur-lg border border-neutral-800 rounded-2xl shadow-2xl p-8">
          {/* Mode Tabs */}
          <div className="flex border-b border-neutral-800 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 text-sm font-mono uppercase tracking-wider transition-all ${
                mode === 'login'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <LogIn className="w-4 h-4 inline-block mr-2" />
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 text-sm font-mono uppercase tracking-wider transition-all ${
                mode === 'register'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <UserPlus className="w-4 h-4 inline-block mr-2" />
              Register
            </button>
          </div>

          {/* Lockout message */}
          {locked && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium mb-1">Too Many Failed Attempts</p>
                <p className="text-xs text-red-400/80">
                  Please wait {lockTimeRemaining} minute{lockTimeRemaining !== 1 ? 's' : ''} before trying again.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && !locked && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar selection (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all ${
                        avatar === emoji
                          ? 'bg-red-600 scale-110'
                          : 'bg-neutral-800 hover:bg-neutral-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
                Name
              </label>
              <input
                ref={nameInputRef}
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || locked}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Access Code (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-neutral-300 mb-2">
                  Access Code
                </label>
                <input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  placeholder="Enter 6-digit access code"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono text-lg tracking-widest"
                />
                {isManagerUnlocked && (
                  <p className="mt-2 text-xs text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Manager access unlocked
                  </p>
                )}
                {accessCode.length === 6 && !isManagerUnlocked && (
                  <p className="mt-2 text-xs text-neutral-400">
                    Regular access - Rep role only
                  </p>
                )}
              </div>
            )}

            {/* Role selection (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('trainee')}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      role === 'trainee'
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                    } disabled:opacity-50`}
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-sm font-medium text-white">Sales Rep</div>
                    <div className="text-xs text-neutral-400 mt-1">Practice pitches</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    disabled={loading || !isManagerUnlocked}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
                      role === 'manager'
                        ? 'border-red-500 bg-red-500/10'
                        : isManagerUnlocked
                        ? 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                        : 'border-neutral-800 bg-neutral-900/50 cursor-not-allowed'
                    } disabled:opacity-50`}
                  >
                    {!isManagerUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded-lg">
                        <Lock className="w-6 h-6 text-neutral-600" />
                      </div>
                    )}
                    <div className="text-2xl mb-2">👔</div>
                    <div className="text-sm font-medium text-white">Manager</div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {isManagerUnlocked ? 'View all analytics' : 'Enter access code'}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* PIN input */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-neutral-300 mb-2">
                PIN (4-6 digits)
              </label>
              <div className="relative">
                <input
                  ref={pinInputRef}
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                  disabled={loading || locked}
                  placeholder="Enter 4-6 digit PIN"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-12 font-mono text-lg tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* PIN strength indicator (register only) */}
              {mode === 'register' && pin.length > 0 && pinStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-400">PIN Strength</span>
                    <span className={`text-xs font-medium ${
                      pinStrength.label === 'Weak' ? 'text-red-400' :
                      pinStrength.label === 'Medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {pinStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pinStrength.color} transition-all duration-300`}
                      style={{ width: pinStrength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm PIN (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPin" className="block text-sm font-medium text-neutral-300 mb-2">
                  Confirm PIN
                </label>
                <div className="relative">
                  <input
                    id="confirmPin"
                    type={showConfirmPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => handleConfirmPinInput(e.target.value)}
                    disabled={loading || locked}
                    placeholder="Re-enter your PIN"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-12 font-mono text-lg tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPin && pin !== confirmPin && (
                  <p className="mt-2 text-xs text-red-400">PINs do not match</p>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || locked || !name.trim() || pin.length < 4 || (mode === 'register' && (pin !== confirmPin || !validatePIN(pin).valid))}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-neutral-700 disabled:to-neutral-700 text-white font-mono uppercase tracking-wider rounded-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>{mode === 'login' ? 'Logging in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              disabled={loading}
              className="text-sm text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center text-xs text-neutral-500">
          <Lock className="w-3 h-3 inline-block mr-1" />
          Your PIN is securely encrypted and stored locally on your device
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
