require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('./auth');
const upload = require('./uploads');
const adminRoutes = require("./routes/admin");
const groupRoutes = require("./routes/groups");
const http = require('http'); // 1. Importar o módulo http
const { Server } = require("socket.io"); // 2. Importar o Server do socket.io

const app = express();
const port = process.env.PORT || 4000;
const prisma = new PrismaClient();

// 3. Criar o servidor HTTP e o servidor Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexões de qualquer origem
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use("/admin", adminRoutes);
app.use("/api/groups", groupRoutes);

// --- ROTAS DE AUTENTICAÇÃO E TAREFAS (o seu código existente) ---
// (Todo o seu código de rotas /register, /login, /me, /tasks, etc. continua aqui, sem alterações)
app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role || 'user',
      },
    });

    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(400).json({ error: 'Senha inválida' });

  const token = generateToken(user);
  res.json({ token });
});

app.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }, // só os dados que quer retornar
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/tasks', verifyToken, async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: {
      userId: req.user.id,
      groupId: null 
    },
    orderBy: {
        createdAt: 'desc'
    }
  });
  res.json(tasks);
});

app.post('/tasks', verifyToken, upload.none(), async (req, res) => {
  const { title, description } = req.body;
  const task = await prisma.task.create({
    data: {
      title,
      description,
      userId: req.user.id,
    },
  });
  res.status(201).json(task);
});

app.put('/tasks/:id', verifyToken, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  
    // Primeiro, encontre a tarefa para saber se ela tem um ficheiro para apagar
    const taskExists = await prisma.task.findFirst({
      where: { id, userId: req.user.id },
    });
  
    if (!taskExists) return res.status(404).json({ error: 'Tarefa não encontrada ou não pertence ao utilizador.' });
  
    const { title, description, done, removeFile } = req.body;
  
    let data = { title, description, done };
  
    // Se for para remover o ficheiro
    if (removeFile) {
      data.fileUrl = null;
      data.originalFilename = null; // Limpa também os outros campos
      data.mimeType = null;
  
      // Lógica para apagar o ficheiro da S3 (se existir)
      if (taskExists.fileUrl && taskExists.fileUrl.includes('s3.amazonaws.com')) {
        const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const s3 = new S3Client({ region: process.env.AWS_REGION });
        const bucketName = process.env.AWS_BUCKET_NAME;
        const fileKey = taskExists.fileUrl.split('/').pop(); // Pega o nome do ficheiro da URL
  
        const deleteParams = {
          Bucket: bucketName,
          Key: fileKey,
        };
        await s3.send(new DeleteObjectCommand(deleteParams));
      }
    }
  
    const task = await prisma.task.update({
      where: { id },
      data,
    });
  
    res.json(task);
});


app.delete('/tasks/:id', verifyToken, async (req, res) => {
  await prisma.task.deleteMany({
    where: {
      id: Number(req.params.id),
      userId: req.user.id,
    },
  });
  res.status(204).send();
});

// Rota de upload de ficheiros (agora condicional para S3)
app.post('/tasks/:id/upload', verifyToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
  }
  const { id } = req.params;

  // Decide qual URL usar
  // Para a S3, a localização está em `req.file.location`
  // Para o local, o caminho está em `req.file.filename`
  const fileUrl = req.file.location ? req.file.location : `/uploads/${req.file.filename}`;

  try {
    const taskUpdateResult = await prisma.task.updateMany({
      where: {
        id: parseInt(id),
        userId: req.user.id,
      },
      data: {
        fileUrl: fileUrl,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
      },
    });

    if (taskUpdateResult.count === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou não pertence ao utilizador.' });
    }

    res.json({ message: 'Ficheiro enviado com sucesso!', fileUrl: fileUrl });
  } catch (error) {
    console.error("Erro no upload da tarefa:", error);
    res.status(500).json({ error: 'Ocorreu um erro interno ao processar o ficheiro.' });
  }
});

// 4. Lógica do Socket.IO
io.on('connection', (socket) => {
  console.log('Um utilizador conectou-se via Socket.IO');

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId); // Adiciona o utilizador a uma "sala" com o ID do grupo
    console.log(`Utilizador entrou no grupo: ${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('Utilizador desconectou-se');
  });
});


// 5. Exporte o `io` e mude app.listen para server.listen
module.exports.io = io;
server.listen(port, () => console.log(`Server running on port ${port}`));