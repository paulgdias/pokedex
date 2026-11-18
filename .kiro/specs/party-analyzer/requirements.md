# Requirements Document

## Introduction

The Party Analyzer is a new page in the Pokédex app that lets users build a party of up to six Pokémon and understand how those Pokémon work together defensively and offensively. Users can inspect the combined type coverage of the whole party, examine individual Pokémon matchups within that party, and test how the party fares against up to three opponent types. As a stretch goal, the page can suggest replacement Pokémon drawn from the same generation/region as the slot being replaced.

Party state is stored in URL search parameters so any party configuration can be shared or bookmarked and survives a reload.

## Glossary

- **Party**: A collection of 1–6 `PokemonDetails` entries selected by the user to be analyzed together.
- **Party Slot**: One of the six positions in a Party; a slot is either filled (with a chosen Pokémon) or empty.
- **Party Analyzer**: The page and analysis engine described in this document.
- **Party Type Coverage**: The aggregate set of types that the Party can hit super-effectively with at least one member's attack types. Computed from each member's own types using the offensive matchup data.
- **Party Defensive Profile**: For each of the 18 attacking types, the number of Party members that are weak to it, resistant to it, or immune to it, based on `getTypeMatchups` applied to each member's defending types.
- **Threat Types**: Up to three Pokémon types specified by the user to test the Party against. The Party Analyzer evaluates how each Party member fares defensively against each Threat Type.
- **Replacement Suggestion**: A `PokemonDetails` entry sourced only from the same generation as the Pokémon occupying a given Party Slot, limited to default forms (no Mega, Gigantamax or other alternate forms) of species not already in the Party.
- **Net Coverage Gain**: For a replacement candidate, the number of types the Party would hit super-effectively with the candidate in place of the slot's current member, minus the number it hits now. It counts the Coverage Gaps the candidate closes minus the types that only the current member covered, which the swap would lose.
- **TypeEfficacy**: The `TypeEfficacy` lookup table (attacker → defender → multiplier) already used throughout the app, fetched via `typeEfficacyQueryOptions`.
- **Missing Type Data**: A type that the TypeEfficacy table never mentions, neither as an attacking type nor as a defending type. Its matchups cannot be known; treating them as 1× would be misleading.
- **Picker**: The search combobox UI used to find and select a Pokémon by name or Pokédex number, reusing the interaction pattern from the Compare page. It lists nothing until the user types, then up to eight matches.
- **Coverage Gap**: A Pokémon type that none of the Party members can hit super-effectively (2× or higher) with their own types.

## Requirements

### Requirement 1: Party Selection

**User Story:** As a trainer, I want to build a party of up to six Pokémon from the full Pokédex, so that I can analyze how they work together.

#### Acceptance Criteria

1. THE Party_Analyzer SHALL display exactly six Party Slots arranged in a fixed grid.
2. WHEN a Party Slot is empty, THE Party_Analyzer SHALL render a Picker that searches the whole loaded Pokédex by name or Pokédex number and lists up to eight matches.
3. WHEN the user selects a Pokémon from the Picker, THE Party_Analyzer SHALL fill the targeted Party Slot with that Pokémon and close the Picker.
4. THE Party_Analyzer SHALL prevent the same Pokémon from occupying more than one Party Slot simultaneously by excluding already-selected Pokémon from the Picker's available options.
5. WHEN a Party Slot is filled, THE Party_Analyzer SHALL display a remove control that clears that slot.
6. WHEN the user activates the remove control for a filled slot, THE Party_Analyzer SHALL clear that slot and leave all other slots unchanged.
7. WHENEVER a slot is filled or cleared and at least one slot remains filled, THE Party_Analyzer SHALL serialize the Party to the URL param `party` as a comma-separated list of exactly six Pokémon ids in slot order, using `0` for empty slots. WHEN every slot is empty, THE Party_Analyzer SHALL remove the `party` param from the URL rather than writing six zeros, as the Pokédex filters drop empty params.
8. WHEN the page loads and the `party` URL param is present and contains exactly six comma-separated values, THE Party_Analyzer SHALL restore the Party from that param using the loaded Pokédex data.
9. IF the `party` URL param contains fewer or more than six comma-separated values, THEN THE Party_Analyzer SHALL ignore the param entirely and render all six slots as empty.
10. IF a value in the `party` URL param is not a plain whole number (such as `4abc`, `1.5` or `-3`), or is a Pokémon id that does not exist in the loaded Pokédex, THEN THE Party_Analyzer SHALL treat that slot as empty.
11. THE Party_Analyzer SHALL write all Party state changes with `{ replace: true, preventScrollReset: true }`.
12. IF the `party` URL param contains the same Pokémon id more than once, THEN THE Party_Analyzer SHALL place that Pokémon only in the first slot where it appears and treat every later repeat as an empty slot.

### Requirement 2: Party Defensive Profile

**User Story:** As a trainer, I want to see which types hit my whole party hard and which ones my party resists, so that I can spot defensive holes.

#### Acceptance Criteria

1. WHEN the Party contains at least one Pokémon, THE Party_Analyzer SHALL compute and display the Party Defensive Profile.
2. THE Party_Analyzer SHALL group all 18 attacking types into exactly four mutually exclusive bands, checked in the priority order Weak > Immune > Resistant > Neutral: **Weak** (at least one member takes 2× or higher), **Immune** (no member takes 2× or higher and at least one member takes 0×), **Resistant** (no member takes 2× or higher, no member takes 0×, and at least one member takes 0.5× or lower), and **Neutral** (every member takes exactly 1×). One member's immunity SHALL NOT hide another member's weakness.
3. FOR each attacking type in the Weak band, THE Party_Analyzer SHALL display the count of Party members whose effective multiplier for that type is 2× or higher alongside the type pill.
4. WHEN no Party member's effective multiplier for a given attacking type is 2× or higher, THE Party_Analyzer SHALL omit that type from the Weak band.
5. THE Party_Analyzer SHALL derive each member's per-type effective multiplier by applying `getTypeMatchups` to that member's defending types, treating dual-type Pokémon as the product of both type multipliers.
6. WHEN the Party is empty, THE Party_Analyzer SHALL display a prompt instructing the user to add Pokémon to see the defensive profile.
7. IF one of a Party member's types is Missing Type Data, THEN THE Party_Analyzer SHALL exclude that member from all band calculations and display "Type data unavailable for [name]" beneath the bands.
8. WHEN the Party Defensive Profile is displayed, THE Party_Analyzer SHALL render all four band sections in the fixed order: Immune, Resistant, Neutral, Weak, showing an empty state label for any band that contains zero types.

### Requirement 3: Party Offensive Coverage

**User Story:** As a trainer, I want to see which types my party can hit super-effectively and which types none of my Pokémon cover, so that I can identify offensive gaps.

#### Acceptance Criteria

1. WHEN the Party contains at least one Pokémon, THE Party_Analyzer SHALL compute and display the Party Type Coverage, listing all 18 types each classified as either Covered or a Coverage Gap.
2. THE Party_Analyzer SHALL classify a type as **Covered** if at least one Party member's `getOffense` result returns a multiplier of 2× or higher against that type, and as a **Coverage Gap** otherwise.
3. THE Party_Analyzer SHALL render Coverage Gap type badges using a visually distinct style (a different background colour or border) compared to Covered type badges, such that a user can distinguish the two groups without reading a legend.
4. WHEN all 18 types are Covered, THE Party_Analyzer SHALL display a confirmation message in place of any Coverage Gap indicators.
5. WHEN the Party is empty, THE Party_Analyzer SHALL display a prompt instructing the user to add Pokémon, and SHALL NOT render any type coverage classification.
6. IF one of a Party member's types is Missing Type Data, THEN THE Party_Analyzer SHALL treat that type as contributing no offensive coverage and SHALL continue computing coverage from the member's other type and the remaining Party members.

### Requirement 4: Individual Member Matchups

**User Story:** As a trainer, I want to view each party member's own type matchups within the analysis, so that I can see which member handles which threats.

#### Acceptance Criteria

1. WHEN the Party contains at least one Pokémon, THE Party_Analyzer SHALL display a per-member matchup section.
2. WHILE a Party Slot is filled, THE Party_Analyzer SHALL display that member's official art sprite, name, and type pills.
3. WHILE a Party Slot is filled, THE Party_Analyzer SHALL display that member's defensive type matchups, computed from the shared `TypeEfficacy` table, grouped by multiplier and rendered using the `TypeMatchups` component.
4. THE Party_Analyzer SHALL display only non-neutral matchup groups (4×, 2×, ½×, ¼×, 0×) for each member, omitting any multiplier group that has zero attacking types.
5. IF a filled Party Slot's member has no non-neutral matchup groups and none of its types is Missing Type Data, THEN THE Party_Analyzer SHALL display a message indicating that member has no weaknesses or resistances.
6. IF one of a member's types is Missing Type Data, THEN THE Party_Analyzer SHALL display "Type data unavailable" in place of that member's matchup groups.

### Requirement 5: Threat Type Analysis

**User Story:** As a trainer, I want to specify up to three opponent types and see how each party member fares against them, so that I can prepare for specific threats.

#### Acceptance Criteria

1. THE Party_Analyzer SHALL provide a control to add up to three Threat Types by selecting from the 18 Pokémon types (Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost, Steel, Fire, Water, Grass, Electric, Psychic, Ice, Dragon, Dark, Fairy). Everywhere the Party Analyzer lists types, it SHALL use this order, the games' order that the type chart page (`/types`) also uses (`TYPE_ORDER` in `@utils/stats`).
2. THE Party_Analyzer SHALL prevent the same type from being added as a Threat Type more than once.
3. WHEN a Threat Type is added, THE Party_Analyzer SHALL display a remove control for that Threat Type.
4. IF three Threat Types are already set, THEN THE Party_Analyzer SHALL disable the add-Threat-Type control so that no additional type can be selected.
5. THE Party_Analyzer SHALL serialize Threat Types to the URL param `threats` as a comma-separated list of lowercase type names, in the order they were added. WHEN the last Threat Type is removed, THE Party_Analyzer SHALL remove the `threats` param from the URL.
6. WHEN the page loads and the `threats` URL param is present, THE Party_Analyzer SHALL restore the Threat Types from that param, preserving their order.
7. IF a type name in the `threats` URL param is not one of the 18 valid types, THEN THE Party_Analyzer SHALL ignore it silently.
8. IF the `threats` URL param contains more than three valid type names, THEN THE Party_Analyzer SHALL restore only the first three valid type names and ignore the rest.
9. WHEN at least one Threat Type is set and the Party contains at least one Pokémon, THE Party_Analyzer SHALL display a grid with one row per Party member and one column per Threat Type, where each cell shows the defensive damage multiplier (0×, ¼×, ½×, 1×, 2×, or 4×) of that Pokémon against that Threat Type.
10. THE Party_Analyzer SHALL color-code each grid cell based on the displayed multiplier: 2× or 4× as weak, ¼× or ½× as resistant, 0× as immune, and 1× as neutral.
11. WHEN neither Threat Types nor any Party member have been set, THE Party_Analyzer SHALL display a prompt describing the Threat Type analysis feature.
12. IF the `threats` URL param contains the same type more than once, THEN THE Party_Analyzer SHALL keep only its first occurrence; the three-type cap applies after repeats are removed.

### Requirement 6: Replacement Suggestions (Stretch Goal)

**User Story:** As a trainer, I want the Party Analyzer to suggest which Pokémon I could swap out and what to replace them with, using only Pokémon from the same generation, so that I get region-appropriate recommendations.

#### Acceptance Criteria

1. WHEN the Party contains at least two Pokémon, there is at least one Coverage Gap, and at least one replacement candidate has a Net Coverage Gain above zero, THE Party_Analyzer SHALL display a Suggestions section. Otherwise THE Party_Analyzer SHALL NOT render the section at all (no empty heading).
2. WHEN the Party contains at least two Pokémon and there is at least one Coverage Gap, THE Party_Analyzer SHALL identify the Party Slot whose current member contributes the fewest unique offensive type coverages not already covered by any other Party member, and treat that slot as the weakest contributor; IF two or more slots are tied for fewest unique contributions, THEN THE Party_Analyzer SHALL select the slot occupied by the Pokémon with the highest Pokémon id among the tied slots. THE Party_Analyzer SHALL name that member and its slot number (1–6, counting empty slots).
3. THE Party_Analyzer SHALL source replacement candidates exclusively from the same `generationId` as the Pokémon occupying the slot being replaced, and only from default forms (`isDefault`), never Mega, Gigantamax or other alternate forms.
4. THE Party_Analyzer SHALL rank replacement candidates by their Net Coverage Gain, in descending order.
5. WHEN multiple candidates have the same Net Coverage Gain, THE Party_Analyzer SHALL break ties by ascending Pokémon id.
6. THE Party_Analyzer SHALL exclude from the replacement candidate pool every Pokémon whose species (`speciesId`) is already present in any Party Slot, including the Party members themselves.
7. WHEN no replacement candidate has a Net Coverage Gain above zero, THE Party_Analyzer SHALL hide the Suggestions section (see 6.1) rather than displaying an empty candidate list. A swap that closes one gap but opens another SHALL NOT be suggested.
8. WHEN the Party has full offensive coverage across all 18 Pokémon types, THE Party_Analyzer SHALL hide the Suggestions section entirely.
9. IF the Party_Analyzer identifies a weakest contributor slot per criterion 2 and replacement candidates exist for that slot, THEN THE Party_Analyzer SHALL display no more than three replacement candidates for that slot, selecting the top three by the ranking in criteria 4–5.

### Requirement 7: Navigation and Routing

**User Story:** As a user, I want the Party Analyzer to feel like a first-class page in the app, so that I can reach it from the navigation and return to it with the browser back button.

#### Acceptance Criteria

1. THE Party_Analyzer SHALL be reachable at the path `/party`, registered in `createAppRoutes` via `dataRoute` with a route id of `"party"`.
2. THE Nav SHALL include a link to `/party` in `NAV_ITEMS` that applies `toWithPreservedSearch`: when the current pathname is `/party`, the link carries the existing `location.search`; otherwise it uses an empty search string.
3. THE Party_Analyzer SHALL use the shared `pokedexLoader` to receive the full `PokemonDetails[]` via `useLoaderData`.
4. THE Party_Analyzer SHALL display a `PageHeader` containing an `h1` with the text "Party Analyzer" styled with `font-display text-[34px] leading-tight font-bold tracking-tight`, matching the heading style used by `Compare` and `TypeChart`.
5. THE Party_Analyzer SHALL store party slot selections and threat type selections exclusively in URL search params, so that WHEN the user navigates away from `/party` and returns via the browser back button, THE Party_Analyzer SHALL reflect the party and threat type state encoded in the restored URL.

### Requirement 8: Accessibility and Responsiveness

**User Story:** As a user with varied abilities or screen sizes, I want the Party Analyzer to be fully accessible and usable on mobile, so that I can build and analyze parties on any device.

#### Acceptance Criteria

1. THE Party_Analyzer SHALL meet the axe accessibility score threshold (passes / (passes + violations) ≥ 50%) enforced by the Storybook test harness.
2. THE Party_Analyzer SHALL assign an `aria-label` to every interactive control: Picker `ComboBox` inputs shall be labelled by slot position (e.g. "Slot 1 Pokémon"), slot remove buttons shall be labelled "Remove [Pokémon name]", threat type selectors shall be labelled "Add a threat type", and threat type remove buttons shall be labelled "Remove [type name] threat".
3. THE Party_Analyzer SHALL accompany every element whose meaning is carried by color or a symbol (weak-count badges, coverage-gap pills, threat grid multiplier cells) with a visually hidden `sr-only` text node containing the same information as the visible color or symbol, following the pattern used in `Compare` for stat highlights.
4. THE Party_Analyzer SHALL use React Aria Components for all interactive elements in line with the app's existing patterns: `ComboBox` + `ListBox` for the slot Pickers, `Select` + `ListBox` for the threat type selector, and `Button` for every remove control.
5. THE Party_Analyzer SHALL lay out the six party slots in a CSS grid that shows two columns at viewport widths below the `md` breakpoint (768px) and three or more columns at and above that breakpoint.
6. WHILE `typeEfficacyQueryOptions` is in a loading state, THE Party_Analyzer SHALL display an inline text message in place of the analysis section and SHALL NOT render the coverage or matchup analysis. IF `typeEfficacyQueryOptions` returns an error, THE Party_Analyzer SHALL display an inline error message in place of the analysis section.
