
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutlookEvent {
  id: string;
  subject: string;
  body: {
    content: string;
    contentType: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
}

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { method } = req;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (method === 'GET' && action === 'events') {
      // Get calendar events
      const startDate = url.searchParams.get('start') || new Date().toISOString();
      const endDate = url.searchParams.get('end') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Get user's calendar settings
      const { data: calendarSettings } = await supabase
        .from('user_calendar_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const events: CalendarEvent[] = [];

      // Fetch Outlook events if access token exists
      if (calendarSettings?.outlook_access_token) {
        try {
          const outlookResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${startDate}' and start/dateTime le '${endDate}'&$select=id,subject,body,start,end,location`,
            {
              headers: {
                'Authorization': `Bearer ${calendarSettings.outlook_access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (outlookResponse.ok) {
            const outlookData = await outlookResponse.json();
            const outlookEvents: CalendarEvent[] = outlookData.value.map((event: OutlookEvent) => ({
              id: event.id,
              title: event.subject,
              description: event.body?.content,
              start: event.start.dateTime,
              end: event.end.dateTime,
              location: event.location?.displayName,
              source: 'outlook' as const,
              isAllDay: false,
            }));
            events.push(...outlookEvents);
          }
        } catch (error) {
          console.error('Error fetching Outlook events:', error);
        }
      }

      // Fetch tasks with time slots
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('task_date', startDate.split('T')[0])
        .lte('task_date', endDate.split('T')[0])
        .not('start_time', 'is', null)
        .not('end_time', 'is', null);

      if (tasks) {
        const taskEvents: CalendarEvent[] = tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          start: `${task.task_date}T${task.start_time}:00`,
          end: `${task.task_date}T${task.end_time}:00`,
          location: task.location,
          source: 'task' as const,
          isAllDay: false,
        }));
        events.push(...taskEvents);
      }

      return new Response(JSON.stringify({ events }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && action === 'auth') {
      const { code } = await req.json();
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('OUTLOOK_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('OUTLOOK_CLIENT_SECRET') ?? '',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/outlook-calendar?action=callback`,
          scope: 'https://graph.microsoft.com/calendars.readwrite offline_access',
        }),
      });

      if (!tokenResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to get access token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenData = await tokenResponse.json();

      // Save tokens to database
      const { error } = await supabase
        .from('user_calendar_settings')
        .upsert({
          user_id: user.id,
          outlook_access_token: tokenData.access_token,
          outlook_refresh_token: tokenData.refresh_token,
          outlook_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to save tokens' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && action === 'create-event') {
      const { title, description, start, end, location } = await req.json();
      
      // Get user's calendar settings
      const { data: calendarSettings } = await supabase
        .from('user_calendar_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!calendarSettings?.outlook_access_token) {
        return new Response(JSON.stringify({ error: 'No Outlook access token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const event = {
        subject: title,
        body: {
          contentType: 'text',
          content: description || '',
        },
        start: {
          dateTime: start,
          timeZone: 'UTC',
        },
        end: {
          dateTime: end,
          timeZone: 'UTC',
        },
        location: location ? {
          displayName: location,
        } : undefined,
      };

      const createResponse = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${calendarSettings.outlook_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!createResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to create event' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const createdEvent = await createResponse.json();
      
      return new Response(JSON.stringify({ event: createdEvent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in outlook-calendar function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
