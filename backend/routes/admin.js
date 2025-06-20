// routes/admin.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { verifyToken, requireAdmin } = require('../auth');

router.get('/users/:userId/tasks', verifyToken, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const tasks = await prisma.task.findMany({
      where: { 
        userId,
        groupId: null // <-- A CORREÇÃO: só tarefas sem grupo
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('GET /users/:userId/tasks route accessed');
    console.log('User ID:', userId);
    console.log('Tasks retrieved:', tasks);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar tarefas do usuário' });
  }
});

router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    console.log('GET /users route accessed');
    console.log('Users retrieved:', users);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

// Rota para o ADMIN listar TODOS os grupos
router.get('/groups', verifyToken, requireAdmin, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: { // Inclui uma contagem de membros e tarefas
          select: { members: true, tasks: true },
        },
      },
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar grupos' });
  }
});

// Rota para o ADMIN listar as tarefas de UM grupo específico
router.get('/groups/:groupId/tasks', verifyToken, requireAdmin, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const tasks = await prisma.task.findMany({
      where: { groupId },
      include: {
        user: { select: { name: true } } // Inclui o nome de quem criou a tarefa
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar tarefas do grupo' });
  }
});

// Atualizar tarefa de qualquer usuário
router.put('/tasks/:id', verifyToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, done } = req.body;

  try {
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { title, description, done },
    });
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar tarefa' });
  }
});

// Excluir tarefa de qualquer usuário
router.delete('/tasks/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir tarefa' });
  }
});


module.exports = router;
