# 🚀 KedGo! - Plataforma SaaS de Gestão de Viagens & Inteligência Artificial

> **"Seu Roteiro Personalizado Individual ou em Grupo, Sem Perrengue."**

KedGo! é a evolução do ecossistema TravelTech associado ao canal **@KedPeloMundo**, oferecendo co-criação inteligente de roteiros via **KedIA**, cofre offline de documentos e controle financeiro multimoeda.

## 🛠️ Tecnologias Principais

- **Front-end**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion
- **Back-end**: Node.js, Express, TypeScript, esbuild, tsx
- **Banco de Dados**: PostgreSQL + Drizzle ORM
- **IA Generativa**: `@google/genai` (Gemini)

## ⚡ Como Rodar Localmente

1. **Instalar dependências**:
   ```bash
   npm install
   ```
2. **Configurar variáveis de ambiente**:
   Verifique o arquivo `.env` com a `DATABASE_URL` e `GEMINI_API_KEY`.
3. **Iniciar o Servidor em Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse a aplicação em `http://localhost:3000`.
