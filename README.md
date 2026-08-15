# Chore Spin Wheel

## Usage

```bash
npm test          # 39 tests
npm run typecheck # tsc --noEmit
```

## Design Rationale

Game-show prize wheel from "spinning wheel" + "colored segments" in brief. Touchpoints: (1) circular SVG radial segments, (2) cubic-bezier spin animation, (3) "Tonight's chore" copy making the result feel final, not accusatory.

## Breakpoints

- `640px` — smaller wheel, reduced font sizes
- `360px` — stacked form layout, compact padding

## Known Limitations

- Max 20 chores; color palette repeats after 8
- Fixed spin duration; no history log
