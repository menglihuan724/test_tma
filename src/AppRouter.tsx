import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import AppLayout from './layouts/AppLayout';
import HomePage from './pages/HomePage';
import CfxPage from './pages/CfxPage';
import UniPage from './pages/UniPage';
import SuiPage from './pages/SuiPage';
import MarketPage from './pages/MarketPage';
import ArbitragePage from './pages/ArbitragePage';
import AavePage from './pages/AavePage';

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route path="/login" element={<Login />} />
        
        {/* App routes with layout */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="cfx" element={<CfxPage />} />
          <Route path="uni" element={<UniPage />} />
          <Route path="sui" element={<SuiPage />} />
          <Route path="market" element={<MarketPage />} />
          <Route path="arbitrage" element={<ArbitragePage />} />
          <Route path="aave" element={<AavePage />} />
        </Route>
        
        {/* Legacy route redirect */}
        <Route path="/home" element={<Navigate to="/app/home" replace />} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
