import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { SellPage } from './pages/SellPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Pages wrapped with Header, SubHeader, and Footer */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListingPage />} />
        <Route path="/search" element={<ProductListingPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/seller" element={<SellPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Standalone Distraction-free Checkout Flow */}
      <Route path="/checkout" element={<CheckoutPage />} />

      {/* Standalone Campus Auth Flow */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage initialMode="admin" />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}
