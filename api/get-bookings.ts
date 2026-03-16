import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServerClient } from '../lib/supabase';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, master_id, status } = req.query;
    const supabase = createServerClient();

    let query = supabase.from('bookings').select('*');

    // Фильтры
    if (date) {
      query = query.eq('date', date as string);
    }
    if (master_id) {
      query = query.eq('master_id', master_id as string);
    }
    if (status) {
      query = query.eq('status', status as string);
    }

    // Сортировка по времени
    query = query.order('time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    return res.status(200).json({ bookings: data || [] });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
