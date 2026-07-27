import { useCallback, useEffect, useRef, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { PALETTES, VoiceOrb } from './components/voice-orb';
import type { PaletteName, VoiceOrbState } from './components/voice-orb';

/**
 * Live voice orb wired to Bhanu's ElevenLabs Conversational AI agent.
 *
 * The agent is public (`auth.enable_auth === false`), so the browser connects
 * with just the agent id — no backend / signed-URL needed.
 *
 * Two SDK signals drive the orb:
 *   - `status` + `isSpeaking` + input volume → the orb `state`
 *   - `getOutputByteFrequencyData()` (agent) / `getInputByteFrequencyData()`
 *     (you) → the orb's audio reaction, via its `getFrequencyData` prop.
 */

const AGENT_ID = 'agent_6001ky3xa8eded1r959raw2w6jth';

interface ConversationOrbProps {
  size?: number;
  paletteName?: PaletteName;
}

function STATUS_LABEL(state: VoiceOrbState): string {
  switch (state) {
    case 'connecting':
      return 'Connecting…';
    case 'listening':
      return 'Listening — go ahead';
    case 'user-speaking':
      return 'Listening…';
    case 'assistant-speaking':
      return 'Bhanu AI is speaking';
    case 'error':
      return 'Something went wrong';
    default:
      return 'Tap to talk with Bhanu AI';
  }
}

function ConversationOrbInner({ size = 300, paletteName = 'arctic' }: ConversationOrbProps) {
  const [micDenied, setMicDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userSpeaking, setUserSpeaking] = useState(false);

  const conversation = useConversation({
    onConnect: () => setErrorMsg(null),
    onError: (message: string) => setErrorMsg(message || 'Connection error'),
  });

  const {
    status,
    isSpeaking,
    startSession,
    endSession,
    getInputByteFrequencyData,
    getOutputByteFrequencyData,
    getInputVolume,
  } = conversation;

  // Refs so the per-frame closures below never read a stale value.
  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const statusRef = useRef(status);
  statusRef.current = status;
  const userSpeakingRef = useRef(false);

  // Feed the orb whichever stream is live: agent output while it speaks,
  // your mic once you're actually speaking. Quiet listening feeds nothing, so
  // ambient noise never stirs the orb. Stable identity — reads through refs.
  const getFrequencyData = useCallback((): Uint8Array | null => {
    if (statusRef.current !== 'connected') return null;
    try {
      if (isSpeakingRef.current) return getOutputByteFrequencyData();
      return userSpeakingRef.current ? getInputByteFrequencyData() : null;
    } catch {
      return null;
    }
  }, [getOutputByteFrequencyData, getInputByteFrequencyData]);

  // Derive "user is speaking" from input level while connected and the agent is
  // silent. Hysteresis (rise 0.12 / fall 0.05) stops flicker on the threshold.
  useEffect(() => {
    if (status !== 'connected') {
      userSpeakingRef.current = false;
      setUserSpeaking(false);
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (isSpeakingRef.current) {
        userSpeakingRef.current = false;
        setUserSpeaking(false);
        return;
      }
      let v = 0;
      try {
        v = getInputVolume();
      } catch {
        v = 0;
      }
      const next = userSpeakingRef.current ? v > 0.05 : v > 0.12;
      userSpeakingRef.current = next;
      setUserSpeaking(next);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, getInputVolume]);

  const orbState: VoiceOrbState =
    status === 'connecting'
      ? 'connecting'
      : status === 'error'
        ? 'error'
        : status === 'connected'
          ? isSpeaking
            ? 'assistant-speaking'
            : userSpeaking
              ? 'user-speaking'
              : 'listening'
          : 'idle';

  const connected = status === 'connected';
  const connecting = status === 'connecting';

  const start = useCallback(async () => {
    setMicDenied(false);
    setErrorMsg(null);
    // Surface a mic denial early with a clean message (the SDK also requests it).
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());
    } catch {
      setMicDenied(true);
      return;
    }
    startSession({ agentId: AGENT_ID, connectionType: 'webrtc' });
  }, [startSession]);

  return (
    <div className="bhanu-stage">
      <VoiceOrb
        state={orbState}
        getFrequencyData={getFrequencyData}
        palette={PALETTES[paletteName]}
        size={size}
        audioParams={{ gain: 2.6, noiseFloor: 0.02, attack: 0.05, release: 0.28 }}
      />

      <p className="bhanu-status" data-state={orbState}>
        {STATUS_LABEL(orbState)}
      </p>

      <div className="bhanu-actions">
        {connected ? (
          <button className="bhanu-btn danger" onClick={() => endSession()}>
            End conversation
          </button>
        ) : (
          <button className="bhanu-btn" disabled={connecting} onClick={() => void start()}>
            {connecting ? 'Connecting…' : 'Talk to Bhanu AI'}
          </button>
        )}
      </div>

      {micDenied && (
        <p className="bhanu-error">
          Microphone access is required for a voice conversation. Enable it in your browser and
          try again.
        </p>
      )}
      {errorMsg && !micDenied && <p className="bhanu-error">{errorMsg}</p>}
    </div>
  );
}

/** Public entry: provides the ElevenLabs context the inner hook requires. */
export function ConversationOrb(props: ConversationOrbProps) {
  return (
    <ConversationProvider>
      <ConversationOrbInner {...props} />
    </ConversationProvider>
  );
}
