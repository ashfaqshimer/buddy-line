'use server';

import { Message, Player } from '@/lib/game-types';

export interface BotResponseResult {
  text: string;
  model: string;
  tokens: number;
  latencyMs: number;
}

/**
 * Server action to generate an AI crewmate response.
 * Simulates LLM execution with 2000ms latency to test loading & turn-taking states.
 */
export async function generateBotResponse(
  chatHistory: Message[],
  bot: Player
): Promise<BotResponseResult> {
  const startTime = Date.now();

  // Simulate network & LLM inference delay (2000ms as requested in NEBULA_HUB_PLAN.md)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // =========================================================================
  // TODO: Integrate Google Gemini API via @google/genai SDK here.
  // Example future implementation:
  //
  // import { GoogleGenAI } from '@google/genai';
  // const ai = new GoogleGenAI();
  // const response = await ai.models.generateContent({
  //   model: 'gemini-2.5-flash',
  //   contents: [
  //     { role: 'system', text: `${bot.systemPrompt}. Your alignment is ${bot.alignment}. Never break character.` },
  //     ...chatHistory.map(m => ({ role: m.isBot ? 'model' : 'user', text: `${m.playerName}: ${m.text}` }))
  //   ]
  // });
  // return { text: response.text, model: 'gemini-2.5-flash', ... };
  // =========================================================================

  // =========================================================================
  // TODO: Integrate Firebase / WebSockets for multiplayer broadcast & synchronization.
  // In live multiplayer:
  // - Broadcast turn state transitions to Firebase Realtime Database or Cloud Firestore.
  // - Synchronize audio/text streams across all connected human clients.
  // =========================================================================

  // Dynamic persona responses based on bot alignment and role
  const botResponsesByRole: Record<string, string[]> = {
    Navigator: [
      'The star tracker was recalibrated right before the power surge. I noticed manual steering logs coming from the engineering station.',
      'Course corrections require two-factor clearance. If someone modified the coordinates, check the sub-relay junction in Hydroponics.',
      'Commander, the navigational beacons are drifting. Are you certain your maintenance routines did not bypass the primary gyro?',
    ],
    Medic: [
      'Bio-monitors show elevated adrenaline levels across several sectors. Someone was sprinting through Corridor B when the oxygen dropped.',
      'I checked the medical refrigeration seals; they were uncompromised. The issue is strictly in primary engineering or the main deck.',
      'According to the health diagnostics, everyone was at their designated stations except for one anomaly near the airlock.',
    ],
    Security: [
      'I pulled the security terminal logs. The security overrides were bypassed with high-level access keys. Let us hear everyone’s exact timeline.',
      'Empty words will not save the ship. Whoever was near the main reactor manifold between 09:35 and 09:40 needs to account for themselves.',
      'I suggest we proceed directly to a formal inquiry. If anyone hesitates to share their workstation telemetry, I consider that suspect.',
    ],
    Scientist: [
      'The decay rate of the isotope in the reactor core is mathematically inconsistent with a natural failure. Sabotage is statistically certain.',
      'Thermal readings spike each time the auxiliary relay engages. This pattern suggests deliberate disruption rather than mechanical fatigue.',
      'We must correlate the timing of the atmospheric vent with the power bus log. Science will expose the Replicant.',
    ],
  };

  const pool = botResponsesByRole[bot.role] || [
    'I agree we need to remain calm and examine the subsystem logs before jumping to conclusions.',
  ];

  // Pick response variation deterministically or semi-randomly
  const index = (chatHistory.length + bot.name.length) % pool.length;
  const chosenText = pool[index];
  const latencyMs = Date.now() - startTime;

  return {
    text: chosenText,
    model: 'gemini-1.5-flash-sim',
    tokens: Math.floor(chosenText.length * 1.3) + 45,
    latencyMs,
  };
}
