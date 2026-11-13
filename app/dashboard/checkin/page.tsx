  'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, Zap, ShieldAlert, Sparkles, Activity, Heart, Clock, 
  Smile, Frown, Battery, CheckCircle2, ChevronRight, Apple, 
  Smartphone, RefreshCw, AlertTriangle, Info, ArrowUpRight,
  Copy, Check, ExternalLink, ShieldCheck, Terminal, Layers
} from 'lucide-react';
import { calculateBurnout, BurnoutAssessment } from '@/lib/burnout-engine';

export default function CheckInPage() {
  const [sleepHours, setSleepHours] = useState<number>(7.0);
  const [deepSleepMin, setDeepSleepMin] = useState<number>(65);
  const [restingHeartRate, setRestingHeartRate] = useState<number>(68);
  const [hrv, setHrv] = useState<number>(55);
  const [stress, setStress] = useState<number>(3);
  const [focus, setFocus] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [showAdvancedVitals, setShowAdvancedVitals] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  
  // Sync Modal Tabs: 'apple' | 'android' | 'history'
  const [syncTab, setSyncTab] = useState<'apple' | 'android' | 'history'>('apple');
  const [syncToken, setSyncToken] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync test & Google Fit states
  const [isTestingApple, setIsTestingApple] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [assessment, setAssessment] = useState<BurnoutAssessment | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Calculate live burnout on parameter changes
  useEffect(() => {
    const live = calculateBurnout({
      sleepHours,
      deepSleepMin: showAdvancedVitals ? deepSleepMin : null,
      restingHeartRate: showAdvancedVitals ? restingHeartRate : null,
      hrv: showAdvancedVitals ? hrv : null,
      stressLevel: stress,
      focusLevel: focus,
      energyLevel: energy,
      recentHistory: history.map((h) => ({
        date: h.date,
        sleepHours: h.sleepHours,
        stressLevel: h.stressLevel,
      })),
    });
    setAssessment(live);
  }, [sleepHours, deepSleepMin, restingHeartRate, hrv, stress, focus, energy, showAdvancedVitals, history]);

  // Load existing metrics & webhook credentials on mount
  const loadData = async () => {
    try {
      const res = await fetch('/api/health/sync');
      if (res.ok) {
        const data = await res.json();
        if (data.history) setHistory(data.history);
        if (data.latest) {
          setSleepHours(data.latest.sleepHours);
          setStress(data.latest.stressLevel);
          setFocus(data.latest.focusLevel);
          setEnergy(data.latest.energyLevel);
          if (data.latest.deepSleepMin) setDeepSleepMin(data.latest.deepSleepMin);
          if (data.latest.restingHeartRate) setRestingHeartRate(data.latest.restingHeartRate);
          if (data.latest.hrv) setHrv(data.latest.hrv);
        }
      }
    } catch (err) {
      console.error("Failed to load health metrics", err);
    }
  };

  useEffect(() => {
    loadData();

    // Fetch student's personal webhook token
    async function loadToken() {
      try {
        const res = await fetch('/api/health/token');
        if (res.ok) {
          const json = await res.json();
          setSyncToken(json.syncToken);
          setWebhookUrl(json.webhookUrl);
        }
      } catch (err) {
        console.error("Failed to load sync token", err);
      }
    }
    loadToken();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Test Apple HealthKit Payload via Webhook
  const handleTestAppleHealth = async () => {
    setIsTestingApple(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/health/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${syncToken}`,
        },
        body: JSON.stringify({
          source: 'apple_health',
          sleepHours: 7.8,
          deepSleepMin: 85,
          restingHeartRate: 61,
          hrv: 68,
          steps: 9420,
          stressLevel: 2,
          focusLevel: 4,
          energyLevel: 4,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSleepHours(7.8);
        setDeepSleepMin(85);
        setRestingHeartRate(61);
        setHrv(68);
        setShowAdvancedVitals(true);
        setSyncStatusMsg({
          type: 'success',
          text: '✓ Apple HealthKit payload verified! 7.8h sleep & 68ms HRV synced to Neon DB.',
        });
        await loadData();
      } else {
        const err = await res.json();
        setSyncStatusMsg({ type: 'error', text: err.error || 'Failed to sync Apple Health payload' });
      }
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', text: err.message || 'Network error during Apple Health test' });
    } finally {
      setIsTestingApple(false);
    }
  };

  // Google Fit / Android Cloud Sync
  const handleGoogleFitSync = async () => {
    setIsSyncingGoogle(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/health/google/sync', {
        method: 'POST',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.syncedData) {
          setSleepHours(json.syncedData.sleepHours);
          if (json.syncedData.deepSleepMin) setDeepSleepMin(json.syncedData.deepSleepMin);
          if (json.syncedData.restingHeartRate) setRestingHeartRate(json.syncedData.restingHeartRate);
          setShowAdvancedVitals(true);
        }
        setSyncStatusMsg({
          type: 'success',
          text: `✓ Google Health sync successful (${json.isLiveGoogleApi ? 'Live Fit API' : 'Health Connect Bridge'}). Metrics recorded!`,
        });
        await loadData();
      } else {
        const err = await res.json();
        setSyncStatusMsg({ type: 'error', text: err.error || 'Google Fit sync failed' });
      }
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', text: err.message || 'Error syncing Google Fit' });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleSave = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleepHours,
          deepSleepMin: showAdvancedVitals ? deepSleepMin : null,
          restingHeartRate: showAdvancedVitals ? restingHeartRate : null,
          hrv: showAdvancedVitals ? hrv : null,
          stressLevel: stress,
          focusLevel: focus,
          energyLevel: energy,
          source: 'manual',
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        await loadData();
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'CRITICAL': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MODERATE': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-[#bbf246] bg-[#bbf246]/10 border-[#bbf246]/30';
    }
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'apple_health':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/15 text-[10px] font-mono">
            <Apple size={10} /> Apple HealthKit
          </span>
        );
      case 'google_fit_api':
      case 'android_health_sync':
      case 'google_fit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#bbf246]/10 text-[#bbf246] border border-[#bbf246]/20 text-[10px] font-mono">
            <Smartphone size={10} /> Google Health
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-mono">
            Manual Calibration
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-[#f4f4f5] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header with Title and Integration Trigger */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bbf246]/10 border border-[#bbf246]/30 text-[#bbf246] text-xs font-mono mb-2 uppercase">
              <Activity className="w-3.5 h-3.5" /> Autonomic Nervous System & Recovery Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
              NEURAL COGNITIVE CHECK-IN
            </h1>
            <p className="text-sm text-[#a1a1aa] font-mono mt-1">
              Deterministic cognitive load modeling powered by sleep debt and autonomic recovery.
            </p>
          </div>

          <button
            onClick={() => setShowSyncModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f0f17] hover:bg-[#161624] border border-[#bbf246]/30 hover:border-[#bbf246]/60 text-xs font-mono text-white shadow-lg transition-all group"
          >
            <div className="flex items-center gap-1.5">
              <Apple className="w-4 h-4 text-white" />
              <span className="text-zinc-500">/</span>
              <Smartphone className="w-4 h-4 text-[#bbf246]" />
            </div>
            <span className="font-semibold text-[#f4f4f5]">Apple & Android Health Integration</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#bbf246] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Top Intelligence Grid: Burnout Gauge & Capacity Meter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Burnout Risk Card */}
          <div className="p-6 rounded-2xl bg-[#0f0f17] border border-white/10 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#a1a1aa] uppercase tracking-wider">Burnout Index</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${getRiskColor(assessment?.burnoutRisk)}`}>
                {assessment?.burnoutRisk || 'LOW'} RISK
              </span>
            </div>

            <div className="my-5 flex items-baseline gap-3">
              <span className="text-6xl font-display font-black tracking-tight text-white">
                {assessment?.burnoutScore ?? 0}
              </span>
              <span className="text-sm font-mono text-[#a1a1aa]">/ 100</span>
            </div>

            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${assessment?.burnoutScore ?? 0}%`,
                  backgroundColor: assessment?.burnoutScore! > 70 ? '#f43f5e' : assessment?.burnoutScore! > 50 ? '#f59e0b' : '#bbf246'
                }}
              />
            </div>
          </div>

          {/* 2. Cognitive Capacity Meter */}
          <div className="p-6 rounded-2xl bg-[#0f0f17] border border-white/10 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#a1a1aa] uppercase tracking-wider">Cognitive Capacity</span>
              <span className="text-xs font-mono text-[#bbf246]">Active Baseline</span>
            </div>

            <div className="my-5 flex items-baseline gap-2">
              <span className="text-6xl font-display font-black tracking-tight text-[#bbf246]">
                {assessment?.cognitiveCapacity ?? 100}%
              </span>
              <span className="text-xs text-[#a1a1aa] font-mono">Retention Speed</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#a1a1aa]">
              <span>Sleep Debt: <strong className="text-white">{assessment?.sleepDebtHours ?? 0}h</strong></span>
              <span>Consecutive Deficit: <strong className="text-white">{assessment?.metrics.consecutiveDeprivationDays ?? 0}d</strong></span>
            </div>
          </div>

          {/* 3. Sleep Quantity vs Ideal Baseline */}
          <div className="p-6 rounded-2xl bg-[#0f0f17] border border-white/10 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#a1a1aa] uppercase tracking-wider">Restorative Sleep</span>
              <Moon className="w-4 h-4 text-[#bbf246]" />
            </div>

            <div className="my-5 flex items-baseline gap-2">
              <span className="text-6xl font-display font-black tracking-tight text-white">
                {sleepHours.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-[#a1a1aa]">Hours</span>
            </div>

            <div className="text-xs font-mono text-[#a1a1aa]">
              Ideal Target: <span className="text-[#bbf246]">7.75h</span> · Delta: <span className={sleepHours < 7 ? 'text-amber-400' : 'text-[#bbf246]'}>{(sleepHours - 7.75).toFixed(1)}h</span>
            </div>
          </div>
        </div>

        {/* Dynamic Recovery & Academic Advice Banner */}
        {assessment?.recoveryAdvice && (
          <div className="p-5 rounded-2xl bg-[#0f0f17] border border-[#bbf246]/20 shadow-lg flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#bbf246]/10 border border-[#bbf246]/30 flex items-center justify-center shrink-0 text-[#bbf246] mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase text-[#bbf246] font-bold tracking-wider">
                Autonomous Recovery Directive
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                {assessment.recoveryAdvice}
              </p>
            </div>
          </div>
        )}

        {/* Input Controls Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0f0f17] border border-white/10 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-display font-bold text-white">Vitals & Behavioral Inputs</h2>
              <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">Adjust inputs or sync automatically from your phone.</p>
            </div>

            <button
              onClick={() => setShowAdvancedVitals(!showAdvancedVitals)}
              className="text-xs font-mono text-[#bbf246] hover:underline"
            >
              {showAdvancedVitals ? 'Hide Biometric Vitals' : 'Show Advanced Biometrics (HRV/Deep Sleep)'}
            </button>
          </div>

          {/* Primary Sleep Hours Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-display font-semibold text-white flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#bbf246]" /> Sleep Duration (Last Night)
              </span>
              <span className="text-lg font-display font-bold text-[#bbf246]">
                {sleepHours.toFixed(1)} hrs
              </span>
            </div>

            <input
              type="range" min="3" max="12" step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-500">
              <span>3.0h (Severe Deficit)</span>
              <span>7.5h (Optimal)</span>
              <span>12.0h (Oversleep)</span>
            </div>
          </div>

          {/* Advanced Biometrics Accordion */}
          {showAdvancedVitals && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-white/5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#a1a1aa]">Deep Sleep Duration</span>
                  <span className="text-[#bbf246]">{deepSleepMin} min</span>
                </div>
                <input
                  type="range" min="10" max="180" step="5"
                  value={deepSleepMin}
                  onChange={(e) => setDeepSleepMin(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#a1a1aa]">Resting Heart Rate</span>
                  <span className="text-[#bbf246]">{restingHeartRate} bpm</span>
                </div>
                <input
                  type="range" min="45" max="100" step="1"
                  value={restingHeartRate}
                  onChange={(e) => setRestingHeartRate(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#a1a1aa]">HRV (SDNN)</span>
                  <span className="text-[#bbf246]">{hrv} ms</span>
                </div>
                <input
                  type="range" min="20" max="120" step="2"
                  value={hrv}
                  onChange={(e) => setHrv(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
                />
              </div>
            </div>
          )}

          {/* Subjective Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-white/5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#a1a1aa]">Perceived Stress</span>
                <span className="text-[#bbf246]">{stress}/5</span>
              </div>
              <input
                type="range" min="1" max="5" step="1"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#a1a1aa]">Focus Clarity</span>
                <span className="text-[#bbf246]">{focus}/5</span>
              </div>
              <input
                type="range" min="1" max="5" step="1"
                value={focus}
                onChange={(e) => setFocus(parseInt(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#a1a1aa]">Energy Reserve</span>
                <span className="text-[#bbf246]">{energy}/5</span>
              </div>
              <input
                type="range" min="1" max="5" step="1"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#bbf246]"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isSyncing}
              className="w-full py-4 rounded-xl bg-[#bbf246] hover:bg-[#a3e635] text-black font-display font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(187,242,70,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Calibrating Model...
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-black" /> Calibrated & Logged to Neon DB
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" /> Calibrate Academic Baseline
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Sync History Table */}
        {history.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#0f0f17] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Recent 7-Day Calibration History
              </h3>
              <span className="text-xs font-mono text-[#a1a1aa]">
                Neon PostgreSQL Synchronized
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[#a1a1aa]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Sleep</th>
                    <th className="py-2.5 px-3">Burnout</th>
                    <th className="py-2.5 px-3">Capacity</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((h, i) => (
                    <tr key={h.id || i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-white font-medium">
                        {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-3">
                        {getSourceBadge(h.source)}
                      </td>
                      <td className="py-3 px-3 text-[#bbf246]">
                        {h.sleepHours} hrs
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(h.burnoutRisk)}`}>
                          {h.burnoutScore}/100 ({h.burnoutRisk})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white font-semibold">
                        {h.cognitiveCap}%
                      </td>
                      <td className="py-3 px-3 text-emerald-400">
                        ● CALIBRATED
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enhanced Multi-Platform Health Integration Modal */}
        <AnimatePresence>
          {showSyncModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="max-w-2xl w-full p-6 md:p-8 rounded-3xl bg-[#09090f] border border-white/10 shadow-2xl space-y-6"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-[#bbf246]" /> Device Health Integrations
                    </h3>
                    <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
                      PWA Zero-App Architecture: Sync biometrics without installing third-party apps.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setShowSyncModal(false); setSyncStatusMsg(null); }} 
                    className="p-1 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs Selector */}
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 font-mono text-xs">
                  <button
                    onClick={() => { setSyncTab('apple'); setSyncStatusMsg(null); }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      syncTab === 'apple' ? 'bg-[#bbf246] text-black font-bold shadow-sm' : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <Apple size={14} /> Apple HealthKit (iOS)
                  </button>
                  <button
                    onClick={() => { setSyncTab('android'); setSyncStatusMsg(null); }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      syncTab === 'android' ? 'bg-[#bbf246] text-black font-bold shadow-sm' : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <Smartphone size={14} /> Google Fit / Android
                  </button>
                  <button
                    onClick={() => { setSyncTab('history'); setSyncStatusMsg(null); }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      syncTab === 'history' ? 'bg-[#bbf246] text-black font-bold shadow-sm' : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <Layers size={14} /> Sync Status
                  </button>
                </div>

                {/* Feedback Toast */}
                {syncStatusMsg && (
                  <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 animate-in fade-in ${
                    syncStatusMsg.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {syncStatusMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    <span>{syncStatusMsg.text}</span>
                  </div>
                )}

                {/* Tab 1: Apple HealthKit */}
                {syncTab === 'apple' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal size={14} className="text-[#bbf246]" /> Webhook Endpoint URL
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          HTTPS ACTIVE
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl || 'http://localhost:3000/api/health/sync'}
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 select-all"
                        />
                        <button
                          onClick={() => handleCopy(webhookUrl || 'http://localhost:3000/api/health/sync', 'url')}
                          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#bbf246] flex items-center gap-1 transition-colors"
                        >
                          {copiedField === 'url' ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedField === 'url' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-mono text-[#a1a1aa]">Your Secret Sync Bearer Token:</span>
                        <button
                          onClick={() => handleCopy(syncToken, 'token')}
                          className="text-[11px] font-mono text-[#bbf246] hover:underline flex items-center gap-1"
                        >
                          {copiedField === 'token' ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedField === 'token' ? 'Token Copied!' : 'Copy Bearer Token'}</span>
                        </button>
                      </div>
                    </div>

                    {/* How Apple Shortcuts Works Step-by-Step */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-mono text-[#a1a1aa]">
                      <div className="text-white font-bold font-display uppercase tracking-wider text-xs">
                        iOS Native Shortcuts Setup:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                        <li>Open the pre-installed <strong>Shortcuts</strong> app on iPhone.</li>
                        <li>Create a new Automation: <em>"When Waking Up"</em> or <em>"Time of Day: 08:00 AM"</em>.</li>
                        <li>Add action: <em>Find Health Samples</em> (Type: <strong>Sleep Analysis</strong> & <strong>Heart Rate</strong>).</li>
                        <li>Add action: <em>Get Contents of URL</em> pointing to your Webhook URL with <code>Authorization: Bearer [Token]</code>.</li>
                      </ol>
                    </div>

                    {/* Action Button: Push Test Payload */}
                    <button
                      onClick={handleTestAppleHealth}
                      disabled={isTestingApple}
                      className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#bbf246]/40 hover:border-[#bbf246] text-xs font-mono text-[#bbf246] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isTestingApple ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-[#bbf246]" />
                          <span>Simulating Apple HealthKit Webhook Push...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>⚡ Test Apple HealthKit Webhook Payload (7.8h Sleep & 68ms HRV)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Tab 2: Android Health / Google Fit */}
                {syncTab === 'android' && (
                  <div className="space-y-4">
                    {/* Cloud OAuth Sync */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-display font-bold text-white flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-[#bbf246]" /> Google Fit & Health Connect Cloud
                          </div>
                          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
                            Syncs via your logged-in Google / KIIT student credentials.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#bbf246]/10 text-[#bbf246] border border-[#bbf246]/20">
                          CLOUD REST API
                        </span>
                      </div>

                      <button
                        onClick={handleGoogleFitSync}
                        disabled={isSyncingGoogle}
                        className="w-full py-3 rounded-xl bg-[#bbf246] hover:bg-[#a3e635] text-black font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        {isSyncingGoogle ? (
                          <>
                            <RefreshCw size={14} className="animate-spin text-black" />
                            <span>Querying Google Fitness API & Calculating Burnout...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} />
                            <span>Sync Now from Google Health / Fit</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Tasker / Health Connect Alternative */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-mono text-[#a1a1aa]">
                      <div className="text-white font-bold font-display uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <Terminal size={14} className="text-[#bbf246]" /> Android Tasker / Automate Webhook
                      </div>
                      <p className="text-zinc-400 leading-relaxed">
                        If using Health Connect with Samsung Health or Pixel Watch, use Tasker or MacroDroid to HTTP POST your sleep time directly to your personal webhook:
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                        <code>{`POST ${webhookUrl || '/api/health/sync'}\nHeader: Authorization: Bearer ${syncToken ? syncToken.slice(0, 15) + '...' : 'TOKEN'}\nBody: {"source":"android_health","sleepHours":7.2,"restingHeartRate":65}`}</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: History & Calibration Logs */}
                {syncTab === 'history' && (
                  <div className="space-y-3">
                    <div className="text-xs font-mono text-[#a1a1aa]">
                      Active Biometric Logs stored in Neon PostgreSQL:
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                      {history.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 bg-white/[0.02] rounded-xl border border-white/5">
                          No health logs recorded yet. Use the test buttons or calibrate your baseline.
                        </div>
                      ) : (
                        history.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                            <div>
                              <div className="text-white font-bold">
                                {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                {getSourceBadge(item.source)}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[#bbf246] font-bold">
                                {item.sleepHours} hrs {item.restingHeartRate ? `· ${item.restingHeartRate} bpm` : ''}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                Burnout: {item.burnoutScore}/100 ({item.burnoutRisk})
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <button
                    onClick={() => { setShowSyncModal(false); setSyncStatusMsg(null); }}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#f4f4f5] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
