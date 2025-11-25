-- Fix: Arreglar la estructura de la tabla user_roles
-- El problema es que hay una columna 'id' extra que está causando conflictos

-- 1. Ver la estructura actual de la tabla
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 2. Ver los constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
AND table_name = 'user_roles';

-- 3. Ver el check constraint específico
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'user_roles'
AND con.contype = 'c'; -- 'c' = check constraint

-- 4. Eliminar el constraint problemático si existe
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- 5. Crear el constraint correcto
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'editor', 'subscriber'));

-- 6. Verificar que ahora funciona
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
AND constraint_name = 'user_roles_role_check';


