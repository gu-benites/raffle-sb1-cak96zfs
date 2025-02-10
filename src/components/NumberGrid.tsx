import React from 'react';

export type Ticket = {
  number: number;
  status: 'available' | 'pending' | 'paid';
  buyer_name?: string;
  buyer_email?: string;
  created_at?: string;
  raffle_id?: string;
  user_id?: string;
  payment_id?: string;
};

export interface NumberGridProps {
  tickets: Ticket[];
  selectedNumbers?: number[];
  onNumberClick?: (number: number, status: string) => void;
  showTooltip?: boolean;
  isAdmin?: boolean;
  reservedNumbers?: number[];
}

export function NumberGrid({ 
  tickets, 
  selectedNumbers = [], 
  onNumberClick,
  showTooltip = false,
  isAdmin = false,
  reservedNumbers = []
}: NumberGridProps) {
  const getTicketColor = (ticket: Ticket, isSelected: boolean) => {
    if (isSelected)
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-500';
    
    const isReserved = reservedNumbers.includes(ticket.number);
    const bgColor =
      ticket.status === 'paid'
        ? 'bg-green-100'
        : ticket.status === 'pending' || isReserved
        ? 'bg-yellow-100'
        : 'bg-gray-100';
    
    return `
      relative h-9 flex items-center justify-center rounded-md text-sm font-medium
      ${bgColor}
      ${isSelected ? 'text-purple-700 ring-1 ring-purple-500' : 'text-gray-700 cursor-pointer border border-gray-200 hover:border-purple-300'}
      transition-all duration-200
    `;
  };

  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
      {tickets.map((ticket) => (
        <button
          key={ticket.number}
          onClick={() => onNumberClick?.(ticket.number, ticket.status)}
          disabled={ticket.status !== 'available' && !isAdmin}
          className={getTicketColor(ticket, selectedNumbers.includes(ticket.number))}
        >
          {String(ticket.number).padStart(2, '0')}
          
          {showTooltip && ticket.status !== 'available' && (
            <div className="absolute z-10 invisible group-hover:visible 
              bg-gray-900 text-white text-xs rounded-md py-1.5 px-2 w-40
              -top-16 left-1/2 transform -translate-x-1/2 shadow-lg"
            >
              <div className="flex flex-col gap-1">
                <span>{ticket.buyer_name || 'Sem nome'}</span>
                <span className="text-gray-300">{ticket.buyer_email || 'Sem email'}</span>
                <span className="text-gray-300">
                  {ticket.created_at 
                    ? new Date(ticket.created_at).toLocaleDateString()
                    : 'Data não disponível'
                  }
                </span>
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2
                border-t-4 border-x-4 border-gray-900 border-x-transparent"
              />
            </div>
          )}
        </button>
      ))}
    </div>
  );
} 