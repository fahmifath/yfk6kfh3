# Chore Spin Wheel

## Usage

```bash
npm test && npm run typecheck
```

## Design Rationale

Game-show prize wheel from "spinning wheel" + "colored segments" in brief. Three touchpoints: (1) SVG radial segments with name labels, (2) spin animation stops exactly on winning segment, (3) "Tonight's chore" copy.

## Breakpoints

- `640px` — smaller wheel, reduced fonts
- `360px` — stacked form, compact padding

## Known Limitations

- Max 20 chores; colors repeat after 8; names truncated at 9 chars in wheel