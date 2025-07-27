
-- Create user_calendar_settings table
CREATE TABLE public.user_calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outlook_access_token TEXT,
  outlook_refresh_token TEXT,
  outlook_token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  default_calendar_view TEXT NOT NULL DEFAULT 'month' CHECK (default_calendar_view IN ('month', 'week')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_calendar_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own calendar settings" 
  ON public.user_calendar_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar settings" 
  ON public.user_calendar_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar settings" 
  ON public.user_calendar_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar settings" 
  ON public.user_calendar_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_calendar_settings_updated_at
  BEFORE UPDATE ON public.user_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
