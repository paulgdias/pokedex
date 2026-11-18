# Implementation Plan: Party Analyzer

## Overview

Implement the Party Analyzer page at `/party`. The work breaks into five layers: (1) a pure-function utility module with URL parsing and all analysis math; (2) the six display-only components that render analysis results; (3) the interactive slot and threat-picker components; (4) the page component that wires everything together via URL params; and (5) the route registration and nav link that make the page reachable. Each layer is independently testable, and property-based tests are co-located with the analysis utilities to catch correctness issues early.

## Tasks

- [x] 1. Create the `partyAnalyzer` utility module with types, URL helpers, and analysis functions
  - Create `src/utils/partyAnalyzer/index.ts` exporting `parseParty`, `serializeParty`, `parseThreats`, `serializeThreats`, `computeDefensiveProfile`, `computeOffensiveCoverage`, `computeThreatGrid`, `rankReplacements`, and `hasTypeData`; list types in `TYPE_ORDER` from `@utils/stats` (the `/types` page's order) rather than defining a second order
  - Define the exported types `PartyType`, `DefensiveBand`, `DefensiveProfileEntry`, `CoverageEntry`, `ThreatGridRow`, and `ReplacementEntry`
  - Implement `parseParty`: absent param or not-exactly-6 values → 6 nulls; `0`, a value that is not a plain whole number, unknown id, or an id already placed in an earlier slot → null; each valid integer maps to the matching `PokemonDetails` via the passed dex array
  - Implement `serializeParty`: maps null slots to `0`, joins with comma
  - Implement `parseThreats`: split on comma, filter to `TYPE_ORDER`, drop repeats (first occurrence wins), take first 3, ignore unknown names
  - Implement `serializeThreats`: join with comma
  - Implement `computeDefensiveProfile`: for each of the 18 attacking types, compute effective multiplier per party member using `getTypeMatchups` (dual-type product already handled there), assign band by priority Weak > Immune > Resistant > Neutral (an immunity never hides a weakness), include `weakCount` for the Weak band
  - Implement `computeOffensiveCoverage`: for each defending type in `TYPE_ORDER`, check if any party member's type produces ≥ 2× via `getOffense`; mark as `covered` or gap
  - Implement `computeThreatGrid`: for each member × each threat type, compute effective multiplier via `getTypeMatchups` product across the member's defending types
  - Implement `rankReplacements` (stretch goal): take the six slots (nulls for empty ones), identify coverage gaps, find weakest contributor (fewest unique contributions, ties broken by highest `pokemon.id`) and report its real `slotIndex`, source candidates from default forms (`isDefault`) of the same `generationId` excluding species (`speciesId`) already in the party, rank by net coverage gain (gaps closed minus types only the current member covered) descending then id ascending, keep gains above 0, return up to 3
  - Implement `hasTypeData`: true when the chart mentions every one of the given types as an attacking type (row) or defending type (column); false means Missing Type Data
  - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.12, 2.1–2.5, 2.7, 3.1–3.2, 3.6, 5.5–5.8, 5.9, 5.12, 6.1–6.9_

  - [x] 1.1 Write unit tests for URL helpers in `src/utils/partyAnalyzer/partyAnalyzer.test.ts`
    - Test `parseParty`: valid param, absent param, wrong count (5, 7), unknown ids, `0` values, values that are not plain whole numbers (`4abc`, `1.5`), mix of valid and unknown, repeated ids
    - Test `parseThreats`: valid list, more than 3 (truncation), unknown type names, mixed valid/invalid, empty string, repeated types
    - Test `serializeParty` / `serializeThreats` round-trips
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.12, 5.5–5.8, 5.12_

  - [ ]* 1.2 Write property test: Party URL round-trip (Property 1)
    - **Property 1: Party URL round-trip** — for any array of exactly 6 slots (valid id or null, no id in two slots), `parseParty(serializeParty(party), dex)` equals the original
    - **Validates: Requirements 1.7, 1.8**

  - [ ]* 1.3 Write property test: Threat URL round-trip (Property 2)
    - **Property 2: Threat URL round-trip** — for any list of 0–3 valid type names, `parseThreats(serializeThreats(threats))` equals the original
    - **Validates: Requirements 5.5, 5.6**

  - [ ]* 1.4 Write property test: Party URL ignores invalid lengths (Property 7)
    - **Property 7: Party URL ignores invalid lengths** — for any comma-separated string that does not split to exactly 6 values, `parseParty` returns an array of exactly 6 nulls
    - **Validates: Requirements 1.9**

  - [ ]* 1.5 Write property test: Threat parsing ignores unknown types (Property 8)
    - **Property 8: Threat parsing ignores unknown types** — for any comma-separated string of mixed valid, invalid and repeated type names, `parseThreats` returns only valid ones, each once, up to 3, in original order
    - **Validates: Requirements 5.7, 5.8**

  - [x] 1.6 Write unit tests for analysis functions in `partyAnalyzer.test.ts`
    - Test `computeDefensiveProfile`: single-type member, dual-type member, all-neutral party, known super-effective and immune scenarios, weak beating immune, correct `weakCount`
    - Test `hasTypeData`: type known as a row, type known only as a column, type the chart never mentions
    - Test `computeOffensiveCoverage`: single member covering some types, full-coverage party, empty party, a member type with Missing Type Data contributing nothing
    - Test `computeThreatGrid`: 1 member × 1 threat, 6 members × 3 threats, immune type (0×)
    - Test `rankReplacements`: tie-breaking by highest id, real `slotIndex` with empty slots, net-gain ranking (no swap that trades one gap for another), exclusion of party species and non-default forms, generation filter, no candidates available
    - _Requirements: 2.1–2.5, 2.7, 3.1–3.2, 3.6, 5.9, 6.1–6.9_

  - [ ]* 1.7 Write property test: Defensive profile covers all 18 types (Property 3)
    - **Property 3: Defensive profile covers all 18 types** — for any non-empty party and valid `TypeEfficacy`, `computeDefensiveProfile` returns exactly 18 entries covering all types in `TYPE_ORDER` with valid band values
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 1.8 Write property test: Defensive profile bands are mutually exclusive (Property 4)
    - **Property 4: Defensive profile bands are mutually exclusive** — for any party and efficacy, no attacking type appears in more than one band
    - **Validates: Requirements 2.2**

  - [ ]* 1.9 Write property test: Weak and Immune bands are correct (Property 5)
    - **Property 5: Weak and Immune bands are correct** — for any party and attacking type, if a member takes 2× or more the type is Weak with `weakCount` equal to those members; otherwise, if a member takes 0×, it is Immune
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 1.10 Write property test: Offensive coverage covers all 18 types (Property 6)
    - **Property 6: Offensive coverage covers all 18 types** — for any non-empty party and valid efficacy, `computeOffensiveCoverage` returns exactly 18 entries, one per type in `TYPE_ORDER`
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 1.11 Write property test: Threat grid dimensions match inputs (Property 9)
    - **Property 9: Threat grid dimensions match inputs** — for any party of size N and list of M threat types (0 ≤ N ≤ 6, 0 ≤ M ≤ 3), `computeThreatGrid` returns exactly N rows each with exactly M entries in `multipliers`
    - **Validates: Requirements 5.9**

  - [ ]* 1.12 Write property test: Replacement candidates exclude party species (Property 10)
    - **Property 10: Replacement candidates exclude party species** — for any party and dex, `rankReplacements` returns candidates whose `speciesId` is not the species of any current party member
    - **Validates: Requirements 6.6**

  - [ ]* 1.13 Write property test: Replacement candidates come from same generation (Property 11)
    - **Property 11: Replacement candidates come from same generation** — for any party, `rankReplacements` returns candidates whose `generationId` equals the target slot's Pokémon's `generationId`, all default forms
    - **Validates: Requirements 6.3**

  - [ ]* 1.14 Write property test: A Pokémon never fills two slots (Property 12)
    - **Property 12: A Pokémon never fills two slots** — for any comma-separated string of six values, `parseParty` returns slots with no repeated id, each id at its first position
    - **Validates: Requirements 1.4, 1.12**

  - [ ]* 1.15 Write property test: Suggested swaps always gain coverage (Property 13)
    - **Property 13: Suggested swaps always gain coverage** — for any party and dex, putting any candidate from `rankReplacements` into `slotIndex` makes `computeOffensiveCoverage` report strictly more covered types
    - **Validates: Requirements 6.4, 6.7**

- [x] 2. Checkpoint — ensure all utility tests pass
  - Run `npm test` targeting the unit project; ensure all `partyAnalyzer` tests pass. Ask the user if any test logic needs clarification.

- [x] 3. Implement the `DefensiveProfile` component
  - Create `src/components/PokemonDetail`-style folder at `src/components/Party/DefensiveProfile/index.tsx`
  - Accept props `party: PokemonDetails[]` and `efficacy: TypeEfficacy`
  - Call `computeDefensiveProfile` and render four `Panel as="section"` sections in order: Immune, Resistant, Neutral, Weak, each with a `SectionLabel` heading
  - Use `aria-labelledby` on each `Panel` section
  - Render type pills using `typePillClass` and `typeDotClass` from `@styles/Pokedex`
  - Weak pills show a numeric badge for `weakCount` and an `sr-only` span reading `"[N] members weak to [type]"`
  - Show an empty-state label for any band containing zero types
  - When `party` is empty, render a prompt: "Add Pokémon to see the defensive profile"
  - If a member's types have Missing Type Data (`hasTypeData` is false), exclude that member from band calculations and display `"Type data unavailable for [name]"` beneath the section
  - _Requirements: 2.1–2.8_

  - [x] 3.1 Write component tests for `DefensiveProfile` in `DefensiveProfile.test.tsx`
    - Shows all 4 band sections; Weak band shows count badges; empty party shows prompt; missing type data shows error message
    - _Requirements: 2.1–2.8_

  - [x] 3.2 Write Storybook story `DefensiveProfile.stories.tsx` with `play` function
    - At least one story with `expect` call; use `DEX` fixture and `EFFICACY` from `__fixtures__/pokemon.ts`
    - _Requirements: 2.1–2.3_

  - [x] 3.3 Write `DefensiveProfile.mdx`
    - `<Meta>`, short description, `<ArgTypes>`, `<Canvas>` per story

- [x] 4. Implement the `OffensiveCoverage` component
  - Create `src/components/Party/OffensiveCoverage/index.tsx`
  - Accept props `party: PokemonDetails[]` and `efficacy: TypeEfficacy`
  - Call `computeOffensiveCoverage` and render all 18 types
  - Covered types use standard `typePillClass`; gap types use an outlined variant (no fill, dashed border, muted text via Tailwind)
  - Each gap pill includes an `sr-only` span reading `"Coverage gap"` for screen readers
  - When all 18 types are covered, display a confirmation message in place of gap indicators
  - When `party` is empty, display a prompt; do not render any type classification
  - _Requirements: 3.1–3.6_

  - [x] 4.1 Write component tests for `OffensiveCoverage` in `OffensiveCoverage.test.tsx`
    - Covered and gap types are visually distinct; full coverage shows confirmation; empty party shows prompt
    - _Requirements: 3.1–3.6_

  - [x] 4.2 Write Storybook story `OffensiveCoverage.stories.tsx` with `play` function
    - _Requirements: 3.1–3.3_

  - [x] 4.3 Write `OffensiveCoverage.mdx`

- [x] 5. Implement the `MemberMatchups` component
  - Create `src/components/Party/MemberMatchups/index.tsx`
  - Accept props `party: PokemonDetails[]` and `efficacy: TypeEfficacy` (the page renders it only once the type chart has loaded, per Requirement 8.6)
  - Render one `Panel as="section"` per filled slot with `aria-labelledby` set to the member's name heading
  - Each panel contains: sprite (`<img>` with `alt=""`), name, type pills, then `<TypeMatchups types={pokemon.types} efficacy={efficacy} />`
  - Display only non-neutral matchup groups (4×, 2×, ½×, ¼×, 0×); if the member's types have Missing Type Data (`hasTypeData` is false), show `"Type data unavailable"`; otherwise, if `getTypeMatchups` returns no groups, show `"No weaknesses or resistances"`
  - _Requirements: 4.1–4.6_

  - [x] 5.1 Write component tests for `MemberMatchups` in `MemberMatchups.test.tsx`
    - Renders matchups per member; no-weakness message; type data unavailable message
    - _Requirements: 4.1–4.6_

  - [x] 5.2 Write Storybook story `MemberMatchups.stories.tsx` with `play` function
    - _Requirements: 4.2–4.4_

  - [x] 5.3 Write `MemberMatchups.mdx`

- [x] 6. Implement the `ThreatAnalysis` component
  - Create `src/components/Party/ThreatAnalysis/index.tsx`
  - Accept props `party: PokemonDetails[]`, `threats: string[]`, `efficacy: TypeEfficacy`, `onAddThreat: (type: string) => void`, `onRemoveThreat: (type: string) => void`
  - Render a React Aria `Select` (not a `ComboBox`: 18 fixed options need no search, and a `ComboBox` reopens its list over the grid after each pick) limited to 18 types with aria-label `"Add a threat type"`; disable it when `threats.length >= 3`; prevent duplicate types
  - Render a remove `Button` per threat with aria-label `"Remove [type] threat"`
  - When `party.length > 0 && threats.length > 0`, render the grid: one row per party member, one column per threat type
  - Each cell displays the multiplier label (0×, ¼×, ½×, 1×, 2×, 4×) and uses `cellClass`-style color coding: 2× or 4× as weak, ¼× or ½× as resistant, 0× as immune, 1× as neutral
  - Each cell includes an `sr-only` description via `describeMatchup` from `@utils/stats`
  - When neither threats nor party members are set, show a prompt describing the feature
  - _Requirements: 5.1–5.11_

  - [x] 6.1 Write component tests for `ThreatAnalysis` in `ThreatAnalysis.test.tsx`
    - Add-threat control is disabled at 3 threats; grid renders correct multipliers; removing a threat removes its column; prompt shown when empty
    - _Requirements: 5.1–5.11_

  - [x] 6.2 Write Storybook story `ThreatAnalysis.stories.tsx` with `play` function
    - _Requirements: 5.1–5.4, 5.9–5.10_

  - [x] 6.3 Write `ThreatAnalysis.mdx`

- [x] 7. Implement the `ReplacementSuggestions` component (stretch goal)
  - Create `src/components/Party/ReplacementSuggestions/index.tsx`
  - Accept props `party: (PokemonDetails | null)[]` (the six slots), `allPokemon: PokemonDetails[]`, `efficacy: TypeEfficacy`
  - Call `rankReplacements`; hide the section entirely when it returns `null` (no coverage gaps, fewer than 2 members, or no candidate with a net coverage gain)
  - Render at most one suggestion entry for the weakest slot (member name and slot number) with up to 3 candidate cards (sprite, name, type pills)
  - _Requirements: 6.1–6.9_

  - [x] 7.1 Write component tests for `ReplacementSuggestions` in `ReplacementSuggestions.test.tsx`
    - Hidden when no gaps; shows up to 3 candidates; names the real slot with empty slots before it; hidden when no same-generation candidate has a net coverage gain
    - _Requirements: 6.1–6.9_

  - [x] 7.2 Write Storybook story `ReplacementSuggestions.stories.tsx` with `play` function
    - _Requirements: 6.1–6.9_

  - [x] 7.3 Write `ReplacementSuggestions.mdx`

- [x] 8. Implement the `SlotPicker` component
  - Create `src/components/Party/SlotPicker/index.tsx`
  - Accept props `index: number`, `allPokemon: PokemonDetails[]`, `excludedIds: number[]`, `onSelect: (id: number) => void`
  - Implement as a React Aria `ComboBox` → `Input` → `Popover` → `ListBox`, replicating the `Picker` pattern from `Compare.tsx`
  - Use `getPokemonSuggestions` from `@utils/search` capped at 8, filtered to exclude `excludedIds`
  - Aria-label: `"Slot N Pokémon"` where N is `index + 1`
  - Each `ListBoxItem` displays sprite, dex number (`formatPokedexNumber`), and name
  - _Requirements: 1.2, 1.3, 1.4, 8.2, 8.4_

  - [x] 8.1 Write component tests for `SlotPicker` in `SlotPicker.test.tsx`
    - Renders combobox with correct label; already-selected ids absent from suggestions; selecting fires `onSelect`
    - _Requirements: 1.2–1.4, 8.2_

  - [x] 8.2 Write Storybook story `SlotPicker.stories.tsx` with `play` function
    - _Requirements: 1.2–1.3_

  - [x] 8.3 Write `SlotPicker.mdx`

- [x] 9. Implement `PartySlot` and `PartySlots` components
  - Create `src/components/Party/PartySlot/index.tsx`
  - Accept props `index: number`, `pokemon: PokemonDetails | null`, `allPokemon: PokemonDetails[]`, `selectedIds: number[]`, `onSet: (id: number | null) => void`
  - Empty state: render `<SlotPicker>` with `excludedIds={selectedIds}` and `onSelect={(id) => onSet(id)}`
  - Filled state: render sprite (`<img>`), name, type pills, and a `Button` with aria-label `"Remove [name]"` that calls `onSet(null)`
  - Create `src/components/Party/PartySlots/index.tsx`
  - Accept props `party: (PokemonDetails | null)[]`, `allPokemon: PokemonDetails[]`, `onSet: (index: number, id: number | null) => void`
  - Render a CSS grid of exactly six `PartySlot` elements: `grid-cols-2 md:grid-cols-3`
  - _Requirements: 1.1–1.6, 8.2, 8.5_

  - [x] 9.1 Write component tests for `PartySlot` in `PartySlot.test.tsx`
    - Empty slot renders picker; filled slot renders remove button with correct aria-label; remove clears slot; already-selected Pokémon absent from picker
    - _Requirements: 1.1–1.6, 8.2_

  - [x] 9.2 Write Storybook story `PartySlot.stories.tsx` with `play` function
    - _Requirements: 1.1–1.5_

  - [x] 9.3 Write `PartySlot.mdx`

  - [x] 9.4 Write component tests for `PartySlots` in `PartySlots.test.tsx`
    - Renders exactly 6 slots; calls `onSet` with correct index and id
    - _Requirements: 1.1, 8.5_

  - [x] 9.5 Write Storybook story `PartySlots.stories.tsx` with `play` function
    - _Requirements: 1.1_

  - [x] 9.6 Write `PartySlots.mdx`

- [x] 10. Implement the `Party` page component
  - Create `src/pages/Party.tsx` as a default export
  - Receive `PokemonDetails[]` via `useLoaderData()`
  - Read `TypeEfficacy` via `useQuery(typeEfficacyQueryOptions)` (handle loading and error states per Requirement 8.6)
  - Read and write party and threat params from `useSearchParams()` using `parseParty` / `serializeParty` / `parseThreats` / `serializeThreats`; all writes use `{ replace: true, preventScrollReset: true }`
  - Render `<PageHeader>` containing an `<h1>` with text `"Party Analyzer"` styled `font-display text-[34px] leading-tight font-bold tracking-tight`
  - Render `<PartySlots>` wired to URL-param state via `onSet`
  - Render `<DefensiveProfile>`, `<OffensiveCoverage>`, `<MemberMatchups>`, `<ThreatAnalysis>`, and `<ReplacementSuggestions>` only when `efficacy` is loaded; show inline `"Loading…"` or `"Couldn't load type data. Please try again."` otherwise. The analysis components get the filled members; `<ReplacementSuggestions>` gets all six slots so it can name the real slot
  - Wire `onAddThreat` / `onRemoveThreat` callbacks to update the `threats` URL param
  - Add `preconnect` calls to `https://graphql.pokeapi.co` and `https://raw.githubusercontent.com/`
  - _Requirements: 1.7–1.11, 7.3–7.5, 8.1–8.6_

  - [x]* 10.1 Write component tests for `Party` page in `src/pages/Party.test.tsx`
    - URL param parsing restores state on mount; repeated ids and types in the URL fill one slot / one threat only; party and threat changes write `replace: true` params; loading state shown; error state shown; `TestRouter` wraps the component
    - _Requirements: 1.7–1.12, 5.12, 7.5, 8.6_

- [x] 11. Register the route and add the nav link
  - In `src/utils/routes/index.tsx`, add a `dataRoute` call inside `createAppRoutes` with id `"party"`, path `"/party"`, the lazy page import, the shared `loader`, and the standard error message
  - In `src/components/Nav/index.tsx`, add `{ to: "/party", label: "Party", Icon: Users }` to `NAV_ITEMS` (import `Users` from `lucide-react`)
  - Verify `toWithPreservedSearch` already handles `/party` by the existing pattern (no code change needed)
  - _Requirements: 7.1–7.2_

  - [x]* 11.1 Write tests for route registration in `src/utils/routes/routes.test.tsx` (or add to existing test)
    - Verify the `"party"` route id exists in `createAppRoutes` output with path `"/party"` and a loader
    - _Requirements: 7.1_

- [x] 12. Write the end-to-end test `e2e/party.spec.ts`
  - Navigate to `/party` from the Nav; verify the link is present and the page loads
  - Add two Pokémon and verify the URL encodes them in `party=…`
  - Reload the page and verify the party is restored from the URL
  - Add a threat type and verify the grid appears
  - Remove a party member and verify its slot reverts to empty
  - Use `mockPokeApi` from `e2e/mocks.ts`; keep IndexedDB empty per test (each test uses its own context)
  - _Requirements: 7.1–7.5_

- [x] 13. Final checkpoint — ensure all tests pass and coverage thresholds are met
  - Run `npm run verify` (Biome check, type-check, production build, test with coverage); ensure no failures. Ask the user if anything needs adjustment.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use [fast-check](https://fast-check.io) with a minimum of 100 iterations; each `fc.assert` call is annotated with the Feature and Property number it validates
- All new component folders require `index.tsx`, `ComponentName.test.tsx`, `ComponentName.stories.tsx`, and `ComponentName.mdx` to satisfy `structure.test.ts`
- The `Party/` prefix groups the new components under `src/components/Party/`; each sub-component still follows the folder convention with its own test, story, and MDX file
- The stretch-goal `ReplacementSuggestions` and its property tests (1.12, 1.13, 1.15) can be deferred without blocking any other task
- `fast-check` must be added to `optimizeDeps.include` in `vitest.config.mts` if it isn't already listed, to avoid a Vite re-optimisation mid-run
- E2E: nothing on the Party page is timed, so no `page.clock` is needed; the params are percent-encoded, so URL assertions match both `,` and `%2C`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.6"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.7", "1.8", "1.9", "1.10", "1.11", "1.12", "1.13", "1.14", "1.15"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "4.1", "4.2", "4.3", "5.1", "5.2", "5.3", "6.1", "6.2", "6.3", "7.1", "7.2", "7.3", "8.1", "8.2", "8.3"] },
    { "id": 3, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 4, "tasks": ["10.1", "11.1"] },
    { "id": 5, "tasks": ["12"] }
  ]
}
```
