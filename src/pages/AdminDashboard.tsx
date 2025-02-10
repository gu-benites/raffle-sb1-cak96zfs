import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Package, Users, DollarSign, Plus, Loader2, Search, Filter, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';
import { StatCard } from '../components/StatCard';
import { toast } from 'react-hot-toast';

type RaffleWithStats = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  total_numbers: number;
  price_per_number: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  sold_numbers: number;
  current_revenue: number;
  total_possible_revenue: number;
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [raffles, setRaffles] = useState<RaffleWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalRaffles: 0,
    totalNumbers: 0,
    totalSoldNumbers: 0,
    totalRevenue: 0,
    availableRevenue: 0
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (!isAdmin) {
        navigate('/dashboard');
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      console.log('Iniciando busca de rifas...');
      const { data, error } = await supabase
        .rpc('get_raffles_with_stats');

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      console.log('Dados recebidos:', data);
      if (!data) {
        console.log('Nenhum dado recebido');
        setRaffles([]);
        calculateStats([]);
        return;
      }

      setRaffles(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error fetching raffles:', err);
      setRaffles([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (rafflesData: RaffleWithStats[]) => {
    const newStats = rafflesData.reduce((acc, raffle) => ({
      totalRaffles: acc.totalRaffles + 1,
      totalNumbers: acc.totalNumbers + raffle.total_numbers,
      totalSoldNumbers: acc.totalSoldNumbers + (raffle.sold_numbers || 0),
      totalRevenue: acc.totalRevenue + (raffle.current_revenue || 0),
      availableRevenue: acc.availableRevenue + 
        ((raffle.total_possible_revenue || 0) - (raffle.current_revenue || 0))
    }), {
      totalRaffles: 0,
      totalNumbers: 0,
      totalSoldNumbers: 0,
      totalRevenue: 0,
      availableRevenue: 0
    });

    setStats(newStats);
  };

  const filteredRaffles = raffles.filter(raffle => {
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         raffle.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || raffle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      finished: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      draft: 'Rascunho',
      active: 'Ativo',
      finished: 'Finalizado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header Section com Badge de Admin */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
                <p className="text-sm text-gray-600">Gerencie suas rifas e acompanhe os resultados</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </span>
            </div>
            <button
              onClick={() => navigate('/rifas/nova')}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Nova Rifa
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={Trophy}
            title="Total de Rifas"
            value={formatNumber(stats.totalRaffles)}
            className="bg-purple-50"
          />
          <StatCard
            icon={Package}
            title="Total de Cotas"
            value={formatNumber(stats.totalNumbers)}
            className="bg-blue-50"
          />
          <StatCard
            icon={Users}
            title="Cotas Vendidas"
            value={formatNumber(stats.totalSoldNumbers)}
            className="bg-green-50"
          />
          <StatCard
            icon={DollarSign}
            title="Valor Arrecadado"
            value={formatCurrency(stats.totalRevenue)}
            className="bg-yellow-50"
          />
          <StatCard
            icon={DollarSign}
            title="Valor Disponível"
            value={formatCurrency(stats.availableRevenue)}
            className="bg-emerald-50"
          />
        </div>
      </div>

      {/* Filtros e Lista de Rifas */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar rifas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                >
                  <option value="all">Todos os status</option>
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativos</option>
                  <option value="finished">Finalizados</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredRaffles.map((raffle) => (
              <div key={raffle.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <img
                      src={raffle.image_url || 'https://via.placeholder.com/100'}
                      alt={raffle.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{raffle.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{raffle.description}</p>
                      <div className="mt-1 flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          Cotas: {formatNumber(raffle.sold_numbers || 0)}/{formatNumber(raffle.total_numbers)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Valor: {formatCurrency(raffle.price_per_number)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Total: {formatCurrency((raffle.sold_numbers || 0) * raffle.price_per_number)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(raffle.status)}
                    <button
                      onClick={() => {
                        const rifaId = raffle.id;
                        console.log('Clicou em gerenciar rifa:', {
                          id: rifaId,
                          title: raffle.title
                        });
                        if (rifaId) {
                          navigate(`/rifas/${rifaId}`);
                        } else {
                          toast.error('ID da rifa não encontrado');
                        }
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 