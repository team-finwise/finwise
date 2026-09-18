import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import WhatIf from './pages/WhatIf';
import Assistant from './pages/Assistant';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/what-if" element={<WhatIf />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
