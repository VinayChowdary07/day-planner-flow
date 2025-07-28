
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_all_day: boolean;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_end_date?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_all_day?: boolean;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_end_date?: string;
  color?: string;
}

export const useInAppCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEvents = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_datetime', startDate)
        .lte('start_datetime', endDate)
        .order('start_datetime');

      if (error) throw error;

      setEvents(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch calendar events',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: EventFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          user_id: user.id,
          title: eventData.title,
          description: eventData.description || null,
          start_datetime: eventData.start_datetime,
          end_datetime: eventData.end_datetime,
          location: eventData.location || null,
          is_all_day: eventData.is_all_day || false,
          recurrence_type: eventData.recurrence_type || 'none',
          recurrence_end_date: eventData.recurrence_end_date || null,
          color: eventData.color || '#3B82F6',
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<EventFormData>) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};
