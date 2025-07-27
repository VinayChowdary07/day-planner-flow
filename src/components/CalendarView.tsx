import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Clock, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  source: 'outlook' | 'task';
  isAllDay?: boolean;
}

interface EventFormData {
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
}

export const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: '',
    description: '',
    start: '',
    end: '',
    location: ''
  });
  const [isConnectedToOutlook, setIsConnectedToOutlook] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    checkOutlookConnection();
  }, [currentMonth]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      
      const { data, error } = await supabase.functions.invoke('outlook-calendar', {
        body: {
          action: 'events',
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });

      if (error) throw error;
      
      setEvents(data?.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch calendar events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkOutlookConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use raw query to bypass type checking issues
      const { data, error } = await supabase
        .from('user_calendar_settings' as any)
        .select('outlook_access_token')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Outlook connection:', error);
        return;
      }

      if (data && typeof data === 'object' && !('error' in data)) {
        setIsConnectedToOutlook(!!(data as any).outlook_access_token);
      }
    } catch (error) {
      console.error('Error checking Outlook connection:', error);
    }
  };

  const connectToOutlook = () => {
    const clientId = 'your-outlook-client-id'; // This should be configured in your environment
    const redirectUri = `${window.location.origin}/auth/outlook/callback`;
    const scope = 'https://graph.microsoft.com/calendars.readwrite offline_access';
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };

  const createEvent = async () => {
    if (!eventForm.title || !eventForm.start || !eventForm.end) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('outlook-calendar', {
        body: {
          action: 'create-event',
          ...eventForm,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      setShowEventDialog(false);
      setEventForm({
        title: '',
        description: '',
        start: '',
        end: '',
        location: ''
      });
      
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start);
      return isSameDay(eventDate, date);
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const dayEvents = getEventsForDate(day);
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
      const isSelected = isSameDay(day, selectedDate);
      const isToday = isSameDay(day, new Date());

      days.push(
        <div
          key={day.toString()}
          className={`
            min-h-[120px] border border-border p-2 cursor-pointer transition-colors
            ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
            ${isSelected ? 'bg-primary/10' : ''}
            ${isToday ? 'bg-accent' : ''}
          `}
          onClick={() => setSelectedDate(day)}
        >
          <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
            {format(day, 'd')}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`
                  text-xs p-1 rounded truncate
                  ${event.source === 'outlook' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'}
                `}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center font-medium bg-muted">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayEvents = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toString()} className="border border-border rounded-lg p-3">
              <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`
                      text-xs p-2 rounded
                      ${event.source === 'outlook' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'}
                    `}
                  >
                    <div className="font-medium">{event.title}</div>
                    {event.start && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(event.start), 'HH:mm')}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-primary text-primary-foreground' : ''}
            >
              Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-primary text-primary-foreground' : ''}
            >
              Week
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isConnectedToOutlook && (
            <Button onClick={connectToOutlook} variant="outline" size="sm">
              Connect Outlook
            </Button>
          )}
          
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start">Start *</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={eventForm.start}
                      onChange={(e) => setEventForm(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">End *</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={eventForm.end}
                      onChange={(e) => setEventForm(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Event location"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createEvent}>
                    Create Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigateMonth('prev')}
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <Button
          variant="outline"
          onClick={() => navigateMonth('next')}
          disabled={loading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          ) : (
            <div className="p-4">
              {view === 'month' ? renderMonthView() : renderWeekView()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events for Selected Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Events for {format(selectedDate, 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-muted-foreground">No events for this date</p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <Badge variant={event.source === 'outlook' ? 'default' : 'secondary'}>
                    {event.source === 'outlook' ? 'Outlook' : 'Task'}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {event.start && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(event.start), 'HH:mm')} - {format(parseISO(event.end), 'HH:mm')}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
