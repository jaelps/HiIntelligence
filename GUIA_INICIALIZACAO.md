# Guia de inicialização e requisitos do HiIntelligence

Este documento reúne tudo o que é necessário instalar, configurar e executar para usar o projeto **HiIntelligence** em ambiente local ou via Docker.

---

## 1. Visão geral do projeto

O HiIntelligence é uma aplicação full-stack composta por:

- **Frontend:** React 18, TypeScript e Vite.
- **Backend:** ASP.NET Core 9 Web API.
- **Banco de dados:** PostgreSQL 15 no modo Docker ou SQLite no modo local simplificado.
- **Cache:** Redis 7 no modo Docker.
- **Tempo real:** SignalR para atualizações em tempo real no painel.

A forma mais simples e isolada de iniciar o projeto é com **Docker Compose**. Caso você não queira usar Docker, também é possível executar localmente com **Node.js**, **npm** e **.NET SDK 9**.

---

## 2. Programas necessários

### 2.1 Obrigatórios para qualquer modo de uso

| Programa | Versão recomendada | Para que serve | Como verificar |
| --- | --- | --- | --- |
| **Git** | 2.40 ou superior | Clonar o repositório e versionar alterações | `git --version` |
| **Node.js** | 18 ou superior | Executar o frontend React/Vite | `node -v` |
| **npm** | 9 ou superior | Instalar dependências do frontend | `npm -v` |
| **.NET SDK** | 9.0 ou superior | Restaurar, compilar e executar a API ASP.NET Core | `dotnet --version` |
| **Editor de código** | VS Code recomendado | Editar e navegar pelo projeto | Abrir a pasta do projeto |

> Observação: o npm normalmente já é instalado junto com o Node.js.

### 2.2 Necessários para o modo Docker recomendado

| Programa | Versão recomendada | Para que serve | Como verificar |
| --- | --- | --- | --- |
| **Docker Desktop** | Versão atual estável | Subir frontend, backend, PostgreSQL e Redis em containers | `docker --version` |
| **Docker Compose** | v2 ou superior | Orquestrar os containers definidos em `docker-compose.yml` | `docker compose version` |

No Windows, instale o Docker Desktop com integração WSL 2 habilitada. Aguarde o Docker Desktop ficar com o status **Running** antes de iniciar os containers.

### 2.3 Opcionais, mas recomendados

| Programa | Utilidade |
| --- | --- |
| **PowerShell 7+** | Executar scripts e comandos em Windows, Linux ou macOS com comportamento mais consistente. |
| **Postman ou Insomnia** | Testar endpoints da API manualmente. |
| **Extensão C# Dev Kit para VS Code** | Melhor suporte a projetos .NET/C#. |
| **Extensão ESLint para VS Code** | Ajuda a encontrar problemas no frontend TypeScript/React. |

---

## 3. Portas usadas pela aplicação

Antes de iniciar o projeto, verifique se estas portas estão livres:

| Porta | Serviço | Modo de execução |
| --- | --- | --- |
| `3000` | Frontend | Docker e local |
| `5000` | Backend/API | Docker e local |
| `5432` | PostgreSQL | Docker |
| `6379` | Redis | Docker |

Se alguma porta estiver ocupada, pare o processo que está usando a porta ou ajuste a configuração correspondente.

---

## 4. Estrutura principal de pastas

```text
HiIntelligence/
├── backend/
│   └── HiIntelligence.Api/      # API ASP.NET Core 9
├── frontend/                    # Aplicação React + Vite
├── docker-compose.yml           # Orquestra PostgreSQL, Redis, API e frontend
├── run-local.ps1                # Script para execução local sem Docker
├── README.md                    # Resumo técnico do projeto
└── DEPENDENCIES_REPORT.md       # Relatório de dependências existente
```

---

## 5. Preparando o ambiente

### 5.1 Clonar o projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd HiIntelligence
```

Caso o projeto já esteja na sua máquina, apenas abra um terminal na pasta raiz do repositório.

### 5.2 Conferir os programas instalados

Execute estes comandos no terminal:

```bash
git --version
node -v
npm -v
dotnet --version
docker --version
docker compose version
```

Para usar o modo local sem Docker, os comandos `docker --version` e `docker compose version` são opcionais.

---

## 6. Iniciando com Docker Compose, recomendado

Use esta opção quando quiser subir tudo de uma vez: frontend, backend, PostgreSQL e Redis.

### 6.1 Pré-requisitos

- Docker Desktop instalado e em execução.
- Docker Compose v2 disponível.
- Portas `3000`, `5000`, `5432` e `6379` livres.

### 6.2 Comando para iniciar

Na raiz do projeto, execute:

```bash
docker compose up --build -d
```

Esse comando irá:

1. Construir a imagem do backend.
2. Construir a imagem do frontend.
3. Criar o container PostgreSQL.
4. Criar o container Redis.
5. Subir a API em `http://localhost:5000`.
6. Subir o frontend em `http://localhost:3000`.

### 6.3 Verificar containers

```bash
docker compose ps
```

Todos os serviços devem aparecer como iniciados ou saudáveis.

### 6.4 Acessar a aplicação

Abra no navegador:

```text
http://localhost:3000
```

A API ficará disponível em:

```text
http://localhost:5000
```

### 6.5 Ver logs

Para ver todos os logs:

```bash
docker compose logs -f
```

Para ver apenas a API:

```bash
docker compose logs -f api
```

Para ver apenas o frontend:

```bash
docker compose logs -f frontend
```

### 6.6 Parar o ambiente Docker

```bash
docker compose down
```

Para parar e também apagar os volumes de banco/cache, use somente quando quiser resetar os dados:

```bash
docker compose down -v
```

---

## 7. Iniciando localmente sem Docker

Use esta opção quando você não quiser instalar/subir containers. Nesse modo, o backend pode usar SQLite local como fallback.

### 7.1 Pré-requisitos

- Node.js 18 ou superior.
- npm 9 ou superior.
- .NET SDK 9.0 ou superior.
- PowerShell disponível para executar `run-local.ps1`.
- Portas `3000` e `5000` livres.

### 7.2 Iniciar com o script pronto

No PowerShell, na raiz do projeto, execute:

```powershell
./run-local.ps1
```

O script faz automaticamente:

1. Verificação do .NET SDK.
2. Verificação do Node.js.
3. Instalação das dependências do frontend com `npm install`.
4. Build do backend com `dotnet build`.
5. Inicialização da API.
6. Inicialização do frontend.

Depois, acesse:

```text
http://localhost:3000
```

### 7.3 Iniciar manualmente sem o script

Se preferir iniciar cada serviço manualmente, abra dois terminais.

#### Terminal 1: backend

```bash
cd backend/HiIntelligence.Api
USE_SQLITE=true dotnet run
```

No PowerShell do Windows, use:

```powershell
cd backend/HiIntelligence.Api
$env:USE_SQLITE="true"
dotnet run
```

#### Terminal 2: frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse o frontend em:

```text
http://localhost:3000
```

---

## 8. Variáveis e configurações importantes

### 8.1 Backend

As configurações principais ficam em:

```text
backend/HiIntelligence.Api/appsettings.json
```

Configurações relevantes:

| Chave | Uso |
| --- | --- |
| `ConnectionStrings:DefaultConnection` | Conexão PostgreSQL. |
| `ConnectionStrings:SQLiteConnection` | Arquivo SQLite local. |
| `Redis:ConnectionString` | Endereço do Redis. |
| `JWT:Key` | Chave de assinatura dos tokens JWT. |
| `JWT:Issuer` | Emissor esperado do JWT. |
| `JWT:Audience` | Público esperado do JWT. |

No modo Docker, algumas configurações são sobrescritas pelo `docker-compose.yml` via variáveis de ambiente.

### 8.2 Frontend

A URL base da API é configurada pela variável:

```text
VITE_API_URL
```

Se ela não for definida, o frontend usa por padrão:

```text
http://localhost:5000
```

---

## 9. Credenciais de demonstração

Use estas contas para testar os diferentes níveis de acesso:

| Usuário | Senha | Perfil | Escopo |
| --- | --- | --- | --- |
| `admin` | `admin123` | Administrator | Acesso geral a lojas, regiões e relatórios. |
| `regional_east` | `east123` | Regional Manager | Acesso aos dados da região East. |
| `store_101` | `store123` | Store Manager | Acesso à loja 101. |

---

## 10. Comandos úteis de desenvolvimento

### 10.1 Frontend

Execute dentro da pasta `frontend`:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Significado:

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala dependências do frontend. |
| `npm run dev` | Inicia o servidor Vite de desenvolvimento. |
| `npm run build` | Compila TypeScript e gera build de produção. |
| `npm run preview` | Pré-visualiza o build gerado. |

### 10.2 Backend

Execute dentro da pasta `backend/HiIntelligence.Api`:

```bash
dotnet restore
dotnet build
dotnet run
```

Significado:

| Comando | O que faz |
| --- | --- |
| `dotnet restore` | Restaura pacotes NuGet. |
| `dotnet build` | Compila a API. |
| `dotnet run` | Executa a API. |

### 10.3 Docker

Execute na raiz do projeto:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
docker compose down
```

---

## 11. Solução de problemas comuns

### 11.1 Porta já está em uso

Sintoma: a API ou o frontend não inicia porque a porta já está ocupada.

Solução:

- Pare o processo que está usando a porta.
- Ou altere o mapeamento de portas no `docker-compose.yml`.

### 11.2 Docker Desktop não está rodando

Sintoma: comandos `docker compose` falham com erro de conexão ao Docker daemon.

Solução:

1. Abra o Docker Desktop.
2. Aguarde o status indicar que o Docker está rodando.
3. Rode novamente `docker compose up --build -d`.

### 11.3 Dependências do frontend com erro

Solução:

```bash
cd frontend
rm -rf node_modules
npm install
```

No PowerShell, caso não tenha `rm -rf`, use:

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### 11.4 Backend não conecta no PostgreSQL

Soluções possíveis:

- Confirme se o container `db` está rodando com `docker compose ps`.
- Veja os logs com `docker compose logs -f db`.
- No modo local, defina `USE_SQLITE=true` para usar SQLite.

### 11.5 Resetar banco de dados do Docker

Atenção: este comando apaga os dados persistidos nos volumes Docker.

```bash
docker compose down -v
docker compose up --build -d
```

### 11.6 Problemas com versão do .NET

Se `dotnet --version` mostrar uma versão menor que 9, instale o .NET SDK 9.0 ou superior pelo site oficial da Microsoft.

---

## 12. Checklist rápido para começar

### Usando Docker

- [ ] Git instalado.
- [ ] Docker Desktop instalado e rodando.
- [ ] Portas `3000`, `5000`, `5432` e `6379` livres.
- [ ] Terminal aberto na raiz do projeto.
- [ ] Executar `docker compose up --build -d`.
- [ ] Abrir `http://localhost:3000`.

### Usando execução local

- [ ] Git instalado.
- [ ] Node.js 18+ instalado.
- [ ] npm 9+ instalado.
- [ ] .NET SDK 9.0+ instalado.
- [ ] Portas `3000` e `5000` livres.
- [ ] Terminal aberto na raiz do projeto.
- [ ] Executar `./run-local.ps1` no PowerShell ou iniciar backend/frontend manualmente.
- [ ] Abrir `http://localhost:3000`.

---

## 13. Ordem recomendada para um novo desenvolvedor

1. Instalar Git, Node.js, npm, .NET SDK 9 e Docker Desktop.
2. Clonar o repositório.
3. Abrir a pasta no VS Code.
4. Rodar `docker compose up --build -d` na raiz do projeto.
5. Acessar `http://localhost:3000`.
6. Entrar com o usuário `admin` e senha `admin123`.
7. Se precisar desenvolver sem Docker, parar os containers com `docker compose down` e usar `./run-local.ps1`.
