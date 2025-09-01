-- Fix remaining function search path issues for XP calculation functions
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT CASE 
    WHEN xp < 100 THEN 1
    WHEN xp < 250 THEN 2
    WHEN xp < 500 THEN 3
    WHEN xp < 1000 THEN 4
    WHEN xp < 2000 THEN 5
    ELSE 5 + ((xp - 2000) / 500)
  END;
$function$;

CREATE OR REPLACE FUNCTION public.get_xp_for_level(target_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT CASE 
    WHEN target_level <= 1 THEN 0
    WHEN target_level = 2 THEN 100
    WHEN target_level = 3 THEN 250
    WHEN target_level = 4 THEN 500
    WHEN target_level = 5 THEN 1000
    ELSE 2000 + ((target_level - 5) * 500)
  END;
$function$;