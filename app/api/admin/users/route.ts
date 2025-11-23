import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente Admin de Supabase (Service Role - Bypassa RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Cliente Anónimo para validar tokens
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Middleware para verificar token y rol
async function checkAdmin(request: Request) {
  try {
    // 1. Obtener token del header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('API: No Authorization header');
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 2. Validar usuario con Supabase Auth
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    
    if (error || !user) {
      console.log('API: Invalid token', error);
      return null;
    }

    // 3. SUPER ADMIN BYPASS (Por email)
    if (user.email === 'narciso.pardo@outlook.com') {
      console.log('API: Superadmin bypass granted for:', user.email);
      return user;
    }

    // 4. Verificar rol en BD (Usando Admin client para evitar bloqueos RLS)
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      console.log('API: User is not admin. Role:', roleData?.role);
      return null;
    }

    return user;
  } catch (err) {
    console.error('API: Auth check failed', err);
    return null;
  }
}

// GET: Listar usuarios
export async function GET(request: Request) {
  const adminUser = await checkAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Obtener usuarios (Service Role)
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 2. Obtener roles (Service Role)
    const { data: roles, error: rolesError } = await supabaseAdmin.from('user_roles').select('*');
    if (rolesError) throw rolesError;

    // 3. Combinar
    const combinedUsers = users.map(user => {
      const userRole = roles.find(r => r.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        role: userRole?.role || 'subscriber'
      };
    });

    return NextResponse.json(combinedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Crear usuario nuevo
export async function POST(request: Request) {
  const adminUser = await checkAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['admin', 'editor', 'subscriber'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // 1. Crear usuario en Auth
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirmar automáticamente
    });

    if (createError) throw createError;
    if (!user) throw new Error('Failed to create user');

    // 2. Asignar rol inmediatamente
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: role
      });

    if (roleError) {
      // Si falla el rol, intentamos borrar el usuario para no dejarlo "huerfano" sin rol (opcional)
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw roleError;
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        role: role
      }
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Actualizar rol
export async function PUT(request: Request) {
  const adminUser = await checkAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, role } = await request.json();

    if (!['admin', 'editor', 'subscriber'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ 
        user_id: userId, 
        role: role,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Eliminar usuario
export async function DELETE(request: Request) {
  const adminUser = await checkAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await request.json();

    if (userId === adminUser.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
