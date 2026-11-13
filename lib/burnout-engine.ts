/**
 * Kaizen Burnout & Cognitive Fatigue Prediction Engine
 * Computes deterministic burnout risk, sleep debt accumulation,
 * and cognitive capacity based on biometric vitals and subjective stress.
 */

export interface BurnoutInput {
  sleepHours: number;
  deepSleepMin?: number | null;
  sleepQuality?: number | null;
  restingHeartRate?: number | null;
  hrv?: number | null;
  stressLevel: number; // 1 (Calm) - 5 (Overwhelmed)
  focusLevel: number;  // 1 (Scattered) - 5 (Deep Flow)
  energyLevel: number; // 1 (Exhausted) - 5 (Charged)
  recentHistory?: Array<{
    date: Date | string;
    sleepHours: number;
    stressLevel: number;
  }>;
}

export interface BurnoutAssessment {
  burnoutScore: number; // 0 - 100
  burnoutRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  cognitiveCapacity: number; // 0 - 100%
  sleepDebtHours: number; // Cumulative sleep deficit
  recoveryAdvice: string;
  metrics: {
    sleepScore: number;
    stressScore: number;
    biometricScore: number;
    consecutiveDeprivationDays: number;
  };
}

export function calculateBurnout(input: BurnoutInput): BurnoutAssessment {
  const BASELINE_SLEEP_HOURS = 7.75;
  const todayDeficit = Math.max(0, BASELINE_SLEEP_HOURS - input.sleepHours);

  // 1. Calculate Chronic Sleep Debt & Consecutive Deprivation Days
  let cumulativeDeficit = todayDeficit;
  let consecutiveDeprivationDays = input.sleepHours < 6.0 ? 1 : 0;

  if (input.recentHistory && input.recentHistory.length > 0) {
    // Sort recent history from newest to oldest
    const sorted = [...input.recentHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (let i = 0; i < Math.min(6, sorted.length); i++) {
      const h = sorted[i].sleepHours;
      cumulativeDeficit += Math.max(0, BASELINE_SLEEP_HOURS - h);
      if (h < 6.0 && i === consecutiveDeprivationDays - 1) {
        consecutiveDeprivationDays++;
      }
    }
  }

  // 2. Sleep Debt Score (0 - 45 points)
  let sleepScore = 0;
  if (input.sleepHours < 4.0) {
    sleepScore = 42;
  } else if (input.sleepHours < 5.0) {
    sleepScore = 34;
  } else if (input.sleepHours < 6.0) {
    sleepScore = 24;
  } else if (input.sleepHours < 7.0) {
    sleepScore = 14;
  } else if (input.sleepHours < 7.75) {
    sleepScore = 6;
  } else {
    sleepScore = 0;
  }

  // Compound by consecutive days of sleep deprivation
  if (consecutiveDeprivationDays >= 3) {
    sleepScore = Math.min(45, sleepScore + (consecutiveDeprivationDays * 2.5));
  }

  // 3. Subjective Stress & Energy Score (0 - 35 points)
  // Stress (1 - 5): 1=0pts, 5=24pts
  const stressScore = Math.round(((input.stressLevel - 1) / 4) * 24);
  // Energy deficit (1 - 5): 5=0pts, 1=11pts
  const energyScore = Math.round(((5 - input.energyLevel) / 4) * 11);
  const mentalScore = Math.min(35, stressScore + energyScore);

  // 4. Biometric Strain Score (0 - 20 points)
  let biometricScore = 0;
  if (input.restingHeartRate && input.restingHeartRate > 80) {
    biometricScore += 8;
  } else if (input.restingHeartRate && input.restingHeartRate > 74) {
    biometricScore += 4;
  }

  if (input.hrv && input.hrv < 35) {
    biometricScore += 8;
  } else if (input.hrv && input.hrv < 45) {
    biometricScore += 4;
  }

  if (input.deepSleepMin !== null && input.deepSleepMin !== undefined && input.deepSleepMin < 40) {
    biometricScore += 4;
  }

  // Total Burnout Score: 0 - 100
  const rawScore = sleepScore + mentalScore + biometricScore;
  const burnoutScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Risk Categorization
  let burnoutRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (burnoutScore >= 75) {
    burnoutRisk = "CRITICAL";
  } else if (burnoutScore >= 52) {
    burnoutRisk = "HIGH";
  } else if (burnoutScore >= 28) {
    burnoutRisk = "MODERATE";
  } else {
    burnoutRisk = "LOW";
  }

  // Cognitive Capacity Estimate (100% down to 25%)
  const cognitiveCapacity = Math.max(25, Math.min(100, Math.round(100 - (burnoutScore * 0.72))));

  // Actionable Medical/Academic Advice Generation
  let recoveryAdvice = "";
  if (burnoutRisk === "CRITICAL") {
    recoveryAdvice = `CRITICAL FATIGUE: Cumulative sleep debt of ${cumulativeDeficit.toFixed(1)}h with ${consecutiveDeprivationDays} consecutive days under 6h sleep. Memory encoding & calculation speed reduced by ~${100 - cognitiveCapacity}%. Enforce a strict study cutoff at 22:30 tonight. Do NOT attempt all-night cramming.`;
  } else if (burnoutRisk === "HIGH") {
    recoveryAdvice = `HIGH BURNOUT RISK: Working memory is compromised. Shift high-stakes problem solving to morning hours after 7.5+ hrs sleep. Cap tonight's revision sessions to 25-minute Pomodoro bursts with active physical breaks.`;
  } else if (burnoutRisk === "MODERATE") {
    recoveryAdvice = `MODERATE FATIGUE: Daily sleep of ${input.sleepHours.toFixed(1)}h is slightly below optimal baseline. Cognitive capacity is at ${cognitiveCapacity}%. Prioritize 8 hours of restorative sleep tonight to prevent compounding deficit.`;
  } else {
    recoveryAdvice = `OPTIMAL BASELINE: Full cognitive recovery confirmed (${input.sleepHours.toFixed(1)}h sleep). High neuroplasticity and retention capacity for heavy revision and mock examinations today.`;
  }

  return {
    burnoutScore,
    burnoutRisk,
    cognitiveCapacity,
    sleepDebtHours: Math.round(cumulativeDeficit * 10) / 10,
    recoveryAdvice,
    metrics: {
      sleepScore,
      stressScore: mentalScore,
      biometricScore,
      consecutiveDeprivationDays,
    },
  };
}

