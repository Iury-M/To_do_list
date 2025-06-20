import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../utils/api';

// NOVO: Componente reutilizável para a lista de tarefas
// Isso evita duplicar o código da lista para usuários e para grupos
const TaskList = ({ tasks, onSave, onDelete }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditForm({ title: task.title, description: task.description || '' });
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleSave = (taskId) => {
    onSave(taskId, editForm);
    setEditingTaskId(null);
  };

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id} className="mb-2 border p-3 rounded-lg">
          {editingTaskId === task.id ? (
            // --- Formulário de Edição Inline ---
            <div className="space-y-2">
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows="2"
              />
              <div className="flex gap-2">
                <button onClick={() => handleSave(task.id)} className="px-3 py-1 bg-green-500 text-white text-sm rounded">Salvar</button>
                <button onClick={cancelEdit} className="px-3 py-1 bg-gray-400 text-white text-sm rounded">Cancelar</button>
              </div>
            </div>
          ) : (
            // --- Visualização Normal da Tarefa ---
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{task.title}</span>
                {task.user?.name && <span className="text-sm text-gray-500 ml-2">(Criada por: {task.user.name})</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(task)} className="px-3 py-1 bg-yellow-500 text-white text-xs rounded">Editar</button>
                <button onClick={() => onDelete(task.id)} className="px-3 py-1 bg-red-500 text-white text-xs rounded">Excluir</button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default function Admin() {
  const [viewMode, setViewMode] = useState('users');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupTasks, setGroupTasks] = useState([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) return;
    api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } }).then(res => setUsers(res.data || []));
    api.get('/admin/groups', { headers: { Authorization: `Bearer ${token}` } }).then(res => setGroups(res.data || []));
  }, [token]);

  useEffect(() => {
    if (selectedUser) {
      api.get(`/admin/users/${selectedUser.id}/tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setUserTasks(res.data));
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedGroup) {
      api.get(`/admin/groups/${selectedGroup.id}/tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setGroupTasks(res.data));
    }
  }, [selectedGroup]);

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Confirma exclusão da tarefa?')) return;
    await api.delete(`/admin/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
    refreshData();
  };

  const handleSaveTask = async (taskId, formData) => {
    await api.put(`/admin/tasks/${taskId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
    refreshData();
  };
  
  // Função para atualizar os dados da aba ativa
  const refreshData = () => {
    if (viewMode === 'users' && selectedUser) {
      api.get(`/admin/users/${selectedUser.id}/tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setUserTasks(res.data));
    }
    if (viewMode === 'groups' && selectedGroup) {
      api.get(`/admin/groups/${selectedGroup.id}/tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setGroupTasks(res.data));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Painel do Administrador</h1>
        <Link href="/tasks" className="text-blue-600 hover:underline">&larr; Voltar para Tarefas</Link>
      </div>

      <div className="flex border-b mb-6">
        <button onClick={() => setViewMode('users')} className={`px-4 py-2 -mb-px ${viewMode === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Gerenciar por Usuário</button>
        <button onClick={() => setViewMode('groups')} className={`px-4 py-2 -mb-px ${viewMode === 'groups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Gerenciar por Grupo</button>
      </div>

      {viewMode === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
            <h2 className="font-semibold mb-2 text-lg">Usuários</h2>
            <ul>
              {users.map(user => (
                <li key={user.id} onClick={() => setSelectedUser(user)} className={`p-3 cursor-pointer rounded ${selectedUser?.id === user.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                  {user.name} ({user.email})
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <h2 className="font-semibold mb-2 text-lg">Tarefas Pessoais de {selectedUser?.name || '...'}</h2>
            {selectedUser && userTasks.length === 0 && <p className="text-gray-500">Este usuário não tem tarefas pessoais.</p>}
            {/* Usando o novo componente reutilizável */}
            <TaskList tasks={userTasks} onSave={handleSaveTask} onDelete={handleDeleteTask} />
          </div>
        </div>
      )}

      {viewMode === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
            <h2 className="font-semibold mb-2 text-lg">Grupos</h2>
            <ul>
              {groups.map(group => (
                <li key={group.id} onClick={() => setSelectedGroup(group)} className={`p-3 cursor-pointer rounded ${selectedGroup?.id === group.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                  {group.name} ({group._count.tasks} tarefas)
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <h2 className="font-semibold mb-2 text-lg">Tarefas do Grupo: {selectedGroup?.name || '...'}</h2>
            {selectedGroup && groupTasks.length === 0 && <p className="text-gray-500">Este grupo não tem tarefas.</p>}
            {/* Usando o mesmo componente reutilizável */}
            <TaskList tasks={groupTasks} onSave={handleSaveTask} onDelete={handleDeleteTask} />
          </div>
        </div>
      )}
    </div>
  );
}