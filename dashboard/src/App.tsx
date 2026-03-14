import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Layout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import PatientDetailPage from './pages/PatientDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
