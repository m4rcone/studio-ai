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
npm run generate-theme # Regenera src/app/theme.generated.css a partir do site.config.json
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
- Referências no JSON usam o path relativo: `"/media/hero-clinica.webp"`
- Toda imagem OBRIGATORIAMENTE tem `alt` descritivo no JSON
- Formatos preferidos: `.webp` para fotos, `.svg` para ícones/logos
- O arquivo `content/media/manifest.json` registra todas as imagens com metadata

---

## Ao criar um novo site (workflow completo)

1. Ler o briefing do cliente (fornecido como contexto)
2. Substituir os dados placeholder em `content/site.config.json` (marca, cores, contato)
3. Rodar `npm run generate-theme` para regenerar `src/app/theme.generated.css` com as cores do cliente
4. Criar os componentes visuais em `src/components/sections/` com design único — garantindo que a interface de props de cada componente tenha comentários JSDoc descritivos em inglês em todos os campos
5. Criar os componentes de layout (Header, Footer) em `src/components/layout/`
6. Criar os componentes base necessários em `src/components/ui/`
7. Popular os arquivos em `content/pages/` com dados reais do cliente
8. Criar `content/navigation.json` com a estrutura de menus
9. Adicionar reexporte de cada novo tipo de seção em `src/types/content.ts` e incluir no union `SectionData`
10. Implementar `src/lib/content.ts` (leitura de JSON/MDX)
11. Implementar `src/lib/section-registry.ts` (mapeamento type → componente)
12. Criar as rotas em `src/app/` (home + páginas dinâmicas)
13. Atualizar `ai/CONVENTIONS.md` com a estrutura específica deste site
14. Atualizar `ai/EDITING_GUIDE.md` com regras específicas deste site
15. Rodar `npm run build` para confirmar que o build passa sem erros

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

## Skills do agente

Este projeto usa Claude Code Agent Skills (`.agents/skills/`, com symlink em `.claude/skills/`):

- `deploy-to-vercel` — Deploy na Vercel
- `vercel-react-best-practices` — Padrões de performance React/Next.js
- `vercel-composition-patterns` — Padrões de composição React
- `web-design-guidelines` — Revisão de UI/acessibilidade
