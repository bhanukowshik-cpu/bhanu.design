/**
 * Pure-CSS stand-in when WebGL is unavailable: a soft radial-gradient orb
 * with the same palette, so the composition still reads.
 */
export function OrbFallback() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 'min(52vh, 78vw)',
          height: 'min(52vh, 78vw)',
          borderRadius: '50%',
          transform: 'translateY(-4%)',
          background:
            'radial-gradient(circle at 38% 30%, rgba(205,212,255,0.35) 0%, rgba(125,134,255,0.22) 22%, rgba(75,70,200,0.30) 48%, rgba(10,14,42,0.9) 78%)',
          boxShadow:
            '0 0 90px rgba(96,84,220,0.35), inset -18px -24px 60px rgba(4,6,24,0.8), inset 10px 14px 42px rgba(140,150,255,0.18)',
        }}
        aria-label="Glass orb"
      />
    </div>
  );
}
