# Accuracy Rules

Technical correctness has priority over confident wording.

## Version policy

This project does not lock itself to a single runtime, framework, or database version. When behavior can differ by version, state that fact, identify the relevant version family if known, and avoid presenting a recent feature as universal. Prefer stable concepts for the main explanation.

## Sources

Use authoritative documentation for version-sensitive or implementation-specific claims: ECMAScript and MDN for JavaScript, Node.js documentation for Node behavior, Express documentation for Express behavior, MongoDB documentation for MongoDB, and PostgreSQL documentation for PostgreSQL. Link to sources when references are requested or when a claim is difficult to verify from the explanation alone.

## Uncertainty

Separate specification guarantees from common implementation behavior. Say when a result depends on an engine, driver, optimizer, configuration, workload, isolation level, or undocumented behavior. Never fabricate benchmark numbers, API signatures, or source links.

## Corrections

When an existing note is inaccurate, identify the exact claim, explain the correction, and preserve the original file unless the user explicitly requests an edit. Do not silently propagate an uncertain statement into new material.