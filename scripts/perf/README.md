# V2 Benchmark

Run baseline benchmark:

```bash
node scripts/perf/v2-benchmark.mjs
```

Run with threshold assertion:

```bash
node scripts/perf/v2-benchmark.mjs --assert
```

Output report:
- `scripts/perf/v2-benchmark-report.json`

Nightly CI runs this benchmark and uploads report artifacts.
