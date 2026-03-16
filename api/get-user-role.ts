import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Проверяем суперадмина
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('telegram_user_id', userId)
      .single();

    if (userRole?.role === 'superadmin') {
      return res.status(200).json({ role: 'superadmin', userId });
    }

    // Проверяем мастера
    const { data: master } = await supabase
      .from('masters')
      .select('telegram_chat_id, id, name')
      .eq('telegram_chat_id', userId)
      .single();

    if (master) {
      return res.status(200).json({ 
        role: 'master', 
        userId,
        masterId: master.id,
        masterName: master.name
      });
    }

    // По умолчанию клиент
    return res.status(200).json({ role: 'client', userId });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
