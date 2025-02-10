import React from 'react';
import { Gift, Shield, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Participe de Rifas Online com Segurança e Facilidade
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sua plataforma confiável para participar de sorteios emocionantes com pagamento via PIX
          </p>
          <Link
            to="/rifas"
            className="inline-block px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transform hover:scale-105 transition-all"
          >
            Ver Rifas Disponíveis
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que escolher nossa plataforma?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-600">
                Sistema protegido e transparente para todas as transações
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pagamento via PIX</h3>
              <p className="text-gray-600">
                Processo de pagamento rápido e seguro usando PIX
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prêmios Incríveis</h3>
              <p className="text-gray-600">
                Diversas rifas com prêmios exclusivos e emocionantes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Como Funciona
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-4">1</div>
              <h3 className="text-lg font-semibold mb-2">Escolha sua Rifa</h3>
              <p className="text-gray-600">
                Navegue pelas rifas disponíveis e escolha a que mais te interessar
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-4">2</div>
              <h3 className="text-lg font-semibold mb-2">Selecione os Números</h3>
              <p className="text-gray-600">
                Escolha seus números da sorte entre os disponíveis
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-4">3</div>
              <h3 className="text-lg font-semibold mb-2">Pague via PIX</h3>
              <p className="text-gray-600">
                Faça o pagamento de forma rápida e segura usando PIX
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-4">4</div>
              <h3 className="text-lg font-semibold mb-2">Aguarde o Sorteio</h3>
              <p className="text-gray-600">
                Acompanhe o resultado e boa sorte!
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}