# CLAUDE.md — Instruções para o Claude Code

## Visão geral do projeto

Este é um site Next.js 16 (App Router) com arquitetura **content-driven**. Todo conteúdo visível no site vem de arquivos de dados — nunca de texto hardcoded nos componentes.

O projeto segue uma separação rígida entre **estrutura visual** (componentes) e **conteúdo** (dados em JSON/MDX). Isso permite que o conteúdo seja editado por IA sem tocar em código.

**Stack:** Next.js 16 · React 19 · TypeScript 5.9 · Tailwind CSS v4 · Deploy na Vercel

---

## Comandos

```bash
npm run dev            # Inicia o servidor de desenvolvimento Next.js (localhost:3000)
npm run build          # Gera o bundle de produção
npm run start          # Inicia o servidor de produção
npm run generate-theme   # Regenera src/app/theme.generated.css a partir do site.config.json
npm run generate-favicon # Regenera src/app/favicon.ico a partir das cores do site.config.json
npm run lint           # Executa o ESLint
npm run lint:fix       # Executa o ESLint com correção automática
npm run format         # Formata todos os arquivos com Prettier
```

---

## Estrutura do projeto

```
├── content/                     # DADOS EDITÁVEIS (conteúdo do site)
│   ├── site.config.json         #   dados globais: marca, cores, contato, redes sociais
│   ├── navigation.json          #   menus do header e footer
│   ├── media/
│   │   └── manifest.json        #   registro de todas as imagens com metadata
│   └── pages/
│       ├── home.data.json       #   dados estruturados (seções, cards, listas)
│       ├── [slug].data.json     #   uma página por arquivo
│       └── [slug].mdx           #   conteúdo textual longo (opcional por página)
│
├── ai/                          # DOCUMENTAÇÃO PARA IA
│   ├── CONVENTIONS.md           #   como o conteúdo é organizado
│   └── EDITING_GUIDE.md         #   regras de edição de conteúdo
│
├── scripts/
│   └── generate-theme.mjs       #   gera theme.generated.css a partir de site.config.json
│
├── public/
│   └── media/                   #   imagens do site (webp para fotos, svg para logos)
│
├── src/
│   ├── app/                     # NEXT.JS APP ROUTER
│   │   ├── globals.css          #   importa tailwindcss + theme.generated.css
│   │   ├── theme.generated.css  #   AUTO-GERADO — não editar diretamente
│   │   ├── layout.tsx
│   │   ├── page.tsx             #   home (lê content/pages/home.data.json)
│   │   └── [slug]/page.tsx      #   páginas dinâmicas (rota automática por arquivo em pages/)
│   │
│   ├── components/
│   │   ├── sections/            #   componentes de seção (Hero, Features, Cta, etc.)
│   │   ├── layout/              #   Header, Footer
│   │   └── ui/                  #   componentes base (Button, Card, etc.)
│   │
│   ├── types/
│   │   └── content.ts           #   interfaces TypeScript — fonte de verdade da estrutura de dados
│   │
│   └── lib/
│       ├── content.ts           #   funções para ler JSON/MDX de content/
│       └── section-registry.ts  #   mapeia section.type → componente React
│
└── next.config.ts               #   habilita SVG no next/image
```

---

## Regras fundamentais

### 1. Zero texto hardcoded

Nenhum texto visível ao usuário pode existir diretamente no JSX. Isso inclui:

- Títulos, parágrafos, labels de botões
- Textos de copyright, "Todos os direitos reservados"
- Placeholders, textos alternativos de imagens
- Itens de menu, links

**Certo:**

```tsx
<h1>{data.headline}</h1>
<p>{data.description}</p>
```

**Errado:**

```tsx
<h1>Bem-vindo ao nosso site</h1>
<footer>© 2025 Empresa. Todos os direitos reservados.</footer>
```

A ÚNICA exceção são textos estruturais que não são conteúdo do cliente, como mensagens de erro 404 do Next.js ou textos de loading — e mesmo esses devem estar em um arquivo de constantes, não inline.

### 2. Componentes de seção são data-driven

Todo componente em `src/components/sections/` recebe seus dados via props tipadas. O componente não sabe e não se importa com qual site está renderizando.

```tsx
// src/components/sections/Hero.tsx
interface HeroProps {
  headline: string;
  subheadline?: string;
  cta: {
    label: string;
    href: string;
    style?: "primary" | "secondary" | "whatsapp";
  };
  image: { src: string; alt: string };
}

export function Hero({ headline, subheadline, cta, image }: HeroProps) {
  // renderiza usando apenas as props — zero texto hardcoded
}
```

### 3. Páginas são compostas dinamicamente

Uma página é um array de seções definido no JSON. O componente de página itera sobre esse array e renderiza cada seção usando o registry:

```tsx
// src/app/[slug]/page.tsx
import { getPageData } from "@/lib/content";
import { getSectionComponent } from "@/lib/section-registry";

export default async function Page({ params }: { params: { slug: string } }) {
  const page = await getPageData(params.slug);

  return (
    <main>
      {page.sections.map((section) => {
        const Component = getSectionComponent(section.type);
        return <Component key={section.id} {...section.data} />;
      })}
    </main>
  );
}
```

### 4. Design tokens vêm do site.config.json

Cores, fontes e outros tokens visuais são definidos em `content/site.config.json`. O script `scripts/generate-theme.mjs` lê esses valores e gera `src/app/theme.generated.css` com um bloco `@theme` do Tailwind v4. Esse arquivo é importado por `globals.css` e roda automaticamente antes de `dev` e `build`.

**Nunca edite `theme.generated.css` diretamente** — as alterações serão sobrescritas. Edite `site.config.json`.

```tsx
// Certo: usa variável de tema
<div className="bg-primary text-primary-foreground">

// Errado: cor hardcoded
<div className="bg-blue-600 text-white">
```

### 5. TypeScript com JSDoc é a fonte de verdade

As interfaces de props de cada componente de seção (em `src/components/sections/`) e as interfaces compartilhadas (em `src/types/content.ts`) são a única fonte de verdade da estrutura de dados. Não existem schemas JSON separados.

Para todo componente de seção criado, a interface de props deve:

- Ter comentários JSDoc em **inglês** em **todos** os campos
- Incluir restrições nos comentários: máx. de caracteres, valores aceitos, formato esperado
- Usar union types para campos com valores fixos (`"primary" | "secondary" | "whatsapp"`)
- Exportar a interface para que `src/types/content.ts` possa reexportá-la

```tsx
export interface HeroProps {
  /** Título principal em destaque no topo da página. Recomendado máximo 80 caracteres. */
  headline: string;
  /** Texto de apoio abaixo do título. Recomendado máximo 200 caracteres. */
  subheadline?: string;
  /** Botão de chamada para ação. */
  cta: {
    /** Texto exibido no botão. Máximo ~30 caracteres. */
    label: string;
    /** URL de destino. Pode ser caminho interno (/contato) ou URL externa. */
    href: string;
    /** Estilo visual do botão. */
    style?: "primary" | "secondary" | "whatsapp";
  };
}
```

Após criar o componente, adicione o reexporte em `src/types/content.ts` e inclua o tipo no union `SectionData`.

### 6. Convenção de nomes

- Componentes de seção: PascalCase → `Hero.tsx`, `Features.tsx`, `ContactForm.tsx`
- Arquivos de dados: kebab-case → `home.data.json`, `site.config.json`
- IDs de seção no JSON: kebab-case descritivo → `"id": "hero-principal"`, `"id": "servicos-destaque"`
- Tipo de seção no JSON: kebab-case → `"type": "hero"`, `"type": "features"`, `"type": "contact-form"`

### 7. Imagens

- Imagens ficam em `public/media/` com nomes descritivos em kebab-case
- Referências no JSON usam o path relativo: `"/media/hero-project.webp"`
- Toda imagem OBRIGATORIAMENTE tem `alt` descritivo no JSON
- Formatos preferidos: `.webp` para fotos, `.svg` para ícones/logos e placeholders
- O arquivo `content/media/manifest.json` registra todas as imagens com metadata

**Placeholders SVG:** Durante a criação do site, crie arquivos `.svg` em `public/media/` para cada imagem que o site precisará. Use nomes definitivos em kebab-case (ex: `project-higienopolis-house.svg`). Quando as fotos reais chegarem, substitua os SVGs mantendo o mesmo nome de arquivo — assim o JSON não precisa ser atualizado. Os SVGs de placeholder devem usar a paleta do cliente, mostrar um ícone descritivo e um label identificando o conteúdo esperado.

---

## Ao criar um novo site (workflow completo)

1. Ler o briefing do cliente (fornecido como contexto)
2. Substituir os dados placeholder em `content/site.config.json` (marca, cores, contato)
3. Rodar `npm run generate-theme` para regenerar `src/app/theme.generated.css` com as cores do cliente
4. Atualizar `src/app/layout.tsx` para importar as fontes corretas via `next/font/google`
5. **Criar SVGs de placeholder** em `public/media/` para todas as imagens que o site precisará — antes de escrever o conteúdo JSON, para que os paths já existam e possam ser referenciados imediatamente
6. **Atualizar `content/media/manifest.json`** com todas as imagens criadas no passo anterior, incluindo `src`, `alt`, `width`, `height` e `usedIn` corretos
7. Criar os componentes visuais em `src/components/sections/` com design único — garantindo que a interface de props de cada componente tenha comentários JSDoc descritivos em inglês em todos os campos
8. Criar os componentes de layout (Header, Footer) em `src/components/layout/`
9. Criar os componentes base necessários em `src/components/ui/`
10. Popular os arquivos em `content/pages/` com dados reais do cliente, referenciando os paths `.svg` dos placeholders
11. Criar `content/navigation.json` com a estrutura de menus
12. Adicionar reexporte de cada novo tipo de seção em `src/types/content.ts` e incluir no union `SectionData`
13. Implementar `src/lib/content.ts` (leitura de JSON/MDX)
14. Implementar `src/lib/section-registry.ts` (mapeamento type → componente)
15. Criar as rotas em `src/app/` (home + páginas dinâmicas)
16. Atualizar `ai/CONVENTIONS.md` com a estrutura específica deste site
17. Atualizar `ai/EDITING_GUIDE.md` com regras específicas deste site
18. Usar a skill `web-design-guidelines` para revisar UI/acessibilidade dos componentes criados
19. Usar a skill `vercel-react-best-practices` para revisar performance dos componentes React/Next.js
20. Rodar `npm run build` para confirmar que o build passa sem erros
21. Usar a skill `deploy-to-vercel` para fazer o deploy de preview na Vercel

---

## Ao editar conteúdo existente

1. Ler `ai/CONVENTIONS.md` e `ai/EDITING_GUIDE.md`
2. Ler a interface TypeScript do componente correspondente em `src/components/sections/` (ou `src/types/content.ts` para estruturas globais)
3. Ler o conteúdo atual do arquivo em `content/`
4. Aplicar a alteração solicitada respeitando os tipos e comentários JSDoc da interface
5. **Nunca** alterar componentes, tipos TypeScript ou código — apenas arquivos em `content/`

---

## Padrões de código

- TypeScript strict mode: sempre tipar props e retornos
- Componentes: function declarations com export nomeado (não default, exceto pages)
- Imports: usar alias `@/` para `src/`
- Tailwind v4: usar a nova sintaxe de configuração via CSS (`@theme`)
- Formatação: Prettier com plugin tailwindcss (já configurado)
- Sem bibliotecas de UI externas a menos que explicitamente solicitado

---

## Studio AI (/studio-ai)

The site includes an embedded AI-powered content editing studio at `/studio-ai`.

### Architecture

- Authentication: email + password via JWT (configured in `.env.local`)
- AI Agent: uses Anthropic API (Claude) with tools to read/edit content files
- Edit flow: all changes go to a preview branch → client approves → merge to main → auto-deploy
- The studio UI inherits the site's design tokens (colors, fonts, border-radius)

### Key files

- `src/lib/studio/` — all studio backend logic
  - `agent.ts` — AI orchestration (streaming tool loop)
  - `github.ts` — GitHub API wrapper (read, commit, branch, merge)
  - `session.ts` — edit session management (in-memory, one per user)
  - `tools.ts` — AI tool definitions (Anthropic API format)
  - `tool-handlers.ts` — tool execution (file reads, JSON edits, GitHub commits)
  - `system-prompt.ts` — builds the AI's context (reads ai/CONVENTIONS.md and ai/EDITING_GUIDE.md)
  - `auth.ts` — JWT authentication helpers
  - `use-chat.ts` — streaming response reader for the chat UI
- `src/components/studio/` — studio UI components
- `src/app/(studio)/` — studio pages (route group, does not affect public URLs)
- `src/app/api/studio/` — studio API routes
- `src/proxy.ts` — Next.js proxy (formerly middleware) — protects studio routes with JWT auth

### Environment variables required

See `.env.local`. Required vars:

- `ANTHROPIC_API_KEY` — for the AI agent
- `GITHUB_TOKEN` — for reading/writing content via GitHub API
- `GITHUB_OWNER`, `GITHUB_REPO` — repository coordinates
- `GITHUB_DEFAULT_BRANCH` — default branch (defaults to `main`)
- `STUDIO_USERS` — comma-separated `email:role` pairs (roles: `client` | `team`)
- `STUDIO_PASSWORD` — shared access password for all studio users
- `AUTH_SECRET` — JWT signing secret (keep long and random)

### When modifying the studio

- Do not change the public site components or routes
- Tool definitions in `tools.ts` must match the handlers in `tool-handlers.ts`
- The system prompt reads `ai/CONVENTIONS.md` and `ai/EDITING_GUIDE.md` at runtime (cached 5 min) — keep these up to date
- Session state is in-memory — it resets on server restart (acceptable for MVP)
- The studio uses route group `(studio)` — URLs start with `/studio-ai`, `src/proxy.ts` protects all routes except `/studio-ai/login` and `/api/studio/auth`
- The chat API (`/api/studio/chat`) enforces a 50-message / 100 KB payload limit per request
- Logging conventions: use `console.warn` for recoverable degraded states (e.g., missing guide files); use `console.error` for unexpected failures (e.g., tool input parse errors); do not leave `console.log` in server-side code

---

## Skills do agente

Este projeto usa Claude Code Agent Skills (`.agents/skills/`, com symlink em `.claude/skills/`):

- `deploy-to-vercel` — Deploy na Vercel. Usar ao final do workflow de criação de novo site e sempre que o usuário pedir deploy.
- `vercel-react-best-practices` — Padrões de performance React/Next.js. Usar após criar ou refatorar componentes.
- `vercel-composition-patterns` — Padrões de composição React. Usar ao projetar APIs de componentes reutilizáveis.
- `web-design-guidelines` — Revisão de UI/acessibilidade. Usar após criar todos os componentes visuais de um novo design.

**Regra:** Ao gerar um novo design completo, sempre executar `web-design-guidelines` e `vercel-react-best-practices` antes do deploy.
