# Neon Cascade

A sleek 2D browser pinball game with 5 tables, built with TypeScript, [Matter.js](https://brm.io/matter-js/) physics, and Canvas 2D rendering. No art or audio assets — everything is drawn and synthesized at runtime.

## Gameplay

- **5 distinct tables**, each with its own neon theme and objective:
  1. **Ion Storm** — light all 3 pop bumpers
  2. **Crimson Vault** — clear the drop-target bank twice
  3. **Solar Drift** — spin the gate 15 times
  4. **Violet Cascade** — run the spire ramp 5 times
  5. **Nova Core** — score 15,000 points to overload the core
- **Modern pinball mechanics**: twin flippers, a charge-and-release plunger, pop bumpers, slingshots, a spinner, drop targets, a captured-ball ramp, skill shot, ball save, tilt/nudge, combo multiplier, multiball, and extra balls.
- **Controls**: `←`/`Z` and `→`/`X` for flippers, hold `Space` to charge the launcher and release to fire, `A`/`D`/`W` to nudge the table, `P`/`Esc` to pause. Touch controls appear automatically on touch devices.

## Development

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and produce a production build in dist/
npm run preview   # preview the production build locally
```

## Deploying to Vercel

This is a static Vite build with zero server-side requirements.

1. Push this repository to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Vercel auto-detects the Vite framework preset (build command `npm run build`, output directory `dist`) via `vercel.json`. No extra configuration is needed.

Or deploy from the CLI:

```bash
npm i -g vercel
vercel --prod
```

## Tech notes

- Physics runs on a fixed 120Hz timestep (Matter.js) decoupled from the render loop.
- Flippers are driven by setting angular velocity toward a target angle each tick, so Matter's own solver produces correct ball impulses.
- The ramp is simulated by capturing the ball (making it a sensor) and animating it along a Catmull-Rom spline for its travel time, then releasing it with an exit velocity.
- All sound effects are generated with the Web Audio API (oscillators + noise bursts) — there are no audio files.
