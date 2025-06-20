// CÓDIGO FINAL E COMPLETO PARA: frontend/pages/group/[id].js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import api from "../../utils/api";

// 1. O nome do componente foi corrigido para GroupPage
export default function GroupPage() {
  const router = useRouter();
  // 2. A variável `groupId` é definida aqui, no topo do componente
  const { id: groupId } = router.query;

  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 3. A função de busca de dados depende do `groupId`
  const fetchGroupData = async () => {
    if (!groupId || !token) return;
    try {
      const groupRes = await api.get(`/api/groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } });
      setGroup(groupRes.data);
      const tasksRes = await api.get(`/api/groups/${groupId}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(tasksRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados do grupo:", err);
      router.push('/groups');
    }
  };

  // 4. O useEffect é chamado quando o `groupId` é definido
  useEffect(() => {
    if (groupId) { // Adicionada verificação para rodar apenas quando groupId estiver disponível
      fetchGroupData();
    }
  }, [groupId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupId) return;
    try {
      const response = await api.post(`/api/groups/${groupId}/tasks`, { title, description }, { headers: { Authorization: `Bearer ${token}` } });
      if (file) {
        await handleUpload(response.data.id, file);
      }
      setTitle("");
      setDescription("");
      setFile(null);
      setShowNewTaskForm(false);
      fetchGroupData();
    } catch (err) {
      alert("Erro ao criar tarefa no grupo.");
    }
  };

  const handleEdit = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}`, { title: editTitle, description: editDescription, removeFile }, { headers: { Authorization: `Bearer ${token}` } });
      if (editFile) {
        await handleUpload(taskId, editFile);
      }
      setEditingTask(null);
      fetchGroupData();
    } catch (err) {
      alert("Erro ao editar tarefa.");
    }
  };

  const handleUpload = async (taskId, fileToUpload) => {
    if (!fileToUpload) return;
    const formData = new FormData();
    formData.append("file", fileToUpload);
    try {
      await api.post(`/tasks/${taskId}/upload`, formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
    } catch (err) {
      console.error("Erro no upload", err);
      throw err;
    }
  };

  const handleToggleDone = async (task, isFromModal = false) => {
    await api.put(`/tasks/${task.id}`, { done: !task.done }, { headers: { Authorization: `Bearer ${token}` } });
    if (isFromModal && viewingTask) {
      setViewingTask({ ...viewingTask, done: !viewingTask.done });
    }
    fetchGroupData();
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    await api.delete(`/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
    setViewingTask(null);
    fetchGroupData();
  };
  
  const filteredTasks = tasks.filter(task => {
    if (filter === "pending") return !task.done;
    if (filter === "completed") return task.done;
    return true;
  });

  const formatDate = (dateString) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
  
  const renderAttachment = (task) => {
    if (!task.fileUrl) return null;
    const fullUrl = `http://localhost:4000${task.fileUrl}`;
    if (task.mimeType?.startsWith('image/')) return <img src={fullUrl} alt={task.originalFilename || 'Anexo'} className="max-h-[50vh] rounded-lg object-contain mx-auto" />;
    if (task.mimeType?.startsWith('audio/')) return <audio src={fullUrl} controls className="w-full" />;
    return ( <div className="bg-gray-100 p-4 rounded-lg flex items-center space-x-3 mt-4"><svg className="h-8 w-8 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><a href={fullUrl} download={task.originalFilename} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">Baixar: {task.originalFilename || 'Arquivo Anexo'}</a></div> );
  };

  if (!group) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Grupo: {group.name}</h1>
            <Link href="/groups" className="text-sm text-blue-600 hover:underline">&larr; Voltar para todos os grupos</Link>
          </div>
          <button onClick={() => { localStorage.removeItem("token"); router.push("/"); }} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Sair</button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center space-y-4 xs:space-y-0 mb-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-md text-sm ${filter === "all" ? "bg-blue-700 text-white" : "bg-white text-gray-800 border"}`}>Todas</button>
            <button onClick={() => setFilter("pending")} className={`px-4 py-2 rounded-md text-sm ${filter === "pending" ? "bg-blue-700 text-white" : "bg-white text-gray-800 border"}`}>Pendentes</button>
            <button onClick={() => setFilter("completed")} className={`px-4 py-2 rounded-md text-sm ${filter === "completed" ? "bg-blue-700 text-white" : "bg-white text-gray-800 border"}`}>Concluídas</button>
          </div>
          <button onClick={() => setShowNewTaskForm(true)} className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Nova Tarefa
          </button>
        </div>

        {showNewTaskForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-gray-900">Nova Tarefa para o Grupo</h2><button onClick={() => setShowNewTaskForm(false)} className="text-gray-400 hover:text-gray-500"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><input type="text" placeholder="Título da tarefa" className="w-full px-4 py-2 border rounded-md" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
              <div><textarea placeholder="Descrição" className="w-full px-4 py-2 border rounded-md" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" /></div>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:flex-1">
                  <input type="file" className="hidden" id="file-upload" onChange={(e) => setFile(e.target.files[0])} /><label htmlFor="file-upload" className="inline-flex items-center px-4 py-2 border rounded-md cursor-pointer"><svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>Anexar Arquivo</label>{file && (<span className="ml-2 text-sm text-gray-500">{file.name}</span>)}
                </div><button type="submit" className="w-full sm:w-auto px-6 py-2 bg-blue-700 text-white rounded-md">Adicionar Tarefa</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm p-5 cursor-pointer hover:shadow-md flex flex-col justify-between" onClick={() => setViewingTask(task)}>
              <div>
                <div className="flex items-start justify-between"><h3 className={`text-lg font-semibold break-words ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</h3><input type="checkbox" checked={task.done} onChange={(e) => { e.stopPropagation(); handleToggleDone(task); }} className="h-5 w-5 text-blue-600 rounded flex-shrink-0 ml-4"/></div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{task.description || ''}</p>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Criada por: {task.user.name}</p>
                {task.fileUrl && <div className="text-gray-400"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></div>}
              </div>
            </div>
          ))}
        </div>

        {viewingTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-gray-900">Detalhes da Tarefa</h2><button onClick={() => setViewingTask(null)} className="text-gray-400 hover:text-gray-500"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3"><input type="checkbox" checked={viewingTask.done} onChange={() => handleToggleDone(viewingTask, true)} className="h-5 w-5 text-blue-600 rounded"/><h3 className={`text-xl font-medium ${viewingTask.done ? "line-through text-gray-500" : "text-gray-900"}`}>{viewingTask.title}</h3></div>
              <p className="text-sm text-gray-500">Criada por: {viewingTask.user?.name}</p>
              {viewingTask.description && <div className="bg-gray-50 p-4 rounded-md"><p className="text-gray-700 whitespace-pre-wrap">{viewingTask.description}</p></div>}
              {renderAttachment(viewingTask)}
              <div className="text-sm text-gray-500"><p>Criado em: {formatDate(viewingTask.createdAt)}</p><p>Última atualização: {formatDate(viewingTask.updatedAt)}</p></div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                <button onClick={() => { setViewingTask(null); setEditingTask(viewingTask); setEditTitle(viewingTask.title); setEditDescription(viewingTask.description || ""); setEditFile(null); setRemoveFile(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-md">Editar</button>
                <button onClick={() => handleDelete(viewingTask.id)} className="px-4 py-2 bg-red-600 text-white rounded-md">Excluir</button>
              </div>
            </div>
          </div></div></div>
        )}
        
        {editingTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg shadow-xl w-full max-w-2xl"><div className="p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold">Editar Tarefa</h2><button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-gray-500"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(editingTask.id); }} className="space-y-4">
              <div><input type="text" className="w-full px-4 py-2 border rounded-md" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required /></div>
              <div><textarea className="w-full px-4 py-2 border rounded-md" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows="3"/></div>
              <div className="flex items-center justify-between">
                <div>
                  <input type="file" className="hidden" id={`edit-file-${editingTask.id}`} onChange={(e) => setEditFile(e.target.files[0])} /><label htmlFor={`edit-file-${editingTask.id}`} className="inline-flex items-center px-4 py-2 border rounded-md cursor-pointer"><svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>Alterar Arquivo</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id={`remove-file-${editingTask.id}`} checked={removeFile} onChange={() => setRemoveFile(!removeFile)} className="h-4 w-4 rounded" /><label htmlFor={`remove-file-${editingTask.id}`} className="ml-2 text-sm">Remover arquivo</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 border rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
              </div>
            </form>
          </div></div></div>
        )}
      </main>
    </div>
  );
}