import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin API para crear usuarios
// Solo accesible por el admin principal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role = 'user' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar contraseña (mínimo 8 caracteres)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Crear cliente Supabase con service role (admin)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Necesitas esta key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 500 }
      );
    }

    // Crear perfil de usuario
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: email,
        role: role,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Intentar eliminar el usuario de auth si falla el perfil
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { success: false, error: 'Error al crear perfil de usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
      },
    });
  } catch (error: any) {
    console.error('Error in create-user API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
