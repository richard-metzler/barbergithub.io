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

    // GET - получить расписание мастера на дату
    if (req.method === 'GET') {
      const { master_id, date } = req.query;

      if (!master_id || !date) {
        return res.status(400).json({ error: 'master_id and date required' });
      }

      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('master_id', master_id)
        .eq('date', date)
        .order('time', { ascending: true });

      if (error) return res.status(500).json({ error: 'Failed to fetch schedule' });

      return res.status(200).json({ schedule: data || [] });
    }

    // POST - создать блокировку времени
    if (req.method === 'POST') {
      const { master_id, date, time, reason, client_name, client_phone, created_by } = req.body;

      if (!master_id || !date || !time) {
        return res.status(400).json({ error: 'master_id, date, time required' });
      }

      const { data, error } = await supabase
        .from('schedule')
        .insert({
          master_id,
          date,
          time,
          is_blocked: true,
          reason: reason || 'Блокировка времени',
          client_name,
          client_phone,
          created_by,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Time slot already exists' });
        }
        return res.status(500).json({ error: 'Failed to create schedule' });
      }

      return res.status(201).json({ schedule: data });
    }

    // PUT - обновить блокировку
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;

      if (!id) return res.status(400).json({ error: 'id required' });

      const { data, error } = await supabase
        .from('schedule')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: 'Failed to update schedule' });

      return res.status(200).json({ schedule: data });
    }

    // DELETE - удалить блокировку
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) return res.status(400).json({ error: 'id required' });

      const { error } = await supabase.from('schedule').delete().eq('id', id);

      if (error) return res.status(500).json({ error: 'Failed to delete schedule' });

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
