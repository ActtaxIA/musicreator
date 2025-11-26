-- Asignar rol de ADMIN al usuario narciso.pardo@outlook.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'narciso.pardo@outlook.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verificar el cambio
SELECT u.email, r.role 
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
WHERE u.email = 'narciso.pardo@outlook.com';







