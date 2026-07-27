/**
 * Standalone embed entry — mounts the voice orb into a host element.
 *
 * Two modes:
 *   mount(el, {ui:true})   — self-contained: orb is the tap-to-talk button with caption (legacy).
 *   mount(el, {ui:false, onState, controls}) — headless: renders ONLY the orb visual wired to the
 *     ElevenLabs conversation; reports state via onState('idle'|'connecting'|'listening'|
 *     'user-speaking'|'thinking'|'assistant-speaking'|'mic-denied'|'error') and hands the host
 *     {start, end} through the controls callback. The host renders its own CTA / tags / end-call.
 *   mountVisual(el, opts)  — decorative orb only, no conversation.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { VoiceOrb, PALETTES } from './components/voice-orb';
import type { PaletteName, VoiceOrbState } from './components/voice-orb';

const AGENT_ID = 'agent_6001ky3xa8eded1r959raw2w6jth';

type UiState =
  | 'idle' | 'connecting' | 'listening' | 'user-speaking'
  | 'thinking' | 'assistant-speaking' | 'mic-denied' | 'error';

interface LiveOrbProps {
  palette?: PaletteName;
  size?: number;
  ui?: boolean;
  debug?: boolean;
  onState?: (state: UiState) => void;
  controls?: (api: { start: () => void; end: () => void }) => void;
}

function LiveOrb({ palette = 'ember', size = 188, ui = true, debug = false, onState, controls }: LiveOrbProps) {
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const statusRef = useRef(status);
  statusRef.current = status;
  const userSpeakingRef = useRef(false);
  const thinkingRef = useRef(false);
  const lastUserEndRef = useRef(0);

  const getFrequencyData = useCallback((): Uint8Array | null => {
    if (statusRef.current !== 'connected') return null;
    try {
      return isSpeakingRef.current ? getOutputByteFrequencyData() : getInputByteFrequencyData();
    } catch {
      return null;
    }
  }, [getOutputByteFrequencyData, getInputByteFrequencyData]);

  // Mic-level loop: derives user-speaking (hysteresis) and a "thinking" window
  // between the user finishing and the agent starting to speak.
  useEffect(() => {
    if (status !== 'connected') {
      userSpeakingRef.current = false; thinkingRef.current = false;
      setUserSpeaking(false); setThinking(false);
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      let v = 0;
      try { v = getInputVolume(); } catch { v = 0; }

      if (isSpeakingRef.current) {
        if (userSpeakingRef.current) { userSpeakingRef.current = false; setUserSpeaking(false); }
        if (thinkingRef.current) { thinkingRef.current = false; setThinking(false); }
        lastUserEndRef.current = 0;
        return;
      }
      const cur = userSpeakingRef.current;
      const next = cur ? v > 0.05 : v > 0.12;
      if (next !== cur) {
        userSpeakingRef.current = next;
        setUserSpeaking(next);
        if (cur && !next) lastUserEndRef.current = performance.now();
      }
      const th = !next && lastUserEndRef.current > 0 &&
        performance.now() - lastUserEndRef.current < 7000;
      if (th !== thinkingRef.current) { thinkingRef.current = th; setThinking(th); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, getInputVolume]);

  const uiState: UiState =
    status === 'connecting' ? 'connecting'
    : status === 'error' || errorMsg ? 'error'
    : status === 'connected'
      ? (isSpeaking ? 'assistant-speaking'
        : userSpeaking ? 'user-speaking'
        : thinking ? 'thinking'
        : 'listening')
      : micDenied ? 'mic-denied' : 'idle';

  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  useEffect(() => { onStateRef.current?.(uiState); }, [uiState]);

  const start = useCallback(async () => {
    setMicDenied(false);
    setErrorMsg(null);
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());
    } catch {
      setMicDenied(true);
      return;
    }
    startSession({ agentId: AGENT_ID, connectionType: 'webrtc' });
  }, [startSession]);

  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  useEffect(() => {
    controlsRef.current?.({
      start: () => { void start(); },
      end: () => { try { void endSession(); } catch { /* noop */ } },
    });
  }, [start, endSession]);

  // Orb visual: "thinking" borrows the connecting preset's faster autonomous
  // drift so processing reads as motion; everything else maps 1:1.
  const orbState: VoiceOrbState =
    uiState === 'connecting' ? 'connecting'
    : uiState === 'error' || uiState === 'mic-denied' ? 'error'
    : uiState === 'assistant-speaking' ? 'assistant-speaking'
    : uiState === 'user-speaking' ? 'user-speaking'
    : uiState === 'thinking' ? 'connecting'
    : uiState === 'listening' ? 'listening'
    : 'idle';

  const orb = (
    <VoiceOrb
      state={orbState}
      getFrequencyData={getFrequencyData}
      palette={PALETTES[palette]}
      size={size}
      debug={debug}
      audioParams={{ gain: 2.6, noiseFloor: 0.02, attack: 0.05, release: 0.28 }}
    />
  );

  if (!ui) return orb;

  /* legacy self-contained chrome (orb-as-button + caption) */
  const connected = status === 'connected';
  const connecting = status === 'connecting';
  const onActivate = () => {
    if (connecting) return;
    if (connected) endSession();
    else void start();
  };
  let caption: React.ReactNode;
  if (micDenied) caption = 'Enable microphone access, then tap again';
  else if (errorMsg && !connected) caption = errorMsg + ' — tap to retry';
  else if (connecting) caption = 'Connecting…';
  else if (uiState === 'assistant-speaking') caption = 'Speaking… (tap to end)';
  else if (connected) caption = 'Listening — go ahead (tap to end)';
  else caption = 'Tap to talk';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        role="button"
        tabIndex={0}
        aria-label={connected ? 'End conversation' : 'Talk to Bhanu AI'}
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); }
        }}
        style={{ cursor: connecting ? 'progress' : 'pointer', lineHeight: 0, borderRadius: '50%', outline: 'none' }}
      >
        {orb}
      </div>
      <span style={{ fontSize: 12.5, letterSpacing: '0.04em', opacity: 0.7 }}>{caption}</span>
    </div>
  );
}

function mount(el: HTMLElement, opts: Omit<LiveOrbProps, never> = {}): Root {
  const root = createRoot(el);
  root.render(
    <ConversationProvider>
      <LiveOrb {...opts} />
    </ConversationProvider>,
  );
  return root;
}

/** Visual-only mount — no conversation layer. */
function mountVisual(
  el: HTMLElement,
  opts: {
    palette?: PaletteName;
    size?: number;
    state?: VoiceOrbState;
    simulate?: 'user' | 'assistant' | null;
    debug?: boolean;
  } = {},
): Root {
  const root = createRoot(el);
  root.render(
    <VoiceOrb
      state={opts.state ?? 'idle'}
      simulate={opts.simulate ?? null}
      palette={opts.palette ? PALETTES[opts.palette] : undefined}
      size={opts.size ?? 300}
      debug={opts.debug ?? false}
    />,
  );
  return root;
}

(window as unknown as { BhanuOrb: unknown }).BhanuOrb = { mount, mountVisual, PALETTES };

const target = document.getElementById('bhanu-orb');
if (target) {
  mount(target, {
    palette: (target.dataset.palette as PaletteName) || undefined,
    size: target.dataset.size ? Number(target.dataset.size) : undefined,
  });
}
