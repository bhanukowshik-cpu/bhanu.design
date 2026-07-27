import { Leva } from 'leva';
import { VoiceOrb } from './components/voice-orb/VoiceOrb';

export default function App() {
  // dev controls only — append ?clean to the URL to hide the panel
  const clean = new URLSearchParams(window.location.search).has('clean');
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Leva hidden={clean} collapsed titleBar={{ title: 'Orb Controls' }} />
      <VoiceOrb />
    </div>
  );
}
