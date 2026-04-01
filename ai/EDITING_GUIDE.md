# Guia de Edição de Conteúdo

Este documento contém as regras e procedimentos para edição de conteúdo do site via IA.

---

## Princípios gerais

1. **Só edite arquivos em `content/`** — nunca modifique componentes, tipos TypeScript, código ou configurações
2. **Confirme a estrutura pela interface TypeScript** — antes de editar, leia a interface do componente correspondente em `src/components/sections/` para entender quais campos são válidos, suas restrições (máx. de caracteres, valores permitidos) e quais são obrigatórios
3. **Nunca invente conteúdo** — se a solicitação é ambígua, peça esclarecimento
4. **Preserve a consistência** — ao adicionar itens a listas, siga o padrão dos itens existentes
5. **Confirme antes de aplicar** — mostre o que vai mudar (antes/depois) e peça confirmação

---

## O que pode ser editado

### Textos

- Títulos, subtítulos, descrições, parágrafos
- Labels de botões e CTAs
- Textos de depoimentos, nomes de autores
- Itens de lista (serviços, funcionalidades)
- Texto de copyright, taglines

### Dados de contato

- Telefone, WhatsApp, email
- Endereço (rua, bairro, cidade, estado, CEP)
- Links de redes sociais

### Imagens

- Substituir imagens existentes (requer upload da nova imagem)
- Atualizar textos alternativos (alt)
- Atualizar metadata no manifest

### Estrutura de conteúdo

- Adicionar/remover itens em listas existentes (ex: novo depoimento, novo serviço)
- Reordenar itens dentro de listas
- Reordenar seções dentro de uma página

### SEO

- Títulos e descrições de páginas
- Título e descrição padrão do site

### Navegação

- Labels e links do menu
- Texto e link do CTA do header
- Links do footer

---

## O que NÃO pode ser editado (perfil cliente)

- Criar novas páginas
- Adicionar novos tipos de seção
- Modificar componentes, tipos TypeScript ou código
- Alterar design tokens (cores, fontes) — encaminhar para a equipe
- Remover páginas inteiras

---

## Procedimento de edição

### Para editar um campo de texto:

1. Identifique em qual arquivo o campo está:
   - Dados globais → `site.config.json`
   - Menu → `navigation.json`
   - Conteúdo de página → `pages/[slug].data.json`

2. Leia a interface TypeScript do componente correspondente em `src/components/sections/` (ou `src/types/content.ts` para estruturas globais) para confirmar os campos válidos, restrições e tipos

3. Localize o campo exato usando o `id` da seção e o nome do campo

4. Aplique a alteração respeitando:
   - Limites de caracteres indicados nos comentários JSDoc da interface
   - Valores permitidos nos union types (ex: `"primary" | "secondary" | "whatsapp"`)
   - Campos sem `?` são obrigatórios e não podem ser removidos
   - Tipo do campo (string, number, array, object)

### Para adicionar um item a uma lista:

1. Leia os itens existentes para entender o padrão
2. Leia a interface do componente para ver quais campos são obrigatórios
3. Crie o novo item seguindo a mesma estrutura com todos os campos obrigatórios
4. Posicione o item na ordem desejada no array

### Para reordenar seções:

1. Leia o array `sections` da página
2. Mova o objeto da seção para a posição desejada
3. Não altere o conteúdo das seções, apenas a ordem

### Para atualizar uma imagem:

1. Receba o arquivo de imagem do solicitante
2. Salve em `public/media/` com nome descritivo em kebab-case
3. Atualize a referência no JSON (campo `src`)
4. Atualize o `alt` se necessário
5. Atualize `content/media/manifest.json`

---

## Exemplos de solicitações e como resolver

| Solicitação                      | Arquivo                    | Campo                                           |
| -------------------------------- | -------------------------- | ----------------------------------------------- |
| "Muda o telefone"                | `site.config.json`         | `contact.phone`                                 |
| "Troca o título do topo da home" | `pages/home.data.json`     | `sections[type=hero].data.headline`             |
| "Adiciona um novo depoimento"    | `pages/home.data.json`     | `sections[type=testimonials].data.items` (push) |
| "Muda o link do Instagram"       | `site.config.json`         | `social.instagram`                              |
| "Reordena os serviços"           | `pages/servicos.data.json` | `sections[type=features].data.items` (reorder)  |
| "Muda o texto do botão do menu"  | `navigation.json`          | `header.cta.label`                              |

---

## Notas específicas deste site

Este é o **template base** do sistema content-driven. Não há cliente real — os dados em `content/` são placeholders genéricos. As notas abaixo descrevem o comportamento atual do template.

### Páginas existentes

| Slug        | Arquivo                            | Seções                                |
| ----------- | ---------------------------------- | ------------------------------------- |
| `/`         | `content/pages/home.data.json`     | `hero`                                |
| `/servicos` | `content/pages/servicos.data.json` | `hero` → `features` (6 itens) → `cta` |

### Imagens placeholder

As imagens em `public/media/` são SVGs gerados como placeholders visuais:

| Arquivo                | Uso                        | Substitua por        |
| ---------------------- | -------------------------- | -------------------- |
| `logo.svg`             | Logo no Header             | Logo real do cliente |
| `hero-placeholder.svg` | Hero da home               | Foto real do cliente |
| `servicos-hero.svg`    | Hero da página de serviços | Foto real do cliente |

Para substituir: salve a nova imagem em `public/media/`, atualize `src` e `alt` no JSON da seção, e registre em `content/media/manifest.json`.

### Design tokens

As cores e fontes atuais são genéricas (azul `#2563eb`, amarelo `#f59e0b`, fonte Inter). Para personalizar um cliente, edite apenas `content/site.config.json` → campo `theme`. O CSS é regenerado automaticamente no próximo `npm run dev` ou `npm run build`.

### WhatsApp

O campo `contact.whatsapp` em `site.config.json` deve estar no formato internacional sem espaços nem símbolos: `5541999998888` (55 = Brasil, 41 = DDD, número). O botão CTA com `style: "whatsapp"` usa este número automaticamente se o `href` for montado como `https://wa.me/{whatsapp}`.

### Verificação após edição

Após editar o conteúdo, verifique que o JSON resultante está sintaticamente correto (sem erros de vírgula, aspas, etc.) e que respeita a estrutura da interface TypeScript do componente correspondente. Use um linter de JSON ou o próprio TypeScript para detectar inconsistências.
