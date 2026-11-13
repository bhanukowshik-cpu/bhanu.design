# Sound credits and licence status

All recordings are from the **Epidemic Sound** Sound Effects library, downloaded on 13 Nov 2026 through the account's
Epidemic Sound connector (WAV, 96 kHz / 24-bit; 192 kHz for the fireplace). Masters live in `audio/raw/` (gitignored);
`audio/build.py` records every cut, and the IDs below re-download them.

## ⚠️ Licence status: NOT CLEARED FOR SHIPPING (13 Nov 2026)

Do not merge the soundscape to `main` until Epidemic Sound confirms in writing that the account's plan covers it.
What Epidemic's own licence texts say (read 13 Nov 2026):

1. **Scope of the grant.** Both the Creator licence (updated 29 Apr 2025) and the Pro licence (updated 27 Apr 2026)
   grant the right to synchronise the works "in video and podcast productions". Websites are listed only as places to
   *publish those productions*. A live, interactive web soundscape that plays the recordings directly is not a video
   or podcast production.
2. **No standalone use.** Both forbid uses "intended to allow third parties to download, reproduce, stream, and/or
   otherwise access or use the Licensed Works … on a standalone basis, including … digital templates or other
   applications". The site serves each recording as its own file (e.g. `/audio/hero/ocean.m4a`), which anyone can open.
3. **Apps and games** need Business Plus or Enterprise (Sound Effects FAQ: "on the Business Plus and Enterprise plans,
   which cover up to 3 mobile apps and 3 games"); Creator, Pro and Pro Plus don't cover them. An interactive site may
   fall under this.
4. **No edits.** "You may cut, loop and fade in/out … but you may not otherwise edit, alter, or change the Licensed
   Works." `build.py` also EQs the barks and gulls (low/high-pass), compresses the fireplace, sums every one-shot to mono
   and normalises loudness; at runtime the hero engine filters and pans them. Ask whether level changes, mono and
   gentle EQ count as edits; if they do, drop the `fx` entries in `build.py` and rebuild.
5. **Commercial use.** The Sound Effects FAQ: "The Creator plan covers non-commercial publishing"; commercial and
   client work needs Pro or above. The homepage promotes the owner's company (Verified Call), so treat it as commercial.
6. **Credits.** Required where reasonably possible, in the form "Artist / Title / courtesy of Epidemic Sound",
   hyperlinked to epidemicsound.com. Once cleared, add a credit line to the footer (Epidemic gives no artist name for
   these sound effects; use the title).
7. **After cancelling.** Productions published during the subscription stay licensed; nothing new may be made after.
   Ask how that applies to a website that keeps serving the files.

Plan on the account: **unknown** (the owner should check; Epidemic's current tiers are Creator / Pro / Pro Plus /
Business / Business Plus / Enterprise, and older accounts may still be "Personal").

Sources: epidemicsound.com/policy/creator-subscription/ · epidemicsound.com/policy/pro-subscription/ ·
epidemicsound.com/sound-effects/ (FAQ) · epidemicsound.com/pricing/

## Tracks used

| File(s) in `audio/` | Epidemic Sound title | Sound effect ID | Source length | What we used |
|---|---|---|---|---|
| `hero/ocean.m4a` | Water, Lap, Small Waves Lapping, Bubbling In Dock | `cc966b42-27fc-46d2-8ba0-cbfdd4e6e37e` | 2:44 | 104–152 s → 45 s loop |
| `hero/wind.m4a` | Wind, Designed, Paragliding, Flight, Action Camera POV, Wind Blowing, Gusts, Soft, Muffled | `93e1b9c3-d0e2-4dd9-acf2-f5486a681765` | 2:58 | 69–117 s → 45 s loop |
| `hero/bark-1…4.m4a` | Animals, Aquatic, Sea Lion, Group, Barking, Growling | `3f7244a4-26c5-47d8-a87a-a0f052def5f7` | 2:32 | 4 one-shots |
| `hero/plip-1…4.m4a` | Water, Drip, Water Surface, Small, Light 01 | `a3ee556c-5b4e-47f4-bfee-3474e44fb24e` | 0:22 | 4 one-shots |
| `hero/gull-1…4.m4a` | Birds, Sea, Seagulls, Calling, Single Calls, Close Perspective, Norway, Tromso (3.0) | `92b64cdb-4c88-4a72-86ab-0226e6525998` | 1:49 | 4 one-shots |
| `hero/foghorn.m4a` | Boats, Horn, Distant, Big Transatlantic Ship | `463af07a-e0b5-41be-9019-008d70e379e2` | 0:35 | one blast |
| `hero/ferryhorn.m4a` | Boats, Horn, Ferry, Horn, Across The Lake | `d0b6acba-060b-4549-ba8b-b1b0b95a266e` | 0:05 | one blast |
| `whoosh.m4a` | Swooshes, Whoosh, Airy, Soft Wind, Breeze, Variations | `393ee980-2c49-45f0-8ed8-025c0efa81ff` | 0:07 | first variation |
| `chapters/vc.m4a` | Ambience, Room Tone, Office Room Tone, AC | `69cae017-120b-4591-bd81-ffcffe41fb13` | 2:00 | 45 s loop |
| `chapters/stressie.m4a` | Ambience, Restaurant & Bar, Cafe, Outdoors, Wind In Trees, Walla, Turkey Istanbul, Loop 02 | `4372bee0-9a9d-4385-9d11-d2b0c8d94ee2` | 2:07 | 45 s loop |
| `chapters/etlive.m4a` | Ambience, Residential, Kitchen, Air, Quiet, Closed Window, Next Door Activity | `dabaded0-9e81-48f9-8d51-75777c459271` | 2:01 | 45 s loop |
| `chapters/etstudio.m4a` | Ambience, Room Tone, University Classroom 01 | `a6b4735a-8184-43cb-abe6-0a0b50c6c3d8` | 2:00 | 45 s loop |
| `chapters/etanalytics.m4a` | Ambience, Room Tone, Empty Office, Hum, Ventilation | `147c743f-9838-4da8-80c1-69dba915e02c` | 1:28 | 45 s loop |
| `chapters/dearly.m4a` | Fire, Crackle, Fireplace, Indoor, Open, Crackling, Transient, Low Intensity | `4c34a487-e5bc-44eb-9d09-399f9baef907` | 2:17 | 45 s loop |

The footer painting reuses the hero files. No music tracks are used.
