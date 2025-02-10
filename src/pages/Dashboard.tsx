import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, DollarSign, Package, Users, Loader2, Settings, Plus, Trophy, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatNumber } from '../utils/format';
import { StatCard } from '../components/StatCard';
import { theme } from '../styles/theme';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import { reservationService } from '../services/redis';
import { testRedisConnection } from '../services/redis';

type Raffle = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  total_numbers: number;
  price_per_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  sold_numbers: number;
  current_revenue: number;
};

type RaffleStat = {
  id: string;
  sold_numbers: number;
  current_revenue: number;
};

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    checkUserAndFetchRaffles();
  }, []);

  const checkUserAndFetchRaffles = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
      if (isAdminError) {
        console.error('Erro ao verificar admin:', isAdminError);
        setIsAdmin(false);
      } else {
        setIsAdmin(isAdminData || false);
      }

      let query = supabase
        .from('raffles')
        .select(`
          id,
          title,
          description,
          image_url,
          total_numbers,
          price_per_number,
          status,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (!isAdminData) {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar rifas:', error);
        throw error;
      }

      const { data: statsData, error: statsError } = await supabase
        .rpc('get_raffles_with_stats');

      if (statsError) {
        console.error('Erro ao buscar estatísticas:', statsError);
        throw statsError;
      }

      const rafflesWithStats = data.map(raffle => {
        const stats = statsData?.find((stat: RaffleStat) => stat.id === raffle.id) || {};
        return {
          ...raffle,
          sold_numbers: stats.sold_numbers || 0,
          current_revenue: stats.current_revenue || 0
        };
      });

      setRaffles(rafflesWithStats);
    } catch (err) {
      console.error('Erro completo:', err);
      toast.error('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRaffles = raffles.filter(raffle => {
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         raffle.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || raffle.status === statusFilter;
    
    if (!isAdmin) {
      return matchesSearch && raffle.status === 'active';
    }
    
    return matchesSearch && matchesStatus;
  });

  function TestRedisButton() {
    const handleTest = async () => {
      try {
        const result = await reservationService.testConnection();
        if (result) {
          toast.success('Conexão com Redis OK!');
        } else {
          toast.error('Falha na conexão com Redis');
        }
      } catch (error) {
        console.error('Erro no teste:', error);
        toast.error('Erro ao testar Redis');
      }
    };

    if (import.meta.env.DEV) {
      return (
        <button
          onClick={handleTest}
          className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
        >
          Testar Conexão Redis
        </button>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isAdmin ? 'Dashboard Administrativo' : 'Rifas Disponíveis'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isAdmin 
                  ? 'Gerencie suas rifas e acompanhe os resultados'
                  : 'Encontre e participe das rifas ativas'
                }
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate('/rifas/nova')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg 
                  hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Nova Rifa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {isAdmin ? (
            // Stats para Admin
            <>
              <StatCard
                icon={Package}
                title="Total de Rifas"
                value={formatNumber(raffles.length)}
                subtitle={`${formatNumber(raffles.filter(r => r.status === 'active').length)} ativas`}
                className="bg-blue-50"
              />
              <StatCard
                icon={DollarSign}
                title="Receita Total"
                value={formatCurrency(raffles.reduce((acc, raffle) => acc + raffle.current_revenue, 0))}
                subtitle="Todas as rifas"
                className="bg-green-50"
              />
              <StatCard
                icon={Users}
                title="Números Vendidos"
                value={formatNumber(raffles.reduce((acc, raffle) => acc + raffle.sold_numbers, 0))}
                subtitle={`${formatNumber(raffles.reduce((acc, raffle) => acc + (raffle.total_numbers - raffle.sold_numbers), 0))} disponíveis`}
                className="bg-purple-50"
              />
            </>
          ) : (
            // Stats para Usuário comum
            <>
              <StatCard
                icon={Package}
                title="Rifas Disponíveis"
                value={formatNumber(raffles.filter(r => r.status === 'active').length)}
                className="bg-blue-50"
              />
              <StatCard
                icon={Trophy}
                title="Meus Números"
                value={formatNumber(0)}
                className="bg-purple-50"
              />
              <StatCard
                icon={DollarSign}
                title="Total Investido"
                value={formatCurrency(0)}
                className="bg-green-50"
              />
            </>
          )}
        </div>

        {/* Filters */}
        <div className={theme.components.card + ' mb-6'}>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar rifas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={theme.components.input + ' pl-10'}
              />
            </div>
          </div>
        </div>

        {/* Raffles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRaffles.map((raffle) => (
            <div
              key={raffle.id}
              className={theme.components.card + ' group hover:shadow-md transition-all duration-200'}
            >
              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <img
                  src={raffle.image_url || 'https://via.placeholder.com/300x200'}
                  alt={raffle.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {raffle.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {raffle.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Valor por número</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(raffle.price_per_number)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Números disponíveis</span>
                    <span>{formatNumber(raffle.total_numbers - raffle.sold_numbers)} / {formatNumber(raffle.total_numbers)}</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${(raffle.sold_numbers / raffle.total_numbers) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  {isAdmin ? (
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/rifas/${raffle.id}`)}
                      leftIcon={<Settings className="h-4 w-4" />}
                    >
                      Gerenciar
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/comprar/${raffle.id}`)}
                      leftIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Participar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRaffles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma rifa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}