import { supabase } from '../lib/supabase';

export const raffleService = {
  async createRaffle(raffleData: any) {
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .insert([raffleData])
      .select()
      .single();

    if (raffleError) throw raffleError;

    // Criar tickets para a nova rifa
    const tickets = [];
    for (let i = 1; i <= raffleData.total_numbers; i++) {
      tickets.push({
        raffle_id: raffle.id,
        number: i,
        status: 'available', // agora os tickets são criados como disponíveis
      });
    }

    const { error: ticketError } = await supabase
      .from('tickets')
      .insert(tickets);

    if (ticketError) throw ticketError;

    return raffle;
  }
}; 