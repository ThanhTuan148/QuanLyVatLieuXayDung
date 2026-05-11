// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';

import CustomersPage from './pages/CustomersPage';
import InventoryPage from './pages/InventoryPage';
import DeliveriesPage from './pages/DeliveriesPage';

import SettingsPage from './pages/SettingsPage';
import SuppliersPage from './pages/SuppliersPage';
import PromotionsPage from './pages/PromotionsPage';
import EmployeesPage from './pages/EmployeesPage';
import CustomerShoppingPage from './pages/CustomerShoppingPage';
import CustomerCategoryPage from './pages/CustomerCategoryPage';
import ShoppingCartPage from './pages/ShoppingCartPage';
import CheckoutPage from './pages/CheckoutPage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import CustomerAboutPage from './pages/CustomerAboutPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import CustomerOrderDetailPage from './pages/CustomerOrderDetailPage';
import CustomerDebtsPage from './pages/CustomerDebtsPage';
import ProcurementPage from './pages/ProcurementPage';
import ReturnsPage from './pages/ReturnsPage';
import FlashSalePage from './pages/FlashSalePage';
import FavoritesPage from './pages/FavoritesPage';
import DebtsPage from './pages/DebtsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PriceHistoryPage from './pages/PriceHistoryPage';
import ReportsPage from './pages/ReportsPage';
import ShoppingLayout from './components/ShoppingLayout';
import { PermissionProvider } from './contexts/PermissionContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdminUser = (userObj) => {
    if (!userObj) return false;
    if (userObj.employeeId) return true; // Most reliable way to check if it's a staff member
    
    const roleStr = (userObj.role || userObj.Role || userObj.roleName || '').toLowerCase();
    const adminWords = ['admin', 'manager', 'staff', 'nhanvien', 'quanly', 'quản trị', 'quản lý', 'nhân viên', 'kế toán', 'tài xế', 'taixe', 'thủ kho'];
    return adminWords.some(w => roleStr.includes(w));
  };

  const getAdminHomeRoute = (userObj) => {
    if (!userObj) return '/shopping';
    const roleStr = String(userObj.role || userObj.Role || userObj.roleName || '').toLowerCase();
    if (roleStr.includes('tài xế')) return '/deliveries';
    if (roleStr.includes('thủ kho')) return '/inventory';
    if (roleStr.includes('admin') || roleStr.includes('quản trị')) return '/customers'; // SysAdmin goes to Customers management
    if (roleStr.includes('quản lý') || roleStr.includes('giám đốc')) return '/dashboard';
    return '/products'; 
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (token && user) {
      setIsAuthenticated(true);
      setUserRole(user);
    }
    setLoading(false);
  }, []);

  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/auth" />;
    if (!isAdminUser(userRole)) return <Navigate to="/shopping" />;
    return <Layout>{children}</Layout>;
  };

  const DashboardRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/auth" />;
    if (!isAdminUser(userRole)) return <Navigate to="/shopping" />;
    const roleStr = String(userRole?.role || userRole?.Role || userRole?.roleName || '').toLowerCase();
    const isHighManager = roleStr.includes('quản lý') || roleStr.includes('giám đốc');
    if (!isHighManager) return <Navigate to={getAdminHomeRoute(userRole)} />;
    return <Layout>{children}</Layout>;
  };


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Provider store={store}>
      <PermissionProvider>
        <Router>
          <Routes>
          {/* Default: redirect root based on role */}
          <Route path="/" element={
            isAuthenticated 
              ? (isAdminUser(userRole) ? <Navigate to={getAdminHomeRoute(userRole)} /> : <Navigate to="/shopping" />)
              : <Navigate to="/shopping" />
          } />
          {/* /login redirects to /auth (old page removed) */}
          <Route path="/login" element={<Navigate to="/auth" />} />

          {/* Shopping (customer) routes - always accessible */}
          <Route path="/shopping" element={<ShoppingLayout><CustomerShoppingPage /></ShoppingLayout>} />
          <Route path="/category/:slug" element={<ShoppingLayout><CustomerCategoryPage /></ShoppingLayout>} />
          <Route path="/flashsale" element={<ShoppingLayout><FlashSalePage /></ShoppingLayout>} />
          <Route path="/favorites" element={<ShoppingLayout><FavoritesPage /></ShoppingLayout>} />
          <Route path="/search" element={<ShoppingLayout><SearchResultsPage /></ShoppingLayout>} />
          <Route path="/product/:id" element={<ShoppingLayout><ProductDetailPage /></ShoppingLayout>} />
          <Route path="/shopping-cart" element={<ShoppingLayout><ShoppingCartPage /></ShoppingLayout>} />
          <Route path="/checkout" element={isAuthenticated ? <ShoppingLayout><CheckoutPage /></ShoppingLayout> : <Navigate to="/auth" state={{ returnUrl: '/checkout' }} />} />
          {/* /auth - redirect based on role if already logged in */}
          <Route
            path="/auth"
            element={
              isAuthenticated 
                ? (isAdminUser(userRole) ? <Navigate to={getAdminHomeRoute(userRole)} /> : <Navigate to="/shopping" />) 
                : <ShoppingLayout><CustomerAuthPage /></ShoppingLayout>
            }
          />
          <Route path="/about" element={<ShoppingLayout><CustomerAboutPage /></ShoppingLayout>} />
          <Route path="/profile" element={isAuthenticated ? <ShoppingLayout><CustomerProfilePage /></ShoppingLayout> : <Navigate to="/auth" />} />
          <Route path="/my-orders" element={isAuthenticated ? <ShoppingLayout><CustomerOrdersPage /></ShoppingLayout> : <Navigate to="/auth" />} />
          <Route path="/order-detail/:id" element={isAuthenticated ? <ShoppingLayout><CustomerOrderDetailPage /></ShoppingLayout> : <Navigate to="/auth" />} />
          <Route path="/my-debts" element={isAuthenticated ? <ShoppingLayout><CustomerDebtsPage /></ShoppingLayout> : <Navigate to="/auth" />} />


          {/* Admin / Staff routes - protected by token and role */}
          <Route path="/dashboard" element={<DashboardRoute><DashboardPage /></DashboardRoute>} />
          <Route path="/products" element={<AdminRoute><ProductsPage /></AdminRoute>} />
          <Route path="/orders" element={<AdminRoute><OrdersPage /></AdminRoute>} />

          <Route path="/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />
          <Route path="/promotions" element={<AdminRoute><PromotionsPage /></AdminRoute>} />
          <Route path="/suppliers" element={<AdminRoute><SuppliersPage /></AdminRoute>} />
          <Route path="/procurement" element={<AdminRoute><ProcurementPage /></AdminRoute>} />
          <Route path="/returns" element={<AdminRoute><ReturnsPage /></AdminRoute>} />
          <Route path="/inventory" element={<AdminRoute><InventoryPage /></AdminRoute>} />
          <Route path="/debts" element={<AdminRoute><DebtsPage /></AdminRoute>} />
          <Route path="/deliveries" element={<AdminRoute><DeliveriesPage /></AdminRoute>} />

          <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          <Route path="/employees" element={<AdminRoute><EmployeesPage /></AdminRoute>} />
          <Route path="/price-history" element={<AdminRoute><PriceHistoryPage /></AdminRoute>} />
          <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/shopping" />} />
          </Routes>
        </Router>
      </PermissionProvider>
    </Provider>
  );
}

export default App;
