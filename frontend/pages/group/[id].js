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
      const res = await api.get(`/tasks?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data.tasks);
      setTotalPages(res.data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      router.push("/login");
    }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      
      try {
        const token = localStorage.getItem("token");
        const response = await api.post("/tasks", { 
          title, 
          description 
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const taskId = response.data.id;

        if (file) {
          await handleUpload(taskId, file);
        }

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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Minhas Tarefas</h1>
              <span className="hidden sm:block text-gray-500">Olá, {userName}</span>
            </div>
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
                  ? "bg-
