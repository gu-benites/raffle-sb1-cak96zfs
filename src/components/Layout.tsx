import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { signOut } from '../lib/auth';

export function Layout() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-800">RifaFácil</span>
          </Link>
          <div className="space-x-4">
            <Link
              to="/auth"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Cadastrar
            </Link>
          </div>
        </nav>
      </header>

      <Outlet />

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Trophy className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold">RifaFácil</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2025 RifaFácil. Todos os direitos reservados.</p>
              <p className="text-sm text-gray-500 mt-1">
                Plataforma segura para rifas online
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}