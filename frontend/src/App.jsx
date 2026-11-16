import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import SmartSearch from './pages/SmartSearch';
import Categories from './pages/Categories';
import StockHistory from './pages/StockHistory';
import ProductDetails from './pages/ProductDetails';
import StockRequests from './pages/StockRequests';
import CheckoutSummary from './pages/CheckoutSummary';
import VehiclePackages from './pages/VehiclePackages';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/:id" element={<ProductDetails />} />
          <Route path="search" element={<SmartSearch />} />
          <Route path="stock-requests" element={<StockRequests />} />
          <Route path="stock-requests/checkout" element={<CheckoutSummary />} />
          <Route path="vehicle-packages" element={<VehiclePackages />} />
          <Route path="categories" element={<Categories />} />
          <Route path="history" element={<StockHistory />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
