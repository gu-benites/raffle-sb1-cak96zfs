import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Calculator, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import { theme } from '../styles/theme';
import { raffleService } from '../services/raffle';

type RaffleForm = {
  title: string;
  description: string;
  image_url: string;
  total_numbers: number;
  price_per_number: number;
  start_date: string;
  end_date: string;
  draw_method: string;
};

export function CreateRaffle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [form, setForm] = useState<RaffleForm>({
    title: '',
    description: '',
    image_url: '',
    total_numbers: 100,
    price_per_number: 10,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    draw_method: ''
  });
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [createdRaffleId, setCreatedRaffleId] = useState<string | null>(null);

  const drawMethods = [
    {
      value: 'federal',
      label: 'Loteria Federal',
      description: 'Sorteio baseado no resultado oficial da Loteria Federal'
    },
    {
      value: 'sorteador',
      label: 'Sorteador.com.br',
      description: 'Plataforma online certificada para realização de sorteios'
    },
    {
      value: 'instagram',
      label: 'Live no Instagram',
      description: 'Sorteio ao vivo através de live no Instagram'
    },
    {
      value: 'youtube',
      label: 'Live no Youtube',
      description: 'Sorteio ao vivo através de live no Youtube'
    },
    {
      value: 'tiktok',
      label: 'Live no TikTok',
      description: 'Sorteio ao vivo através de live no TikTok'
    },
    {
      value: 'other',
      label: 'Outros',
      description: 'Outro método de sorteio (especificar na descrição)'
    }
  ];

  useEffect(() => {
    calculateTotalRevenue();
  }, [form.total_numbers, form.price_per_number]);

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

  const calculateTotalRevenue = () => {
    setTotalRevenue(form.total_numbers * form.price_per_number);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verificar sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Sessão atual:', session);

      // Verificar se é admin
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin');
      console.log('Verificação de admin:', { isAdmin, adminCheckError });

      if (adminCheckError) {
        console.error('Erro ao verificar admin:', adminCheckError);
        throw new Error('Erro ao verificar permissões de administrador');
      }

      if (!isAdmin) {
        throw new Error('Você não tem permissão para criar rifas');
      }

      // Agora crie a rifa usando o serviço que também criará os tickets
      const raffle = await raffleService.createRaffle({
        ...form,
        status: 'draft',
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString()
      });

      // Define o id da rifa criada para exibição ou para futura publicação
      setCreatedRaffleId(raffle.id);
      setShowPublishModal(true);
    } catch (err: any) {
      console.error('Erro completo:', err);
      const errorMessage = err.message || 'Erro ao criar rifa';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!createdRaffleId) return;

    const loadingToast = toast.loading('Publicando rifa...');
    try {
      const { error } = await supabase
        .from('raffles')
        .update({ status: 'active' })
        .eq('id', createdRaffleId);

      if (error) throw error;

      toast.success('Rifa publicada com sucesso!', { id: loadingToast });
      navigate(`/rifas/${createdRaffleId}`);
    } catch (err) {
      console.error('Erro ao publicar:', err);
      toast.error('Erro ao publicar rifa', { id: loadingToast });
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        <div className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Criar Nova Rifa</h1>
                  <p className="text-sm text-gray-600">Preencha os dados para criar uma nova rifa</p>
                </div>
              </div>

              {/* Form */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Título da Rifa
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      placeholder="Ex: Rifa Beneficente da Igreja"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      placeholder="Descreva os detalhes da rifa..."
                    />
                  </div>

                  <div>
                    <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                      URL da Imagem
                    </label>
                    <input
                      id="image_url"
                      type="url"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>

                  <div>
                    <label htmlFor="draw_method" className="block text-sm font-medium text-gray-700 mb-1">
                      Por onde será feito o sorteio?
                    </label>
                    <div className="relative">
                      <select
                        id="draw_method"
                        required
                        value={form.draw_method}
                        onChange={(e) => setForm({ ...form, draw_method: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none appearance-none bg-white"
                      >
                        <option value="" disabled>Escolha uma opção</option>
                        {drawMethods.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {form.draw_method && (
                      <p className="mt-1 text-sm text-gray-500">
                        {drawMethods.find(m => m.value === form.draw_method)?.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="total_numbers" className="block text-sm font-medium text-gray-700 mb-1">
                        Total de Números
                      </label>
                      <input
                        id="total_numbers"
                        type="number"
                        required
                        min="1"
                        value={form.total_numbers}
                        onChange={(e) => setForm({ ...form, total_numbers: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="price_per_number" className="block text-sm font-medium text-gray-700 mb-1">
                        Preço por Número
                      </label>
                      <div className="relative">
                        <input
                          id="price_per_number"
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={form.price_per_number}
                          onChange={(e) => setForm({ ...form, price_per_number: parseFloat(e.target.value) })}
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      </div>
                    </div>

                    {/* Total Revenue Card */}
                    <div className="md:col-span-2 bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calculator className="h-5 w-5 text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">
                            Valor Total Possível
                          </span>
                        </div>
                        <span className="text-lg font-semibold text-purple-700">
                          {formatCurrency(totalRevenue)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Baseado no total de números e preço por número
                      </p>
                    </div>

                    <div>
                      <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Início
                      </label>
                      <input
                        id="start_date"
                        type="date"
                        required
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Término
                      </label>
                      <input
                        id="end_date"
                        type="date"
                        required
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Seção do botão submit com mensagem de erro */}
                  <div id="submit-section" className="space-y-4">
                    {error && (
                      <div className="p-4 bg-red-50 rounded-lg flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-red-800">
                            Erro ao criar rifa
                          </h3>
                          <p className="text-sm text-red-700 mt-1">
                            {error}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Criando...
                          </>
                        ) : (
                          'Criar Rifa'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Publicação */}
      <Dialog
        open={showPublishModal}
        onClose={() => {}}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                {/* Ícone de Sucesso */}
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Rifa criada com sucesso!
                </Dialog.Title>

                <p className="mt-2 text-sm text-gray-500">
                  Sua rifa foi criada e está pronta para ser publicada.
                </p>

                <div className="mt-8 flex flex-col gap-3 w-full">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg 
                      hover:bg-gray-50 transition-colors font-medium"
                  >
                    Manter como Rascunho
                  </button>
                  <button
                    onClick={handlePublish}
                    className="w-full px-4 py-3.5 bg-purple-600 text-white rounded-lg 
                      hover:bg-purple-700 transition-colors font-medium"
                  >
                    Publicar Agora
                  </button>
                </div>

                <p className="mt-6 text-xs text-gray-500">
                  Você poderá alterar o status da rifa posteriormente no painel de gerenciamento
                </p>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
} 