import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { signIn, signUp } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function Auth() {
  console.log('Auth component rendered');
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'register');
  }, [searchParams]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, insira seu e-mail');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Iniciando processo de recuperação para:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Erro detalhado:', {
          message: error.message,
          status: error.status
        });
        throw error;
      }

      alert('Se este e-mail estiver cadastrado em nossa base, você receberá um link para redefinição de senha.');
    } catch (err: any) {
      console.error('Erro completo:', err);
      setError('Não foi possível enviar o e-mail de recuperação. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (mode: 'login' | 'register') => {
    navigate(`/auth?mode=${mode}`);
  };

  const authContent = {
    login: {
      title: 'Bem-vindo de volta!',
      subtitle: 'Que bom ter você por aqui novamente',
      buttonText: 'Entrar'
    },
    register: {
      title: 'Crie sua conta',
      subtitle: 'Junte-se à nossa comunidade de sorteios',
      buttonText: 'Criar conta'
    }
  };

  const content = isLogin ? authContent.login : authContent.register;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs de navegação */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => toggleMode('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative
                ${isLogin 
                  ? 'text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Login
              {isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
              )}
            </button>
            <button
              onClick={() => toggleMode('register')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative
                ${!isLogin 
                  ? 'text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Criar conta
              {!isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
              )}
            </button>
          </div>

          <div className="p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {content.title}
              </h2>
              <p className="text-sm text-gray-600">
                {content.subtitle}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 text-red-700 bg-red-50 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-colors duration-200"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-colors duration-200 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  content.buttonText
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}