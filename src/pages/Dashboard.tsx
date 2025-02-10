import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Package, Users, DollarSign, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Raffle = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  total_numbers: number;
  price_per_number: number;
  start_date: string;
  end_date: string;
  status: string;
};

export function Dashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [raffles, setRaffles] = useState<Raffle[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verificar se o usuário é admin (você precisará implementar essa lógica)
      const isUserAdmin = session.user.user_metadata.role === 'admin';
      setIsAdmin(isUserAdmin);

      // Carregar rifas
      const { data: rafflesData, error } = await supabase
        .from('raffles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar rifas:', error);
      } else {
        setRaffles(rafflesData || []);
      }

      setLoading(false);
    };

    checkSession();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Dashboard Administrativo' : 'Minhas Rifas'}
            </h1>
            {isAdmin && (
              <button
                onClick={() => navigate('/rifas/nova')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Rifa
              </button>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Rifas</p>
                  <p className="text-2xl font-semibold text-gray-900">{raffles.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participantes</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-semibold text-gray-900">R$ 0,00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {raffles.map((raffle) => (
            <div key={raffle.id} className="bg-white rounded-lg shadow overflow-hidden">
              <img
                src={raffle.image_url || 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=2070'}
                alt={raffle.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{raffle.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{raffle.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-purple-600 font-semibold">
                    R$ {raffle.price_per_number.toFixed(2)}/número
                  </span>
                  <button
                    onClick={() => navigate(`/rifas/${raffle.id}`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {isAdmin ? 'Gerenciar' : 'Participar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}