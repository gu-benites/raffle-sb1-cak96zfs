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
import { toast } from 'react-hot-toast';
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
  const [paymentUrl, setPaymentUrl] = React.useState<string | null>(null);

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

      const { data, error } = await supabase
        .rpc('get_raffle_tickets', { 
          p_raffle_id: id 
        });

      if (error) {
        console.error('Erro ao buscar tickets:', error);
        throw error;
      }

      const allTickets: Ticket[] = Array.from(
        { length: raffle.total_numbers }, 
        (_, i) => ({
          number: i + 1,
          status: 'available'
        })
      );

      if (data && Array.isArray(data)) {
        data.forEach((ticket: Ticket) => {
          const index = ticket.number - 1;
          if (index >= 0 && index < allTickets.length) {
            allTickets[index].status = ticket.status;
          }
        });
      }

      setTickets(allTickets);
    } catch (err) {
      console.error('Erro ao buscar tickets:', err);
      toast.error('Erro ao carregar números');
    }
  };

  const handleNumberClick = async (ticketNumber: number, currentStatus: string) => {
    if (currentStatus !== 'available') {
      toast.error('Este número não está mais disponível.');
      return;
    }
  
    const newStatus: 'pending' = 'pending';
    const success = await updateTicketStatus(ticketNumber, newStatus);
    if (success) {
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.number === ticketNumber ? { ...ticket, status: newStatus } : ticket
        )
      );
      // Adiciona o número selecionado à lista
      setSelectedNumbers(prev => [...prev, ticketNumber]);
    }
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

  const handleBuy = async () => {
    if (selectedNumbers.length === 0) {
      toast.error('Selecione pelo menos um número');
      return;
    }

    if (!raffle) {
      toast.error('Dados da rifa não carregados corretamente.');
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading('Processando sua compra...');

    try {
      const tickets = selectedNumbers.map(number => ({
        number,
        raffle_id: id!
      }));

      await purchaseService.reserveNumbers(tickets);
      
      // Criar ordem de pagamento
      const amount = selectedNumbers.length * raffle.price_per_number;
      const paymentOrder = await purchaseService.createPaymentOrder(
        raffle.id,
        selectedNumbers,
        amount
      );

      setPaymentUrl(paymentOrder.payment_url);
      toast.success('Números reservados! Complete o pagamento.', { id: loadingToast });
    } catch (err) {
      console.error('Erro na compra:', err);
      toast.error('Erro ao processar compra', { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
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