#!/usr/bin/env python3
"""Validate one or more artist.json documents against the v1 schema.

Usage:  python3 scripts/validate.py spec/examples/*.json
        python3 scripts/validate.py https://example.com/.well-known/artist.json
"""
import json, sys, pathlib, urllib.request
from jsonschema import Draft202012Validator, FormatChecker

ROOT = pathlib.Path(__file__).resolve().parents[1]
schema = json.loads((ROOT / "spec" / "artist.schema.json").read_text())
Draft202012Validator.check_schema(schema)
validator = Draft202012Validator(schema, format_checker=FormatChecker())

def load(src: str):
    if src.startswith("http"):
        with urllib.request.urlopen(src, timeout=10) as r:
            return json.load(r)
    return json.loads(pathlib.Path(src).read_text())

rc = 0
for src in sys.argv[1:]:
    doc = load(src)
    errors = sorted(validator.iter_errors(doc), key=lambda e: list(e.path))
    if errors:
        rc = 1
        print(f"FAIL {src}")
        for e in errors:
            print(f"  /{'/'.join(map(str, e.path))}: {e.message}")
    else:
        print(f"OK   {src}  (spec_version={doc.get('spec_version')}, "
              f"{len(doc.get('tour_dates', []))} events, {len(doc.get('releases', []))} releases, "
              f"{len(doc.get('merchandise', []))} products)")
sys.exit(rc)
