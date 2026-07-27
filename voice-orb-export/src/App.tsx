import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { PALETTES, VoiceOrb } from './components/voice-orb';
import type { PaletteName, VoiceOrbState } from './components/voice-orb';
import { ConversationOrb } from './ConversationOrb';
import './demo.css';

type AudioMode = 'none' | 'sim-user' | 'sim-assistant' | 'mic' | 'file';

const PALETTE_NAMES: { id: PaletteName; label: string }[] = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'ember', label: 'Ember' },
  { id: 'nebula', label: 'Nebula' },
  { id: 'arctic', label: 'Arctic' },
];

const STATES: VoiceOrbState[] = [
  'idle',
  'listening',
  'user-speaking',
  'assistant-speaking',
  'connecting',
  'error',
];

const AUDIO_MODES: { id: AudioMode; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'sim-user', label: 'Sim user' },
  { id: 'sim-assistant', label: 'Sim assistant' },
  { id: 'mic', label: 'Microphone' },
  { id: 'file', label: 'Audio file' },
];

type View = 'live' | 'playground';

export default function App() {
  const [view, setView] = useState<View>('live');
  const [state, setState] = useState<VoiceOrbState>('idle');
  const [audioMode, setAudioMode] = useState<AudioMode>('none');
  const [paletteName, setPaletteName] = useState<PaletteName>('aurora');
  const [debug, setDebug] = useState(false);
  const [paused, setPaused] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [fileReady, setFileReady] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement>(null);

  // Stop mic tracks whenever we leave mic mode.
  useEffect(() => {
    if (audioMode !== 'mic' && micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      setMicStream(null);
    }
    if (audioMode !== 'file') {
      audioElRef.current?.pause();
    }
  }, [audioMode, micStream]);

  const simulate =
    audioMode === 'sim-user' ? 'user' : audioMode === 'sim-assistant' ? 'assistant' : null;
  const audioSource =
    audioMode === 'mic' ? micStream : audioMode === 'file' && fileReady ? audioElRef.current : null;

  const selectAudio = async (mode: AudioMode) => {
    setMicError(null);
    if (mode === 'mic') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream);
        setAudioMode('mic');
        setState('listening');
      } catch {
        setMicError('Microphone permission denied');
      }
      return;
    }
    setAudioMode(mode);
    if (mode === 'sim-user') setState('user-speaking');
    if (mode === 'sim-assistant') setState('assistant-speaking');
    if (mode === 'none') setState('idle');
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioElRef.current) return;
    const el = audioElRef.current;
    el.src = URL.createObjectURL(file);
    el.loop = true;
    void el.play().catch(() => {});
    setFileReady(true);
    setAudioMode('file');
    setState('assistant-speaking');
  };

  return (
    <main className="demo">
      <header className="demo-header">
        <h1>Voice Orb</h1>
        <p>WebGL2 · OGL · audio-reactive · original implementation</p>
      </header>

      <nav className="view-tabs">
        <button className={view === 'live' ? 'active' : ''} onClick={() => setView('live')}>
          Bhanu AI (live)
        </button>
        <button
          className={view === 'playground' ? 'active' : ''}
          onClick={() => setView('playground')}
        >
          Playground
        </button>
      </nav>

      {view === 'live' && <ConversationOrb size={300} paletteName="arctic" />}

      {view === 'playground' && (
        <>
          <section className="demo-stage">
            <VoiceOrb
              state={state}
              audioSource={audioSource}
              simulate={simulate}
              palette={PALETTES[paletteName]}
              size={300}
              paused={paused}
              debug={debug}
            />
          </section>

          <section className="demo-controls">
        <div className="ctl-group">
          <span className="ctl-label">State</span>
          <div className="ctl-row">
            {STATES.map((s) => (
              <button
                key={s}
                className={state === s ? 'active' : ''}
                onClick={() => setState(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="ctl-group">
          <span className="ctl-label">Palette</span>
          <div className="ctl-row">
            {PALETTE_NAMES.map((p) => (
              <button
                key={p.id}
                className={paletteName === p.id ? 'active' : ''}
                onClick={() => setPaletteName(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ctl-group">
          <span className="ctl-label">Audio</span>
          <div className="ctl-row">
            {AUDIO_MODES.map((m) =>
              m.id === 'file' ? (
                <label key="file" className={`filebtn ${audioMode === 'file' ? 'active' : ''}`}>
                  {m.label}
                  <input type="file" accept="audio/*" onChange={onFile} hidden />
                </label>
              ) : (
                <button
                  key={m.id}
                  className={audioMode === m.id ? 'active' : ''}
                  onClick={() => void selectAudio(m.id)}
                >
                  {m.label}
                </button>
              ),
            )}
          </div>
          {micError && <span className="ctl-error">{micError}</span>}
        </div>

        <div className="ctl-group">
          <span className="ctl-label">Options</span>
          <div className="ctl-row">
            <button className={debug ? 'active' : ''} onClick={() => setDebug((d) => !d)}>
              debug
            </button>
            <button className={paused ? 'active' : ''} onClick={() => setPaused((p) => !p)}>
              {paused ? 'paused' : 'running'}
            </button>
          </div>
            </div>
          </section>

          <audio ref={audioElRef} hidden />
        </>
      )}
    </main>
  );
}
