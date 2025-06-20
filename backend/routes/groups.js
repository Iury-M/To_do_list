// Em backend/routes/groups.js

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { verifyToken } = require('../auth'); // Supondo que você exportou de um arquivo de auth

// Rota para CRIAR um novo grupo
router.post('/', verifyToken, async (req, res) => {
    const { name, invitedUserEmail } = req.body;
    const creatorId = req.user.id;

    try {
        // 1. Encontra o usuário a ser convidado
        const invitedUser = await prisma.user.findUnique({ where: { email: invitedUserEmail } });
        if (!invitedUser) {
            return res.status(404).json({ message: "Usuário convidado não encontrado." });
        }

        // 2. Cria o grupo e os membros em uma única transação
        const newGroup = await prisma.group.create({
            data: {
                name,
                members: {
                    create: [
                        // O criador já entra como admin e aceito
                        { userId: creatorId, role: 'ADMIN', status: 'ACCEPTED' },
                        // O convidado entra com status pendente
                        { userId: invitedUser.id, role: 'MEMBER', status: 'PENDING' }
                    ]
                }
            },
            include: { members: true }
        });

        res.status(201).json(newGroup);
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar grupo.", error: error.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    const groups = await prisma.group.findMany({
        where: {
            members: {
                some: {
                    userId: req.user.id,
                    status: 'ACCEPTED'
                }
            }
        }
    });
    res.json(groups);
});

router.get('/invitations', verifyToken, async (req, res) => {
    const invitations = await prisma.groupMember.findMany({
        where: {
            userId: req.user.id,
            status: 'PENDING'
        },
        include: {
            group: { // Inclui os dados do grupo em cada convite
                include: {
                    members: { // Inclui os membros para achar o nome de quem convidou
                        include: {
                            user: { select: { name: true }}
                        }
                    }
                }
            }
        }
    });
    res.json(invitations);
});

// Rota para ACEITAR um convite
router.post('/invitations/:membershipId/accept', verifyToken, async (req, res) => {
    const membershipId = parseInt(req.params.membershipId);
    try {
        await prisma.groupMember.update({
            where: {
                id: membershipId,
                userId: req.user.id // Garante que o usuário só pode aceitar o seu próprio convite
            },
            data: { status: 'ACCEPTED' }
        });
        res.status(200).json({ message: 'Convite aceito com sucesso!' });
    } catch(err) {
        res.status(500).json({ message: 'Erro ao aceitar convite.' });
    }
});

router.get('/:groupId', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);

        // Verifica se o usuário tem permissão para ver este grupo
        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId: groupId,
                userId: req.user.id,
                status: 'ACCEPTED'
            }
        });

        if (!membership) {
            return res.status(403).json({ message: "Você não é membro deste grupo." });
        }

        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return res.status(404).json({ message: "Grupo não encontrado." });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar detalhes do grupo." });
    }
});


// ROTA NOVA 2: Buscar as TAREFAS de um grupo específico
router.get('/:groupId/tasks', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);

        // Verifica se o usuário tem permissão para ver as tarefas deste grupo
        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId: groupId,
                userId: req.user.id,
                status: 'ACCEPTED'
            }
        });

        if (!membership) {
            return res.status(403).json({ message: "Você não é membro deste grupo." });
        }

        const tasks = await prisma.task.findMany({
            where: { groupId },
            include: {
                user: { // Inclui o nome de quem criou a tarefa
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar tarefas do grupo." });
    }
});


router.post('/:groupId/tasks', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const userId = req.user.id;
        const { title, description } = req.body;

        // 1. Verifica se o usuário é realmente um membro do grupo antes de criar a tarefa
        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId: groupId,
                userId: userId,
                status: 'ACCEPTED'
            }
        });

        if (!membership) {
            return res.status(403).json({ message: "Você não tem permissão para criar tarefas neste grupo." });
        }

        // 2. Cria a tarefa, associando ao grupo e ao usuário que a criou
        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                userId: userId,   // ID de quem criou
                groupId: groupId, // ID do grupo ao qual pertence
            }
        });

        res.status(201).json(newTask); // Retorna a tarefa criada
    } catch (error) {
        console.error("Erro ao criar tarefa no grupo:", error);
        res.status(500).json({ message: "Erro interno ao criar tarefa." });
    }
});

module.exports = router;