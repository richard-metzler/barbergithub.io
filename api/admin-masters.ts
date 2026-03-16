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

    // GET - получить всех мастеров
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('masters').select('*').order('rating', { ascending: false });
      if (error) return res.status(500).json({ error: 'Failed to fetch masters' });
      return res.status(200).json({ masters: data || [] });
    }

    // POST - создать мастера
    if (req.method === 'POST') {
      const master = req.body;
      
      const { data, error } = await supabase
        .from('masters')
        .insert(master)
        .select()
        .single();

      if (error) return res.status(500).json({ error: 'Failed to create master' });

      // Добавляем роль master в user_roles если есть telegram_chat_id
      if (master.telegram_chat_id) {
        await supabase
          .from('user_roles')
          .upsert({ telegram_user_id: master.telegram_chat_id, role: 'master' });
      }

      return res.status(201).json({ master: data });
    }

    // PUT - обновить мастера
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;

      if (!id) return res.status(400).json({ error: 'id required' });

      const { data, error } = await supabase
        .from('masters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: 'Failed to update master' });

      // Обновляем telegram_chat_id в user_roles если изменился
      if (updates.telegram_chat_id !== undefined) {
        await supabase
          .from('user_roles')
          .upsert({ telegram_user_id: updates.telegram_chat_id, role: 'master' });
      }

      return res.status(200).json({ master: data });
    }

    // DELETE - удалить мастера
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) return res.status(400).json({ error: 'id required' });

      // Получаем мастера для удаления telegram_chat_id из user_roles
      const { data: master } = await supabase
        .from('masters')
        .select('telegram_chat_id')
        .eq('id', id)
        .single();

      const { error } = await supabase.from('masters').delete().eq('id', id);

      if (error) return res.status(500).json({ error: 'Failed to delete master' });

      // Удаляем из user_roles
      if (master?.telegram_chat_id) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('telegram_user_id', master.telegram_chat_id);
      }

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
