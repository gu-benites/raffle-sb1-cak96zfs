import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar,
  Package, 
  Loader2,
  User,
  Trash2,
  AlertTriangle,
  Trophy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatNumber } from '../utils/format';
import { StatCard } from '../components/StatCard';
import toast from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import { theme } from '../styles/theme';
import { NumberGrid } from '../components/NumberGrid';
import { Button } from '../components/Button';

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
  created_at: string;
  updated_at: string;
};

type Ticket = {
  number: number;
  status: 'available' | 'pending' | 'paid';
  buyer_name?: string;
  buyer_email?: string;
  created_at?: string;
  raffle_id?: string;
  user_id?: string;
  payment_id?: string;
};

export function ManageRaffle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [raffle, setRaffle] = React.useState<Raffle | null>(null);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [reservedNumbers, setReservedNumbers] = React.useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isIncreaseModalOpen, setIsIncreaseModalOpen] = React.useState(false);
  const [newTotalNumbers, setNewTotalNumbers] = React.useState<number>(0);
  const [isAdminUser, setIsAdminUser] = React.useState<boolean>(false);

  React.useEffect(() => {
    console.log('ID da rifa no ManageRaffle:', id);
    fetchRaffle();
  }, [id]);

  const fetchRaffle = async () => {
    try {
      if (!id) {
        console.log('ID não fornecido');
        navigate('/dashboard');
        return;
      }

      setLoading(true);
      console.log('Buscando rifa com ID:', id);

      const { data, error } = await supabase
        .rpc('get_raffle_with_stats', { 
          p_raffle_id: id 
        });

      console.log('Resposta do servidor:', { data, error });

      if (error) {
        console.error('Error details:', error);
        toast.error(error.message || 'Erro ao carregar a rifa');
        navigate('/dashboard');
        return;
      }

      if (!data || data.length === 0) {
        console.log('Nenhum dado encontrado para o ID:', id);
        toast.error('Rifa não encontrada');
        navigate('/dashboard');
        return;
      }

      // Garantir que as datas estão no formato correto
      const formattedData = {
        ...data[0],
        start_date: data[0].start_date.slice(0, 16), // Formato YYYY-MM-DDTHH:mm
        end_date: data[0].end_date.slice(0, 16)
      };

      console.log('Dados formatados:', formattedData);
      setRaffle(formattedData);
    } catch (err: any) {
      console.error('Error completo:', err);
      toast.error(err.message || 'Erro ao carregar dados da rifa');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      if (!id || !raffle) return;

      const { data, error } = await supabase
        .rpc('get_raffle_tickets', { 
          p_raffle_id: id 
        });

      if (error) {
        console.error('Erro ao buscar tickets:', error);
        throw error;
      }

      console.log('Tickets encontrados:', data);

      // Criar array com todos os números
      const allTickets: Ticket[] = Array.from(
        { length: raffle.total_numbers }, 
        (_, i) => ({
          number: i + 1,
          status: 'available'
        })
      );

      // Atualizar status dos números vendidos
      data?.forEach((ticket: Ticket) => {
        const index = ticket.number - 1;
        if (index >= 0 && index < allTickets.length) {
          allTickets[index] = {
            ...ticket,
            status: ticket.status as 'pending' | 'paid'
          };
        }
      });

      setTickets(allTickets);
    } catch (err) {
      console.error('Erro ao buscar tickets:', err);
      toast.error('Erro ao carregar números');
    }
  };

  React.useEffect(() => {
    if (raffle) {
      fetchTickets();
    }
  }, [raffle]);

  const getTicketColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 hover:bg-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
    }
  };

  const updateStatus = async (newStatus: string) => {
    const loadingToast = toast.loading('Atualizando status...');
    
    try {
      const { error } = await supabase
        .from('raffles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Atualizar dados locais
      if (raffle) {
        setRaffle({ 
          ...raffle, 
          status: newStatus,
          updated_at: new Date().toISOString()
        });
      }

      toast.success('Status atualizado com sucesso', {
        id: loadingToast
      });

      // Recarregar os dados para garantir sincronização
      fetchRaffle();
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error(err.message || 'Erro ao atualizar status', {
        id: loadingToast
      });
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== raffle?.title) {
      toast.error('O título da rifa não corresponde');
      return;
    }

    setIsDeleting(true);
    const loadingToast = toast.loading('Excluindo rifa...');

    try {
      const { error } = await supabase
        .from('raffles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Rifa excluída com sucesso', {
        id: loadingToast
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro ao excluir rifa:', err);
      toast.error('Erro ao excluir rifa', {
        id: loadingToast
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const updateRaffleDetails = async (field: keyof Raffle, value: string | number) => {
    const loadingToast = toast.loading('Atualizando...');
    
    try {
      const { error } = await supabase
        .from('raffles')
        .update({ 
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Atualizar estado local
      if (raffle) {
        setRaffle({ 
          ...raffle, 
          [field]: value,
          updated_at: new Date().toISOString()
        });
      }

      toast.success('Atualizado com sucesso', {
        id: loadingToast
      });

      // Recarregar dados
      fetchRaffle();
    } catch (err: any) {
      console.error('Erro ao atualizar:', err);
      toast.error(err.message || 'Erro ao atualizar', {
        id: loadingToast
      });
    }
  };
  const handleIncreaseNumbers = async () => {
    if (!raffle || newTotalNumbers <= raffle.total_numbers) {
      toast.error('O novo total deve ser maior que o atual');
      return;
    }

    const loadingToast = toast.loading('Atualizando quantidade...');
    
    try {
      await updateRaffleDetails('total_numbers', newTotalNumbers);
      toast.success('Quantidade atualizada com sucesso', { id: loadingToast });
      setIsIncreaseModalOpen(false);
    } catch (err) {
      toast.error('Erro ao atualizar quantidade', { id: loadingToast });
    }
  };

  React.useEffect(() => {
    console.log('Estado do modal:', isDeleteModalOpen);
  }, [isDeleteModalOpen]);

  React.useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: isAdmin } = await supabase.rpc('is_admin');
      console.log("Valor retornado de is_admin:", isAdmin);

      if (!isAdmin) {
        navigate('/dashboard');
        return;
      }

      setIsAdminUser(isAdmin);
    };
    checkAdmin();
  }, [navigate]);

  // Nova função para buscar os números reservados (exemplo)
  const fetchReservedNumbers = async () => {
    try {
      // Consulta direta: buscar números dos tickets com status 'pending'
      const { data: reserved, error } = await supabase
        .from('tickets')
        .select('number')
        .eq('raffle_id', id)
        .eq('status', 'pending');

      if (error) {
        console.error('Erro ao buscar reservas:', error);
        return;
      }

      if (reserved) {
        // 'reserved' é um array de objetos com o campo number, por exemplo: [{ number: 5 }, { number: 10 }]
        const reservedNums = reserved.map((item: any) => item.number);
        setReservedNumbers(reservedNums);
      }
    } catch (err) {
      console.error('Erro na função fetchReservedNumbers:', err);
    }
  };

  // Exemplo de polling para atualizar os números reservados a cada 5 segundos
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Chama a função que consulta reservas
      fetchReservedNumbers();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Função que atualiza o status de um ticket no Supabase
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
    
    // Opcional: Verifique os dados retornados para confirmar a atualização.
    console.log('Ticket atualizado com sucesso:', data);
    return true;
  };

  // Handler chamado ao clicar no número. Recebe o número do ticket e o status atual.
  const handleNumberClick = async (ticketNumber: number, currentStatus: string) => {
    // Se o usuário é admin, não atualiza os tickets, pois admin não compra ticket
    if (isAdminUser) {
      console.log('Admin não pode comprar tickets.');
      return;
    }

    // Determina o novo status: se disponível, marca como pendente, caso contrário, volta para disponível.
    const newStatus = currentStatus === 'available' ? 'pending' : 'available';
  
    const success = await updateTicketStatus(ticketNumber, newStatus);
    if (success) {
      // Atualiza o estado local para refletir a mudança
      setTickets(prevTickets =>
        prevTickets.map(t =>
          t.number === ticketNumber ? { ...t, status: newStatus } : t
        )
      );
    }
  };

  React.useEffect(() => {
    // Crie um canal realtime usando supabase.channel (v2) para a tabela 'tickets' filtrando pelo raffle_id.
    const channel = supabase
      .channel(`tickets-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `raffle_id=eq.${id}` },
        (payload: any) => {
          console.log("Ticket atualizado (UPDATE):", payload.new);
          // Atualiza o estado local dos tickets com o novo valor
          setTickets((prevTickets) =>
            prevTickets.map((ticket) =>
              ticket.number === payload.new.number ? payload.new : ticket
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tickets', filter: `raffle_id=eq.${id}` },
        (payload: any) => {
          console.log("Ticket inserido (INSERT):", payload.new);
          setTickets((prevTickets) => [...prevTickets, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tickets', filter: `raffle_id=eq.${id}` },
        (payload: any) => {
          console.log("Ticket deletado (DELETE):", payload.old);
          setTickets((prevTickets) =>
            prevTickets.filter((ticket) => ticket.number !== payload.old.number)
          );
        }
      )
      .subscribe();
    
    // Cleanup: cancelar a assinatura usando channel.unsubscribe()
    return () => {
      channel.unsubscribe();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Rifa não encontrada</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

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
                <div className="mt-4 flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    raffle.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    raffle.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {raffle.status === 'draft' ? 'Rascunho' :
                     raffle.status === 'active' ? 'Ativo' : 'Finalizado'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Criada em {new Date(raffle.created_at).toLocaleDateString()}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Package}
            title="Total de Números"
            value={formatNumber(raffle.total_numbers)}
            className="bg-blue-50"
          />
          <StatCard
            icon={Users}
            title="Números Vendidos"
            value={formatNumber(raffle.sold_numbers)}
            className="bg-green-50"
          />
          <StatCard
            icon={DollarSign}
            title="Valor por Número"
            value={formatCurrency(raffle.price_per_number)}
            className="bg-yellow-50"
          />
          <StatCard
            icon={DollarSign}
            title="Valor Arrecadado"
            value={formatCurrency(raffle.current_revenue)}
            className="bg-emerald-50"
          />
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gerenciar Status</h2>
              <p className="text-sm text-gray-500 mt-1">Altere o status da rifa para controlar sua visibilidade</p>
            </div>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Rifa
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => raffle.status !== 'draft' && updateStatus('draft')}
              className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200
                ${raffle.status === 'draft'
                  ? 'border-purple-200 bg-purple-50 shadow-sm'
                  : 'border-gray-200 hover:border-purple-400 hover:shadow-md cursor-pointer'
                }
              `}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${raffle.status === 'draft' ? 'bg-purple-100' : 'bg-gray-100'}`}
                  >
                    <Package className={`h-5 w-5 ${raffle.status === 'draft' ? 'text-purple-600' : 'text-gray-600'}`} />
                  </div>
                  {raffle.status === 'draft' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Atual
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className={`font-semibold ${raffle.status === 'draft' ? 'text-purple-900' : 'text-gray-900'}`}>
                    Rascunho
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Visível apenas para admin
                  </p>
                </div>
              </div>
              {raffle.status === 'draft' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
              )}
            </div>

            <div
              onClick={() => raffle.status !== 'active' && updateStatus('active')}
              className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200
                ${raffle.status === 'active'
                  ? 'border-green-200 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-green-400 hover:shadow-md cursor-pointer'
                }
              `}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${raffle.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    <Users className={`h-5 w-5 ${raffle.status === 'active' ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  {raffle.status === 'active' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Ativo
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className={`font-semibold ${raffle.status === 'active' ? 'text-green-900' : 'text-gray-900'}`}>
                    Ativo
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Disponível para compra
                  </p>
                </div>
              </div>
              {raffle.status === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500" />
              )}
            </div>

            <div
              onClick={() => raffle.status !== 'finished' && updateStatus('finished')}
              className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200
                ${raffle.status === 'finished'
                  ? 'border-yellow-200 bg-yellow-50 shadow-sm'
                  : 'border-gray-200 hover:border-yellow-400 hover:shadow-md cursor-pointer'
                }
              `}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${raffle.status === 'finished' ? 'bg-yellow-100' : 'bg-gray-100'}`}
                  >
                    <Trophy className={`h-5 w-5 ${raffle.status === 'finished' ? 'text-yellow-600' : 'text-gray-600'}`} />
                  </div>
                  {raffle.status === 'finished' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Finalizado
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className={`font-semibold ${raffle.status === 'finished' ? 'text-yellow-900' : 'text-gray-900'}`}>
                    Finalizado
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Sorteio realizado
                  </p>
                </div>
              </div>
              {raffle.status === 'finished' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500" />
              )}
            </div>
          </div>
        </div>

        {/* Detalhes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Detalhes da Rifa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Números */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Números da Rifa</h3>
              
              <div>
                <label className="text-sm text-gray-600">Total de Números</label>
                <div className="mt-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-gray-700 font-medium">
                    {formatNumber(raffle.total_numbers)}
                    <span className="text-sm text-gray-500 ml-2">
                      ({formatNumber(raffle.sold_numbers)} vendidos)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTotalNumbers(raffle.total_numbers);
                      setIsIncreaseModalOpen(true);
                    }}
                  >
                    Aumentar Quantidade
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Valor por Número</label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    value={raffle.price_per_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRaffleDetails('price_per_number', parseFloat(e.target.value))}
                    min={0}
                    step={0.01}
                    className={theme.components.input + ' pl-8'}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Período da Rifa</h3>
              
              <div>
                <label className="text-sm text-gray-600">Data de Início</label>
                <div className="mt-1 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={raffle.start_date.slice(0, 16)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRaffleDetails('start_date', e.target.value)}
                    className={theme.components.input + ' pl-10'}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Data de Término</label>
                <div className="mt-1 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={raffle.end_date.slice(0, 16)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRaffleDetails('end_date', e.target.value)}
                    min={raffle.start_date.slice(0, 16)}
                    className={theme.components.input + ' pl-10'}
                  />
                </div>
              </div>
            </div>

            {/* Método de Sorteio */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Método de Sorteio</h3>
              <select
                value={raffle.draw_method}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateRaffleDetails('draw_method', e.target.value)}
                className={theme.components.input}
              >
                <option value="sorteador">Sorteador.com.br</option>
                <option value="federal">Loteria Federal</option>
                <option value="instagram">Live no Instagram</option>
                <option value="youtube">Live no Youtube</option>
                <option value="tiktok">Live no TikTok</option>
                <option value="other">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nova seção de Números */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Números da Rifa</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-100 mr-2"></div>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-100 mr-2"></div>
                  <span>Pendente</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-100 mr-2"></div>
                  <span>Pago</span>
                </div>
              </div>
            </div>

            <NumberGrid 
              tickets={tickets}
              reservedNumbers={reservedNumbers}
              showTooltip={true}
              onNumberClick={handleNumberClick}
            />
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <Dialog.Title className="text-lg font-medium">
                Excluir Rifa
              </Dialog.Title>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Esta ação não pode ser desfeita. Todos os dados da rifa serão permanentemente excluídos.
              </p>
              
              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2">
                  Para confirmar, digite o título da rifa: <span className="font-semibold">{raffle?.title}</span>
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className={theme.components.input}
                  placeholder="Digite o título da rifa"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmation('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteConfirmation !== raffle?.title}
                isLoading={isDeleting}
              >
                Excluir Permanentemente
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Modal de Aumento de Números */}
      <Dialog
        open={isIncreaseModalOpen}
        onClose={() => setIsIncreaseModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Aumentar Quantidade de Números
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Atual
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-700">
                  {formatNumber(raffle.total_numbers)} números
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Quantidade
                </label>
                <input
                  type="number"
                  min={raffle.total_numbers + 1}
                  value={newTotalNumbers}
                  onChange={(e) => setNewTotalNumbers(parseInt(e.target.value))}
                  className={theme.components.input}
                />
                {newTotalNumbers > raffle.total_numbers && (
                  <p className="mt-1 text-sm text-gray-500">
                    Você está adicionando {formatNumber(newTotalNumbers - raffle.total_numbers)} novos números
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">Atenção</h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      Esta ação não poderá ser desfeita. Após aumentar a quantidade, 
                      não será possível diminuir o número de rifas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsIncreaseModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleIncreaseNumbers}
                disabled={newTotalNumbers <= raffle.total_numbers}
              >
                Confirmar Aumento
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 