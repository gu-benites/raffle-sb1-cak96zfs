import { supabase } from '../lib/supabase';
import { reservationService } from './redis';

type PurchaseTicket = {
  number: number;
  raffle_id: string;
};

export const purchaseService = {
  // Reserva temporária dos números
  async reserveNumbers(tickets: PurchaseTicket[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar disponibilidade no banco
    const availableTickets = await this.checkTicketsAvailability(tickets);

    if (!availableTickets.every((t: any) => t.available)) {
      throw new Error('Alguns números não estão mais disponíveis');
    }

    // Reservar no Redis
    await reservationService.reserveNumbers(
      tickets[0].raffle_id,
      tickets.map(t => t.number),
      user.id
    );

    return true;
  },

  // Criar ordem de pagamento
  async createPaymentOrder(raffle_id: string, tickets: number[], amount: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar reservas no Redis
    const reservations = await reservationService.checkReservation(raffle_id, tickets);
    const invalidReservations = reservations.filter((r: any) => 
      !r.isReserved || r.reservation.userId !== user.id
    );

    if (invalidReservations.length > 0) {
      throw new Error('Reserva expirada ou inválida');
    }

    // Criar ordem de pagamento
    const { data, error } = await supabase.rpc('create_payment_order', {
      p_raffle_id: raffle_id,
      p_user_id: user.id,
      p_tickets: tickets,
      p_amount: amount
    });

    if (error) throw error;
    return data;
  },

  // Confirmar pagamento
  async confirmPayment(payment_id: string) {
    // Buscar informações do pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('raffle_id, tickets')
      .eq('id', payment_id)
      .single();

    if (paymentError) throw paymentError;

    // Confirmar pagamento
    const { error } = await supabase.rpc('confirm_payment', {
      p_payment_id: payment_id
    });

    if (error) throw error;

    // Remover reservas do Redis
    await reservationService.removeReservation(
      payment.raffle_id,
      payment.tickets
    );

    return true;
  },

  // Adicione o método de teste aqui
  async checkTicketsAvailability(tickets: PurchaseTicket[]) {
    const { data, error } = await supabase.rpc('check_tickets_availability', {
      p_tickets: tickets
    });

    if (error) {
      console.error('Erro ao verificar disponibilidade de tickets:', error);
      throw error;
    }

    return data;
  }
}; 