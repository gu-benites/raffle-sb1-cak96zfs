import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar,
  Package, 
  Loader2,
  User,
  DollarSign,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatNumber } from '../utils/format';
import { StatCard } from '../components/StatCard';
import toast from 'react-hot-toast';
import { theme } from '../styles/theme';
import { NumberGrid } from '../components/NumberGrid';
import { Button } from '../components/Button';
import { purchaseService } from '../services/purchase';

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
  draw_method: string;
  sold_numbers: number;
  current_revenue: number;
};

type Ticket = {
  number: number;
  status: 'available' | 'pending' | 'paid';
};

export function BuyRaffle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [raffle, setRaffle] = React.useState<Raffle | null>(null);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [selectedNumbers, setSelectedNumbers] = React.useState<number[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isReserving, setIsReserving] = React.useState(false);
  const [paymentUrl, setPaymentUrl] = React.useState<string | null>(null);
  const [reservationTimeout, setReservationTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);

  React.useEffect(() => {
    fetchRaffle();
  }, [id]);

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate]);

  React.useEffect(() => {
    if (raffle) {
      fetchTickets();
    }
  }, [raffle, id]);

  React.useEffect(() => {
    return () => {
      if (reservationTimeout) {
        clearTimeout(reservationTimeout);
      }
    };
  }, [reservationTimeout]);

  const fetchRaffle = async () => {
    try {
      if (!id) {
        navigate('/dashboard');
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .rpc('get_raffle_with_stats', { 
          p_raffle_id: id 
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('Rifa não encontrada');
        navigate('/dashboard');
        return;
      }

      const formattedData = {
        ...data[0],
        start_date: data[0].start_date.slice(0, 16),
        end_date: data[0].end_date.slice(0, 16)
      };

      setRaffle(formattedData);
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Erro ao carregar dados da rifa');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      if (!id || !raffle) {
        console.log('Faltando id ou raffle:', { id, raffle });
        return;
      }

      console.log('Buscando tickets para rifa:', id);

      const { data, error } = await supabase
        .rpc('get_raffle_tickets', { 
          p_raffle_id: id 
        });

      if (error) {
        console.error('Erro ao buscar tickets:', error);
        throw error;
      }

      console.log('Tickets recebidos:', data);

      // Criar array com todos os números
      const allTickets: Ticket[] = Array.from(
        { length: raffle.total_numbers }, 
        (_, i) => ({
          number: i + 1,
          status: 'available'
        })
      );

      // Atualizar status dos números vendidos
      if (data && Array.isArray(data)) {
        data.forEach((ticket: Ticket) => {
          const index = ticket.number - 1;
          if (index >= 0 && index < allTickets.length) {
            allTickets[index].status = ticket.status;
          }
        });
      }

      console.log('Tickets processados:', allTickets);
      setTickets(allTickets);
    } catch (err) {
      console.error('Erro ao buscar tickets:', err);
      toast.error('Erro ao carregar números');
    }
  };

  const playSelectSound = () => {
    const audio = new Audio('/select.mp3'); // Adicionar arquivo de som
    audio.volume = 0.2;
    audio.play().catch(() => {});
  };

  const handleNumberClick = async (ticketNumber: number, currentStatus: string) => {
    // Para o usuário comum, suponha que só seja possível alterar de "available" para "pending".
    if (currentStatus !== 'available') {
      return; // se o ticket já não estiver disponível, não faz nada
    }
  
    const newStatus: 'pending' = 'pending';
    const success = await updateTicketStatus(ticketNumber, newStatus);
    if (success) {
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.number === ticketNumber ? { ...ticket, status: newStatus } : ticket
        )
      );
    }
  };

  const checkReservationExpiry = useCallback(() => {
    if (reservationExpiry && new Date() > reservationExpiry) {
      toast.error('Sua reserva expirou. Selecione os números novamente.');
      setSelectedNumbers([]);
      setReservationExpiry(null);
      navigate('/dashboard');
    }
  }, [reservationExpiry, navigate]);

  useEffect(() => {
    if (reservationExpiry) {
      const interval = setInterval(checkReservationExpiry, 1000);
      return () => clearInterval(interval);
    }
  }, [reservationExpiry, checkReservationExpiry]);

  const handleBuy = async () => {
    if (selectedNumbers.length === 0) {
      toast.error('Selecione pelo menos um número');
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading('Processando sua compra...');

    try {
      setIsReserving(true);
      const tickets = selectedNumbers.map(number => ({
        number,
        raffle_id: id
      }));

      await purchaseService.reserveNumbers(tickets);
      
      // Definir expiração para 15 minutos
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);
      setReservationExpiry(expiry);

      // 2. Criar ordem de pagamento
      const amount = selectedNumbers.length * raffle.price_per_number;
      const paymentOrder = await purchaseService.createPaymentOrder(
        raffle.id,
        selectedNumbers,
        amount
      );

      // 3. Configurar timeout para a reserva (15 minutos)
      const timeout = setTimeout(() => {
        toast.error('Reserva expirada. Selecione os números novamente.');
        navigate('/dashboard');
      }, 15 * 60 * 1000);

      setReservationTimeout(timeout);
      setPaymentUrl(paymentOrder.payment_url);

      // 4. Abrir modal de pagamento
      setShowPaymentModal(true);
      toast.success('Números reservados! Complete o pagamento.', { id: loadingToast });
    } catch (err) {
      console.error('Erro na compra:', err);
      toast.error('Erro ao processar compra', { id: loadingToast });
    } finally {
      setIsProcessing(false);
      setIsReserving(false);
    }
  };

  const getTicketColor = (status: string, isSelected: boolean) => {
    if (isSelected) 
      return 'bg-purple-100 text-purple-800 ring-2 ring-purple-500 ring-offset-2 transform scale-105';
    
    switch (status) {
      case 'paid':
        return 'bg-gray-100 text-gray-400 cursor-not-allowed';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 cursor-not-allowed';
      default:
        return 'bg-white hover:bg-gray-50 text-gray-800 cursor-pointer border border-gray-200 hover:border-purple-300';
    }
  };

  const scrollToNumbers = () => {
    document.getElementById('numbers-grid')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const updateTicketStatus = async (ticketNumber: number, newStatus: 'pending' | 'available') => {
    console.log('Atualizando ticket:', { raffleId: id, ticketNumber, newStatus });
    const { data, error } = await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .match({ raffle_id: id, number: ticketNumber });

    if (error) {
      console.error('Erro ao atualizar status do ticket:', error);
      toast.error('Erro ao atualizar status do ticket: ' + error.message);
      return false;
    }
    
    console.log('Ticket atualizado com sucesso:', data);
    return true;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
        <p className="text-gray-500">Carregando informações da rifa...</p>
      </div>
    );
  }

  if (!raffle) return null;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header com imagem */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start space-x-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1 flex items-start space-x-6">
              <img
                src={raffle.image_url || 'https://via.placeholder.com/200'}
                alt={raffle.title}
                className="w-32 h-32 rounded-lg object-cover shadow-sm"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{raffle.title}</h1>
                <p className="text-sm text-gray-600 mt-1">{raffle.description}</p>
                <div className="mt-4 flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Sorteio em: {new Date(raffle.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={Package}
            title="Números Disponíveis"
            value={formatNumber(raffle.total_numbers - raffle.sold_numbers)}
            className="bg-blue-50"
          />
          <StatCard
            icon={DollarSign}
            title="Valor por Número"
            value={formatCurrency(raffle.price_per_number)}
            className="bg-green-50"
          />
          <StatCard
            icon={DollarSign}
            title="Total Selecionado"
            value={formatCurrency(selectedNumbers.length * raffle.price_per_number)}
            className="bg-purple-50"
          />
        </div>

        {/* Números */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {/* Header da seção */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Escolha seus Números</h2>
              <p className="text-sm text-gray-500">Clique nos números desejados para selecioná-los</p>
            </div>
            
            {/* Legenda */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-white border border-gray-200 mr-2"></div>
                <span>Disponível</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-100 mr-2"></div>
                <span>Selecionado</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-100 mr-2"></div>
                <span>Indisponível</span>
              </div>
            </div>
          </div>

          <NumberGrid 
            tickets={tickets}
            selectedNumbers={selectedNumbers}
            onNumberClick={handleNumberClick}
          />
        </div>

        {/* Barra fixa de resumo */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-3xl mx-auto">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''} selecionado{selectedNumbers.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-gray-500">
                  Total: {formatCurrency(selectedNumbers.length * (raffle?.price_per_number || 0))}
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth={isMobile}
                onClick={handleBuy}
                disabled={selectedNumbers.length === 0}
                isLoading={isProcessing}
              >
                {`Comprar ${selectedNumbers.length} número${selectedNumbers.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>

        {/* Espaçador para evitar que o conteúdo fique sob a barra fixa */}
        <div className="h-24 sm:h-20"></div>
      </div>
    </div>
  );
} 