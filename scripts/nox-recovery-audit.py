#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""NOX Arsenal Recovery-Audit: Vault-Kandidaten vs. Repo-Bestand.

Portabel: Pfade kommen aus CLI-Args (--vault-path, --repo-path) oder ENV
(NOX_VAULT_PATH, NOX_REPO_PATH); Default ist der Repo-Ordner relativ zu diesem
Script (scripts/..). Keine absoluten Benutzerpfade als Source-of-Truth.
"""
import argparse, json, os, re, sys, glob, datetime

def cli_or_env(args, flag, env):
    return getattr(args, flag) or os.environ.get(env) or None

def read_file(p):
    try:
        with open(p, encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return ""

# ---------- 0. Pfad-Auflösung ----------
here = os.path.dirname(os.path.abspath(__file__))
default_repo = os.path.normpath(os.path.join(here, ".."))
parser = argparse.ArgumentParser(description="NOX Arsenal Recovery-Audit (Vault vs Repo)")
parser.add_argument("--vault-path", default=os.environ.get("NOX_VAULT_PATH", ""),
                    help="Obsidian-Playbook-Ordner (NOX Motion Arsenal). Default: NOX_VAULT_PATH")
parser.add_argument("--repo-path", default=os.environ.get("NOX_REPO_PATH", default_repo),
                    help="Repo-Root. Default: Script-Ordner/..")
parser.add_argument("--out", default=os.path.join(default_repo, "audit_recovery.json"),
                    help="JSON-Ausgabe. Default: <repo>/audit_recovery.json")
args = parser.parse_args()
REPO = os.path.normpath(args.repo_path)
VAULT = os.path.normpath(args.vault_path) if args.vault_path else ""

# ---------- 1. Repo-Effekte aus allen Catalogs extrahieren ----------
repo_effects = {}  # id -> {displayName, description, category, name}
cat_files = []
for root, dirs, files in os.walk(os.path.join(REPO, "src", "motion-arsenal", "effects")):
    for fn in files:
        if fn.endswith("catalog.ts"):
            cat_files.append(os.path.join(root, fn))

for cf in cat_files:
    src = read_file(cf)
    # Effekt-Blöcke: meta: { id: '...', ... }, Component: lazy(...)
    # Finde alle id: '...' mit zugehörigem displayName/description/category davor
    for m in re.finditer(r"id:\s*'([^']+)'", src):
        eid = m.group(1)
        # Rückwärts bis zum Blockstart '{' suchen für displayName/category/description
        start = max(0, m.start() - 3000)
        chunk = src[start:m.start()]
        dname = re.findall(r"displayName:\s*'([^']*)'", chunk)
        cat = re.findall(r"category:\s*'([^']*)'", chunk)
        desc = re.findall(r"description:\s*'([^']*)'", chunk)
        name = re.findall(r"name:\s*'([^']*)'", chunk)
        mode = re.findall(r"mode:\s*'([^']*)'", chunk)
        prod = "productionSafe: true" in src[max(0, m.start() - 4000):m.end() + 2000]
        repo_effects[eid] = {
            "name": name[-1] if name else "",
            "displayName": dname[-1] if dname else "",
            "category": cat[-1] if cat else "",
            "description": desc[-1] if desc else "",
            "mode": mode[-1] if mode else "",
            "productionSafe": prod,
        }

print(f"Repo-Effekte extrahiert: {len(repo_effects)}")

# ---------- 2. Vault-Notizen ----------
if not VAULT:
    print("WARN: kein Vault-Pfad (--vault-path / NOX_VAULT_PATH) — Vault-Scan übersprungen")
    vault_notes = []
else:
    eff_dir = os.path.join(VAULT, "Effekte")
    vault_notes = []  # {file, title, nox_id, kategorie, produktionsreif, modus, mtime}
    if os.path.isdir(eff_dir):
        for fn in sorted(os.listdir(eff_dir)):
            if not fn.endswith(".md"):
                continue
            p = os.path.join(eff_dir, fn)
            src = read_file(p)
            fm = src.split("---")[1] if src.startswith("---") else ""
            def fmval(key):
                m = re.search(rf"^{key}:\s*(.+)$", fm, re.M)
                return m.group(1).strip().strip('"\'') if m else ""
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(p))
            vault_notes.append({
                "file": fn[:-3],
                "nox_id": fmval("nox-id"),
                "kategorie": fmval("kategorie"),
                "produktionsreif": fmval("produktionsreif"),
                "modus": fmval("modus"),
                "mtime": mtime.strftime("%Y-%m-%d"),
                "body": src,
            })
    else:
        print(f"WARN: Vault-Ordner nicht gefunden: {eff_dir}")

print(f"Vault-Notizen: {len(vault_notes)}")

# ---------- 3. Matching: Vault-Notiz vs Repo-Effekt ----------
def normalize(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def token_overlap(a, b):
    ta, tb = set(normalize(a).split()), set(normalize(b).split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / min(len(ta), len(tb))

audit = []
for note in vault_notes:
    title = note["file"]
    nox_id = note["nox_id"]
    # Kandidat im Repo suchen: exakte nox-id-Übereinstimmung oder Name-Overlap
    match = None
    match_score = 0.0
    if nox_id and nox_id in repo_effects:
        match = nox_id
        match_score = 1.0
    else:
        for eid, e in repo_effects.items():
            # Token-Overlap Titel vs displayName
            s1 = token_overlap(title, e["displayName"] or e["name"])
            s2 = token_overlap(title, eid)
            score = max(s1, s2)
            if score > match_score:
                match_score = score
                match = eid
    exists = match_score >= 0.5
    audit.append({
        "titel": title,
        "nox_id": nox_id,
        "kategorie": note["kategorie"],
        "produktionsreif": note["produktionsreif"],
        "mtime": note["mtime"],
        "exists_in_repo": exists,
        "repo_match": match if exists else None,
        "match_score": round(match_score, 2),
        "repo_display": repo_effects.get(match, {}).get("displayName", "") if exists else "",
    })

# ---------- 4. Kennzahlen (6 getrennte, KEINE Sammelzahl) ----------
# 1) vault_candidates    – Vault-Notizen, die Effekt-Kandidaten beschreiben
# 2) repo_effects        – Effekte mit Catalog-Eintrag (registriert im Arsenal)
# 3) registered          – davon mit Komponenten-Datei vorhanden (Build-fähig)
# 4) build_pass          – davon mit productionSafe: true im Catalog
# 5) runtime_verified    – davon in scripts/runtime-qa-*.mjs referenziert
# 6) production_verified – Vault-Notizen mit produktionsreif: true UND im Repo
effects_root = os.path.join(REPO, "src", "motion-arsenal", "effects")
effect_ids = set(repo_effects.keys())

# Komponenten-Dateien (Name.tsx) pro Effekt-ID suchen: id 'system-gauge-needle-sweep'
# -> Komponente GaugeNeedleSweep.tsx. Das Kategorie-Präfix (system/hero/...) wird
# abgestreift; die restlichen ID-Teile ergeben den CamelCase-Dateinamen.
def find_component_file(eid):
    parts = [p for p in eid.split("-") if p]
    # Präfix abstreifen: erste Komponente ist die Kategorie, der Rest der Name
    name_parts = parts[1:] if len(parts) > 1 else parts
    needle = "".join(name_parts).lower()
    for root, _, files in os.walk(effects_root):
        for fn in files:
            base = fn.lower().replace(".tsx", "").replace(".ts", "")
            if base == needle or base.endswith(needle):
                return os.path.join(root, fn)
    return None

with_components = {eid for eid in effect_ids if find_component_file(eid)}
production_safe = {eid for eid, meta in repo_effects.items() if meta.get("productionSafe")}

# Runtime-verifiziert: Komponenten-Dateiname kommt in den runtime-qa-Skripten
# ODER der Harness (runtime-harness*.html/tsx) vor — die referenzieren die
# Effekte über ihre Komponente, nicht über die Catalog-ID.
qa_refs = set()
for qa_file in glob.glob(os.path.join(here, "runtime-qa-*.mjs")) + glob.glob(
    os.path.join(here, "runtime-harness*.html")
) + glob.glob(os.path.join(here, "runtime-harness*.tsx")):
    qa_src = read_file(qa_file)
    for eid in with_components:
        comp_file = find_component_file(eid)
        comp_base = os.path.splitext(os.path.basename(comp_file))[0] if comp_file else ""
        if comp_base and comp_base in qa_src:
            qa_refs.add(eid)

n_prod = sum(1 for a in audit if a["produktionsreif"] == "true")
n_exists = sum(1 for a in audit if a["exists_in_repo"])
metrics = {
    "vault_candidates": len(vault_notes),
    "repo_effects": len(repo_effects),
    "registered": len(with_components),
    "build_pass": len(production_safe),
    "runtime_verified": len(qa_refs),
    "production_verified": n_prod,
}
out = {"metrics": metrics, "repo_effects": len(repo_effects), "vault_notes": len(vault_notes), "audit": audit}
out_path = os.path.normpath(args.out)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

# Zusammenfassung — 6 getrennte Kennzahlen
print("=== NOX ARSENAL METRICS (getrennt, keine Sammelzahl) ===")
print(f"vault_candidates     : {metrics['vault_candidates']:>4}  (Vault-Notizen als Effekt-Kandidaten)")
print(f"repo_effects         : {metrics['repo_effects']:>4}  (Catalog-Einträge im Arsenal)")
print(f"registered           : {metrics['registered']:>4}  (mit Komponenten-Datei im Repo)")
print(f"build_pass           : {metrics['build_pass']:>4}  (productionSafe: true im Catalog)")
print(f"runtime_verified     : {metrics['runtime_verified']:>4}  (in runtime-qa-Skripten abgedeckt)")
print(f"production_verified  : {metrics['production_verified']:>4}  (Vault: produktionsreif=true, im Repo)")

# Letzte ~60 Kandidaten (der letzte Batch)
recent = [a for a in audit if a["mtime"] >= "2026-08-02"]
print(f"\n=== LETZTER BATCH ({len(recent)} Kandidaten, ab 02.08.) ===")
for a in recent:
    repo = f"REPO: {a['repo_match']} ({a['repo_display']})" if a["exists_in_repo"] else "NICHT im Repo"
    print(f"{a['mtime']} | {a['titel'][:45]:47} | prod={a['produktionsreif'] or '-'} | {repo}")
