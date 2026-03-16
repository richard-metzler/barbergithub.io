import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET - получить все записи или одну по ID
    if (req.method === 'GET') {
      const { id, date, master_id, status } = req.query;
      
      let query = supabase.from('bookings').select('*');

      if (id) {
        const { data, error } = await query.eq('id', id).single();
        if (error) return res.status(404).json({ error: 'Booking not found' });
        return res.status(200).json({ booking: data });
      }

      if (date) query = query.eq('date', date as string);
      if (master_id) query = query.eq('master_id', master_id as string);
      if (status) query = query.eq('status', status as string);

      query = query.order('date', { ascending: true }).order('time', { ascending: true });

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: 'Failed to fetch bookings' });

      return res.status(200).json({ bookings: data || [] });
    }

    // POST - создать новую запись
    if (req.method === 'POST') {
      const booking = req.body;
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();

      if (error) return res.status(500).json({ error: 'Failed to create booking' });

      return res.status(201).json({ booking: data });
    }

    // PUT - обновить запись
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;

      if (!id) return res.status(400).json({ error: 'id required' });

      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: 'Failed to update booking' });

      return res.status(200).json({ booking: data });
    }

    // DELETE - удалить запись
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) return res.status(400).json({ error: 'id required' });

      const { error } = await supabase.from('bookings').delete().eq('id', id);

      if (error) return res.status(500).json({ error: 'Failed to delete booking' });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
