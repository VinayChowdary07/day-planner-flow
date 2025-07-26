import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    console.log(`Generating recurring tasks at ${now.toISOString()}`);

    // Find all recurring tasks that need new instances
    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .neq('recurrence', 'none')
      .is('parent_task_id', null) // Only parent tasks, not instances
      .not('next_occurrence', 'is', null)
      .lte('next_occurrence', now.toISOString());

    if (fetchError) {
      console.error('Error fetching recurring tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringTasks?.length || 0} tasks to process`);

    for (const task of recurringTasks || []) {
      try {
        // Calculate next occurrence based on recurrence type
        const nextOccurrence = calculateNextOccurrence(
          new Date(task.next_occurrence),
          task.recurrence
        );

        // Check if we should still generate (within end date if specified)
        if (task.recurrence_end_date) {
          const endDate = new Date(task.recurrence_end_date);
          if (nextOccurrence > endDate) {
            // End recurring task generation
            await supabase
              .from('tasks')
              .update({ next_occurrence: null })
              .eq('id', task.id);
            continue;
          }
        }

        // Create new task instance
        const newTaskData = {
          user_id: task.user_id,
          title: task.title,
          description: task.description,
          task_date: nextOccurrence.toISOString().split('T')[0],
          start_time: task.start_time,
          end_time: task.end_time,
          location: task.location,
          tags: task.tags,
          status: 'incomplete',
          priority: task.priority,
          category: task.category,
          parent_task_id: task.id,
          is_template: false,
          order_position: 0
        };

        // Insert new instance
        const { error: insertError } = await supabase
          .from('tasks')
          .insert(newTaskData);

        if (insertError) {
          console.error(`Error creating instance for task ${task.id}:`, insertError);
          continue;
        }

        // Update parent task's next occurrence
        const futureNextOccurrence = calculateNextOccurrence(
          nextOccurrence,
          task.recurrence
        );

        await supabase
          .from('tasks')
          .update({ next_occurrence: futureNextOccurrence.toISOString() })
          .eq('id', task.id);

        console.log(`Created instance for task ${task.title} on ${nextOccurrence.toDateString()}`);

      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: recurringTasks?.length || 0,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recurring-tasks function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Calculate the next occurrence based on recurrence type
 * @param currentDate - Current occurrence date
 * @param recurrence - Type of recurrence ('daily', 'weekly', 'monthly', 'custom')
 * @returns Next occurrence date
 */
function calculateNextOccurrence(currentDate: Date, recurrence: string): Date {
  const next = new Date(currentDate);
  
  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'custom':
      // For custom, default to daily (can be extended)
      next.setDate(next.getDate() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  
  return next;
}