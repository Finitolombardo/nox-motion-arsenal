# Skilltree — täglicher Effekt-Level-up

Jeden Tag werden vier Effekte um neue Möglichkeiten erweitert. Ein Effekt wird
dabei **nie ersetzt, entfernt oder umdesignt** — er bekommt Fähigkeiten dazu,
wie ein Skill im Skilltree. Wer den Effekt heute einbindet, sieht ihn morgen
unverändert; alles Neue liegt daneben und ist optional.

## Ablauf eines Laufs

```bash
node scripts/skilltree-run.mjs preflight
```

Prüft sauberen Stand, holt `main`, legt den Branch `skilltree/<datum>` an und
gibt die vier Effekte des Tages aus (Datei, Import, vorhandene Optionen).

Dann die Arbeit an den vier Effekten — Regeln unten.

```bash
node scripts/skilltree-run.mjs finish
```

Fährt Vertragswächter, Typecheck, Contract-Tests und Build. Erst wenn alles
grün ist, wird committet, nach `fork` gepusht, in `main` gemerged und deployt.
Bei der ersten roten Prüfung bricht der Lauf ab und der Branch bleibt zur
Ansicht stehen.

## Was ein Level-up sein darf

Die vier Achsen, jeweils als **neues Prop oder neue Option**:

**Farbe** — zusätzliche `color`-Props für bisher fest verdrahtete Farben, ein
`palette`-Select mit benannten Stimmungen (`gold`, `ice`, `ember`, `toxic`,
`mono`). Nie die bestehende Default-Farbe austauschen.

**Form / Figur** — `shape`-Select (`circle`, `square`, `triangle`, `hex`,
`star`), Partikel-Sprites, Glyph-Sets, Eck-Radien, Strichstärken.

**Richtung** — `direction` (`left`, `right`, `up`, `down`), `origin`
(`center`, `corner`, `edge`), `reverse`, Rotationsachse, Ein- statt Ausatmen.

**Weitere Möglichkeiten** — Presets, Intensitätsstufen, Trigger-Varianten
(`hover`, `click`, `scroll`, `auto`), Staffelung, Dichte, Loop statt Einmal-
Sequenz, Brand-Kit-Anbindung.

## Harte Regeln

Diese fünf Punkte prüft `scripts/skilltree-guard.mjs` mechanisch — ein Verstoß
lässt den Lauf abbrechen, egal wie gut die Idee war:

1. Kein Effekt und kein Prop wird entfernt oder umbenannt.
2. Kein Prop-Typ ändert sich.
3. **Kein Default-Wert ändert sich.** Das ist die wichtigste Regel: solange
   Defaults stehen, bleibt jeder bestehende Einbau optisch identisch.
4. Keine `select`-Option verschwindet.
5. `min`/`max` werden nur weiter, nie enger.

Zusätzlich, nicht maschinell prüfbar, aber genauso verbindlich:

- Der Charakter des Effekts bleibt. Ein Gold-Tachometer wird nicht zum
  Balkendiagramm, ein Starfield nicht zum Regen.
- Neue Props kommen in eine sinnvolle `group`, damit das Control-Panel
  übersichtlich bleibt.
- Reduced-Motion-Verhalten gilt auch für alles Neue.
- Keine neue npm-Abhängigkeit ohne Not.
- Performance-Budget des Effekts halten. Steht in `performanceNotes`.

## Pflichtteile pro geändertem Effekt

- Implementierung erweitert, alte Codepfade bleiben erreichbar.
- Katalog-Metadaten ergänzt: neue Props mit `label`, `type`, `default`,
  `group`; bei Bedarf `description` und `bestFor` nachziehen.
- `improvementVersion` erhöhen (Minor), `lastImprovedAt` auf heute,
  `lastImprovedBy: 'skilltree'`, `improvementChangelog` um einen Satz pro
  neuer Fähigkeit ergänzen.
- Wenn ein Contract-Test für den Effekt existiert (`scripts/test-<name>-contract.mjs`),
  die neuen Props dort mit abdecken.

## Rotation

`scripts/skilltree-rotation.mjs` führt Buch in `.nox/skilltree-rotation.json`.
Jeder Effekt kommt genau einmal pro Runde dran; ist die Runde durch, steigen
alle ein Level und es geht von vorn los. Zuerst dran sind die Effekte mit den
wenigsten Props — dort bringt eine Erweiterung am meisten.

Bei 159 Effekten und 4 pro Tag dauert eine Runde rund 40 Tage.

```bash
node scripts/skilltree-rotation.mjs status
```

## Wenn etwas schiefgeht

Der Lauf ist so gebaut, dass ein Fehlschlag folgenlos bleibt: rote Prüfung
heißt kein Commit, kein Merge, kein Deploy. Der Branch `skilltree/<datum>`
bleibt stehen, damit die Arbeit nicht verloren ist.

Ist trotzdem etwas Unerwünschtes auf `main` gelandet:

```bash
git revert -m 1 <merge-commit>
```

Der Vertrags-Snapshot in `.nox/effect-contracts.json` wird bei jedem grünen
Lauf fortgeschrieben. Nach einem Revert muss er zurückgesetzt werden:

```bash
node scripts/skilltree-guard.mjs snapshot
```
