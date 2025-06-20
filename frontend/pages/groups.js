// Em frontend/pages/groups.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../utils/api';

export default function Groups() {
  const router = useRouter();
  const [myGroups, setMyGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  
  // Estados para o formulário de criação
  const [groupName, setGroupName] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Função para buscar os dados
  const fetchData = async () => {
    if (!token) {
        router.push('/');
        return;
    }
    try {
      const groupsRes = await api.get('/api/groups', { headers: { Authorization: `Bearer ${token}` } });
      const invitesRes = await api.get('/api/groups/invitations', { headers: { Authorization: `Bearer ${token}` } });
      setMyGroups(groupsRes.data);
      setInvitations(invitesRes.data);
    } catch (err) {
      console.error("Erro ao buscar dados de grupos:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Função para criar um novo grupo
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/groups', { name: groupName, invitedUserEmail: invitedEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupName('');
      setInvitedEmail('');
      fetchData(); // Atualiza a lista de grupos
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar grupo.');
    }
  };
  
  // Função para aceitar um convite
  const handleAcceptInvite = async (membershipId) => {
    try {
        await api.post(`/api/groups/invitations/${membershipId}/accept`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchData(); // Atualiza as listas
    } catch (err) {
        alert('Erro ao aceitar convite.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Meus Grupos</h1>
        <button onClick={() => router.push('/tasks')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Minhas Tarefas
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seção da Esquerda: Criar e Listar Grupos */}
        <section>
          {/* Formulário de Criação */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Criar Novo Grupo</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                type="text"
                placeholder="Nome do Grupo"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email do usuário a convidar"
                value={invitedEmail}
                onChange={(e) => setInvitedEmail(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" className="w-full bg-blue-700 text-white p-2 rounded hover:bg-blue-900">
                Criar e Convidar
              </button>
            </form>
          </div>

          {/* Lista de Grupos */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Grupos que você participa</h2>
            <ul className="space-y-3">
              {myGroups.map(group => (
                <li key={group.id} className="p-4 border rounded-md hover:bg-gray-50">
                  <Link href={`/group/${group.id}`} className="font-semibold text-blue-700 text-lg">
                      {group.name}
                  </Link>
                </li>
              ))}
              {myGroups.length === 0 && <p className="text-gray-500">Você ainda não participa de nenhum grupo.</p>}
            </ul>
          </div>
        </section>

        {/* Seção da Direita: Convites Pendentes */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Convites Pendentes</h2>
          <ul className="space-y-3">
            {invitations.map(invite => (
              <li key={invite.id} className="p-4 border rounded-md flex justify-between items-center">
                <div>
                  <p className="font-semibold">{invite.group.name}</p>
                  <p className="text-sm text-gray-500">Convidado por: {invite.group.members.find(m => m.role === 'ADMIN')?.user.name}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleAcceptInvite(invite.id)} className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">Aceitar</button>
                  {/* Adicionar lógica de recusar se desejar */}
                </div>
              </li>
            ))}
            {invitations.length === 0 && <p className="text-gray-500">Você não tem convites pendentes.</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}