# 📋 Relatório de Dependências - HiIntelligence

**Data do Relatório:** 05/06/2026  
**Projeto:** HiIntelligence - Enterprise Financial Intelligence & BI Platform

---

## 🎯 Resumo Executivo

Este projeto é uma aplicação **full-stack** moderna com:
- **Frontend:** React 18 + TypeScript + Vite + MUI
- **Backend:** ASP.NET Core 9 + Entity Framework Core
- **Infraestrutura:** Docker Compose (PostgreSQL + Redis) com fallback SQLite local

---

## 1️⃣ **DEPENDÊNCIAS DO SISTEMA**

### Obrigatórias (Necessárias em Qualquer Modo)

| Dependência | Versão | Link Download | Status |
|---|---|---|---|
| **Node.js** | v18+ | https://nodejs.org/ | ✅ Obrigatória |
| **.NET SDK** | 9.0+ | https://dotnet.microsoft.com/download | ✅ Obrigatória |
| **npm** | v9+ (bundled) | (via Node.js) | ✅ Obrigatória |

### Opcionais (Para Docker)

| Dependência | Versão | Link Download | Status |
|---|---|---|---|
| **Docker Desktop** | Latest | https://www.docker.com/products/docker-desktop | ⚠️ Para modo orquestrado |
| **Docker Compose** | v2+ | (bundled no Docker) | ⚠️ Para modo orquestrado |

---

## 2️⃣ **FRONTEND - DEPENDÊNCIAS NPM**

### Localização
- **Arquivo:** `frontend/package.json`
- **Comando de Instalação:** `npm install` (na pasta `frontend/`)

### Dependências Principais

#### UI & Styling
| Pacote | Versão | Propósito |
|---|---|---|
| `react` | ^18.3.1 | Framework React |
| `react-dom` | ^18.3.1 | Renderização DOM |
| `@mui/material` | ^6.0.2 | Componentes de UI (Material Design) |
| `@mui/icons-material` | ^6.0.2 | Ícones Material Design |
| `@emotion/react` | ^11.13.3 | CSS-in-JS |
| `@emotion/styled` | ^11.13.0 | Styled Components |
| `lucide-react` | ^0.439.0 | Ícones adicionais |
| `recharts` | ^2.12.7 | Gráficos interativos (Area, Line, Bar) |

#### Estado & Dados
| Pacote | Versão | Propósito |
|---|---|---|
| `@reduxjs/toolkit` | ^2.2.7 | Gerenciamento de estado (auth, notificações) |
| `react-redux` | ^9.1.2 | Integração Redux com React |
| `@tanstack/react-query` | ^5.55.0 | Caching e polling de queries |
| `axios` | ^1.7.7 | Cliente HTTP |

#### Routing & Comunicação
| Pacote | Versão | Propósito |
|---|---|---|
| `react-router-dom` | ^6.26.1 | Navegação e roteamento |
| `@microsoft/signalr` | ^8.0.7 | WebSocket (comunicação real-time) |

### Dependências de Desenvolvimento

| Pacote | Versão | Propósito |
|---|---|---|
| `typescript` | ^5.5.4 | Type checking |
| `@types/react` | ^18.3.5 | Tipos TypeScript para React |
| `@types/react-dom` | ^18.3.0 | Tipos TypeScript para React DOM |
| `vite` | ^5.4.2 | Build tool & dev server |
| `@vitejs/plugin-react` | ^4.3.1 | Plugin React para Vite |

---

## 3️⃣ **BACKEND - DEPENDÊNCIAS .NET**

### Localização
- **Arquivo:** `backend/HiIntelligence.Api/HiIntelligence.Api.csproj`
- **Restauração:** `dotnet restore` (automático no build)

### NuGet Packages

| Pacote | Versão | Propósito |
|---|---|---|
| **Microsoft.AspNetCore.Authentication.JwtBearer** | 9.0.0 | Autenticação JWT |
| **Microsoft.EntityFrameworkCore** | 9.0.0 | ORM & Data Access |
| **Microsoft.EntityFrameworkCore.Design** | 9.0.0 | Ferramentas de design (migrations) |
| **Microsoft.EntityFrameworkCore.Sqlite** | 9.0.0 | Provider SQLite (modo local) |
| **Npgsql.EntityFrameworkCore.PostgreSQL** | 9.0.0 | Provider PostgreSQL (modo Docker) |
| **Microsoft.Extensions.Caching.StackExchangeRedis** | 9.0.0 | Caching com Redis |
| **System.IdentityModel.Tokens.Jwt** | 8.2.1 | Token JWT |

### SignalR (Incluído no ASP.NET Core)
- Comunicação real-time WebSocket para atualizações de dashboard
- Grupos por usuário para notificações direcionadas

---

## 4️⃣ **INFRAESTRUTURA - DOCKER COMPOSE**

### Serviços Orquestrados

#### PostgreSQL
```yaml
Imagem: postgres:15-alpine
Porta: 5432
BD: hiintelligence
Usuário: admin
Senha: SecretPassword123! (⚠️ Alterar em produção)
```

#### Redis
```yaml
Imagem: redis:7-alpine
Porta: 6379
Propósito: Cache distribuído
```

#### API (Backend)
```yaml
Imagem: hiintelligence-api:latest
Porta: 5000 (mapeada para 80 no container)
Dependências: PostgreSQL, Redis
```

#### Frontend
```yaml
Imagem: hiintelligence-ui:latest
Porta: 3000 (mapeada para 80 no container)
Dependências: API
```

---

## 5️⃣ **MODOS DE EXECUÇÃO**

### 🐳 Modo A: Docker Compose (Recomendado)

**Dependências Necessárias:**
- ✅ Docker Desktop (instalado e rodando)
- ✅ Docker Compose v2+
- ✅ ~4GB RAM disponível

**Comando:**
```powershell
docker compose up --build -d
```

**Acesso:**
- Frontend: http://localhost:3000
- API: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

### 💻 Modo B: Execução Local (Fallback)

**Dependências Necessárias:**
- ✅ Node.js v18+
- ✅ .NET 9.0 SDK
- ✅ npm v9+

**Comando:**
```powershell
./run-local.ps1
```

**Configuração Automática:**
- Backend usa `USE_SQLITE=true`
- Cria banco local: `hiintelligence.db`
- Sem Redis (caching em memória)

**Acesso:**
- Frontend: http://localhost:3000
- API: http://localhost:5000
- BD local: `hiintelligence.db` (SQLite)

---

## 6️⃣ **CHECKLIST DE PRÉ-REQUISITOS**

### ✓ Verificação Rápida (Windows PowerShell)

```powershell
# 1. Verificar Node.js
node -v
npm -v

# 2. Verificar .NET SDK
dotnet --version

# 3. Verificar Docker (se usar Docker Compose)
docker --version
docker compose --version

# 4. Verificar acesso aos diretórios
Test-Path ".\backend\HiIntelligence.Api"
Test-Path ".\frontend"
```

### 📋 Checklist Manual

- [ ] Node.js v18+ instalado
- [ ] .NET 9.0 SDK instalado
- [ ] npm funcionando
- [ ] Docker Desktop (opcional, para modo orquestrado)
- [ ] Pastas `backend/` e `frontend/` existentes
- [ ] Arquivo `run-local.ps1` com permissões de execução
- [ ] Permissões de escrita para criar `hiintelligence.db` (modo local)

---

## 7️⃣ **INSTALAÇÃO DE DEPENDÊNCIAS**

### Passo 1: Frontend (npm)
```powershell
cd frontend
npm install
cd ..
```

### Passo 2: Backend (.NET)
```powershell
cd backend\HiIntelligence.Api
dotnet restore
dotnet build
cd ..\..
```

### Passo 3: Executar Projeto

**Opção A - Docker Compose:**
```powershell
docker compose up --build -d
```

**Opção B - Local:**
```powershell
./run-local.ps1
```

---

## 8️⃣ **CREDENCIAIS PADRÃO (DEMO)**

| Usuário | Senha | Função |
|---|---|---|
| `admin` | `admin123` | Administrador (acesso global) |
| `regional_east` | `east123` | Gerente Regional (região East) |
| `store_101` | `store123` | Gerente de Loja (loja #101) |

---

## 9️⃣ **VERIFICAÇÃO FINAL**

Após iniciar o projeto, confirme:

1. ✅ Frontend carregando em `http://localhost:3000`
2. ✅ API respondendo em `http://localhost:5000/health` (ou qualquer endpoint)
3. ✅ Login funcionando com credenciais demo
4. ✅ Dashboard carregando dados em tempo real
5. ✅ WebSocket conectado (verifique console do navegador)

---

## 🔧 Troubleshooting Comum

| Problema | Solução |
|---|---|
| **"dotnet not found"** | Instale .NET 9.0 SDK e adicione ao PATH |
| **"npm install" lento** | Use `npm ci` para instalação mais rápida |
| **Porta 3000/5000 em uso** | Altere as portas em `docker-compose.yml` ou `run-local.ps1` |
| **Erro PostgreSQL** | Use modo local (SQLite) via `run-local.ps1` |
| **Redis timeout** | Sistema ainda funcionará, apenas sem cache distribuído |

---

## 📞 Resumo de Dependências Críticas

```
┌─── Frontend (npm) ───────────┐
│ • React 18                  │
│ • TypeScript                │
│ • Vite 5.4                  │
│ • Material UI 6             │
│ • Redux Toolkit 2.2         │
│ • React Query 5.55          │
│ • SignalR Client 8.0        │
└──────────────────────────────┘

┌─── Backend (.NET) ───────────┐
│ • .NET 9.0 SDK              │
│ • ASP.NET Core 9            │
│ • Entity Framework Core 9   │
│ • SQLite OR PostgreSQL      │
│ • Redis (opcional)          │
│ • JWT Authentication        │
│ • SignalR                   │
└──────────────────────────────┘

┌─── Infraestrutura ──────────┐
│ • Node.js v18+              │
│ • Docker (recomendado)      │
│ • PostgreSQL 15 (opcional)  │
│ • Redis 7 (opcional)        │
└──────────────────────────────┘
```

---

**Última Atualização:** 05/06/2026  
**Status:** ✅ Documento Completo
