# Dungeon Pinball

A torch-lit, roguelike-flavored 2D browser pinball game with 5 chambers, built with TypeScript, [Matter.js](https://brm.io/matter-js/) physics, and Canvas 2D rendering. No art or audio assets — everything is drawn and synthesized at runtime.

## Gameplay

- **5 cursed chambers**, each with its own torchlit theme and objective:
  1. **Goblin Warrens** — light all 3 torches
  2. **Crimson Crypt** — shatter the bone wall twice
  3. **Molten Forge** — spin the furnace wheel 15 times
  4. **Shadow Sanctum** — ascend the spire stairs 5 times
  5. **Dragon's Hoard** — plunder 15,000 gold to wake the dragon
- **Modern pinball mechanics**: twin flippers, a charge-and-release plunger, pop bumpers, slingshots, a spinner, drop targets, a captured-ball ramp, skill shot ("First Strike"), ball save ("Sanctuary"), tilt/nudge ("Tremor"), combo multiplier, multiball ("Horde"), and bonus lives.
- **Controls**: `←`/`Z` and `→`/`X` for flippers, hold `Space` to charge your strike and release to launch, `A`/`D`/`W` to shake the chamber, `P`/`Esc` to pause. Touch controls appear automatically on touch devices.

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
- Slingshots (the kicker triangles above each flipper) are positioned outside each flipper's rotational sweep radius — placing one inside that arc jams the flipper against its static body instead of letting it swing freely.
- The ramp is simulated by capturing the ball (making it a sensor) and animating it along a Catmull-Rom spline for its travel time, then releasing it with an exit velocity.
- All sound effects are generated with the Web Audio API (oscillators + noise bursts) — there are no audio files.
