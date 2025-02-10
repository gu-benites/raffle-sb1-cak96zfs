import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Trophy, User, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import { signOut } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Auth } from '../pages/Auth';
import { Dashboard } from '../pages/Dashboard';
import { CreateRaffle } from '../pages/CreateRaffle';
import { ManageRaffle } from '../pages/ManageRaffle';
import { BuyRaffle } from '../pages/BuyRaffle';

export function Layout() {
  console.log('Layout rendering');
  const navigate = useNavigate();
  const location = useLocation();
  console.log('Current location:', location.pathname);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email ?? null);
    };

    checkUser();
    
    // Listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {location.pathname !== '/auth' && (
        <header className="bg-white shadow-sm">
          <nav className="container mx-auto px-4 py-4 md:py-6 flex flex-wrap md:flex-nowrap justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              <span className="text-xl md:text-2xl font-bold text-gray-800">RifaFácil</span>
            </Link>
            
            {/* Menu responsivo */}
            <div className="w-full md:w-auto mt-4 md:mt-0 flex justify-end">
              {!isLoggedIn ? (
                <div className="flex space-x-2 md:space-x-4 w-full md:w-auto justify-end">
                  <Link
                    to="/auth?mode=login"
                    className="flex-1 md:flex-none text-center px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="flex-1 md:flex-none text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Cadastrar
                  </Link>
                </div>
              ) : (
                <div className="relative w-full md:w-auto">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 focus:outline-none"
                  >
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 truncate max-w-[150px]">{userEmail}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 left-0 md:left-auto mt-2 w-full md:w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1" role="menu">
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurações
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {location.pathname !== '/auth' && (
        <footer className="bg-gray-900 text-white py-4 md:py-6 mt-auto">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-purple-400" />
                <span className="text-lg font-bold">RifaFácil</span>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-gray-400">© 2025 RifaFácil. Todos os direitos reservados.</p>
                <p className="text-xs text-gray-500 mt-1">
                  Plataforma segura para rifas online
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}