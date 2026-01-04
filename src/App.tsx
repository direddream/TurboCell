import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/common/Layout'
import HomePage from './pages/HomePage'
import ScenarioToCellPage from './pages/ScenarioToCellPage'
import CellToScenarioPage from './pages/CellToScenarioPage'
import { SelectProvider } from './contexts/SelectContext'
import { DevProvider } from './contexts/DevContext'

// Turbo-Select pages
import S1ScenarioBuilder from './pages/select/S1ScenarioBuilder'
import S2Recommendation from './pages/select/S2Recommendation'
import S3SOAStrategy from './pages/select/S3SOAStrategy'
import TurboSelectWorkspace from './pages/select/TurboSelectWorkspace'
import ScenarioToCellWorkspace from './pages/select/ScenarioToCellWorkspace'
import CellToScenarioWorkspace from './pages/select/CellToScenarioWorkspace'

// Turbo-Dev pages
import D1CellInput from './pages/dev/D1CellInput'
import D2Prediction from './pages/dev/D2Prediction'
import D3VIPService from './pages/dev/D3VIPService'

// Turbo-Inspect pages
import I1DataImport from './pages/inspect/I1DataImport'
import I2HealthAssessment from './pages/inspect/I2HealthAssessment'
import I3DiagnosisTriage from './pages/inspect/I3DiagnosisTriage'

export default function App() {
  return (
    <SelectProvider>
      <DevProvider>
        <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Legacy routes */}
          <Route path="/scenario-to-cell" element={<ScenarioToCellPage />} />
          <Route path="/cell-to-scenario" element={<CellToScenarioPage />} />

          {/* Turbo-Select NEW routes (split workspaces) */}
          <Route path="/select/scenario-to-cell" element={<ScenarioToCellWorkspace />} />
          <Route path="/select/cell-to-scenario" element={<CellToScenarioWorkspace />} />

          {/* Turbo-Select legacy routes */}
          <Route path="/select" element={<TurboSelectWorkspace />} />
          <Route path="/select/s1" element={<S1ScenarioBuilder />} />
          <Route path="/select/s2" element={<S2Recommendation />} />
          <Route path="/select/s3" element={<S3SOAStrategy />} />

          {/* Turbo-Dev routes */}
          <Route path="/dev/d1" element={<D1CellInput />} />
          <Route path="/dev/d2" element={<D2Prediction />} />
          <Route path="/dev/d3" element={<D3VIPService />} />

          {/* Turbo-Inspect routes */}
          <Route path="/inspect/i1" element={<I1DataImport />} />
          <Route path="/inspect/i2" element={<I2HealthAssessment />} />
          <Route path="/inspect/i3" element={<I3DiagnosisTriage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      </DevProvider>
    </SelectProvider>
  )
}
