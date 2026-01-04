# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Turbo-Select is a battery cell selection and scenario assessment demo application (概念验证 Demo). It uses **heuristic rules and lightweight approximation models** for product concept demonstration - not real electrochemical simulation.

Three product modules:
- **Turbo-Select** (`/select/*`): Input workload/constraints → Recommend cells + series/parallel config + risk labels
- **Turbo-Dev** (`/dev/*`): Input cell design parameters → Predict lifespan range + confidence + risk factors
- **Turbo-Inspect** (`/inspect/*`): Import data → Health assessment + diagnosis triage

## Commands

```bash
npm run dev       # Start dev server with --host flag
npm run build     # TypeScript compile + Vite build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

## Architecture

### State Management

Two React Contexts manage cross-page state:
- `SelectContext` - Scenario parameters, cell database with dynamic scoring, selected cell
- `DevContext` - Cell design parameters, prediction results, offline trigger flags

### Core Calculation Logic

All in `src/utils/`:
- `battery.ts` - ScenarioInput/PackCandidate interfaces, OCV estimation, resistance modeling, thermal/lifecycle estimation
- `matching.ts` - Scenario-to-Cell matching algorithm: `findBestPack()` calculates ns/np config, `scoreCandidate()` applies heuristic scoring (rate limits, temperature bounds, lifecycle, cost tiers, priority bonuses)
- `soa.ts` - SOA (Safe Operating Area) grid generation: discharge/charge current limits across SOC × Temperature matrix
- `math.ts` - Utility functions (clamp, smoothStep)

### Page Flow Structure

Each module has a multi-step wizard flow:
- **Select**: S1 (ScenarioBuilder) → S2 (Recommendation) → S3 (SOAStrategy)
- **Dev**: D1 (CellInput) → D2 (Prediction) → D3 (VIPService)
- **Inspect**: I1 (DataImport) → I2 (HealthAssessment) → I3 (DiagnosisTriage)

Legacy single-page routes still exist at `/scenario-to-cell` and `/cell-to-scenario`.

### Data Types

`src/demo/types.ts` defines the core `CellRecord` interface with:
- Chemistry types: LFP, NMC, NCA, LTO
- Form factors: cylindrical, prismatic, pouch
- Data quality markers: datasheet, estimated, demo
- Full electrical/thermal specifications

## Key Dependencies

- **UI**: Ant Design v6, Framer Motion for animations
- **Charts**: ECharts + echarts-for-react, @ant-design/charts
- **PDF Export**: jsPDF + html2canvas
- **Routing**: react-router-dom v7
