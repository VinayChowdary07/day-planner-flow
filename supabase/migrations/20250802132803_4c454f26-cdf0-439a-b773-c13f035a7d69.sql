
-- Add subtask support to the tasks table
ALTER TABLE public.tasks ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Create an index for better performance when querying subtasks
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- Add a function to calculate task progress based on subtasks
CREATE OR REPLACE FUNCTION calculate_task_progress(task_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subtask_count integer;
    completed_subtasks integer;
    progress_percentage integer;
    result jsonb;
BEGIN
    -- Count total subtasks
    SELECT COUNT(*) INTO subtask_count
    FROM tasks 
    WHERE parent_task_id = task_id;
    
    -- If no subtasks, return null progress
    IF subtask_count = 0 THEN
        RETURN jsonb_build_object(
            'has_subtasks', false,
            'total_subtasks', 0,
            'completed_subtasks', 0,
            'progress_percentage', null
        );
    END IF;
    
    -- Count completed subtasks
    SELECT COUNT(*) INTO completed_subtasks
    FROM tasks 
    WHERE parent_task_id = task_id AND status = 'complete';
    
    -- Calculate progress percentage
    progress_percentage := CASE 
        WHEN subtask_count = 0 THEN 0
        ELSE ROUND((completed_subtasks::float / subtask_count::float) * 100)
    END;
    
    RETURN jsonb_build_object(
        'has_subtasks', true,
        'total_subtasks', subtask_count,
        'completed_subtasks', completed_subtasks,
        'progress_percentage', progress_percentage
    );
END;
$$;
