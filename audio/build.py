#!/usr/bin/env python3
"""Rebuild the site's sound files from the Epidemic Sound masters in audio/raw/.

    python3 -I audio/build.py            # from the repo root

audio/raw/ is gitignored (licensed masters, ~1 GB at 96 kHz / 24-bit). Re-download them with
the IDs in audio/CREDITS.md, keeping the `slot__` filename prefixes this script globs for.

Loops: a (LOOP_S + XF_S) window is cut, its last XF_S seconds are equal-power crossfaded into
its first XF_S seconds, so the file ends where it starts and the loop point is inaudible.
One-shots: mono, 50 ms fades (longer tails where noted), optional EQ to push them distant.
Everything is normalised to TARGET_LUFS so the gain values in poster-lab.html / index.html stay
meaningful.

Loops are 96 kbps, not HANDOFF's 128 kbps, because its size caps can't hold at 128 kbps
(two 45 s stereo loops = 1.44 MB of a 1.5 MB hero budget; one 45 s chapter loop = 720 KB of
600 KB). Room tone at 96 kbps AAC is transparent.
"""
import glob, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(ROOT, 'raw')
TARGET_LUFS = -24.0
LOOP_S, XF_S = 45.0, 3.0
SR = 48000

# slot: (raw prefix, window start s, out path, kbps, extra filter)
LOOPS = {
    'ocean':       ('ocean',      104.0, 'hero/ocean.m4a',           96, ''),   # seam lands between waves
    'wind':        ('wind',        69.0, 'hero/wind.m4a',            96, ''),   # 68-120 s: no dropouts
    'vc':          ('vc',           6.0, 'chapters/vc.m4a',          96, ''),
    'stressie':    ('stressie',    30.0, 'chapters/stressie.m4a',    96, ''),
    'etlive':      ('etlive',      24.0, 'chapters/etlive.m4a',      96, ''),   # 22-74 s: between the clatters
    'etstudio':    ('etstudio',     6.0, 'chapters/etstudio.m4a',    96, ''),
    'etanalytics': ('etanalytics',  6.0, 'chapters/etanalytics.m4a', 96, ''),
    'dearly':      ('dearly',      48.0, 'chapters/dearly.m4a',      96,       # soften crackle peaks so it reaches target
                    'acompressor=threshold=0.05:ratio=4:attack=2:release=120:makeup=1'),
}

DISTANT = 'highpass=f=350,lowpass=f=3200'        # far across the water
# slot: (raw prefix, [(start, end), ...], out stem, extra filter, fade-out s)
SHOTS = {
    'bark':      ('bark',      [(15.0, 18.8), (22.8, 24.6), (71.6, 73.7), (93.7, 95.1)], 'hero/bark',      'lowpass=f=2600', 0.15),
    'plip':      ('plip',      [(0.3, 1.4), (1.6, 3.0), (3.6, 4.5), (10.7, 12.0)],       'hero/plip',      '',               0.05),
    'gull':      ('gull',      [(28.3, 29.7), (42.4, 44.0), (63.1, 65.7), (67.2, 69.0)], 'hero/gull',      DISTANT,          0.10),
    'foghorn':   ('foghorn',   [(21.8, 27.7)],                                           'hero/foghorn',   '',               1.50),
    'ferryHorn': ('ferryhorn', [(0.0, 4.0)],                                             'hero/ferryhorn', '',               0.50),
    'whoosh':    ('whoosh',    [(0.1, 3.4)],                                             'whoosh',         '',               0.30),
}
SHOT_KBPS = 80   # HANDOFF says 96; 80 keeps the hero set under its 1.5 MB cap, inaudible on mono calls


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode: sys.exit(f'ffmpeg failed: {" ".join(cmd)}\n{p.stderr[-1500:]}')
    return p.stderr


def lufs(path):
    err = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    summary = err[err.rfind('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summary).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', summary).group(1))
    return i, tp


def src(prefix):
    hits = glob.glob(os.path.join(RAW, prefix + '__*.wav'))
    if len(hits) != 1: sys.exit(f'expected one audio/raw/{prefix}__*.wav, found {len(hits)}')
    return hits[0]


def encode(wav, out, kbps, channels):
    i, tp = lufs(wav)
    gain = min(TARGET_LUFS - i, -1.0 - tp)          # hit the target, never past -1 dBTP
    dst = os.path.join(ROOT, out)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    lvl = wav[:-4] + '.lvl.wav'
    run(['ffmpeg', '-y', '-hide_banner', '-i', wav, '-af', f'volume={gain:.2f}dB', '-ac', str(channels),
         '-map_metadata', '-1', '-c:a', 'pcm_s24le', lvl])
    # Apple's encoder via afconvert: writes correct priming/remainder, so loops decode to exactly
    # LOOP_S (ffmpeg's aac_at wrapper adds ~33 ms of padding = an audible gap at every loop point).
    run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', str(kbps * 1000), '-s', '0', lvl, dst])
    os.remove(lvl)
    print(f'{out:28s} {os.path.getsize(dst)/1024:6.0f} KB   {i:6.1f} LUFS -> {i+gain:6.1f}  (tp {tp+gain:5.1f})')


def main():
    tmp = tempfile.mkdtemp()
    try:
        for slot, (prefix, start, out, kbps, fx) in LOOPS.items():
            wav = os.path.join(tmp, slot + '.wav')
            pre = f'aresample={SR}' + (',' + fx if fx else '')
            graph = (f'[0:a]{pre},asplit[a][b];'
                     f'[a]atrim=start={XF_S}:end={LOOP_S + XF_S},asetpts=PTS-STARTPTS[body];'
                     f'[b]atrim=start=0:end={XF_S},asetpts=PTS-STARTPTS[head];'
                     f'[body][head]acrossfade=d={XF_S}:c1=qsin:c2=qsin')
            run(['ffmpeg', '-y', '-hide_banner', '-ss', str(start), '-t', str(LOOP_S + XF_S + 0.5), '-i', src(prefix),
                 '-filter_complex', graph, '-c:a', 'pcm_s24le', wav])
            encode(wav, out, kbps, 2); os.remove(wav)
        for slot, (prefix, cuts, stem, fx, fade_out) in SHOTS.items():
            for n, (a, b) in enumerate(cuts, 1):
                wav = os.path.join(tmp, f'{slot}{n}.wav')
                d = b - a
                chain = [f'aresample={SR}', 'pan=mono|c0=0.5*c0+0.5*c1'] + ([fx] if fx else []) + \
                        ['afade=t=in:d=0.05', f'afade=t=out:st={d - fade_out:.3f}:d={fade_out}']
                run(['ffmpeg', '-y', '-hide_banner', '-ss', str(a), '-t', f'{d:.3f}', '-i', src(prefix),
                     '-af', ','.join(chain), '-c:a', 'pcm_s24le', wav])
                out = f'{stem}-{n}.m4a' if len(cuts) > 1 else f'{stem}.m4a'
                encode(wav, out, SHOT_KBPS, 1); os.remove(wav)
    finally:
        for f in glob.glob(os.path.join(tmp, '*')): os.remove(f)
        os.rmdir(tmp)


if __name__ == '__main__':
    main()
