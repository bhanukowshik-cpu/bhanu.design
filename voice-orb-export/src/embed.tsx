/**
 * Standalone embed entry — mounts the INTERACTIVE voice orb (VoiceOrb visual +
 * @elevenlabs/react conversation) into a host element. The orb itself is the
 * click target: tap to start a voice conversation with Bhanu's public agent,
 * tap again to end. Built as a self-contained ESM bundle for the static site.
 *
 *   <div id="bhanu-orb" data-palette="ember" data-size="188"></div>
 *   <script type="module" src="orb/bhanu-orb.js"></script>
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { VoiceOrb, PALETTES } from './components/voice-orb';
import type { PaletteName, VoiceOrbState } from './components/voice-orb';

// Bhanu's public Conversational-AI agent (auth disabled — connects with id only).
const AGENT_ID = 'agent_6001ky3xa8eded1r959raw2w6jth';

function LiveOrb({ palette = 'ember', size = 188 }: { palette?: PaletteName; size?: number }) {
  const [userSpeaking, setUserSpeaking] = useState(false);
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

  const getFrequencyData = useCallback((): Uint8Array | null => {
    if (statusRef.current !== 'connected') return null;
    try {
      return isSpeakingRef.current ? getOutputByteFrequencyData() : getInputByteFrequencyData();
    } catch {
      return null;
    }
  }, [getOutputByteFrequencyData, getInputByteFrequencyData]);

  // Derive "user is speaking" from mic level while connected and agent is silent.
  useEffect(() => {
    if (status !== 'connected') {
      setUserSpeaking(false);
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (isSpeakingRef.current) {
        setUserSpeaking(false);
        return;
      }
      let v = 0;
      try {
        v = getInputVolume();
      } catch {
        v = 0;
      }
      setUserSpeaking((prev) => (prev ? v > 0.05 : v > 0.12));
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
          : micDenied
            ? 'error'
            : 'idle';

  const connected = status === 'connected';
  const connecting = status === 'connecting';

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

  const onActivate = () => {
    if (connecting) return;
    if (connected) endSession();
    else void start();
  };

  let caption: React.ReactNode;
  if (micDenied) caption = 'Enable microphone access, then tap again';
  else if (errorMsg && !connected) caption = errorMsg + ' — tap to retry';
  else if (connecting) caption = 'Connecting…';
  else if (orbState === 'assistant-speaking') caption = 'Bhanu AI is speaking… (tap to end)';
  else if (orbState === 'user-speaking') caption = 'Listening… (tap to end)';
  else if (orbState === 'listening') caption = 'Listening — go ahead (tap to end)';
  else
    caption = (
      <>
        <b style={{ color: 'var(--ink-2, #e0cdb9)', fontWeight: 600 }}>Talk to my AI</b> — ask it
        anything about my work
      </>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        role="button"
        tabIndex={0}
        aria-label={connected ? 'End conversation' : 'Talk to Bhanu AI'}
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate();
          }
        }}
        style={{ cursor: connecting ? 'progress' : 'pointer', lineHeight: 0, borderRadius: '50%', outline: 'none' }}
      >
        <VoiceOrb
          state={orbState}
          getFrequencyData={getFrequencyData}
          palette={PALETTES[palette]}
          size={size}
          audioParams={{ gain: 2.6, noiseFloor: 0.02, attack: 0.05, release: 0.28 }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--sans, inherit)',
          fontSize: 12.5,
          letterSpacing: '0.04em',
          color: 'var(--ink-3, #a99177)',
        }}
      >
        {caption}
      </span>
    </div>
  );
}

function mount(el: HTMLElement, opts: { palette?: PaletteName; size?: number } = {}): Root {
  const root = createRoot(el);
  root.render(
    <ConversationProvider>
      <LiveOrb palette={opts.palette} size={opts.size} />
    </ConversationProvider>,
  );
  return root;
}

/** Visual-only mount — the fluid orb with no conversation layer, no caption.
 *  For decorative/inline uses like the hero CTA pill. */
function mountVisual(
  el: HTMLElement,
  opts: {
    palette?: PaletteName;
    size?: number;
    state?: VoiceOrbState;
    simulate?: 'user' | 'assistant' | null;
  } = {},
): Root {
  const root = createRoot(el);
  root.render(
    <VoiceOrb
      state={opts.state ?? 'idle'}
      simulate={opts.simulate ?? null}
      palette={opts.palette ? PALETTES[opts.palette] : undefined}
      size={opts.size ?? 300}
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
