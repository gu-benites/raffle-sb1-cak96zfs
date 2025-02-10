import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { CreateRaffle } from './pages/CreateRaffle';
import { ManageRaffle } from './pages/ManageRaffle';
import { BuyRaffle } from './pages/BuyRaffle';
import { Toaster } from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase'; // Certifique-se de que o caminho está correto

export function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user);
      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500" />
        </div>
      }>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
            <Route path="/rifas/nova" element={<CreateRaffle />} />
            <Route path="/rifas/:id" element={<ManageRaffle />} />
            <Route path="/comprar/:id" element={<BuyRaffle />} />
          </Route>
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}