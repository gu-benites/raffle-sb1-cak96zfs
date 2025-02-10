import { Dialog } from '@headlessui/react';
import { Button } from './Button';
import { formatCurrency } from '../utils/format';

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl: string;
  amount: number;
  selectedNumbers: number[];
};

export function PaymentModal({
  isOpen,
  onClose,
  paymentUrl,
  amount,
  selectedNumbers
}: PaymentModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            Complete seu Pagamento
          </Dialog.Title>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total a pagar:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''} selecionado{selectedNumbers.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                Sua reserva é válida por 15 minutos. Complete o pagamento para garantir seus números.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.open(paymentUrl, '_blank')}
              >
                Pagar com Pix
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Fechar
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 