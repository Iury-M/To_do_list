import { useState, useEffect } from "react";
import api from "../utils/api";
import { useRouter } from "next/router";

export default function Tasks() {
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
  const [userName, setUserName] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "pending", "completed"
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserName(res.data.name);

        // A verificação correta acontece aqui, com dados seguros do backend
        if (res.data.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        
      } catch (err) {
        router.push("/login");
      }
  };

  const fetchTasks = async (page = 1) => {
    try {
      const token = localStorage.getItem("token");
      // Adiciona o parâmetro `page` à chamada da API
      const res = await api.get(`/tasks?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data.tasks); // A resposta agora é um objeto
      setTotalPages(res.data.totalPages); // Guardamos o total de páginas
      setCurrentPage(page);
    } catch (err) {
      router.push("/login");
    }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      
      // 1. Crie a tarefa apenas com os dados de texto primeiro.
      try {
        const token = localStorage.getItem("token");
        const response = await api.post("/tasks", { 
          title, 
          description 
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            // Não precisa mais de 'multipart/form-data' aqui
          },
        });

        const taskId = response.data.id;

        // 2. Se houver um arquivo, faça o upload para a tarefa recém-criada.
        if (file) {
          await handleUpload(taskId, file);
        }

        // 3. Limpe o formulário e atualize a lista.
        setTitle("");
        setFile(null);
        setDescription("");
        fetchTasks();
        setShowNewTaskForm(false);
      } catch (err) {
        alert("Erro ao criar tarefa.");
      }
    };

  const handleEdit = async (taskId) => {
    const token = localStorage.getItem("token");
    try {
      await api.put(
        `/tasks/${taskId}`,
        {
          title: editTitle,
          description: editDescription,
          removeFile,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (editFile) {
        const formData = new FormData();
        formData.append("file", editFile);

        await api.post(`/tasks/${taskId}/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setEditingTask(null);
      setRemoveFile(false);
      setEditFile(null);
      setEditTitle("");
      setEditDescription("");
      fetchTasks();
    } catch (err) {
      alert("Erro ao editar tarefa.");
    }
  };

  const handleUpload = async (taskId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      await api.post(`/tasks/${taskId}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Arquivo enviado com sucesso!");
      fetchTasks();
    } catch (err) {
      alert("Erro ao enviar arquivo.");
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "pending") return !task.done;
    if (filter === "completed") return task.done;
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderAttachment = (task) => {
    if (!task.fileUrl) return null;
  
    // Verifica se a URL já é um link completo (da S3) ou um caminho local
    const isFullUrl = task.fileUrl.startsWith('http');
    const fullUrl = isFullUrl ? task.fileUrl : `http://localhost:4000${task.fileUrl}`;
  
    if (task.mimeType?.startsWith('image/')) {
      return <img src={fullUrl} alt={task.originalFilename || 'Anexo'} className="max-h-[50vh] rounded-lg object-contain mx-auto" />;
    }
    if (task.mimeType?.startsWith('audio/')) {
      return <audio src={fullUrl} controls className="w-full" />;
    }
    return (
      <div className="bg-gray-100 p-4 rounded-lg flex items-center space-x-3">
        <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <a href={fullUrl} download={task.originalFilename} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Baixar: {task.originalFilename || 'Arquivo Anexo'}
        </a>
      </div>
    );
  };

  useEffect(() => {
    fetchUser();
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        {/* Este div centraliza o conteúdo e o alinha com o `main` */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Lado Esquerdo: Título e Saudação */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Minhas Tarefas</h1>
              <span className="hidden sm:block text-gray-500">Olá, {userName}</span>
            </div>

            {/* Lado Direito: Botões */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/groups")}
                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-900 transition-colors"
              >
                Grupos
              </button>
              {isAdmin && (
                  <button
                  onClick={() => router.push("/admin")}
                  className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-900 transition-colors"
                  >
                  Administrar
                  </button>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  router.push("/");
                }}
                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-900 transition-colors"
              >
                Sair
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros e Botão Nova Tarefa */}
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center space-y-4 xs:space-y-0 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base ${
                filter === "all"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base ${
                filter === "pending"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base ${
                filter === "completed"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Concluídas
            </button>
          </div>
          <button
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            className="w-full xs:w-auto px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nova Tarefa
          </button>
        </div>

        {/* Form de Nova Tarefa */}
        {showNewTaskForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nova Tarefa</h2>
              <button
                onClick={() => setShowNewTaskForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Título da tarefa"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 bg-white text-gray-900" // Adicione bg-white text-gray-900
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Descrição"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 bg-white text-gray-900" // Adicione bg-white text-gray-900
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:flex-1">
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Anexar Arquivo
                  </label>
                  {file && (
                    <span className="ml-2 text-sm text-gray-500 block mt-2 sm:mt-0 sm:inline">{file.name}</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors"
                >
                  Adicionar Tarefa
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grid de Tarefas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 cursor-pointer transition-all hover:shadow-md ${
                task.done ? "opacity-75" : ""
              }`}
              onClick={() => setViewingTask(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => {
                      e.stopPropagation();
                      const token = localStorage.getItem("token");
                      api.put(
                        `/tasks/${task.id}`,
                        { done: !task.done },
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      ).then(() => fetchTasks());
                    }}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-base sm:text-lg font-medium truncate ${task.done ? "line-through text-gray-500" : "text-gray-900"}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`mt-1 text-sm ${task.done ? "text-gray-400" : "text-gray-500"} line-clamp-2`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                {task.fileUrl && (
                  <div className="flex-shrink-0 ml-2 text-gray-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center mt-8 space-x-4">
          <button
            onClick={() => fetchTasks(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button
            onClick={() => fetchTasks(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Próxima
          </button>
        </div>

        {/* Modal de Visualização */}
        {viewingTask && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Detalhes da Tarefa</h2>
                  <button
                    onClick={() => setViewingTask(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={viewingTask.done}
                      onChange={async () => {
                        const token = localStorage.getItem("token");
                        await api.put(
                          `/tasks/${viewingTask.id}`,
                          { done: !viewingTask.done },
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        fetchTasks();
                        setViewingTask({ ...viewingTask, done: !viewingTask.done });
                      }}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <h3 className={`text-lg sm:text-xl font-medium ${viewingTask.done ? "line-through text-gray-500" : "text-gray-900"}`}>
                      {viewingTask.title}
                    </h3>
                  </div>

                  {viewingTask.description && (
                    <div className="bg-gray-50/80 backdrop-blur-sm p-4 rounded-md">
                      <p className="text-gray-700 whitespace-pre-wrap">{viewingTask.description}</p>
                    </div>
                  )}

                  {renderAttachment(viewingTask)}

                  <div className="text-sm text-gray-500">
                    <p>Criado em: {formatDate(viewingTask.createdAt)}</p>
                    <p>Última atualização: {formatDate(viewingTask.updatedAt)}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setViewingTask(null);
                        setEditingTask(viewingTask.id);
                        setEditTitle(viewingTask.title);
                        setEditDescription(viewingTask.description || "");
                        // Adicione estas duas linhas para limpar o estado de arquivos antigos
                        setEditFile(null);
                        setRemoveFile(false);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem("token");
                        await api.delete(`/tasks/${viewingTask.id}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        setViewingTask(null);
                        fetchTasks();
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Editar Tarefa</h2>
                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setEditTitle("");
                      setEditDescription("");
                      setRemoveFile(false);
                      setEditFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEdit(editingTask);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <input
                      type="text"
                      placeholder="Editar título"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 bg-white text-gray-900" // Adicione bg-white text-gray-900
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Editar descrição"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 bg-white text-gray-900" // Adicione bg-white text-gray-900
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="w-full sm:flex-1">
                      <input
                        type="file"
                        className="hidden"
                        id={`edit-file-${editingTask}`}
                        onChange={(e) => setEditFile(e.target.files[0])}
                      />
                      <label
                        htmlFor={`edit-file-${editingTask}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Alterar Arquivo
                      </label>
                    </div>
                    <div className="flex items-center w-full sm:w-auto">
                      <input
                        type="checkbox"
                        id={`remove-file-${editingTask}`}
                        checked={removeFile}
                        onChange={() => setRemoveFile(!removeFile)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`remove-file-${editingTask}`} className="ml-2 text-sm text-gray-600">
                        Remover arquivo
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(null);
                        setEditTitle("");
                        setEditDescription("");
                        setRemoveFile(false);
                        setEditFile(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
