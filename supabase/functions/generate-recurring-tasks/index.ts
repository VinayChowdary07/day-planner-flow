
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const securityHeaders = {
  ...corsHeaders,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: securityHeaders });
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
      .in('recurrence', ['daily', 'weekly', 'monthly'])
      .is('parent_task_id', null) // Only parent tasks, not instances
      .not('next_occurrence', 'is', null)
      .lte('next_occurrence', now.toISOString());

    if (fetchError) {
      console.error('Error fetching recurring tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringTasks?.length || 0} tasks to process`);

    let processedCount = 0;

    for (const task of recurringTasks || []) {
      try {
        console.log(`Processing recurring task: ${task.title} (ID: ${task.id})`);

        // Check if we should still generate (within end date if specified)
        if (task.recurrence_end_date) {
          const endDate = new Date(task.recurrence_end_date);
          const nextOccurrence = new Date(task.next_occurrence);
          
          if (nextOccurrence > endDate) {
            console.log(`Task ${task.title} has passed end date, stopping recurrence`);
            // End recurring task generation
            await supabase
              .from('tasks')
              .update({ next_occurrence: null })
              .eq('id', task.id);
            continue;
          }
        }

        // Calculate the date for the new instance
        const instanceDate = new Date(task.next_occurrence);
        
        // Create new task instance
        const newTaskData = {
          user_id: task.user_id,
          title: task.title,
          description: task.description,
          task_date: instanceDate.toISOString().split('T')[0],
          start_time: task.start_time,
          end_time: task.end_time,
          location: task.location,
          tags: task.tags || [],
          status: 'incomplete',
          priority: task.priority,
          category: task.category,
          parent_task_id: task.id,
          is_template: false,
          order_position: 0,
          project_id: task.project_id,
          goal_id: task.goal_id,
          recurrence: 'none' // Instance tasks don't have recurrence
        };

        console.log('Creating new task instance:', newTaskData);

        // Insert new instance
        const { data: newTask, error: insertError } = await supabase
          .from('tasks')
          .insert(newTaskData)
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating instance for task ${task.id}:`, insertError);
          continue;
        }

        console.log(`Created task instance: ${newTask.id} for date: ${instanceDate.toDateString()}`);

        // Calculate next occurrence based on recurrence type
        const futureNextOccurrence = calculateNextOccurrence(
          instanceDate,
          task.recurrence
        );

        // Update parent task's next occurrence
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ next_occurrence: futureNextOccurrence.toISOString() })
          .eq('id', task.id);

        if (updateError) {
          console.error(`Error updating next occurrence for task ${task.id}:`, updateError);
        } else {
          console.log(`Updated next occurrence for ${task.title} to ${futureNextOccurrence.toISOString()}`);
        }

        processedCount++;

      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
      }
    }

    console.log(`Successfully processed ${processedCount} recurring tasks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        total_found: recurringTasks?.length || 0,
        timestamp: now.toISOString()
      }),
      { headers: securityHeaders }
    );

  } catch (error) {
    console.error('Error in generate-recurring-tasks function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: securityHeaders 
      }
    );
  }
});

/**
 * Calculate the next occurrence based on recurrence type
 * @param currentDate - Current occurrence date
 * @param recurrence - Type of recurrence ('daily', 'weekly', 'monthly')
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
    default:
      // Default to daily if recurrence type is unknown
      next.setDate(next.getDate() + 1);
  }
  
  return next;
}
