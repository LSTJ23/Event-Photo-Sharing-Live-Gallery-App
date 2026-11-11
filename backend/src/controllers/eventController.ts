import { Request, Response } from 'express';
import { supabase } from '../supabase.js';

export const getEventBySlug = async (req: Request, res: Response) => {
  const { qrSlug } = req.params;

  if (!qrSlug) {
    return res.status(400).json({ error: 'QR slug is required.' });
  }

  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('id, title, description, deadline, created_at')
      .eq('qr_code_slug', qrSlug)
      .single();

    if (error || !event) {
      return res.status(404).json({
        valid: false,
        error: 'Event is invalid or does not exist.'
      });
    }

    if (event.deadline && new Date() > new Date(event.deadline)) {
      return res.status(400).json({
        valid: false,
        error: 'This event has expired and is no longer accepting entries.'
      });
    }

    return res.status(200).json({
      valid: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};