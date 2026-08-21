---
name: gerenciando-kedgo
description: Atua como Engenheiro Full-Stack responsável pela arquitetura, manutenção e evolução do sistema KEDGO (Roteiro e Custos de Viagem). Use quando o usuário pedir para modificar rotas de API, tabelas no Drizzle, componentes de itinerário ou regras de salvamento do projeto.
---

# Gerenciando a Aplicação KEDGO

## Visão Geral da Aplicação

O **KEDGO** é um ecossistema full-stack responsivo para planejamento, colaboração em grupo e gestão financeira de viagens complexas (múltiplos destinos, dezenas de integrantes).

### Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Front-End | React 18 + TypeScript (Vite) |
| Estilização | Tailwind CSS v4 + Lucide React |
| Animações | motion/react |
| Gráficos / PDF | Recharts + html2pdf.js / jspdf |
| Back-End | Node.js + Express + TypeScript |
| Build | tsx (dev) · esbuild → `dist/server.cjs` (prod) |
| Banco de Dados | PostgreSQL + Drizzle ORM |
| IA Generativa | @google/genai (Gemini) via `/api/ai/plan` |
| APIs Externas | Open-Meteo (clima) · Geocodificação |

### Schemas Principais (`src/db/schema.ts`)
`users` · `itineraries` · `travelers` · `destinations` · `itineraryDays` · `activities` · `flights` · `flightPassengers` · `costs` · `costCategories` · `documents` · `generalTips` · `chatMessages` · `accessLogs` · `transactionLogs`

---

## Quando usar esta skill

- Alterar schemas do banco de dados PostgreSQL (`src/db/schema.ts`)
- Ajustar ou criar novos endpoints no servidor Express (`server.ts`)
- Modificar componentes de interface React no front-end (`src/components/` ou `src/App.tsx`)
- Tratar segurança de dados, rotas de voos, rateios de custos ou chat em tempo real

---

## Fluxo de Trabalho (Workflow)

1. **Análise de Requisitos & Escopo**: Verificar se a mudança afeta o banco de dados, o backend ou apenas o estado do frontend.
2. **Atualização do Banco (Drizzle ORM)**:
   - Caso altere `src/db/schema.ts`, execute `drizzle-kit generate` e aplique as migrações.
3. **Ajuste de Endpoints (Express)**:
   - Garantir que todos os endpoints passem pelo `authMiddleware` quando necessário.
   - Preservar as travas de segurança contra *overwrite* de estado vazio em `PUT /api/itineraries/:id`.
4. **Manutenção do Frontend**:
   - Manter a compatibilidade com a interface `ItineraryData` (`src/types.ts`).
   - Sincronizar atualizações usando o padrão de autosave ou atualizações direcionadas via API.
5. **Validação**:
   - Rodar lint TypeScript para garantir ausência de erros.
   - Recompilar e reiniciar o servidor se `server.ts` for modificado.

---

## Instruções

### 1. Estrutura de Arquivos Principais

```
kktur/
├── server.ts                    # Servidor Node.js/Express, endpoints REST, Gemini, Chat
├── src/
│   ├── App.tsx                  # Orquestrador de estado e abas do frontend
│   ├── types.ts                 # Interfaces TypeScript (ItineraryData, etc.)
│   ├── db/
│   │   └── schema.ts            # Tabelas Drizzle ORM
│   ├── data/
│   │   └── defaultData.ts       # Dados de contingência e inicialização
│   └── components/
│       ├── ItineraryTab.tsx     # Roteiro diário e paradas de cidades
│       ├── OverviewTab.tsx      # Gestão de voos, bilhetes e passageiros
│       └── ChatTab.tsx          # Mensagens em tempo real (grupo/privada)
└── dist/
    └── server.cjs               # Bundle de produção (gerado pelo esbuild)
```

### 2. Módulos em Operação (Produção)

- **Gestão de Roteiros Multi-Cidades**: Visualização hierárquica por destino, dias e atividades cronológicas (horários, custos, notas e arquivos anexos).
- **Gerenciador de Voos & Passagens**: Itinerários aéreos multi-trechos (ex: FLN-GRU-BOG-IAD), associação de passageiros com assentos, bilhetes PDF e localizadores.
- **Controle Financeiro & Rateio**: Categorização dinâmica de despesas, conversão de moedas e calculadora de divisão entre viajantes.
- **Chat do Grupo & Notificações**: Mensagens públicas e privadas com busca diferencial (`since`), attachments e indicador de digitação.
- **Autenticação & Controle de Acesso**: JWT + BCrypt; associação por e-mail sanitizado (`LOWER(TRIM(email))`).
- **Data Safety Guard**: Proteção em `PUT /api/itineraries/:id` contra gravações de estado vazio; rotas de recuperação para itinerários de referência.

### 3. Módulos em Backlog / Oculto

- **AdminDashboard.tsx**: Auditoria de acessos e monitoramento do consumo da API Gemini.
- **OCR via Gemini Vision**: Leitura automática de comprovantes e passagens para preenchimento automático.
- **Sincronização Offline**: Fallback com localStorage e reconciliação progressiva.
- **Notificações Push / Webhooks de Voo**: Status em tempo real para alertas de portão e atrasos.

---

## Regras de Ouro da Aplicação

> **NUNCA viole estas regras sem confirmação explícita do usuário.**

1. **Preservação de Dados**: Nunca limpe o estado de viagens sem validar se a requisição contém ao menos **1 destino** ou **1 viajante**, evitando sobrescrever dados na nuvem.
2. **Porta & IP**: O servidor deve sempre subir em `0.0.0.0:3000` com suporte a proxy reverso Nginx.
3. **Idioma**: Toda a comunicação com o usuário final deve ser mantida em **Português do Brasil**.
4. **Auth Middleware**: Todo endpoint que expõe dados de viajantes ou itinerários deve passar pelo `authMiddleware`.
5. **Compatibilidade de Tipos**: Qualquer nova tabela ou coluna deve ser refletida na interface `ItineraryData` em `src/types.ts`.

---

## Recursos de Referência

- [`src/types.ts`](src/types.ts) — Interfaces TypeScript do domínio
- [`src/db/schema.ts`](src/db/schema.ts) — Schema relacional Drizzle ORM
- [`server.ts`](server.ts) — Servidor Express e endpoints REST
- [`src/App.tsx`](src/App.tsx) — Orquestrador de estado do frontend
