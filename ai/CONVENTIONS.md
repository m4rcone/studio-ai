# Convenções de Conteúdo

Este documento explica como o conteúdo do site é organizado. Ele é usado por IAs e desenvolvedores para entender a estrutura e fazer edições corretas.

---

## Arquivos de conteúdo

### site.config.json

Dados globais do site. Usado por Header, Footer, meta tags e como fonte dos design tokens.

```json
{
  "brand": {
    "name": "Nome da Empresa",
    "tagline": "Slogan da empresa",
    "logo": "/media/logo.svg"
  },
  "theme": {
    "colors": {
      "primary": "#2563eb",
      "primary-foreground": "#ffffff",
      "secondary": "#f59e0b",
      "secondary-foreground": "#1a1a1a",
      "background": "#ffffff",
      "foreground": "#1a1a1a",
      "muted": "#f5f5f5",
      "muted-foreground": "#737373"
    },
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "borderRadius": "0.5rem"
  },
  "contact": {
    "phone": "(41) 9999-8888",
    "whatsapp": "5541999998888",
    "email": "contato@empresa.com",
    "address": {
      "street": "Rua Exemplo, 123",
      "neighborhood": "Centro",
      "city": "Curitiba",
      "state": "PR",
      "zip": "80000-000"
    }
  },
  "social": {
    "instagram": "https://instagram.com/empresa",
    "facebook": "https://facebook.com/empresa",
    "linkedin": null
  },
  "seo": {
    "defaultTitle": "Empresa | Tagline",
    "titleTemplate": "%s | Empresa",
    "defaultDescription": "Descrição padrão para SEO."
  }
}
```

### navigation.json

Estrutura de menus do site.

```json
{
  "header": {
    "links": [
      { "label": "Início", "href": "/" },
      { "label": "Serviços", "href": "/servicos" },
      { "label": "Sobre", "href": "/sobre" },
      { "label": "Contato", "href": "/contato" }
    ],
    "cta": {
      "label": "Agende agora",
      "href": "/contato",
      "style": "primary"
    }
  },
  "footer": {
    "links": [
      { "label": "Política de Privacidade", "href": "/privacidade" },
      { "label": "Termos de Uso", "href": "/termos" }
    ],
    "copyright": "© 2025 Empresa. Todos os direitos reservados."
  }
}
```

### pages/[slug].data.json

Cada página tem um arquivo de dados com esta estrutura:

```json
{
  "slug": "home",
  "meta": {
    "title": "Título da página para SEO",
    "description": "Descrição da página para SEO."
  },
  "sections": [
    {
      "type": "hero",
      "id": "hero-principal",
      "data": {}
    },
    {
      "type": "features",
      "id": "servicos-destaque",
      "data": {}
    }
  ]
}
```

Campos:

- `slug` — identificador da página, usado na URL (exceto "home" que vira `/`)
- `meta` — dados de SEO específicos da página
- `sections` — array ordenado de seções que compõem a página
- `sections[].type` — define qual componente renderiza essa seção
- `sections[].id` — identificador único da seção (kebab-case descritivo)
- `sections[].data` — dados passados como props ao componente

A **ordem das seções** no array define a **ordem na página**. Para reordenar seções, basta mover os objetos no array.

### pages/[slug].mdx (opcional)

Usado quando uma página tem conteúdo textual longo — como uma página "Sobre" com vários parágrafos. O MDX permite formatação rica (negrito, links, listas) de forma natural.

O `.mdx` complementa o `.data.json` da mesma página. Dados estruturados (seções, CTAs) ficam no JSON; texto corrido fica no MDX.

### media/manifest.json

Registro de todas as imagens usadas no site.

```json
{
  "images": [
    {
      "src": "/media/hero-clinica.webp",
      "alt": "Interior moderno da clínica",
      "width": 1920,
      "height": 1080,
      "usedIn": ["home.data.json"]
    }
  ]
}
```

---

## Tipos de seção disponíveis

| Tipo       | Descrição                                                                       | Interface TypeScript                                     | Props obrigatórias         |
| ---------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------- |
| `hero`     | Topo da página: título grande, subtítulo opcional, botão CTA e imagem lateral   | `src/components/sections/Hero.tsx` → `HeroProps`         | `headline`, `cta`, `image` |
| `features` | Grade de cards apresentando serviços ou diferenciais, com ícone, título e texto | `src/components/sections/Features.tsx` → `FeaturesProps` | `headline`, `items`        |
| `cta`      | Faixa de conversão com fundo `bg-primary`, título, texto opcional e botão       | `src/components/sections/Cta.tsx` → `CtaProps`           | `headline`, `cta`          |

### Notas de uso

**`hero`**

- Use no topo de qualquer página como primeira seção
- `cta.style` aceita `"primary"`, `"secondary"` ou `"whatsapp"`
- `image.src` deve começar com `/media/` e apontar para um arquivo em `public/media/`
- Imagens SVG são suportadas (usadas nos placeholders)

**`features`**

- Máximo de 9 itens; grade se adapta: 1 col (mobile) → 2 col (sm) → 3 col (lg)
- `items[].icon` é opcional — use emoji para ícones decorativos
- `items[].id` deve ser único dentro da lista e em kebab-case

**`cta`**

- Fundo sempre `bg-primary`; prefira `style: "primary"` no botão para contraste (fundo branco sobre azul)
- Use como última seção da página para converter visitantes

---

## Relação entre arquivos

```
site.config.json ──→ Header, Footer, Tailwind tokens, meta tags globais
navigation.json ───→ Header (menu), Footer (links)
pages/*.data.json ─→ Conteúdo de cada página (seções)
pages/*.mdx ───────→ Texto longo de páginas específicas
media/manifest.json → Registro e metadata de imagens
src/types/content.ts → Interfaces TypeScript (fonte de verdade da estrutura)
```

> **Nota:** Os tipos TypeScript com comentários JSDoc nos componentes e em `src/types/content.ts` são a fonte de verdade da estrutura dos dados. Para entender quais campos são aceitos em uma seção, leia a interface do componente correspondente em `src/components/sections/`.
