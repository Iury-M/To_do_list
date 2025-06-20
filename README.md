# TaskFlow - Gerenciador de Tarefas

TaskFlow é uma aplicação web moderna para gerenciamento de tarefas, desenvolvida com Next.js no frontend e Node.js no backend.

## 🚀 Funcionalidades

- Autenticação de usuários (login/registro)
- Criação, edição e exclusão de tarefas
- Marcação de tarefas como concluídas
- Anexo de arquivos às tarefas
- Interface responsiva e moderna
- Suporte a usuários administradores

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (gerenciador de pacotes do Node.js)
- Git

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd [NOME_DO_DIRETÓRIO]
```

2. Instale as dependências do backend:
```bash
cd backend
npm install
```

3. Instale as dependências do frontend:
```bash
cd ../frontend
npm install
```

## ⚙️ Configuração

1. No diretório `backend`, crie um arquivo `.env` com as seguintes variáveis:
```env
PORT=4000
JWT_SECRET=sua_chave_secreta_aqui
```

2. Configure o banco de dados:
```bash
cd backend
npx prisma migrate dev
```

## 🚀 Executando o Projeto

1. Inicie o servidor backend:
```bash
cd backend
npm run dev
```
O servidor backend estará rodando em `http://localhost:4000`

2. Em outro terminal, inicie o servidor frontend:
```bash
cd frontend
npm run dev
```
O frontend estará disponível em `http://localhost:3000`

## 📱 Uso

1. Acesse `http://localhost:3000` no seu navegador
2. Crie uma nova conta ou faça login
3. Comece a gerenciar suas tarefas!

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - Next.js
  - Tailwind CSS
  - Axios

- **Backend**:
  - Node.js
  - Express
  - Prisma (ORM)
  - JWT para autenticação
  - Multer para upload de arquivos

## 📦 Estrutura do Projeto

```
projeto/
├── frontend/
│   ├── pages/
│   ├── utils/
│   └── ...
├── backend/
│   ├── prisma/
│   ├── uploads/
│   └── ...
└── README.md
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## ✨ Recursos Adicionais

- Interface moderna com efeitos de glassmorphism
- Design responsivo para todos os dispositivos
- Upload de arquivos com preview
- Sistema de autenticação seguro
- Gerenciamento de estado com React Hooks 