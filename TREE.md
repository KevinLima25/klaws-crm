# TREE — Estrutura do Projeto

```
./
├── crm/                               # Frontend Next.js CRM
│   ├── public/
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   └── agentes/
│   │   │   │       └── page.tsx       # Página de configuração de agentes
│   │   │   ├── api/
│   │   │   │   └── agentes-config/
│   │   │   │       └── route.ts       # API GET/PUT agentes_config
│   │   │   ├── auth/                  # Autenticação (callbacks)
│   │   │   ├── crm/                   # Páginas do CRM
│   │   │   ├── login/                 # Página de login
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   └── switch.tsx         # Componente Switch toggle
│   │   │   ├── auth-form.tsx
│   │   │   ├── chat-interface-v2.tsx  # Chat com upload de arquivos
│   │   │   ├── chat-interface.tsx     # Chat v1 (legado)
│   │   │   ├── crm-sidebar.tsx        # Sidebar com link Agentes
│   │   │   ├── dashboard-v2.tsx
│   │   │   └── dashboard.tsx
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   ├── roles.ts
│   │   │   └── utils.ts
│   │   └── proxy.ts
│   ├── supabase/
│   │   └── migrations/
│   │       ├── 00001_initial.sql
│   │       ├── 00002_add_cargo_to_profiles.sql
│   │       └── 00003_add_comprovantes_agentes_config.sql
│   ├── tests/
│   │   └── login.spec.ts
│   ├── .dockerignore
│   ├── .env.example
│   ├── .env.local                     # ENV com webhook URL atualizada
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── Dockerfile
│   ├── components.json
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── package.json
│   ├── playwright.config.ts
│   ├── postcss.config.mjs
│   ├── SESSÃO_ESTADO.md
│   └── tsconfig.json
├── n8n/
│   ├── data/
│   │   ├── storage/workflows/         # Workflows exportados
│   │   ├── config
│   │   ├── database.sqlite            # Banco do n8n (workflows, webhooks, etc.)
│   │   └── nodes/package.json
│   ├── files/                         # Arquivos montados no container
│   └── query.js
├── waha/
│   ├── media/
│   └── sessions/                      # Sessões WhatsApp (login persistido)
├── docker-compose.yml                 # Serviços: waha, n8n, crm
├── toggle_webhook.js                  # Script toggle webhook pós-restart
├── restart_n8n.bat                    # Batch: restart + toggle
└── STATUS.md                          # Status atual do fluxo
```
