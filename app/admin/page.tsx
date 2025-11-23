'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Trash2, Shield, User, Mail, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  role: string;
  last_sign_in_at: string | null;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Crear usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    // Verificar que es admin
    if (user.email !== 'narciso.pardo@outlook.com') {
      alert('Acceso denegado. Solo administradores.');
      window.location.href = '/';
      return;
    }

    setCurrentUser(user);
  };

  const loadUsers = async () => {
    try {
      // Nota: Esto requiere una función de Supabase Edge Function o API
      // Por ahora mostraremos usuarios de tu tabla personalizada
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Llamar a tu API para crear usuario
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      alert(`✅ Usuario creado: ${newEmail}`);
      setShowCreateModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Eliminar usuario ${userEmail}?`)) return;

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Error al eliminar');

      alert('✅ Usuario eliminado');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Shield className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Usuario
            </button>
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <User className="w-4 h-4" />
            <span>Sesión: {currentUser?.email}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-white font-semibold">Total Usuarios</h3>
            </div>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-semibold">Administradores</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-6 h-6 text-green-400" />
              <h3 className="text-white font-semibold">Usuarios Regulares</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Usuarios del Sistema
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
              Cargando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p>No hay usuarios creados aún.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
              >
                Crear Primer Usuario
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rol</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Creado</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Último acceso</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-white">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES')
                          : 'Nunca'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={user.email === currentUser?.email}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.email === currentUser?.email ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Crear Nuevo Usuario</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 text-white border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 text-white border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Rol</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 text-white border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="user">👤 Usuario Regular</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
