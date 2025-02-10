import React from 'react';
import { Gift, Shield, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center bg-gradient-to-b from-purple-50 to-white px-4 py-8 md:py-12">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center md:text-left space-y-4 md:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Participe de Sorteios
                <span className="text-purple-600"> Online</span> com Segurança
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto md:mx-0">
                Sua plataforma confiável para participar de rifas emocionantes com pagamento via PIX.
                Rápido, seguro e transparente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  to="/rifas"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors group text-sm sm:text-base"
                >
                  Ver Rifas Disponíveis
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm sm:text-base"
                >
                  Criar Conta Grátis
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative">
              <img
                src="https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=1470"
                alt="Sorteios Online"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 to-transparent rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-8 md:py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
                100% Seguro
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                Plataforma verificada e auditada para garantir a segurança das suas transações.
              </p>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
                Pagamento via PIX
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                Realize seus pagamentos de forma rápida e segura através do PIX.
              </p>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-lg hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <Gift className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
                Prêmios Garantidos
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                Sorteios transparentes e prêmios entregues com garantia total.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-600 py-8 md:py-12">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
            Pronto para participar?
          </h2>
          <p className="text-sm sm:text-base text-purple-100 mb-6 md:mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já estão participando dos nossos sorteios.
            Crie sua conta agora e comece a concorrer!
          </p>
          <Link
            to="/auth?mode=register"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm sm:text-base"
          >
            Começar Agora
          </Link>
        </div>
      </section>
    </div>
  );
}