import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_PARAMS } from './orbConfig';
import type { AudioFrame, AudioParams, OrbParams, OrbTelemetry } from './VoiceOrb.types';

interface SliderDef {
  group: string;
  key: keyof OrbParams;
  min: number;
  max: number;
  step: number;
}

const SLIDER_DEFS: SliderDef[] = [
  { group: 'Sphere', key: 'sphereScale', min: 0.4, max: 1.6, step: 0.01 },
  { group: 'Sphere', key: 'spherePower', min: 0.2, max: 3, step: 0.01 },
  { group: 'FBM', key: 'fbmScale', min: 0.5, max: 8, step: 0.05 },
  { group: 'FBM', key: 'fbmPower', min: 0.2, max: 6, step: 0.05 },
  { group: 'FBM', key: 'fbmAmplitude', min: 0, max: 1.5, step: 0.01 },
  { group: 'FBM', key: 'fbmSpeed', min: 0, max: 10, step: 0.05 },
  { group: 'Noise', key: 'noiseScale', min: 0.1, max: 3, step: 0.01 },
  { group: 'Noise', key: 'noiseAmplitude', min: 0, max: 0.6, step: 0.005 },
  { group: 'Noise', key: 'noiseSpeed', min: 0, max: 2, step: 0.01 },
  { group: 'Fluid', key: 'fluidForce', min: 0, max: 2, step: 0.01 },
  { group: 'Fluid', key: 'fluidDissipation', min: 0.8, max: 0.995, step: 0.001 },
  { group: 'Fluid', key: 'fluidDisplacement', min: 0, max: 3, step: 0.01 },
  { group: 'Fluid', key: 'fluidColorOpacity', min: 0, max: 1, step: 0.01 },
  { group: 'Ring', key: 'ringColorOpacity', min: 0, max: 1, step: 0.01 },
  { group: 'Grade', key: 'exposure', min: -0.5, max: 1, step: 0.01 },
  { group: 'Grade', key: 'contrast', min: -0.5, max: 1, step: 0.01 },
  { group: 'Grade', key: 'saturation', min: 0, max: 2, step: 0.01 },
  { group: 'Grade', key: 'grainOpacity', min: 0, max: 0.2, step: 0.005 },
  { group: 'Mask', key: 'maskRadius', min: 0.5, max: 1.1, step: 0.005 },
  { group: 'Mask', key: 'maskSoftness', min: 0.01, max: 0.4, step: 0.005 },
  { group: 'Drift', key: 'driftSpeed', min: 0, max: 0.5, step: 0.005 },
];

const GROUPS = [...new Set(SLIDER_DEFS.map((s) => s.group))];

type AudioSliderKey = 'attack' | 'release' | 'noiseFloor' | 'gain';
const AUDIO_SLIDERS: { key: AudioSliderKey; min: number; max: number; step: number }[] = [
  { key: 'attack', min: 0.01, max: 0.3, step: 0.005 },
  { key: 'release', min: 0.05, max: 1.0, step: 0.01 },
  { key: 'noiseFloor', min: 0, max: 0.3, step: 0.005 },
  { key: 'gain', min: 0.5, max: 4, step: 0.05 },
];

interface DebugPanelProps {
  paramsRef: RefObject<OrbParams>;
  audioParamsRef: RefObject<AudioParams>;
  metersRef: RefObject<AudioFrame>;
  telemetryRef: RefObject<OrbTelemetry | null>;
}

function Bar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="orbdbg-bar">
      <span className="orbdbg-bar-label">{label}</span>
      <span className="orbdbg-bar-track">
        <span className="orbdbg-bar-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="orbdbg-bar-val">{value.toFixed(2)}</span>
    </div>
  );
}

export function DebugPanel({
  paramsRef,
  audioParamsRef,
  metersRef,
  telemetryRef,
}: DebugPanelProps) {
  const [values, setValues] = useState<OrbParams>({ ...paramsRef.current });
  const [audioValues, setAudioValues] = useState({
    attack: audioParamsRef.current.attack,
    release: audioParamsRef.current.release,
    noiseFloor: audioParamsRef.current.noiseFloor,
    gain: audioParamsRef.current.gain,
  });
  const [, force] = useState(0);
  const rafRef = useRef(0);

  // Poll meters/telemetry for display at ~12 Hz (isolated from the orb loop).
  useEffect(() => {
    let acc = 0;
    let last = performance.now();
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      acc += now - last;
      last = now;
      if (acc >= 80) {
        acc = 0;
        force((n) => n + 1);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setParam = (key: keyof OrbParams, v: number) => {
    paramsRef.current[key] = v;
    setValues((s) => ({ ...s, [key]: v }));
  };

  const setAudioParam = (key: AudioSliderKey, v: number) => {
    audioParamsRef.current[key] = v;
    setAudioValues((s) => ({ ...s, [key]: v }));
  };

  const reset = () => {
    Object.assign(paramsRef.current, DEFAULT_PARAMS);
    setValues({ ...DEFAULT_PARAMS });
  };

  const copyConfig = () => {
    void navigator.clipboard?.writeText(JSON.stringify(values, null, 2)).catch(() => {});
  };

  const tele = telemetryRef.current;
  const m = metersRef.current;

  return createPortal(
    <div className="orbdbg" role="dialog" aria-label="Voice orb debug panel">
      <style>{PANEL_CSS}</style>
      <div className="orbdbg-head">
        <strong>orb debug</strong>
        <span className="orbdbg-fps">
          {tele ? `${tele.fps.toFixed(0)} fps · ${tele.state}` : '—'}
        </span>
      </div>

      <div className="orbdbg-meters">
        <Bar label="rms" value={m.average[0]} />
        <Bar label="low" value={m.average[1]} />
        <Bar label="mid" value={m.average[2]} />
        <Bar label="high" value={m.average[3]} />
        <Bar label="transient" value={m.input[1]} />
        <Bar label="flux" value={m.input[2]} />
        <Bar label="confid." value={m.input[3]} />
        <Bar label="cum·fbm" value={m.cumulative[0] % 1} />
      </div>

      <div className="orbdbg-scroll">
        {GROUPS.map((group) => (
          <div key={group} className="orbdbg-group">
            <div className="orbdbg-group-title">{group}</div>
            {SLIDER_DEFS.filter((s) => s.group === group).map((s) => (
              <label key={s.key} className="orbdbg-row">
                <span className="orbdbg-key">{s.key}</span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={values[s.key]}
                  onChange={(e) => setParam(s.key, parseFloat(e.target.value))}
                />
                <span className="orbdbg-num">{values[s.key].toFixed(3)}</span>
              </label>
            ))}
          </div>
        ))}

        <div className="orbdbg-group">
          <div className="orbdbg-group-title">Audio smoothing</div>
          {AUDIO_SLIDERS.map((s) => (
            <label key={s.key} className="orbdbg-row">
              <span className="orbdbg-key">{s.key}</span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={audioValues[s.key]}
                onChange={(e) => setAudioParam(s.key, parseFloat(e.target.value))}
              />
              <span className="orbdbg-num">{audioValues[s.key].toFixed(3)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="orbdbg-actions">
        <button onClick={reset}>reset</button>
        <button onClick={copyConfig}>copy config</button>
      </div>
    </div>,
    document.body,
  );
}

const PANEL_CSS = `
.orbdbg {
  position: fixed; top: 12px; right: 12px; z-index: 9999;
  width: 268px; max-height: calc(100vh - 24px);
  display: flex; flex-direction: column;
  background: rgba(12,14,20,0.86); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
  color: #d7d9e3; font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  box-shadow: 0 12px 40px rgba(0,0,0,0.45);
}
.orbdbg-head { display:flex; justify-content:space-between; align-items:center;
  padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.07); }
.orbdbg-head strong { font-size: 12px; letter-spacing: 0.4px; }
.orbdbg-fps { color:#7f8496; }
.orbdbg-meters { padding: 8px 12px; display:grid; gap:4px;
  border-bottom: 1px solid rgba(255,255,255,0.07); }
.orbdbg-bar { display:grid; grid-template-columns: 52px 1fr 34px; align-items:center; gap:6px; }
.orbdbg-bar-label { color:#8b8fa3; }
.orbdbg-bar-track { height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
.orbdbg-bar-fill { display:block; height:100%; background:linear-gradient(90deg,#6d3bd1,#d6248f); border-radius:3px; }
.orbdbg-bar-val { color:#aeb2c2; text-align:right; }
.orbdbg-scroll { overflow-y:auto; padding: 6px 12px; flex:1; }
.orbdbg-group { margin-bottom: 8px; }
.orbdbg-group-title { color:#7f8496; text-transform:uppercase; letter-spacing:0.6px;
  font-size:9.5px; margin:6px 0 3px; }
.orbdbg-row { display:grid; grid-template-columns: 92px 1fr 40px; align-items:center; gap:6px; margin:2px 0; }
.orbdbg-key { color:#c4c7d3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.orbdbg-row input[type=range] { width:100%; accent-color:#9b5cff; }
.orbdbg-num { color:#8b8fa3; text-align:right; }
.orbdbg-actions { display:flex; gap:8px; padding:10px 12px; border-top:1px solid rgba(255,255,255,0.07); }
.orbdbg-actions button { flex:1; padding:6px; background:rgba(255,255,255,0.06);
  color:#d7d9e3; border:1px solid rgba(255,255,255,0.1); border-radius:7px; cursor:pointer;
  font:inherit; }
.orbdbg-actions button:hover { background:rgba(255,255,255,0.12); }
`;
