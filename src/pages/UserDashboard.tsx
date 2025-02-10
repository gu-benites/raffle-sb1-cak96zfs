import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, Ticket } from 'lucide-react';
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
  sold_numbers: number;
};

export function UserDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [myTickets, setMyTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchRaffles();
    fetchMyTickets();
  }, []);

  const fetchRaffles = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_active_raffles_with_stats');

      if (error) throw error;
      setRaffles(data || []);
    } catch (err) {
      console.error('Error fetching raffles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          raffle:raffles(title)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Rifas Disponíveis</h1>
          <p className="text-sm text-gray-600">Participe e concorra a prêmios incríveis</p>
        </div>
      </div>

      {/* Meus Números */}
      {myTickets.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus Números</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{ticket.raffle.title}</p>
                    <p className="text-sm text-gray-600">Número: {ticket.number}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ticket.status === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ticket.status === 'paid' ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Rifas */}
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {raffles.map((raffle) => (
              <div
                key={raffle.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border hover:shadow-md transition-shadow"
              >
                <img
                  src={raffle.image_url || 'https://via.placeholder.com/400x200'}
                  alt={raffle.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{raffle.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{raffle.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor por número:</span>
                      <span className="font-medium">R$ {raffle.price_per_number.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Números disponíveis:</span>
                      <span className="font-medium">
                        {raffle.total_numbers - (raffle.sold_numbers || 0)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/rifas/${raffle.id}`)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Participar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 