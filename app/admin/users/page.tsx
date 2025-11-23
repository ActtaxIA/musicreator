'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Shield, User, Check, X } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'subscriber';
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('subscriber');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Obtener token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: newUserEmail, 
          password: newUserPassword, 
          role: newUserRole 
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Error al crear usuario');

      alert('Usuario creado correctamente');
      setUsers([...users, result.user]);
      setIsCreateModalOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('subscriber');
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.message || 'Error al crear el usuario');
    }
  };

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Verificar si es admin por BD O por email específico (fallback de seguridad)
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    const isEmailAdmin = session.user.email === 'narciso.pardo@outlook.com';
    const isDbAdmin = roleData?.role === 'admin';

    console.log('Admin Check:', { email: session.user.email, isEmailAdmin, isDbAdmin, roleData, error });

    if (!isDbAdmin && !isEmailAdmin) {
      alert('Acceso denegado. Se requieren permisos de administrador.');
      router.push('/');
      return;
    }

    setCurrentUser({ ...session.user, role: isDbAdmin ? 'admin' : (isEmailAdmin ? 'admin' : 'subscriber') });
    loadUsers();
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      // Obtener token de sesión actual para enviarlo a la API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}` // Enviar token explícitamente
        }
      });

      if (!response.ok) throw new Error('Error al cargar usuarios');
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error al cargar la lista de usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      // Obtener token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) throw new Error('Error al actualizar rol');

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole as any } : u
      ));
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar el rol del usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      // Obtener token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Error al eliminar usuario');

      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => router.push('/')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3 flex-1">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              Gestión de Usuarios
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <User className="w-4 h-4" />
              Crear Usuario
            </button>
          </div>

          {/* Create User Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Crear Nuevo Usuario</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                      placeholder="usuario@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Contraseña</label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Rol Inicial</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="subscriber">Suscriptor</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Crear Usuario
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Usuarios */}
          {isLoading ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              Cargando usuarios...
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg">
              
              {/* VISTA DE MÓVIL (Cards) */}
              <div className="block md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                {users.map((user) => (
                  <div key={user.id} className="p-4 space-y-3">
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900 dark:text-white truncate">{user.email}</div>
                          <div className="text-xs text-zinc-500 truncate">ID: {user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                      
                      {/* Delete Button (Top Right) */}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                        className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-600 dark:hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                         <span className="opacity-50">Registrado:</span>
                         <span>{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>

                      <select
                        value={user.role || 'subscriber'}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className={`bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer w-32 ${
                          user.role === 'admin' ? 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20' :
                          user.role === 'editor' ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20' :
                          'text-zinc-700 dark:text-zinc-300'
                        }`}
                        disabled={user.id === currentUser?.id}
                      >
                        <option value="subscriber">Suscriptor</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* VISTA DE ESCRITORIO (Tabla) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm uppercase">
                      <th className="p-4 font-medium">Usuario</th>
                      <th className="p-4 font-medium">Rol</th>
                      <th className="p-4 font-medium">Fecha Registro</th>
                      <th className="p-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                              <User className="w-5 h-5 text-zinc-500" />
                            </div>
                            <div>
                              <div className="font-medium text-zinc-900 dark:text-white">{user.email}</div>
                              <div className="text-xs text-zinc-500">{user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={user.role || 'subscriber'}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className={`bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer ${
                              user.role === 'admin' ? 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20' :
                              user.role === 'editor' ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20' :
                              'text-zinc-700 dark:text-zinc-300'
                            }`}
                            disabled={user.id === currentUser?.id} // No auto-cambiarse el rol
                          >
                            <option value="subscriber">Suscriptor</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-400 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                            className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-600 dark:hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
