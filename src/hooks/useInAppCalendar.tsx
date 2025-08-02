
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

// Type guard to ensure recurrence_type is valid
const isValidRecurrenceType = (type: string): type is 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' => {
  return ['none', 'daily', 'weekly', 'monthly', 'yearly'].includes(type);
};

// Function to transform raw data to CalendarEvent
const transformToCalendarEvent = (rawEvent: any): CalendarEvent => {
  return {
    id: rawEvent.id,
    title: rawEvent.title,
    description: rawEvent.description,
    start_datetime: rawEvent.start_datetime,
    end_datetime: rawEvent.end_datetime,
    location: rawEvent.location,
    is_all_day: rawEvent.is_all_day,
    recurrence_type: isValidRecurrenceType(rawEvent.recurrence_type) ? rawEvent.recurrence_type : 'none',
    recurrence_end_date: rawEvent.recurrence_end_date,
    color: rawEvent.color,
    created_at: rawEvent.created_at,
    updated_at: rawEvent.updated_at,
  };
};

export const useInAppCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Real-time subscription for calendar events
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for calendar events');
    const channel = supabase
      .channel('calendar-events-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time calendar event update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('Calendar event inserted:', payload.new);
            const newEvent = transformToCalendarEvent(payload.new);
            setEvents(prev => [...prev, newEvent]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('Calendar event updated:', payload.new);
            const updatedEvent = transformToCalendarEvent(payload.new);
            setEvents(prev => prev.map(event => 
              event.id === updatedEvent.id ? updatedEvent : event
            ));
          } else if (payload.eventType === 'DELETE') {
            console.log('Calendar event deleted:', payload.old);
            setEvents(prev => prev.filter(event => event.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up calendar events real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchEvents = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      console.log('Fetching calendar events from', startDate, 'to', endDate);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_datetime', startDate)
        .lte('start_datetime', endDate)
        .order('start_datetime');

      if (error) throw error;

      const transformedEvents = (data || []).map(transformToCalendarEvent);
      console.log('Fetched calendar events:', transformedEvents.length);
      setEvents(transformedEvents);
      return transformedEvents;
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

      console.log('Creating calendar event:', eventData);
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

      console.log('Calendar event created successfully:', data);
      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      return transformToCalendarEvent(data);
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
      console.log('Updating calendar event:', eventId, 'with data:', eventData);
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

      console.log('Calendar event updated successfully:', data);
      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });

      return transformToCalendarEvent(data);
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
      console.log('Deleting calendar event:', eventId);
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      console.log('Calendar event deleted successfully:', eventId);
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
