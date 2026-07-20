# Site Luiz Lopes Corretor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the static `luiz-lopes-site-mockup-v5.html` mockup as a full Next.js 15 real-estate broker site (public site + admin CRUD + Instagram/Facebook post generator) backed first by local mock data, then by Supabase, for Luiz Lopes Corretor de Imóveis (CRECI/MS 8283, Dourados/MS).

**Architecture:** Next.js 15 App Router + TypeScript strict, two route groups — `app/(site)` for the public pages and `app/admin` for the logged-in area. A single data-access layer (`lib/data/imoveis.ts`) is consumed by every page; its implementation reads from an in-repo mock array until the last two tasks, when it is swapped to query Supabase (Postgres + Storage + Auth) without changing any call site. Tailwind is configured with the client's exact named color/type tokens. All interactive bits (search typing animation, tab filter, admin forms, photo uploader, canvas post generator) are isolated Client Components; data fetching stays in Server Components.

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript (strict), Tailwind CSS 3.4, next/font (Google Fonts: Poppins, Inter, IBM Plex Mono), Supabase (`@supabase/supabase-js`, `@supabase/ssr`) — wired only in Tasks 21–24, no other UI/animation/DnD libraries.

## Global Constraints

- All text in the app is Portuguese, direct tone, no generic marketing cliché.
- No emoji anywhere as an icon — SVG/line icons only.
- Mobile-first layout — most clients access via WhatsApp/Instagram on a phone.
- `quadra`/`lote` and every `FichaTecnica` field are conditional on the imóvel's actual data — never render an empty "Quadra — / Lote —", never hardcode a fixed set of fields.
- Do not use the dotted "malha de loteamento" background pattern or the navy+lima color pairing anywhere except the social-media post generator templates (Task 26) — those are explicitly separate from the site's own visual identity.
- Palette (`ink #1C1C1C`, `ink-soft #767676`, `charcoal #2E2E2E`, `gold #A9832F`, `gold-soft #F3ECDC`, `paper #FAFAF8`, `line #E6E4DD`), typography (Poppins 800/900 display, Inter 400–700 body, IBM Plex Mono 500/600 data), and home-page structure are final — already through 5 client revision rounds. Do not present alternatives or reopen them.
- Tailwind color tokens must be named `ink`, `gold`, `paper`, `line`, etc. — never generic Tailwind names like `blue-900`.
- Every task ends with a step that runs the app and visits the relevant path/component so a human can see what was built.
- Supabase project provisioning and the `/admin/login` screen come last (Tasks 21–28), after every public-site task works against local mock data (Tasks 1–20).

---

## File Map

```
package.json, tsconfig.json, next.config.mjs, tailwind.config.ts, postcss.config.js
app/
  layout.tsx                          — root layout, fonts, global <html>/<body>
  globals.css                         — Tailwind directives + base resets
  (site)/
    layout.tsx                        — Nav + Footer wrapper for public pages
    page.tsx                          — home `/`
    imoveis/page.tsx                  — `/imoveis` listing + filters + search
    imoveis/[id]/page.tsx             — `/imoveis/[id]` detail
    sobre/page.tsx                    — `/sobre`
    contato/page.tsx                  — `/contato`
  admin/
    layout.tsx                        — admin shell (auth-gated by middleware)
    login/page.tsx                    — `/admin/login`
    imoveis/page.tsx                  — `/admin/imoveis` list
    imoveis/novo/page.tsx             — `/admin/imoveis/novo`
    imoveis/[id]/editar/page.tsx      — `/admin/imoveis/[id]/editar`
    imoveis/[id]/post/page.tsx        — `/admin/imoveis/[id]/post`
middleware.ts                         — protects /admin/* except /admin/login
lib/
  types.ts                            — Imovel, ImovelFoto, unions
  format.ts                           — formatarMoeda, formatarPreco, formatarSituacao
  mock/imoveis.ts                     — mock array (8 sample imóveis)
  data/imoveis.ts                     — data-access layer (mock, then Supabase)
  supabase/client.ts                  — browser Supabase client
  supabase/server.ts                  — server Supabase client (cookies)
components/
  site/Nav.tsx
  site/SearchHero.tsx
  site/TabFilter.tsx
  site/FichaTecnica.tsx
  site/FeaturedCard.tsx
  site/FeedItem.tsx
  site/HomeFeed.tsx
  site/Footer.tsx
  admin/ImovelForm.tsx
  admin/PhotoUploader.tsx
  admin/PostGenerator.tsx     — used by Task 27, `/admin/imoveis/[id]/post`
supabase/migrations/0001_init.sql
HANDOVER.md, ARCHITECTURE.md, README.md
```

---

### Task 1: Initialize Next.js 15 project, TypeScript strict, and dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/(site)/page.tsx`

**Interfaces:**
- Produces: a runnable `npm run dev` Next.js 15 App Router project on port 3000, root layout exporting default `RootLayout({ children })`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "luiz-lopes-corretor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.5.20",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "typescript": "5.7.3",
    "@types/node": "22.10.7",
    "@types/react": "19.0.7",
    "@types/react-dom": "19.0.3",
    "tailwindcss": "3.4.17",
    "postcss": "8.5.1",
    "autoprefixer": "10.4.20",
    "eslint": "9.39.5",
    "eslint-config-next": "15.5.20"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` written, no errors.

- [ ] **Step 3: Create `tsconfig.json` with strict mode**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules
.next
out
.env
.env.local
npm-debug.log*
.DS_Store
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 6: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  -webkit-text-size-adjust: 100%;
}

body {
  -webkit-font-smoothing: antialiased;
}

a {
  text-decoration: none;
  color: inherit;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
```

- [ ] **Step 7: Create minimal `app/layout.tsx` (placeholder, fonts added in Task 3)**

```tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder home page `app/(site)/page.tsx`**

```tsx
export default function HomePage() {
  return <main>Luiz Lopes Corretor — em construção</main>;
}
```

- [ ] **Step 9: Verify the dev server boots**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000`, no TypeScript or build errors in the terminal.

- [ ] **Step 10: Visit the page**

Visit `http://localhost:3000` in the browser — expect to see the plain text "Luiz Lopes Corretor — em construção". Stop the dev server (Ctrl+C) after confirming.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs .gitignore app/layout.tsx app/globals.css "app/(site)/page.tsx"
git commit -m "chore: initialize Next.js 15 project with TypeScript strict"
```

---

### Task 2: Configure Tailwind with the Luiz Lopes color/type tokens

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`

**Interfaces:**
- Consumes: `app/globals.css` from Task 1 (already has `@tailwind` directives).
- Produces: Tailwind utility classes `bg-ink`, `text-ink-soft`, `bg-charcoal`, `text-gold`, `bg-gold`, `bg-gold-soft`, `bg-paper`, `border-line`, and font families `font-display`, `font-body`, `font-mono` — every later component task relies on these exact names.

- [ ] **Step 1: Create `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 2: Create `tailwind.config.ts` with the approved tokens**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1C1C',
        'ink-soft': '#767676',
        charcoal: '#2E2E2E',
        gold: '#A9832F',
        'gold-soft': '#F3ECDC',
        paper: '#FAFAF8',
        line: '#E6E4DD',
      },
      fontFamily: {
        display: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Use a token class in the placeholder home page to prove the config loads**

Modify `app/(site)/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="bg-paper text-ink min-h-screen flex items-center justify-center font-display font-bold">
      Luiz Lopes Corretor — em construção
    </main>
  );
}
```

- [ ] **Step 4: Run dev server and confirm the token classes apply**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: page background is the off-white paper tone (`#FAFAF8`), text is near-black — confirms `bg-paper`/`text-ink` compiled (not left as unstyled default white/black, which would mean the config wasn't picked up).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts postcss.config.js "app/(site)/page.tsx"
git commit -m "chore: configure Tailwind with Luiz Lopes color and type tokens"
```

---

### Task 3: Root layout with fonts, folder structure, and initial HANDOVER/ARCHITECTURE docs

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/(site)/layout.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `HANDOVER.md`
- Create: `ARCHITECTURE.md`

**Interfaces:**
- Produces: `--font-poppins`, `--font-inter`, `--font-plex-mono` CSS variables available globally (used by `font-display`/`font-body`/`font-mono` from Task 2); route groups `app/(site)` and `app/admin` both resolvable.

- [ ] **Step 1: Load the three Google Fonts via `next/font` in the root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Poppins, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Luiz Lopes Corretor de Imóveis — Dourados/MS',
  description: 'Imóveis à venda e para alugar em Dourados/MS com Luiz Lopes, corretor CRECI/MS 8283.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create the public site layout `app/(site)/layout.tsx` (Nav/Footer added in later tasks, plain wrapper for now)**

```tsx
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Create the admin layout and placeholder index `app/admin/layout.tsx` / `app/admin/page.tsx`**

```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper text-ink font-body">{children}</div>;
}
```

```tsx
// app/admin/page.tsx
import Link from 'next/link';

export default function AdminIndexPage() {
  return (
    <main className="p-10">
      <h1 className="font-display font-bold text-xl">Área administrativa</h1>
      <p className="mt-2 text-ink-soft">
        <Link href="/admin/imoveis" className="text-gold font-semibold">Ir para a lista de imóveis</Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Create `HANDOVER.md` (initial version, written for someone with zero prior context)**

```markdown
# HANDOVER — Site Luiz Lopes Corretor

Este documento explica o projeto para quem nunca viu o código antes.

## O que é

Site institucional + portfólio de imóveis para Luiz Lopes, corretor de imóveis
(CRECI/MS 8283) em Dourados/MS. Tem duas partes:

- **Site público** (`app/(site)`): home, listagem de imóveis, detalhe de imóvel,
  sobre, contato.
- **Área administrativa** (`app/admin`): onde o corretor (ou seu filho) cadastra
  imóveis e gera artes para Instagram/Facebook.

## Estado atual (em construção)

Neste momento o site público está sendo construído contra **dados mock**
(um array TypeScript em `lib/mock/imoveis.ts`), sem banco de dados ainda.
Isso é intencional — todas as páginas e componentes públicos são construídos e
testados primeiro contra esses dados falsos, e o Supabase (banco real) só entra
no fim do desenvolvimento, quando o site já funciona de ponta a ponta.

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Estrutura de pastas

- `app/(site)/` — páginas públicas.
- `app/admin/` — área logada (ainda sem autenticação real nesta fase).
- `lib/types.ts` — modelo de dados (`Imovel`, `ImovelFoto`).
- `lib/mock/imoveis.ts` — dados de exemplo usados por todas as páginas.
- `lib/data/imoveis.ts` — camada de acesso a dados; hoje lê do mock, depois
  passará a consultar o Supabase sem mudar quem a usa.
- `components/site/` — componentes do site público.
- `components/admin/` — componentes da área administrativa.

Este arquivo será atualizado a cada fase do projeto.
```

- [ ] **Step 5: Create `ARCHITECTURE.md` (initial version)**

```markdown
# ARCHITECTURE — Site Luiz Lopes Corretor

## Stack

- **Next.js 15 (App Router) + TypeScript strict** — escolhido por permitir
  Server Components (dados buscados no servidor, sem expor lógica de acesso a
  dados no cliente) e por ser o caminho de deploy mais simples para um site
  pequeno com uma área admin.
- **Tailwind CSS** — tokens de cor/tipografia nomeados (`ink`, `gold`, `paper`,
  `line` etc.) em vez das cores genéricas do Tailwind, para casar exatamente
  com a paleta aprovada pelo cliente.
- **Supabase (Postgres + Storage + Auth)** — banco relacional gerenciado,
  upload de fotos e autenticação de um único usuário admin, sem precisar
  manter infraestrutura própria. Entra só no fim do projeto (ver seção
  "Camada de dados" abaixo).

## Camada de dados

Toda leitura/escrita de imóveis passa por `lib/data/imoveis.ts`. Nenhuma
página ou componente lê `lib/mock/imoveis.ts` ou o Supabase diretamente — elas
chamam funções como `getImoveis()`, `getImovelById()`. Isso significa que,
quando o Supabase for conectado, só o *interior* dessas funções muda; as
páginas que as chamam não precisam ser tocadas.

## Decisões pendentes de registro

Este arquivo será expandido a cada fase com as decisões tomadas.
```

- [ ] **Step 6: Run dev server and confirm both route groups resolve**

Run: `npm run dev`, visit `http://localhost:3000` (home, still the Task 2 placeholder) and `http://localhost:3000/admin` (shows "Área administrativa" heading with a link to `/admin/imoveis`, which will 404 until Task 25 — that's expected at this stage).

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx "app/(site)/layout.tsx" app/admin/layout.tsx app/admin/page.tsx HANDOVER.md ARCHITECTURE.md
git commit -m "docs: add HANDOVER and ARCHITECTURE, wire fonts and route groups"
```

---

### Task 4: TypeScript data model (`Imovel`, `ImovelFoto`)

**Files:**
- Create: `lib/types.ts`

**Interfaces:**
- Produces: `TipoImovel`, `Finalidade`, `StatusImovel` unions; `Imovel` and `ImovelFoto` interfaces — every subsequent task (mock data, components, pages, Supabase queries, admin forms) imports these exact names and shapes.

- [ ] **Step 1: Write `lib/types.ts`**

```ts
// Modelo de dados do imóvel. Espelha exatamente as tabelas `imoveis` e
// `imovel_fotos` que serão criadas no Supabase na Task 20 — os tipos são
// escritos primeiro porque todo o site público e o admin são construídos
// contra eles antes de existir um banco de verdade.

export type TipoImovel = 'terreno' | 'casa' | 'apartamento' | 'sobrado';

export type Finalidade = 'venda' | 'aluguel';

// 'disponivel' | 'reservado' | 'vendido' — importante para o corretor poder
// tirar um imóvel do site sem apagar o histórico dele.
export type StatusImovel = 'disponivel' | 'reservado' | 'vendido';

export interface ImovelFoto {
  id: string;
  imovel_id: string;
  url: string;
  ordem: number;
  is_capa: boolean;
}

export interface Imovel {
  id: string;
  titulo: string;
  tipo: TipoImovel;
  finalidade: Finalidade;
  endereco: string;
  bairro: string;

  // quadra/lote só existem para terrenos em loteamento — nullable e SEMPRE
  // tratados como opcionais na interface (ver lib/format.ts e
  // components/site/FichaTecnica.tsx: nunca renderizar quando nulos).
  quadra: string | null;
  lote: string | null;

  area_total_m2: number | null;
  area_construida_m2: number | null;
  // Texto livre, ex.: "10m x 20m" — só faz sentido para terrenos.
  dimensoes: string | null;

  quartos: number | null;
  vagas: number | null;
  condominio_valor: number | null;

  preco: number;
  preco_observacao: string | null;

  // Ex.: ["quitado", "escriturado"]
  situacao: string[];

  descricao: string;
  status: StatusImovel;

  // true faz o imóvel aparecer no cartão-documento em destaque da home.
  destaque: boolean;

  created_at: string;
  updated_at: string;

  fotos: ImovelFoto[];
}
```

- [ ] **Step 2: Verify the project still type-checks**

Run: `npx tsc --noEmit`
Expected: no errors (the file has no consumers yet, so this only confirms the syntax is valid TypeScript strict).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Imovel and ImovelFoto data model types"
```

---

### Task 5: Formatting utilities (`lib/format.ts`)

**Files:**
- Create: `lib/format.ts`
- Test: `lib/format.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest` and a `test` script)

**Interfaces:**
- Consumes: `Imovel` from `lib/types.ts` (Task 4).
- Produces: `formatarMoeda(valor: number): string`, `formatarPreco(imovel: Pick<Imovel, 'preco' | 'finalidade'>): string`, `formatarSituacao(situacao: string[]): string` — used by `FichaTecnica`, `FeaturedCard`, `FeedItem`, and the detail page in later tasks.

- [ ] **Step 1: Add `vitest` as a dev dependency and a `test` script**

Modify `package.json` `devDependencies` (add) and `scripts` (add `"test": "vitest run"`):

```json
    "vitest": "2.1.8"
```

Run: `npm install`

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 2: Write the failing test `lib/format.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { formatarMoeda, formatarPreco, formatarSituacao } from './format';

describe('formatarMoeda', () => {
  it('formata em reais sem casas decimais', () => {
    expect(formatarMoeda(105000)).toBe('R$ 105.000');
  });
});

describe('formatarPreco', () => {
  it('adiciona "/mês" para aluguel', () => {
    expect(formatarPreco({ preco: 1800, finalidade: 'aluguel' })).toBe('R$ 1.800/mês');
  });

  it('não adiciona sufixo para venda', () => {
    expect(formatarPreco({ preco: 320000, finalidade: 'venda' })).toBe('R$ 320.000');
  });
});

describe('formatarSituacao', () => {
  it('junta itens com "e" e capitaliza', () => {
    expect(formatarSituacao(['quitado', 'escriturado'])).toBe('Quitado e escriturado');
  });

  it('retorna string vazia para lista vazia', () => {
    expect(formatarSituacao([])).toBe('');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/format.test.ts`
Expected: FAIL with "Cannot find module './format'" (file doesn't exist yet).

- [ ] **Step 4: Write `lib/format.ts`**

```ts
import type { Imovel } from './types';

// R$ 105.000 — sempre sem casas decimais (preços de imóvel não usam centavos
// na forma como o corretor os informa).
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

// Aluguel mostra "/mês" (ex.: "R$ 1.800/mês"); venda mostra só o valor.
export function formatarPreco(imovel: Pick<Imovel, 'preco' | 'finalidade'>): string {
  const base = formatarMoeda(imovel.preco);
  return imovel.finalidade === 'aluguel' ? `${base}/mês` : base;
}

// ["quitado", "escriturado"] -> "Quitado e escriturado"
export function formatarSituacao(situacao: string[]): string {
  if (situacao.length === 0) return '';
  const capitalizadas = situacao.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  if (capitalizadas.length === 1) return capitalizadas[0]!;
  return `${capitalizadas.slice(0, -1).join(', ')} e ${capitalizadas[capitalizadas.length - 1]}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/format.test.ts`
Expected: PASS, 4 tests passed.

- [ ] **Step 6: Commit**

```bash
git add lib/format.ts lib/format.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: add price and situacao formatting utilities"
```

---

### Task 6: Mock data and data-access layer (`lib/mock/imoveis.ts`, `lib/data/imoveis.ts`)

**Files:**
- Create: `lib/mock/imoveis.ts`
- Create: `lib/data/imoveis.ts`
- Test: `lib/data/imoveis.test.ts`

**Interfaces:**
- Consumes: `Imovel`, `ImovelFoto` from `lib/types.ts` (Task 4).
- Produces: `getImoveis(filtros?: ImovelFiltros): Promise<Imovel[]>`, `getImovelById(id: string): Promise<Imovel | undefined>`, `getImovelDestaque(): Promise<Imovel | undefined>`, `searchImoveis(imoveis: Imovel[], termo: string): Imovel[]`, and the `ImovelFiltros` type (`{ finalidade?: Finalidade; tipo?: TipoImovel; bairro?: string; precoMin?: number; precoMax?: number }`). Every public page (Tasks 14–18) calls only these functions — Task 20 swaps their internals to Supabase without changing these signatures.

- [ ] **Step 1: Write the mock data `lib/mock/imoveis.ts` (8 imóveis covering every tipo/finalidade, with and without quadra/lote)**

```ts
import type { Imovel } from '../types';

// Dados de exemplo. Cobrem os 4 tipos, as 2 finalidades, e tanto o caso
// "tem quadra/lote" (terreno em loteamento) quanto "não tem" (terreno
// avulso, ou qualquer casa/apto/sobrado — quadra/lote nunca se aplica a eles).
export const mockImoveis: Imovel[] = [
  {
    id: '1',
    titulo: 'Terreno plano — Cidade Jardim I',
    tipo: 'terreno',
    finalidade: 'venda',
    endereco: 'Rua Bernardo Artêmio Zanetti, 2475',
    bairro: 'Cidade Jardim I',
    quadra: '14',
    lote: '08',
    area_total_m2: 200,
    area_construida_m2: null,
    dimensoes: '10m x 20m',
    quartos: null,
    vagas: null,
    condominio_valor: null,
    preco: 105000,
    preco_observacao: 'aceito propostas',
    situacao: ['quitado', 'escriturado'],
    descricao:
      'Terreno plano, pronto para construir, em rua tranquila da Cidade Jardim I. Próximo a comércio e escolas.',
    status: 'disponivel',
    destaque: true,
    created_at: '2026-06-01T12:00:00.000Z',
    updated_at: '2026-06-01T12:00:00.000Z',
    fotos: [
      { id: 'f1', imovel_id: '1', url: '/mock-fotos/terreno-1-a.jpg', ordem: 0, is_capa: true },
      { id: 'f2', imovel_id: '1', url: '/mock-fotos/terreno-1-b.jpg', ordem: 1, is_capa: false },
    ],
  },
  {
    id: '2',
    titulo: 'Casa 3 quartos — Jardim Água Boa',
    tipo: 'casa',
    finalidade: 'aluguel',
    endereco: 'Rua das Palmeiras, 120',
    bairro: 'Jardim Água Boa',
    quadra: null,
    lote: null,
    area_total_m2: null,
    area_construida_m2: 110,
    dimensoes: null,
    quartos: 3,
    vagas: 2,
    condominio_valor: null,
    preco: 1800,
    preco_observacao: null,
    situacao: ['reformada'],
    descricao: 'Casa reformada com 3 quartos, quintal amplo e garagem para 2 carros.',
    status: 'disponivel',
    destaque: false,
    created_at: '2026-06-02T12:00:00.000Z',
    updated_at: '2026-06-02T12:00:00.000Z',
    fotos: [{ id: 'f3', imovel_id: '2', url: '/mock-fotos/casa-2-a.jpg', ordem: 0, is_capa: true }],
  },
  {
    id: '3',
    titulo: 'Sobrado 4 quartos — Vila Progresso',
    tipo: 'sobrado',
    finalidade: 'venda',
    endereco: 'Av. Marcelino Pires, 890',
    bairro: 'Vila Progresso',
    quadra: null,
    lote: null,
    area_total_m2: null,
    area_construida_m2: 180,
    dimensoes: null,
    quartos: 4,
    vagas: 2,
    condominio_valor: null,
    preco: 320000,
    preco_observacao: null,
    situacao: ['escriturado'],
    descricao: 'Sobrado amplo com 4 quartos (1 suíte), sala de estar e jantar integradas, área de serviço.',
    status: 'disponivel',
    destaque: false,
    created_at: '2026-06-03T12:00:00.000Z',
    updated_at: '2026-06-03T12:00:00.000Z',
    fotos: [{ id: 'f4', imovel_id: '3', url: '/mock-fotos/sobrado-3-a.jpg', ordem: 0, is_capa: true }],
  },
  {
    id: '4',
    titulo: 'Terreno — Cidade Jardim I',
    tipo: 'terreno',
    finalidade: 'venda',
    endereco: 'Rua Bernardo Artêmio Zanetti, 2510',
    bairro: 'Cidade Jardim I',
    quadra: null,
    lote: null,
    area_total_m2: 200,
    area_construida_m2: null,
    dimensoes: '10m x 20m',
    quartos: null,
    vagas: null,
    condominio_valor: null,
    preco: 98000,
    preco_observacao: null,
    situacao: ['quitado'],
    descricao: 'Terreno de esquina, ótima localização, pronto para construir.',
    status: 'disponivel',
    destaque: false,
    created_at: '2026-06-04T12:00:00.000Z',
    updated_at: '2026-06-04T12:00:00.000Z',
    fotos: [{ id: 'f5', imovel_id: '4', url: '/mock-fotos/terreno-4-a.jpg', ordem: 0, is_capa: true }],
  },
  {
    id: '5',
    titulo: 'Apartamento 2 quartos — Jardim Água Boa',
    tipo: 'apartamento',
    finalidade: 'aluguel',
    endereco: 'Rua Hayel Bon Faker, 455',
    bairro: 'Jardim Água Boa',
    quadra: null,
    lote: null,
    area_total_m2: null,
    area_construida_m2: 62,
    dimensoes: null,
    quartos: 2,
    vagas: 1,
    condominio_valor: 320,
    preco: 1400,
    preco_observacao: null,
    situacao: [],
    descricao: 'Apartamento de 2 quartos em prédio com portaria 24h, próximo ao centro.',
    status: 'disponivel',
    destaque: false,
    created_at: '2026-06-05T12:00:00.000Z',
    updated_at: '2026-06-05T12:00:00.000Z',
    fotos: [{ id: 'f6', imovel_id: '5', url: '/mock-fotos/apto-5-a.jpg', ordem: 0, is_capa: true }],
  },
  {
    id: '6',
    titulo: 'Apartamento 3 quartos — Centro',
    tipo: 'apartamento',
    finalidade: 'venda',
    endereco: 'Rua Coronel Ponciano, 1020',
    bairro: 'Centro',
    quadra: null,
    lote: null,
    area_total_m2: null,
    area_construida_m2: 85,
    dimensoes: null,
    quartos: 3,
    vagas: 2,
    condominio_valor: 450,
    preco: 380000,
    preco_observacao: 'aceita financiamento',
    situacao: ['escriturado'],
    descricao: 'Apartamento amplo no Centro, 3 quartos sendo 1 suíte, 2 vagas de garagem cobertas.',
    status: 'disponivel',
    destaque: false,
    created_at: '2026-06-06T12:00:00.000Z',
    updated_at: '2026-06-06T12:00:00.000Z',
    fotos: [{ id: 'f7', imovel_id: '6', url: '/mock-fotos/apto-6-a.jpg', ordem: 0, is_capa: true }],
  },
  {
    id: '7',
    titulo: 'Casa 2 quartos — Vila Industrial',
    tipo: 'casa',
    finalidade: 'venda',
    endereco: 'Rua Ivo Alves da Rocha, 233',
    bairro: 'Vila Industrial',
    quadra: null,
    lote: null,
    area_total_m2: null,
    area_construida_m2: 75,
    dimensoes: null,
    quartos: 2,
    vagas: 1,
    condominio_valor: null,
    preco: 175000,
    preco_observacao: null,
    situacao: [],
    descricao: 'Casa simples de 2 quartos, ideal para primeiro imóvel ou investimento.',
    status: 'reservado',
    destaque: false,
    created_at: '2026-06-07T12:00:00.000Z',
    updated_at: '2026-06-07T12:00:00.000Z',
    fotos: [{ id: 'f8', imovel_id: '7', url: '/mock-fotos/casa-7-a.jpg', ordem: 0, is_capa: true }],
  },
  {
    id: '8',
    titulo: 'Terreno de esquina — Cidade Jardim II',
    tipo: 'terreno',
    finalidade: 'venda',
    endereco: 'Rua Projetada B, esquina com Rua C',
    bairro: 'Cidade Jardim II',
    quadra: '02',
    lote: '15',
    area_total_m2: 360,
    area_construida_m2: null,
    dimensoes: '12m x 30m',
    quartos: null,
    vagas: null,
    condominio_valor: null,
    preco: 165000,
    preco_observacao: null,
    situacao: ['quitado', 'escriturado'],
    descricao: 'Terreno de esquina, maior testada, ótimo para construir com projeto comercial ou residencial.',
    status: 'disponivel',
    destaque: false,
    created_at: '2026-06-08T12:00:00.000Z',
    updated_at: '2026-06-08T12:00:00.000Z',
    fotos: [{ id: 'f9', imovel_id: '8', url: '/mock-fotos/terreno-8-a.jpg', ordem: 0, is_capa: true }],
  },
];
```

- [ ] **Step 2: Write the failing test `lib/data/imoveis.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { getImoveis, getImovelById, getImovelDestaque, searchImoveis } from './imoveis';
import { mockImoveis } from '../mock/imoveis';

describe('getImoveis', () => {
  it('retorna todos os imóveis disponíveis por padrão', async () => {
    const resultado = await getImoveis();
    expect(resultado.every((i) => i.status !== 'vendido')).toBe(true);
  });

  it('filtra por tipo', async () => {
    const resultado = await getImoveis({ tipo: 'terreno' });
    expect(resultado.every((i) => i.tipo === 'terreno')).toBe(true);
    expect(resultado.length).toBeGreaterThan(0);
  });

  it('filtra por finalidade', async () => {
    const resultado = await getImoveis({ finalidade: 'aluguel' });
    expect(resultado.every((i) => i.finalidade === 'aluguel')).toBe(true);
  });

  it('filtra por faixa de preço', async () => {
    const resultado = await getImoveis({ precoMin: 100000, precoMax: 200000 });
    expect(resultado.every((i) => i.preco >= 100000 && i.preco <= 200000)).toBe(true);
  });
});

describe('getImovelById', () => {
  it('retorna o imóvel correspondente', async () => {
    const imovel = await getImovelById('1');
    expect(imovel?.titulo).toBe('Terreno plano — Cidade Jardim I');
  });

  it('retorna undefined para id inexistente', async () => {
    const imovel = await getImovelById('inexistente');
    expect(imovel).toBeUndefined();
  });
});

describe('getImovelDestaque', () => {
  it('retorna o imóvel marcado como destaque', async () => {
    const destaque = await getImovelDestaque();
    expect(destaque?.destaque).toBe(true);
  });
});

describe('searchImoveis', () => {
  it('encontra por termo no título, bairro ou endereço', () => {
    const resultado = searchImoveis(mockImoveis, 'cidade jardim');
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.every((i) => i.bairro.toLowerCase().includes('cidade jardim'))).toBe(true);
  });

  it('retorna lista vazia sem correspondência', () => {
    expect(searchImoveis(mockImoveis, 'xyzxyzxyz')).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/data/imoveis.test.ts`
Expected: FAIL with "Cannot find module './imoveis'" (file doesn't exist under `lib/data/` yet).

- [ ] **Step 4: Write `lib/data/imoveis.ts`**

```ts
// Camada de acesso a dados. Toda página/componente do site chama SOMENTE as
// funções deste arquivo — nunca importa `lib/mock/imoveis.ts` diretamente.
// Hoje a implementação filtra o array mock em memória; na Task 20 o corpo
// destas funções passa a consultar o Supabase, mas a assinatura (nomes,
// parâmetros, tipo de retorno) não muda, então nenhuma página precisa ser
// tocada quando isso acontecer. Por isso todas já são `async`.

import type { Finalidade, Imovel, TipoImovel } from '../types';
import { mockImoveis } from '../mock/imoveis';

export interface ImovelFiltros {
  finalidade?: Finalidade;
  tipo?: TipoImovel;
  bairro?: string;
  precoMin?: number;
  precoMax?: number;
}

// Imóveis "vendidos" saem de circulação no site público mas continuam no
// banco para o corretor manter o histórico (ver StatusImovel em lib/types.ts).
function visivelNoSite(imovel: Imovel): boolean {
  return imovel.status !== 'vendido';
}

export async function getImoveis(filtros: ImovelFiltros = {}): Promise<Imovel[]> {
  return mockImoveis.filter((imovel) => {
    if (!visivelNoSite(imovel)) return false;
    if (filtros.finalidade && imovel.finalidade !== filtros.finalidade) return false;
    if (filtros.tipo && imovel.tipo !== filtros.tipo) return false;
    if (filtros.bairro && imovel.bairro !== filtros.bairro) return false;
    if (filtros.precoMin !== undefined && imovel.preco < filtros.precoMin) return false;
    if (filtros.precoMax !== undefined && imovel.preco > filtros.precoMax) return false;
    return true;
  });
}

export async function getImovelById(id: string): Promise<Imovel | undefined> {
  return mockImoveis.find((imovel) => imovel.id === id);
}

export async function getImovelDestaque(): Promise<Imovel | undefined> {
  return mockImoveis.find((imovel) => imovel.destaque && visivelNoSite(imovel));
}

// Busca por texto livre — usada tanto pelo hero da home (via redirect para
// /imoveis?q=) quanto pela busca real de /imoveis. Recebe a lista já
// filtrada/paginada de fora para não duplicar a lógica de `getImoveis`.
export function searchImoveis(imoveis: Imovel[], termo: string): Imovel[] {
  const alvo = termo.trim().toLowerCase();
  if (!alvo) return imoveis;
  return imoveis.filter((imovel) =>
    [imovel.titulo, imovel.bairro, imovel.endereco, imovel.descricao]
      .join(' ')
      .toLowerCase()
      .includes(alvo)
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/data/imoveis.test.ts`
Expected: PASS, 8 tests passed.

- [ ] **Step 6: Commit**

```bash
git add lib/mock/imoveis.ts lib/data/imoveis.ts lib/data/imoveis.test.ts
git commit -m "feat: add mock imovel data and data-access layer"
```

---

### Task 7: Nav component

**Files:**
- Create: `components/site/Nav.tsx`

**Interfaces:**
- Produces: `Nav` default export, a Client Component (needs `usePathname` for the active-link state) rendered by `app/(site)/layout.tsx` in Task 15.

- [ ] **Step 1: Write `components/site/Nav.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WHATSAPP_NUMERO = '5567984294178';
const WHATSAPP_MENSAGEM_PADRAO = 'Olá! Vim pelo site e gostaria de mais informações.';

const LINKS = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between gap-4 px-6 md:px-14 py-5 border-b border-line sticky top-0 bg-paper/95 backdrop-blur-sm z-10">
      <Link href="/" className="flex items-center gap-2.5">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path
            d="M50 10 L90 42 L82 42 L82 88 L60 88 L60 55 L40 55 L40 88 L18 88 L18 42 L10 42 Z"
            stroke="#1C1C1C"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M50 30 L50 78 Q50 88 60 88" stroke="#1C1C1C" strokeWidth="5" fill="none" />
        </svg>
        <span>
          <span className="block font-display font-extrabold text-[16px] leading-tight">LUIZ LOPES</span>
          <span className="block font-semibold text-[9px] text-ink-soft tracking-wide uppercase">
            Corretor · CRECI/MS 8283
          </span>
        </span>
      </Link>

      <div className="hidden md:flex gap-7 font-semibold text-[13.5px]">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'text-gold' : 'text-ink'}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAGEM_PADRAO)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-display font-bold text-[13px] px-5 py-3 rounded-lg border-[1.5px] border-ink text-ink"
      >
        Fale no WhatsApp
      </a>
    </nav>
  );
}
```

- [ ] **Step 2: Temporarily render `Nav` on the home page to verify it visually**

Modify `app/(site)/page.tsx`:

```tsx
import Nav from '@/components/site/Nav';

export default function HomePage() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: sticky nav bar with the house-monogram logo, "LUIZ LOPES / Corretor · CRECI/MS 8283", the three links (Início in gold since it's the active route), and an outlined "Fale no WhatsApp" button that opens WhatsApp in a new tab when clicked.

- [ ] **Step 4: Commit**

```bash
git add components/site/Nav.tsx "app/(site)/page.tsx"
git commit -m "feat: add site Nav component"
```

---

### Task 8: SearchHero component (typing/erasing animation ported from the mockup)

**Files:**
- Create: `components/site/SearchHero.tsx`

**Interfaces:**
- Produces: `SearchHero` default export, a Client Component with no required props, used standalone on the home page (Task 15) and adapted (without the animation) for the `/imoveis` search field (Task 16, which builds its own static-placeholder input rather than importing this component — see Task 16).

- [ ] **Step 1: Write `components/site/SearchHero.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// As mesmas frases de exemplo do mockup v5, cicladas como placeholder do
// campo — a mesma técnica de "digitar e apagar" do campo de busca do
// realtor.com, adaptada em português e portada do <script> vanilla-JS do
// mockup para um efeito React com useEffect + setTimeout.
const FRASES = [
  'terreno plano perto do centro',
  'casa com 3 quartos e quintal',
  'apartamento pra alugar até R$ 1.500',
  'sobrado com 2 vagas de garagem',
  'terreno de esquina na Cidade Jardim',
];

export default function SearchHero() {
  const [placeholder, setPlaceholder] = useState('');
  const [busca, setBusca] = useState('');
  const router = useRouter();

  const fraseIndex = useRef(0);
  const charIndex = useRef(0);
  const apagando = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function tick() {
      const atual = FRASES[fraseIndex.current]!;

      if (!apagando.current) {
        charIndex.current++;
        setPlaceholder(atual.slice(0, charIndex.current));
        if (charIndex.current === atual.length) {
          apagando.current = true;
          timeoutRef.current = setTimeout(tick, 1400);
          return;
        }
      } else {
        charIndex.current--;
        setPlaceholder(atual.slice(0, charIndex.current));
        if (charIndex.current === 0) {
          apagando.current = false;
          fraseIndex.current = (fraseIndex.current + 1) % FRASES.length;
        }
      }

      timeoutRef.current = setTimeout(tick, apagando.current ? 35 : 55);
    }

    timeoutRef.current = setTimeout(tick, 55);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (busca.trim()) params.set('q', busca.trim());
    router.push(`/imoveis${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <section className="px-6 md:px-14 pt-14 md:pt-16 pb-8 max-w-2xl mx-auto text-center">
      <p className="font-display font-bold text-[11.5px] tracking-[1.8px] uppercase text-gold">
        Dourados / MS
      </p>
      <h1 className="font-display font-black text-[28px] md:text-[34px] leading-tight my-2.5 mb-7">
        Descreva o imóvel que você <span className="text-gold">procura</span>
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 bg-white border-[1.5px] border-ink rounded-2xl py-2 pl-5 pr-2 max-w-xl mx-auto"
      >
        <label htmlFor="busca-hero" className="sr-only">
          Buscar imóvel
        </label>
        <input
          id="busca-hero"
          type="text"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 text-left text-[15px] text-ink outline-none bg-transparent placeholder:text-ink"
        />
        <button type="submit" className="font-display font-bold text-[13px] px-5 py-3 rounded-lg bg-gold text-white shrink-0">
          Buscar
        </button>
      </form>
      <p className="text-xs text-ink-soft mt-3.5">
        Ex.: &quot;terreno plano perto do centro&quot; ou &quot;casa com 3 quartos e quintal&quot;
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Render it on the home page to verify visually**

Modify `app/(site)/page.tsx`:

```tsx
import Nav from '@/components/site/Nav';
import SearchHero from '@/components/site/SearchHero';

export default function HomePage() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
      <SearchHero />
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: the search input's placeholder types and erases each example phrase in a loop; typing real text into the field and pressing "Buscar" (or Enter) navigates to `/imoveis?q=<texto>` (will 404 until Task 16 — expected at this stage).

- [ ] **Step 4: Commit**

```bash
git add components/site/SearchHero.tsx "app/(site)/page.tsx"
git commit -m "feat: add SearchHero component with typing animation"
```

---

### Task 9: TabFilter component

**Files:**
- Create: `components/site/TabFilter.tsx`

**Interfaces:**
- Produces: `TabFilter` default export, Client Component. Props: `{ value: string; onChange: (value: string) => void }`. Options are fixed to the 5 approved tabs (`todos`, `terreno`, `casa`, `apartamento`, `aluguel`) — consumed by `HomeFeed` (Task 14) and by the `/imoveis` page (Task 16).

- [ ] **Step 1: Write `components/site/TabFilter.tsx`**

```tsx
'use client';

export interface TabFilterOption {
  value: string;
  label: string;
}

export const TAB_FILTER_OPTIONS: TabFilterOption[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'terreno', label: 'Terrenos' },
  { value: 'casa', label: 'Casas' },
  { value: 'apartamento', label: 'Apartamentos' },
  { value: 'aluguel', label: 'Aluguel' },
];

interface TabFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TabFilter({ value, onChange }: TabFilterProps) {
  return (
    <div className="flex gap-5 md:gap-7 justify-center flex-wrap px-6 pt-8 text-[13.5px] font-semibold">
      {TAB_FILTER_OPTIONS.map((option) => {
        const ativo = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`pb-3.5 border-b-2 ${
              ativo ? 'text-ink border-gold' : 'text-ink-soft border-transparent'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Render it on the home page with local state to verify visually**

Modify `app/(site)/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Nav from '@/components/site/Nav';
import SearchHero from '@/components/site/SearchHero';
import TabFilter from '@/components/site/TabFilter';

export default function HomePage() {
  const [tab, setTab] = useState('todos');

  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
      <SearchHero />
      <TabFilter value={tab} onChange={setTab} />
      <p className="text-center text-ink-soft text-sm py-6">Aba ativa: {tab}</p>
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: clicking each tab (Todos/Terrenos/Casas/Apartamentos/Aluguel) underlines it in gold and updates the "Aba ativa" text below. Note: this makes the home page a Client Component temporarily — Task 15 restructures it back into a Server Component that fetches data, with only the interactive slice (`HomeFeed`, Task 14) as a client child.

- [ ] **Step 4: Commit**

```bash
git add components/site/TabFilter.tsx "app/(site)/page.tsx"
git commit -m "feat: add TabFilter component"
```

---

### Task 10: FichaTecnica component (dynamic fields per tipo)

**Files:**
- Create: `components/site/FichaTecnica.tsx`
- Test: `components/site/FichaTecnica.test.ts`

**Interfaces:**
- Consumes: `Imovel` from `lib/types.ts`, `formatarSituacao`/`formatarMoeda` from `lib/format.ts`.
- Produces: `buildFichaFields(imovel: Imovel): { label: string; value: string }[]` (pure function, exported for testing and reuse) and `FichaTecnica` default export — a component with props `{ imovel: Imovel; variant?: 'grid' | 'inline' }`. This is THE implementation of the spec's core rule: fields are entirely conditional on which data the imóvel has, never fixed. Consumed by `FeaturedCard` (Task 11), `FeedItem` (Task 12), and the detail page (Task 17).

- [ ] **Step 1: Write the failing test `components/site/FichaTecnica.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { buildFichaFields } from './FichaTecnica';
import { mockImoveis } from '@/lib/mock/imoveis';
import type { Imovel } from '@/lib/types';

const terrenoComQuadraLote = mockImoveis.find((i) => i.id === '1')!; // tem quadra/lote
const terrenoSemQuadraLote = mockImoveis.find((i) => i.id === '4')!; // não tem
const casa = mockImoveis.find((i) => i.id === '2')!;
const apartamentoComCondominio = mockImoveis.find((i) => i.id === '5')!;

describe('buildFichaFields', () => {
  it('inclui "Localização no loteamento" quando quadra/lote existem', () => {
    const campos = buildFichaFields(terrenoComQuadraLote);
    const campo = campos.find((c) => c.label === 'Localização no loteamento');
    expect(campo?.value).toBe('Quadra 14 · Lote 08');
  });

  it('NUNCA inclui o campo de quadra/lote quando eles são null (regra central do spec)', () => {
    const campos = buildFichaFields(terrenoSemQuadraLote);
    expect(campos.find((c) => c.label === 'Localização no loteamento')).toBeUndefined();
  });

  it('terreno mostra área total, dimensões, bairro e situação — nunca quartos/vagas', () => {
    const campos = buildFichaFields(terrenoComQuadraLote);
    const labels = campos.map((c) => c.label);
    expect(labels).toEqual(['Área total', 'Dimensões', 'Bairro', 'Localização no loteamento', 'Situação']);
  });

  it('casa mostra quartos, vagas, área construída e situação — nunca dimensões de terreno', () => {
    const campos = buildFichaFields(casa);
    const labels = campos.map((c) => c.label);
    expect(labels).toEqual(['Quartos', 'Vagas', 'Área construída', 'Situação']);
  });

  it('omite "Situação" quando o array situacao está vazio', () => {
    const semSituacao: Imovel = { ...casa, situacao: [] };
    const campos = buildFichaFields(semSituacao);
    expect(campos.find((c) => c.label === 'Situação')).toBeUndefined();
  });

  it('apartamento só mostra Condomínio quando condominio_valor está preenchido', () => {
    const campos = buildFichaFields(apartamentoComCondominio);
    expect(campos.find((c) => c.label === 'Condomínio')?.value).toBe('R$ 320');

    const semCondominio: Imovel = { ...apartamentoComCondominio, condominio_valor: null };
    expect(buildFichaFields(semCondominio).find((c) => c.label === 'Condomínio')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/site/FichaTecnica.test.ts`
Expected: FAIL with "Cannot find module './FichaTecnica'".

- [ ] **Step 3: Write `components/site/FichaTecnica.tsx`**

```tsx
import type { Imovel } from '@/lib/types';
import { formatarMoeda, formatarSituacao } from '@/lib/format';

interface CampoFicha {
  label: string;
  value: string;
}

// Regra central do spec: os campos exibidos dependem inteiramente de quais
// dados o imóvel tem preenchido, nunca de uma lista fixa. Um campo só entra
// no array se o valor correspondente não for null/undefined/vazio — por
// isso não existe "Quadra — / Lote —" vazio em lugar nenhum da interface.
export function buildFichaFields(imovel: Imovel): CampoFicha[] {
  const campos: CampoFicha[] = [];

  if (imovel.tipo === 'terreno') {
    if (imovel.area_total_m2 != null) {
      campos.push({ label: 'Área total', value: `${imovel.area_total_m2} m²` });
    }
    if (imovel.dimensoes) {
      campos.push({ label: 'Dimensões', value: imovel.dimensoes });
    }
    if (imovel.bairro) {
      campos.push({ label: 'Bairro', value: imovel.bairro });
    }
    if (imovel.quadra || imovel.lote) {
      const partes: string[] = [];
      if (imovel.quadra) partes.push(`Quadra ${imovel.quadra}`);
      if (imovel.lote) partes.push(`Lote ${imovel.lote}`);
      campos.push({ label: 'Localização no loteamento', value: partes.join(' · ') });
    }
  } else if (imovel.tipo === 'casa' || imovel.tipo === 'sobrado') {
    if (imovel.quartos != null) {
      campos.push({ label: 'Quartos', value: String(imovel.quartos) });
    }
    if (imovel.vagas != null) {
      campos.push({ label: 'Vagas', value: String(imovel.vagas) });
    }
    if (imovel.area_construida_m2 != null) {
      campos.push({ label: 'Área construída', value: `${imovel.area_construida_m2} m²` });
    }
  } else if (imovel.tipo === 'apartamento') {
    if (imovel.quartos != null) {
      campos.push({ label: 'Quartos', value: String(imovel.quartos) });
    }
    if (imovel.vagas != null) {
      campos.push({ label: 'Vagas', value: String(imovel.vagas) });
    }
    if (imovel.area_construida_m2 != null) {
      campos.push({ label: 'Área', value: `${imovel.area_construida_m2} m²` });
    }
    if (imovel.condominio_valor != null) {
      campos.push({ label: 'Condomínio', value: formatarMoeda(imovel.condominio_valor) });
    }
  }

  // Situação é comum a terreno/casa/sobrado (não a apartamento, que já usa o
  // espaço para Condomínio) e só aparece com pelo menos um item.
  if (imovel.tipo !== 'apartamento' && imovel.situacao.length > 0) {
    campos.push({ label: 'Situação', value: formatarSituacao(imovel.situacao) });
  }

  return campos;
}

interface FichaTecnicaProps {
  imovel: Imovel;
  variant?: 'grid' | 'inline';
}

export default function FichaTecnica({ imovel, variant = 'grid' }: FichaTecnicaProps) {
  const campos = buildFichaFields(imovel);
  if (campos.length === 0) return null;

  const containerClass =
    variant === 'grid'
      ? 'grid grid-cols-2 gap-3.5 py-4 border-t border-b border-line mb-4.5'
      : 'flex gap-6 flex-wrap mb-4.5';

  return (
    <div className={containerClass}>
      {campos.map((campo) => (
        <div key={campo.label}>
          <p className="text-[9.5px] text-ink-soft uppercase tracking-wide mb-0.5">{campo.label}</p>
          <p className="font-mono text-[13px] font-semibold">{campo.value}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/site/FichaTecnica.test.ts`
Expected: PASS, 6 tests passed.

- [ ] **Step 5: Render it on the home page to verify visually**

Modify `app/(site)/page.tsx`:

```tsx
import Nav from '@/components/site/Nav';
import SearchHero from '@/components/site/SearchHero';
import FichaTecnica from '@/components/site/FichaTecnica';
import { mockImoveis } from '@/lib/mock/imoveis';

export default function HomePage() {
  const terreno = mockImoveis[0]!;
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
      <SearchHero />
      <div className="max-w-md mx-auto p-6">
        <FichaTecnica imovel={terreno} />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: a 2-column grid showing "Área total / 200 m²", "Dimensões / 10m x 20m", "Bairro / Cidade Jardim I", "Localização no loteamento / Quadra 14 · Lote 08", "Situação / Quitado e escriturado" — 5 fields, all present because this mock terreno has every field filled.

- [ ] **Step 7: Commit**

```bash
git add components/site/FichaTecnica.tsx components/site/FichaTecnica.test.ts "app/(site)/page.tsx"
git commit -m "feat: add FichaTecnica component with dynamic per-tipo fields"
```

---

### Task 11: FeaturedCard component (cartão-documento with dimension-arrow overlay)

**Files:**
- Create: `components/site/FeaturedCard.tsx`
- Test: `components/site/FeaturedCard.test.ts`

**Interfaces:**
- Consumes: `Imovel` from `lib/types.ts`, `FichaTecnica` (Task 10), `formatarPreco` from `lib/format.ts`.
- Produces: `parseDimensoes(dimensoes: string | null): { horizontal: string; vertical: string } | null` (exported pure function) and `FeaturedCard` default export, props `{ imovel: Imovel }`. Consumed by the home page (Task 15).

- [ ] **Step 1: Write the failing test `components/site/FeaturedCard.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { parseDimensoes } from './FeaturedCard';

describe('parseDimensoes', () => {
  it('separa "10m x 20m" em horizontal e vertical', () => {
    expect(parseDimensoes('10m x 20m')).toEqual({ horizontal: '10m', vertical: '20m' });
  });

  it('aceita "X" maiúsculo e espaçamento irregular', () => {
    expect(parseDimensoes('12m X 30m')).toEqual({ horizontal: '12m', vertical: '30m' });
  });

  it('retorna null para texto que não bate no formato', () => {
    expect(parseDimensoes('irregular')).toBeNull();
  });

  it('retorna null quando dimensoes é null', () => {
    expect(parseDimensoes(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/site/FeaturedCard.test.ts`
Expected: FAIL with "Cannot find module './FeaturedCard'".

- [ ] **Step 3: Write `components/site/FeaturedCard.tsx`**

```tsx
import Link from 'next/link';
import type { Imovel } from '@/lib/types';
import { formatarPreco } from '@/lib/format';
import FichaTecnica from './FichaTecnica';

const WHATSAPP_NUMERO = '5567984294178';

// "10m x 20m" -> { horizontal: "10m", vertical: "20m" }. Usado só para
// desenhar a anotação de dimensão sobre a foto do terreno em destaque — se o
// texto não bater nesse formato (ou o imóvel não tiver dimensoes), a
// anotação simplesmente não é desenhada.
export function parseDimensoes(dimensoes: string | null): { horizontal: string; vertical: string } | null {
  if (!dimensoes) return null;
  const match = dimensoes.match(/^\s*([\d.,]+m)\s*[xX]\s*([\d.,]+m)\s*$/);
  if (!match) return null;
  return { horizontal: match[1]!, vertical: match[2]! };
}

interface FeaturedCardProps {
  imovel: Imovel;
}

export default function FeaturedCard({ imovel }: FeaturedCardProps) {
  const capa = imovel.fotos.find((f) => f.is_capa) ?? imovel.fotos[0];
  const dimensoes = imovel.tipo === 'terreno' ? parseDimensoes(imovel.dimensoes) : null;
  const mensagemWhatsapp = `Olá! Tenho interesse neste imóvel: ${imovel.titulo} (${imovel.endereco}). Pode me passar mais informações?`;

  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden grid md:grid-cols-[1.15fr_1fr]">
      <div className="relative min-h-[280px] md:min-h-[360px] bg-gradient-to-br from-[#4a4a4a] to-ink">
        {capa && (
          // eslint-disable-next-line @next/next/no-img-element -- fotos vêm de URLs externas do Supabase Storage
          <img src={capa.url} alt={imovel.titulo} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <span className="absolute top-5 left-5 bg-ink text-white font-display font-bold text-[11px] px-3 py-1.5 rounded-md tracking-wide uppercase">
          {imovel.tipo}
        </span>

        {dimensoes && (
          <>
            <div className="absolute top-6 bottom-[60px] right-6 w-px bg-white/50">
              <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-white font-mono text-[11px] bg-black/50 px-1.5 py-0.5 rounded">
                {dimensoes.vertical}
              </span>
            </div>
            <div className="absolute bottom-[22px] left-6 right-6 flex items-center text-white font-mono text-[11px]">
              <div className="flex-1 h-px bg-white/50" />
              <span className="px-2.5">{dimensoes.horizontal}</span>
              <div className="flex-1 h-px bg-white/50" />
            </div>
          </>
        )}
      </div>

      <div className="p-7 md:p-8 flex flex-col">
        <h2 className="font-display font-extrabold text-[22px] md:text-[23px] leading-tight mb-1.5">
          {imovel.titulo}
        </h2>
        <p className="text-[13px] text-ink-soft mb-4">{imovel.endereco} — Dourados/MS</p>

        <FichaTecnica imovel={imovel} variant="grid" />

        <div className="flex items-baseline justify-between mb-4.5">
          <span className="font-display font-black text-2xl">{formatarPreco(imovel)}</span>
          {imovel.preco_observacao && (
            <span className="text-[11px] text-ink-soft">{imovel.preco_observacao}</span>
          )}
        </div>

        <div className="flex gap-2.5 mt-auto flex-wrap">
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagemWhatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display font-bold text-[13px] px-5 py-3 rounded-lg bg-gold text-white"
          >
            Falar sobre este {imovel.tipo}
          </a>
          <Link
            href={`/imoveis/${imovel.id}`}
            className="font-display font-bold text-[13px] px-5 py-3 rounded-lg border-[1.5px] border-ink text-ink"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/site/FeaturedCard.test.ts`
Expected: PASS, 4 tests passed.

- [ ] **Step 5: Render it on the home page to verify visually**

Modify `app/(site)/page.tsx`:

```tsx
import Nav from '@/components/site/Nav';
import SearchHero from '@/components/site/SearchHero';
import FeaturedCard from '@/components/site/FeaturedCard';
import { mockImoveis } from '@/lib/mock/imoveis';

export default function HomePage() {
  const destaque = mockImoveis.find((i) => i.destaque)!;
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
      <SearchHero />
      <div className="px-6 md:px-14 pt-8">
        <FeaturedCard imovel={destaque} />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: the document-style card renders with the "TERRENO" tag, the horizontal (10m) and vertical (20m) dimension-arrow overlay on the photo area, the ficha técnica grid, price "R$ 105.000" with "aceito propostas", and the two action buttons.

- [ ] **Step 7: Commit**

```bash
git add components/site/FeaturedCard.tsx components/site/FeaturedCard.test.ts "app/(site)/page.tsx"
git commit -m "feat: add FeaturedCard component with dimension-arrow overlay"
```

---

### Task 12: FeedItem component (alternating photo side)

**Files:**
- Create: `components/site/FeedItem.tsx`

**Interfaces:**
- Consumes: `Imovel` from `lib/types.ts`, `FichaTecnica` (Task 10), `formatarPreco` from `lib/format.ts`.
- Produces: `FeedItem` default export, props `{ imovel: Imovel; invertido?: boolean }`. Consumed by `HomeFeed` (Task 14) and the `/imoveis` listing (Task 16).

- [ ] **Step 1: Write `components/site/FeedItem.tsx`**

```tsx
import Link from 'next/link';
import type { Imovel } from '@/lib/types';
import { formatarPreco } from '@/lib/format';
import FichaTecnica from './FichaTecnica';

interface FeedItemProps {
  imovel: Imovel;
  invertido?: boolean;
}

export default function FeedItem({ imovel, invertido = false }: FeedItemProps) {
  const capa = imovel.fotos.find((f) => f.is_capa) ?? imovel.fotos[0];

  return (
    <div
      className={`grid md:grid-cols-[340px_1fr] gap-7 md:gap-9 py-8 border-b border-line items-center ${
        invertido ? 'md:[&>*:first-child]:order-2' : ''
      }`}
    >
      <div className="relative h-[220px] rounded-xl bg-gradient-to-br from-[#4a4a4a] to-ink overflow-hidden">
        {capa && (
          // eslint-disable-next-line @next/next/no-img-element -- fotos vêm de URLs externas do Supabase Storage
          <img src={capa.url} alt={imovel.titulo} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <span className="absolute top-3.5 left-3.5 font-display font-extrabold text-[10.5px] px-2.5 py-1.5 rounded-md bg-gold text-white uppercase">
          {imovel.finalidade}
        </span>
        <span className="absolute bottom-3.5 left-3.5 font-display font-semibold text-[10.5px] px-2.5 py-1 rounded bg-black/40 text-white capitalize">
          {imovel.tipo}
        </span>
      </div>

      <div>
        <h3 className="font-display font-extrabold text-[19px] mb-1.5">{imovel.titulo}</h3>
        <p className="text-[13px] text-ink-soft mb-4">{imovel.endereco} — Dourados/MS</p>

        <FichaTecnica imovel={imovel} variant="inline" />

        <div className="flex items-center justify-between">
          <span className="font-display font-extrabold text-[19px]">{formatarPreco(imovel)}</span>
          <Link
            href={`/imoveis/${imovel.id}`}
            className="font-display font-bold text-[13px] px-5 py-3 rounded-lg border-[1.5px] border-ink text-ink"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render two items (one inverted) on the home page to verify visually**

Modify `app/(site)/page.tsx`:

```tsx
import Nav from '@/components/site/Nav';
import FeedItem from '@/components/site/FeedItem';
import { mockImoveis } from '@/lib/mock/imoveis';

export default function HomePage() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
      <div className="px-6 md:px-14">
        <FeedItem imovel={mockImoveis[1]!} />
        <FeedItem imovel={mockImoveis[2]!} invertido />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: two full-width feed rows; the first has the photo on the left (desktop width ≥ 768px), the second has the photo on the right — confirming the alternating layout. Each shows the finalidade badge, tipo tag, title, address, inline specs, and price/button row.

- [ ] **Step 4: Commit**

```bash
git add components/site/FeedItem.tsx "app/(site)/page.tsx"
git commit -m "feat: add FeedItem component with alternating photo side"
```

---

### Task 13: Footer component

**Files:**
- Create: `components/site/Footer.tsx`

**Interfaces:**
- Produces: `Footer` default export, no props. Rendered by `app/(site)/layout.tsx` in Task 15.

- [ ] **Step 1: Write `components/site/Footer.tsx`**

```tsx
const WHATSAPP_NUMERO = '5567984294178';
const WHATSAPP_TELEFONE_EXIBIDO = '(67) 98429-4178';
const INSTAGRAM_HANDLE = '@corretorluizlopes';

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="px-6 md:px-14 py-11 bg-ink text-[#B8B4AC]">
      <div className="flex justify-between flex-wrap gap-7 mb-7">
        <div>
          <h4 className="font-display text-white text-[12.5px] mb-2.5">Luiz Lopes Corretor</h4>
          <p className="text-[12.5px] mb-1.5 text-[#A5A19A]">CRECI/MS 8283</p>
          <p className="text-[12.5px] mb-1.5 text-[#A5A19A]">Dourados / MS</p>
        </div>
        <div>
          <h4 className="font-display text-white text-[12.5px] mb-2.5">Contato</h4>
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[12.5px] mb-1.5 text-[#A5A19A]"
          >
            {WHATSAPP_TELEFONE_EXIBIDO}
          </a>
          <a
            href="https://instagram.com/corretorluizlopes"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[12.5px] mb-1.5 text-[#A5A19A]"
          >
            {INSTAGRAM_HANDLE}
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 pt-4.5 text-[11.5px] text-[#8A867E]">
        © {ano} Luiz Lopes Corretor de Imóveis — CRECI/MS 8283
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Render it on the home page to verify visually**

Modify `app/(site)/page.tsx`:

```tsx
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';

export default function HomePage() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: dark ink-colored footer with "Luiz Lopes Corretor" / CRECI/MS 8283 / Dourados / MS on the left, WhatsApp phone number and Instagram handle on the right (both open in a new tab), and a copyright line at the bottom.

- [ ] **Step 4: Commit**

```bash
git add components/site/Footer.tsx "app/(site)/page.tsx"
git commit -m "feat: add site Footer component"
```

---

### Task 14: HomeFeed component (tab filter + alternating feed + load more)

**Files:**
- Create: `components/site/HomeFeed.tsx`
- Test: `components/site/HomeFeed.test.ts`

**Interfaces:**
- Consumes: `Imovel` from `lib/types.ts`, `TabFilter`/`TAB_FILTER_OPTIONS` (Task 9), `FeedItem` (Task 12).
- Produces: `filtrarPorAba(imoveis: Imovel[], aba: string): Imovel[]` (exported pure function) and `HomeFeed` default export, a Client Component with props `{ imoveis: Imovel[] }` (the non-destaque imóveis, already fetched server-side). Consumed by the home page (Task 15).

- [ ] **Step 1: Write the failing test `components/site/HomeFeed.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { filtrarPorAba } from './HomeFeed';
import { mockImoveis } from '@/lib/mock/imoveis';

describe('filtrarPorAba', () => {
  it('"todos" retorna a lista inteira', () => {
    expect(filtrarPorAba(mockImoveis, 'todos')).toHaveLength(mockImoveis.length);
  });

  it('"terreno" filtra por tipo terreno', () => {
    const resultado = filtrarPorAba(mockImoveis, 'terreno');
    expect(resultado.every((i) => i.tipo === 'terreno')).toBe(true);
    expect(resultado.length).toBeGreaterThan(0);
  });

  it('"aluguel" filtra por finalidade aluguel (não é um tipo)', () => {
    const resultado = filtrarPorAba(mockImoveis, 'aluguel');
    expect(resultado.every((i) => i.finalidade === 'aluguel')).toBe(true);
    expect(resultado.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/site/HomeFeed.test.ts`
Expected: FAIL with "Cannot find module './HomeFeed'".

- [ ] **Step 3: Write `components/site/HomeFeed.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { Imovel } from '@/lib/types';
import TabFilter from './TabFilter';
import FeedItem from './FeedItem';

const PAGINA_TAMANHO = 4;

// "aluguel" é uma finalidade, não um tipo — as outras 4 abas filtram por
// `tipo`. Isso reflete a lista de abas aprovada no spec (Todos/Terrenos/
// Casas/Apartamentos/Aluguel), que mistura os dois eixos de propósito.
export function filtrarPorAba(imoveis: Imovel[], aba: string): Imovel[] {
  if (aba === 'todos') return imoveis;
  if (aba === 'aluguel') return imoveis.filter((i) => i.finalidade === 'aluguel');
  return imoveis.filter((i) => i.tipo === aba);
}

interface HomeFeedProps {
  imoveis: Imovel[];
}

export default function HomeFeed({ imoveis }: HomeFeedProps) {
  const [aba, setAba] = useState('todos');
  const [visiveis, setVisiveis] = useState(PAGINA_TAMANHO);

  const filtrados = filtrarPorAba(imoveis, aba);
  const paginados = filtrados.slice(0, visiveis);
  const temMais = visiveis < filtrados.length;

  function handleChangeAba(novaAba: string) {
    setAba(novaAba);
    setVisiveis(PAGINA_TAMANHO);
  }

  return (
    <>
      <TabFilter value={aba} onChange={handleChangeAba} />

      <div className="px-6 md:px-14 pb-14">
        <div className="pt-11 pb-2">
          <p className="font-display font-bold text-[11.5px] tracking-[1.8px] uppercase text-gold">Portfólio</p>
          <p className="text-[13px] text-ink-soft mt-1.5">Imóveis disponíveis, do mais recente ao mais antigo.</p>
        </div>

        {paginados.length === 0 && (
          <p className="text-ink-soft text-sm py-10">Nenhum imóvel encontrado nesta categoria no momento.</p>
        )}

        {paginados.map((imovel, index) => (
          <FeedItem key={imovel.id} imovel={imovel} invertido={index % 2 === 1} />
        ))}

        {temMais && (
          <div className="text-center pt-6 pb-2">
            <button
              type="button"
              onClick={() => setVisiveis((v) => v + PAGINA_TAMANHO)}
              className="text-[13.5px] font-bold text-gold"
            >
              Carregar mais imóveis ↓
            </button>
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/site/HomeFeed.test.ts`
Expected: PASS, 3 tests passed.

- [ ] **Step 5: Render it on the home page to verify visually**

Modify `app/(site)/page.tsx`:

```tsx
import Nav from '@/components/site/Nav';
import HomeFeed from '@/components/site/HomeFeed';
import { mockImoveis } from '@/lib/mock/imoveis';

export default function HomePage() {
  const naoDestaque = mockImoveis.filter((i) => !i.destaque);
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Nav />
      <HomeFeed imoveis={naoDestaque} />
    </main>
  );
}
```

- [ ] **Step 6: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: tab filter above the feed; clicking "Terrenos" narrows the feed to only terrenos and resets the "carregar mais" pagination; with 7 non-destaque mock imóveis and a page size of 4, "Carregar mais imóveis" appears under "Todos" and reveals the rest when clicked, then disappears.

- [ ] **Step 7: Commit**

```bash
git add components/site/HomeFeed.tsx components/site/HomeFeed.test.ts "app/(site)/page.tsx"
git commit -m "feat: add HomeFeed component with tab filtering and pagination"
```

---

### Task 15: Home page `/` (final assembly, exact spec order)

**Files:**
- Modify: `app/(site)/page.tsx`
- Modify: `app/(site)/layout.tsx`

**Interfaces:**
- Consumes: `getImoveis`, `getImovelDestaque` (Task 6); `Nav` (Task 7), `SearchHero` (Task 8), `FeaturedCard` (Task 11), `HomeFeed` (Task 14), `Footer` (Task 13).
- Produces: the finished `/` route — Server Component that fetches data and delegates interactivity to `HomeFeed`.

- [ ] **Step 1: Wire `Nav` and `Footer` into the shared site layout**

Replace `app/(site)/layout.tsx`:

```tsx
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Assemble the home page in the exact approved order — hero, tab-scoped feed (which includes the filter row), featured card, then the rest of the feed inside `HomeFeed`**

Note on ordering: the spec lists the sections as Nav → Hero → Filter tabs → Featured card → Feed → Footer. `HomeFeed` (Task 14) currently renders `TabFilter` immediately followed by the feed list. To match the approved order exactly, the featured card must render between the tab row and the feed list — so the featured card is passed into `HomeFeed` as a slot rather than rendered outside it. Update `components/site/HomeFeed.tsx`:

```tsx
'use client';

import { useState, type ReactNode } from 'react';
import type { Imovel } from '@/lib/types';
import TabFilter from './TabFilter';
import FeedItem from './FeedItem';

const PAGINA_TAMANHO = 4;

export function filtrarPorAba(imoveis: Imovel[], aba: string): Imovel[] {
  if (aba === 'todos') return imoveis;
  if (aba === 'aluguel') return imoveis.filter((i) => i.finalidade === 'aluguel');
  return imoveis.filter((i) => i.tipo === aba);
}

interface HomeFeedProps {
  imoveis: Imovel[];
  destaqueSlot: ReactNode;
}

export default function HomeFeed({ imoveis, destaqueSlot }: HomeFeedProps) {
  const [aba, setAba] = useState('todos');
  const [visiveis, setVisiveis] = useState(PAGINA_TAMANHO);

  const filtrados = filtrarPorAba(imoveis, aba);
  const paginados = filtrados.slice(0, visiveis);
  const temMais = visiveis < filtrados.length;

  function handleChangeAba(novaAba: string) {
    setAba(novaAba);
    setVisiveis(PAGINA_TAMANHO);
  }

  return (
    <>
      <TabFilter value={aba} onChange={handleChangeAba} />

      <div className="px-6 md:px-14 pt-11 border-t border-line mt-7">{destaqueSlot}</div>

      <div className="px-6 md:px-14 pb-14">
        <div className="pt-11 pb-2">
          <p className="font-display font-bold text-[11.5px] tracking-[1.8px] uppercase text-gold">Portfólio</p>
          <p className="text-[13px] text-ink-soft mt-1.5">Imóveis disponíveis, do mais recente ao mais antigo.</p>
        </div>

        {paginados.length === 0 && (
          <p className="text-ink-soft text-sm py-10">Nenhum imóvel encontrado nesta categoria no momento.</p>
        )}

        {paginados.map((imovel, index) => (
          <FeedItem key={imovel.id} imovel={imovel} invertido={index % 2 === 1} />
        ))}

        {temMais && (
          <div className="text-center pt-6 pb-2">
            <button
              type="button"
              onClick={() => setVisiveis((v) => v + PAGINA_TAMANHO)}
              className="text-[13.5px] font-bold text-gold"
            >
              Carregar mais imóveis ↓
            </button>
          </div>
        )}
      </div>
    </>
  );
}
```

Update `components/site/HomeFeed.test.ts` import stays the same (`filtrarPorAba` signature unchanged).

- [ ] **Step 3: Write the final `app/(site)/page.tsx`**

```tsx
import SearchHero from '@/components/site/SearchHero';
import FeaturedCard from '@/components/site/FeaturedCard';
import HomeFeed from '@/components/site/HomeFeed';
import { getImoveis, getImovelDestaque } from '@/lib/data/imoveis';

export default async function HomePage() {
  const [destaque, todos] = await Promise.all([getImovelDestaque(), getImoveis()]);
  const feedImoveis = todos.filter((imovel) => imovel.id !== destaque?.id);

  return (
    <main>
      <SearchHero />
      <HomeFeed
        imoveis={feedImoveis}
        destaqueSlot={destaque ? <FeaturedCard imovel={destaque} /> : null}
      />
    </main>
  );
}
```

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: all suites pass (format, data-access, FichaTecnica, FeaturedCard, HomeFeed).

- [ ] **Step 5: Run dev server and confirm the whole home page**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected, top to bottom: sticky Nav, search hero with typing placeholder, tab filter row, the terreno featured document-card (with dimension overlay), the "Portfólio" feed heading, alternating feed items with "Carregar mais imóveis" at the bottom, and the dark Footer — matching the mockup's section order exactly.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/layout.tsx" "app/(site)/page.tsx" components/site/HomeFeed.tsx
git commit -m "feat: assemble home page in approved section order"
```

---

### Task 16: `/imoveis` page (full listing, filters, and real free-text search)

**Files:**
- Create: `app/(site)/imoveis/page.tsx`
- Create: `components/site/ImoveisFiltro.tsx`

**Interfaces:**
- Consumes: `getImoveis`, `searchImoveis` (Task 6); `ImovelFiltros` type (Task 6); `FeedItem` (Task 12); `TAB_FILTER_OPTIONS` (Task 9).
- Produces: the `/imoveis` route, reading `?q=`, `?finalidade=`, `?tipo=`, `?bairro=`, `?precoMin=`, `?precoMax=` search params. `ImoveisFiltro` Client Component, props `{ initialQuery: string }`, updates the URL search params on submit (no animation, real search).

- [ ] **Step 1: Write `components/site/ImoveisFiltro.tsx`**

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { TAB_FILTER_OPTIONS } from './TabFilter';

interface ImoveisFiltroProps {
  initialQuery: string;
}

export default function ImoveisFiltro({ initialQuery }: ImoveisFiltroProps) {
  const [busca, setBusca] = useState(initialQuery);
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaAtual = searchParams.get('tipoOuFinalidade') ?? 'todos';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (busca.trim()) params.set('q', busca.trim());
    else params.delete('q');
    router.push(`/imoveis?${params.toString()}`);
  }

  function handleAba(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === 'todos') {
      params.delete('tipoOuFinalidade');
    } else {
      params.set('tipoOuFinalidade', valor);
    }
    router.push(`/imoveis?${params.toString()}`);
  }

  return (
    <div className="px-6 md:px-14 pt-10 pb-2">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 bg-white border-[1.5px] border-ink rounded-2xl py-2 pl-5 pr-2 max-w-xl"
      >
        <label htmlFor="busca-imoveis" className="sr-only">
          Buscar imóvel
        </label>
        <input
          id="busca-imoveis"
          type="text"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por bairro, tipo, características..."
          className="flex-1 min-w-0 text-left text-[15px] text-ink outline-none bg-transparent"
        />
        <button type="submit" className="font-display font-bold text-[13px] px-5 py-3 rounded-lg bg-gold text-white shrink-0">
          Buscar
        </button>
      </form>

      <div className="flex gap-5 md:gap-7 flex-wrap pt-6 text-[13.5px] font-semibold">
        {TAB_FILTER_OPTIONS.map((option) => {
          const ativo = option.value === abaAtual;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleAba(option.value)}
              className={`pb-3.5 border-b-2 ${ativo ? 'text-ink border-gold' : 'text-ink-soft border-transparent'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/(site)/imoveis/page.tsx`**

```tsx
import FeedItem from '@/components/site/FeedItem';
import ImoveisFiltro from '@/components/site/ImoveisFiltro';
import { getImoveis, searchImoveis } from '@/lib/data/imoveis';
import type { Finalidade, TipoImovel } from '@/lib/types';

interface ImoveisPageProps {
  searchParams: Promise<{ q?: string; tipoOuFinalidade?: string }>;
}

const FINALIDADES: readonly Finalidade[] = ['venda', 'aluguel'];
const TIPOS: readonly TipoImovel[] = ['terreno', 'casa', 'apartamento', 'sobrado'];

function isFinalidade(valor: string): valor is Finalidade {
  return (FINALIDADES as readonly string[]).includes(valor);
}

function isTipo(valor: string): valor is TipoImovel {
  return (TIPOS as readonly string[]).includes(valor);
}

export default async function ImoveisPage({ searchParams }: ImoveisPageProps) {
  const params = await searchParams;
  const q = params.q ?? '';
  const filtroAba = params.tipoOuFinalidade ?? '';

  const filtros = isFinalidade(filtroAba)
    ? { finalidade: filtroAba }
    : isTipo(filtroAba)
      ? { tipo: filtroAba }
      : {};

  const base = await getImoveis(filtros);
  const resultado = searchImoveis(base, q);

  return (
    <main className="min-h-screen">
      <ImoveisFiltro initialQuery={q} />

      <div className="px-6 md:px-14 pb-14">
        <p className="text-[13px] text-ink-soft pt-4 pb-2">
          {resultado.length} {resultado.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
        </p>

        {resultado.length === 0 && (
          <p className="text-ink-soft text-sm py-10">
            Nenhum imóvel encontrado. Tente outro termo de busca ou remova os filtros.
          </p>
        )}

        {resultado.map((imovel, index) => (
          <FeedItem key={imovel.id} imovel={imovel} invertido={index % 2 === 1} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000/imoveis`.
Expected: search field (static placeholder, no typing animation) and the same 5 tabs; typing "jardim" and pressing Buscar filters the list to imóveis whose título/bairro/endereço/descrição contains "jardim"; clicking "Terrenos" shows only terrenos; the result count updates; visiting `/imoveis?q=cidade+jardim` directly also filters correctly (confirms server-side read of the `q` param).

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/imoveis/page.tsx" components/site/ImoveisFiltro.tsx
git commit -m "feat: add /imoveis listing page with real search and filters"
```

---

### Task 17: `/imoveis/[id]` detail page (gallery, full FichaTecnica, WhatsApp CTA)

**Files:**
- Create: `app/(site)/imoveis/[id]/page.tsx`
- Create: `components/site/Galeria.tsx`

**Interfaces:**
- Consumes: `getImovelById` (Task 6); `FichaTecnica` (Task 10); `formatarPreco` (Task 5).
- Produces: the `/imoveis/[id]` route (calls Next.js `notFound()` for unknown ids); `Galeria` Client Component, props `{ fotos: ImovelFoto[]; alt: string }`.

- [ ] **Step 1: Write `components/site/Galeria.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { ImovelFoto } from '@/lib/types';

interface GaleriaProps {
  fotos: ImovelFoto[];
  alt: string;
}

export default function Galeria({ fotos, alt }: GaleriaProps) {
  const ordenadas = [...fotos].sort((a, b) => a.ordem - b.ordem);
  const [ativa, setAtiva] = useState(0);

  if (ordenadas.length === 0) {
    return (
      <div className="h-[320px] md:h-[420px] rounded-2xl bg-gradient-to-br from-[#4a4a4a] to-ink" />
    );
  }

  const fotoAtiva = ordenadas[ativa]!;

  return (
    <div>
      <div className="h-[320px] md:h-[420px] rounded-2xl overflow-hidden relative bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm de URLs externas do Supabase Storage */}
        <img src={fotoAtiva.url} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {ordenadas.length > 1 && (
        <div className="flex gap-2.5 mt-3 overflow-x-auto">
          {ordenadas.map((foto, index) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => setAtiva(index)}
              className={`w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 ${
                index === ativa ? 'border-gold' : 'border-transparent'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm de URLs externas do Supabase Storage */}
              <img src={foto.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write `app/(site)/imoveis/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getImovelById } from '@/lib/data/imoveis';
import { formatarPreco } from '@/lib/format';
import FichaTecnica from '@/components/site/FichaTecnica';
import Galeria from '@/components/site/Galeria';

const WHATSAPP_NUMERO = '5567984294178';

interface ImovelDetalhePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ImovelDetalhePageProps): Promise<Metadata> {
  const { id } = await params;
  const imovel = await getImovelById(id);
  if (!imovel) return { title: 'Imóvel não encontrado' };
  return { title: `${imovel.titulo} — Luiz Lopes Corretor` };
}

export default async function ImovelDetalhePage({ params }: ImovelDetalhePageProps) {
  const { id } = await params;
  const imovel = await getImovelById(id);

  if (!imovel) {
    notFound();
  }

  const mensagemWhatsapp = `Olá! Tenho interesse neste imóvel: ${imovel.titulo} (${imovel.endereco}). Pode me passar mais informações?`;

  return (
    <main className="px-6 md:px-14 py-10 max-w-5xl mx-auto">
      <p className="font-display font-bold text-[11.5px] tracking-[1.8px] uppercase text-gold mb-3 capitalize">
        {imovel.tipo} para {imovel.finalidade}
      </p>

      <div className="grid md:grid-cols-[1.3fr_1fr] gap-10">
        <div>
          <Galeria fotos={imovel.fotos} alt={imovel.titulo} />

          <h1 className="font-display font-extrabold text-2xl md:text-[28px] mt-7 mb-1.5">{imovel.titulo}</h1>
          <p className="text-[13px] text-ink-soft mb-6">{imovel.endereco} — {imovel.bairro}, Dourados/MS</p>

          <p className="text-[15px] leading-relaxed text-charcoal whitespace-pre-line">{imovel.descricao}</p>
        </div>

        <div className="bg-white border border-line rounded-2xl p-7 h-fit">
          <FichaTecnica imovel={imovel} variant="grid" />

          <div className="flex items-baseline justify-between mb-5">
            <span className="font-display font-black text-2xl">{formatarPreco(imovel)}</span>
            {imovel.preco_observacao && (
              <span className="text-[11px] text-ink-soft">{imovel.preco_observacao}</span>
            )}
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagemWhatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center font-display font-bold text-[13px] px-5 py-3.5 rounded-lg bg-gold text-white"
          >
            Falar sobre este imóvel no WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000/imoveis/1`.
Expected: gallery (with thumbnail strip since imóvel `1` has 2 fotos), title, address, full description, ficha técnica card, price, and a WhatsApp button whose link (hover/inspect) is `https://wa.me/5567984294178?text=Ol%C3%A1!%20Tenho%20interesse...`. Then visit `http://localhost:3000/imoveis/nao-existe` — expect Next.js's default 404 page (confirms `notFound()` fires).

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/imoveis/[id]/page.tsx" components/site/Galeria.tsx
git commit -m "feat: add imovel detail page with gallery and WhatsApp CTA"
```

---

### Task 18: `/sobre` page

**Files:**
- Create: `app/(site)/sobre/page.tsx`

**Interfaces:**
- Produces: the `/sobre` route. No data dependencies beyond static copy.

- [ ] **Step 1: Write `app/(site)/sobre/page.tsx`**

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre — Luiz Lopes Corretor',
};

export default function SobrePage() {
  return (
    <main className="px-6 md:px-14 py-14 max-w-2xl mx-auto">
      <p className="font-display font-bold text-[11.5px] tracking-[1.8px] uppercase text-gold mb-3">Sobre</p>
      <h1 className="font-display font-extrabold text-2xl md:text-[30px] mb-6">Luiz Lopes Corretor de Imóveis</h1>

      <div className="space-y-5 text-[15px] leading-relaxed text-charcoal">
        <p>
          Luiz Lopes atua como corretor de imóveis em Dourados/MS, registrado no CRECI/MS
          sob o número 8283. O trabalho é conduzido de forma direta: cada imóvel anunciado
          é visitado e conferido antes de entrar no portfólio, e o acompanhamento do
          interessado — da primeira mensagem até a assinatura — é feito pessoalmente.
        </p>
        <p>
          A atuação cobre terrenos, casas, sobrados e apartamentos, tanto para venda
          quanto para aluguel, com foco nos bairros de Dourados e região. Documentação,
          situação de escritura e condições de pagamento são informadas com clareza antes
          de qualquer visita.
        </p>
        <p>
          O contato inicial é feito por WhatsApp — a forma mais rápida de tirar dúvidas
          sobre um imóvel específico ou agendar uma visita.
        </p>
      </div>

      <div className="mt-9 border-t border-line pt-6">
        <p className="text-[9.5px] text-ink-soft uppercase tracking-wide mb-1">Registro profissional</p>
        <p className="font-mono text-[13px] font-semibold">CRECI/MS 8283</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000/sobre`.
Expected: "Sobre" eyebrow, heading, three paragraphs of direct-tone copy (no marketing cliché), and the CRECI/MS 8283 registration block at the bottom.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/sobre/page.tsx"
git commit -m "feat: add /sobre page"
```

---

### Task 19: `/contato` page

**Files:**
- Create: `app/(site)/contato/page.tsx`

**Interfaces:**
- Produces: the `/contato` route. No data dependencies beyond static copy.

- [ ] **Step 1: Write `app/(site)/contato/page.tsx`**

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contato — Luiz Lopes Corretor',
};

const WHATSAPP_NUMERO = '5567984294178';
const WHATSAPP_TELEFONE_EXIBIDO = '(67) 98429-4178';
const INSTAGRAM_HANDLE = '@corretorluizlopes';
const MENSAGEM_PADRAO = 'Olá! Vim pelo site e gostaria de falar sobre um imóvel.';

export default function ContatoPage() {
  return (
    <main className="px-6 md:px-14 py-14 max-w-xl mx-auto">
      <p className="font-display font-bold text-[11.5px] tracking-[1.8px] uppercase text-gold mb-3">Contato</p>
      <h1 className="font-display font-extrabold text-2xl md:text-[30px] mb-8">Fale com Luiz Lopes</h1>

      <div className="space-y-4">
        <a
          href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(MENSAGEM_PADRAO)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-white border border-line rounded-xl px-6 py-5"
        >
          <span>
            <span className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1">WhatsApp</span>
            <span className="block font-mono text-[15px] font-semibold">{WHATSAPP_TELEFONE_EXIBIDO}</span>
          </span>
          <span className="font-display font-bold text-[13px] px-5 py-3 rounded-lg bg-gold text-white">
            Conversar
          </span>
        </a>

        <a
          href="https://instagram.com/corretorluizlopes"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-white border border-line rounded-xl px-6 py-5"
        >
          <span>
            <span className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1">Instagram</span>
            <span className="block font-mono text-[15px] font-semibold">{INSTAGRAM_HANDLE}</span>
          </span>
          <span className="font-display font-bold text-[13px] px-5 py-3 rounded-lg border-[1.5px] border-ink text-ink">
            Seguir
          </span>
        </a>

        <div className="flex items-center justify-between bg-white border border-line rounded-xl px-6 py-5">
          <span>
            <span className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1">Telefone</span>
            <span className="block font-mono text-[15px] font-semibold">{WHATSAPP_TELEFONE_EXIBIDO}</span>
          </span>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run dev server and confirm**

Run: `npm run dev`, visit `http://localhost:3000/contato`.
Expected: three cards — WhatsApp (with "Conversar" gold button, opens wa.me with the prefilled default message), Instagram (with outlined "Seguir" button), and a plain phone display card.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/contato/page.tsx"
git commit -m "feat: add /contato page"
```

---

### Task 20: Update HANDOVER.md and ARCHITECTURE.md (mock-data stage)

**Files:**
- Modify: `HANDOVER.md`
- Modify: `ARCHITECTURE.md`

**Interfaces:**
- Consumes: nothing code-level — this task only documents the state reached by Tasks 1–19.

- [ ] **Step 1: Update `HANDOVER.md`'s "Estado atual" section**

Replace the "## Estado atual (em construção)" section in `HANDOVER.md`:

```markdown
## Estado atual

O site público está completo e funcional, rodando inteiramente sobre **dados
mock** (`lib/mock/imoveis.ts`) — ainda não há banco de dados real conectado.

Páginas públicas prontas:
- `/` — home com hero de busca, filtro por abas, imóvel em destaque e feed
- `/imoveis` — listagem completa com busca por texto livre e filtros
- `/imoveis/[id]` — detalhe do imóvel com galeria e botão de WhatsApp
- `/sobre` — texto institucional
- `/contato` — WhatsApp, Instagram, telefone

A área administrativa (`app/admin`) ainda não existe além de uma página
inicial de placeholder — ela é construída depois que o Supabase for
conectado (ver "Próximos passos" no ARCHITECTURE.md).

## Como rodar os testes

```bash
npx vitest run
```

Cobre a camada de dados (`lib/data/imoveis.ts`), formatação de preço/situação
(`lib/format.ts`) e a lógica de campos dinâmicos da ficha técnica
(`components/site/FichaTecnica.tsx`).
```

- [ ] **Step 2: Update `ARCHITECTURE.md`'s pending-decisions section**

Replace the "## Decisões pendentes de registro" section in `ARCHITECTURE.md`:

```markdown
## Decisões já tomadas

- **Camada de dados única** (`lib/data/imoveis.ts`): todas as páginas
  públicas chamam só essas funções. A troca de mock para Supabase (próxima
  fase) altera apenas o corpo delas.
- **Ficha técnica dinâmica**: `components/site/FichaTecnica.tsx` exporta
  `buildFichaFields(imovel)`, uma função pura testada isoladamente
  (`FichaTecnica.test.ts`), que decide quais campos mostrar. Nenhum campo é
  fixo — cada um só entra na lista se o dado correspondente existir.
- **HomeFeed com slot de destaque**: o card em destaque é passado como
  `ReactNode` para `HomeFeed` para poder ficar entre o filtro de abas e a
  lista do feed, preservando a ordem de seções aprovada pelo cliente sem
  duplicar o componente de filtro.
- **Busca**: a home usa uma animação de digitação só decorativa no
  placeholder do campo (`components/site/SearchHero.tsx`); ao enviar, ela
  navega para `/imoveis?q=...`, onde a busca é real (`searchImoveis` em
  `lib/data/imoveis.ts`, correspondência simples por substring em
  título/bairro/endereço/descrição).

## Limitações conhecidas nesta fase

- Sem banco de dados — qualquer alteração de dados exige editar
  `lib/mock/imoveis.ts` e reiniciar o servidor.
- Sem upload de fotos — as URLs mock em `lib/mock/imoveis.ts` apontam para
  caminhos que não existem em `public/`; isso é esperado até o Supabase
  Storage ser conectado.
- Área administrativa ainda não construída.

## Próximos passos

1. Migrações SQL do Supabase e troca da camada de dados (mock → Supabase).
2. `/admin/login` com Supabase Auth.
3. CRUD de imóveis no admin (`/admin/imoveis`, `/admin/imoveis/novo`,
   `/admin/imoveis/[id]/editar`), com upload de fotos.
4. Gerador de post para Instagram/Facebook (`/admin/imoveis/[id]/post`).
```

- [ ] **Step 3: Run dev server once more as a smoke test that nothing broke**

Run: `npm run dev`, visit `http://localhost:3000` — confirm the home page still renders exactly as in Task 15.

- [ ] **Step 4: Commit**

```bash
git add HANDOVER.md ARCHITECTURE.md
git commit -m "docs: update HANDOVER and ARCHITECTURE for mock-data stage"
```

---

### Task 21: Supabase schema migration and client wiring (swap the data-access layer)

This task produces the SQL schema and the Supabase client/query code, and documents the manual dashboard steps — it does **not** create a live Supabase project or require real API keys. The app will not actually connect to a database until a human pastes the SQL into a real Supabase project and sets the env vars (documented in Step 6).

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.example`
- Modify: `lib/data/imoveis.ts`
- Modify: `package.json` (add `@supabase/supabase-js`, `@supabase/ssr`)
- Modify: `HANDOVER.md`

**Interfaces:**
- Consumes: `Imovel`, `ImovelFoto`, `TipoImovel`, `Finalidade`, `StatusImovel` from `lib/types.ts`.
- Produces: `createBrowserSupabaseClient()` (in `lib/supabase/client.ts`) and `createServerSupabaseClient()` (in `lib/supabase/server.ts`, async — reads cookies) — consumed by the admin tasks (22–27). `lib/data/imoveis.ts` keeps its exact Task 6 signatures (`getImoveis`, `getImovelById`, `getImovelDestaque`, `searchImoveis`) but now queries Supabase instead of the mock array.

- [ ] **Step 1: Add the Supabase dependencies**

Modify `package.json` `dependencies` (add):

```json
    "@supabase/supabase-js": "2.48.1",
    "@supabase/ssr": "0.5.2"
```

Run: `npm install`

- [ ] **Step 2: Write the schema migration `supabase/migrations/0001_init.sql`**

```sql
-- 0001_init.sql
-- Schema para o site Luiz Lopes Corretor. Rodar no SQL Editor do painel do
-- Supabase (ou via `supabase db push` se o CLI estiver configurado).

create extension if not exists "pgcrypto";

create type tipo_imovel as enum ('terreno', 'casa', 'apartamento', 'sobrado');
create type finalidade_imovel as enum ('venda', 'aluguel');
create type status_imovel as enum ('disponivel', 'reservado', 'vendido');

create table imoveis (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo tipo_imovel not null,
  finalidade finalidade_imovel not null,
  endereco text not null,
  bairro text not null,
  quadra text,
  lote text,
  area_total_m2 numeric,
  area_construida_m2 numeric,
  dimensoes text,
  quartos integer,
  vagas integer,
  condominio_valor numeric,
  preco numeric not null,
  preco_observacao text,
  situacao text[] not null default '{}',
  descricao text not null default '',
  status status_imovel not null default 'disponivel',
  destaque boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table imovel_fotos (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references imoveis(id) on delete cascade,
  url text not null,
  ordem integer not null default 0,
  is_capa boolean not null default false
);

create index imovel_fotos_imovel_id_idx on imovel_fotos(imovel_id);

-- Mantém updated_at em dia automaticamente a cada UPDATE.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger imoveis_set_updated_at
before update on imoveis
for each row execute function set_updated_at();

-- Row Level Security: leitura pública (o site é público), escrita só para
-- usuários autenticados (o único admin criado manualmente no painel).
alter table imoveis enable row level security;
alter table imovel_fotos enable row level security;

create policy "Leitura publica de imoveis" on imoveis
  for select using (true);

create policy "Leitura publica de fotos" on imovel_fotos
  for select using (true);

create policy "Admin gerencia imoveis" on imoveis
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admin gerencia fotos" on imovel_fotos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Bucket de Storage para as fotos, público para leitura.
insert into storage.buckets (id, name, public)
values ('imoveis-fotos', 'imoveis-fotos', true)
on conflict (id) do nothing;

create policy "Leitura publica do bucket imoveis-fotos"
  on storage.objects for select
  using (bucket_id = 'imoveis-fotos');

create policy "Admin faz upload no bucket imoveis-fotos"
  on storage.objects for insert
  with check (bucket_id = 'imoveis-fotos' and auth.role() = 'authenticated');

create policy "Admin atualiza arquivos no bucket imoveis-fotos"
  on storage.objects for update
  using (bucket_id = 'imoveis-fotos' and auth.role() = 'authenticated');

create policy "Admin remove arquivos no bucket imoveis-fotos"
  on storage.objects for delete
  using (bucket_id = 'imoveis-fotos' and auth.role() = 'authenticated');
```

- [ ] **Step 3: Write `lib/supabase/client.ts` (browser client, used by admin Client Components for uploads)**

```ts
import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase para uso em Client Components (ex.: upload de fotos direto
// do navegador para o Storage). As variáveis são públicas (prefixo
// NEXT_PUBLIC_) porque a chave anon é segura para expor ao navegador — a
// segurança real vem das políticas de RLS definidas na migração.
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Write `lib/supabase/server.ts` (server client, reads the auth session from cookies)**

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente Supabase para uso em Server Components, Server Actions e no
// middleware. Lê/escreve a sessão de autenticação via cookies do Next.js,
// para que `auth.role() = 'authenticated'` nas políticas de RLS funcione
// tanto em leitura quanto em escrita feita a partir do servidor.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component (não pode escrever
          // cookies) — o middleware (Task 22) é quem faz a escrita real da
          // sessão, então esse erro pode ser ignorado com segurança aqui.
        }
      },
    },
  });
}
```

- [ ] **Step 5: Swap `lib/data/imoveis.ts` to query Supabase, keeping the exact Task 6 function signatures**

Replace `lib/data/imoveis.ts`:

```ts
// Camada de acesso a dados. Toda página/componente do site chama SOMENTE as
// funções deste arquivo. Até aqui elas liam `lib/mock/imoveis.ts`; a partir
// desta versão consultam o Supabase — mas a assinatura de cada função
// (nome, parâmetros, tipo de retorno) é exatamente a mesma de antes, então
// nenhuma página precisou ser alterada nesta troca.

import type { Finalidade, Imovel, ImovelFoto, TipoImovel } from '../types';
import { createServerSupabaseClient } from '../supabase/server';

export interface ImovelFiltros {
  finalidade?: Finalidade;
  tipo?: TipoImovel;
  bairro?: string;
  precoMin?: number;
  precoMax?: number;
}

// Formato de uma linha vinda do Supabase (imoveis + imovel_fotos aninhadas
// via `select`). Mapeado 1:1 para `Imovel` porque os nomes de coluna da
// migração (0001_init.sql) já seguem snake_case igual ao tipo TypeScript.
type ImovelRow = Omit<Imovel, 'fotos'> & { imovel_fotos: ImovelFoto[] };

function mapRow(row: ImovelRow): Imovel {
  const { imovel_fotos, ...resto } = row;
  return { ...resto, fotos: imovel_fotos ?? [] };
}

const SELECT_COM_FOTOS = '*, imovel_fotos(*)';

export async function getImoveis(filtros: ImovelFiltros = {}): Promise<Imovel[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase.from('imoveis').select(SELECT_COM_FOTOS).neq('status', 'vendido');

  if (filtros.finalidade) query = query.eq('finalidade', filtros.finalidade);
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
  if (filtros.bairro) query = query.eq('bairro', filtros.bairro);
  if (filtros.precoMin !== undefined) query = query.gte('preco', filtros.precoMin);
  if (filtros.precoMax !== undefined) query = query.lte('preco', filtros.precoMax);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`Falha ao buscar imóveis: ${error.message}`);
  return (data as ImovelRow[]).map(mapRow);
}

export async function getImovelById(id: string): Promise<Imovel | undefined> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('imoveis').select(SELECT_COM_FOTOS).eq('id', id).maybeSingle();
  if (error) throw new Error(`Falha ao buscar imóvel ${id}: ${error.message}`);
  return data ? mapRow(data as ImovelRow) : undefined;
}

export async function getImovelDestaque(): Promise<Imovel | undefined> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('imoveis')
    .select(SELECT_COM_FOTOS)
    .eq('destaque', true)
    .neq('status', 'vendido')
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar imóvel em destaque: ${error.message}`);
  return data ? mapRow(data as ImovelRow) : undefined;
}

// Busca por texto livre continua em memória (não muda com o Supabase): já
// recebe a lista filtrada/paginada de fora, então roda sobre um array
// pequeno já carregado — sem necessidade de full-text search no banco por
// enquanto.
export function searchImoveis(imoveis: Imovel[], termo: string): Imovel[] {
  const alvo = termo.trim().toLowerCase();
  if (!alvo) return imoveis;
  return imoveis.filter((imovel) =>
    [imovel.titulo, imovel.bairro, imovel.endereco, imovel.descricao]
      .join(' ')
      .toLowerCase()
      .includes(alvo)
  );
}
```

- [ ] **Step 6: Remove the now-obsolete mock-based unit test for the data-access layer**

`lib/data/imoveis.test.ts` (Task 6) calls `getImoveis`/`getImovelById`/`getImovelDestaque` expecting them to read the in-memory mock array. Now that they call `createServerSupabaseClient()` (which calls Next.js's `cookies()`, only available inside a real request), that test file cannot run under plain `vitest` anymore — it needs either a live Supabase project or a mocked client, neither of which this task sets up (no live project is created here, per the task's own constraint). Delete it and note why:

Run: `rm lib/data/imoveis.test.ts` (or delete the file).

Add a paragraph to `ARCHITECTURE.md` under "Limitações conhecidas nesta fase":

```markdown
- `lib/data/imoveis.ts` não tem mais teste automatizado unitário depois da
  troca para Supabase (Task 21 do plano de implementação) — as funções
  dependem de `next/headers` e de um projeto Supabase real. A verificação
  passa a ser manual: rodar `npm run dev` contra um projeto Supabase
  configurado (ver "Passo manual" no HANDOVER.md) e conferir as páginas no
  navegador. `searchImoveis`, que é pura, continua sem essa limitação mas já
  não tem um arquivo de teste próprio — se for alterada no futuro, vale
  recriar um teste isolado só para ela.
```

- [ ] **Step 7: Write `.env.example` and the manual-step note in `HANDOVER.md`**

Create `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Add a new section to `HANDOVER.md` (append after "## Como rodar os testes"):

```markdown
## Passo manual — conectar o Supabase (obrigatório antes de rodar a partir daqui)

O código já está preparado para usar o Supabase, mas **ninguém criou o
projeto ainda** — isso precisa ser feito manualmente por uma pessoa com
acesso à conta Supabase do cliente:

1. Crie um projeto novo em https://supabase.com/dashboard, sugestão de nome
   `luizlopes-corretor`.
2. Abra o **SQL Editor** do projeto e cole o conteúdo de
   `supabase/migrations/0001_init.sql`, depois clique em "Run". Isso cria as
   tabelas `imoveis`/`imovel_fotos`, as policies de RLS e o bucket de Storage
   `imoveis-fotos`.
3. Em **Authentication → Users**, crie manualmente o único usuário admin
   (email + senha) que o corretor/filho vai usar para entrar em
   `/admin/login`. Não há cadastro público — só esse usuário existe.
4. Em **Project Settings → API**, copie a "Project URL" e a chave "anon
   public".
5. Crie um arquivo `.env.local` na raiz do projeto (copie de `.env.example`)
   e preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<Project URL do passo 4>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave anon public do passo 4>
   ```
6. Reinicie `npm run dev`. A partir daqui o site lê/escreve no banco real —
   os dados mock (`lib/mock/imoveis.ts`) deixam de ser usados pela camada de
   dados, mas o arquivo continua no repositório como referência de formato.

Sem esses passos, `npm run dev` continua rodando mas todas as páginas que
buscam imóveis lançam erro (`Falha ao buscar imóveis: ...`), porque as
variáveis de ambiente do Supabase estarão vazias.
```

- [ ] **Step 8: Confirm the app fails gracefully without env vars (expected at this stage — no live project yet)**

Run: `npm run dev`, visit `http://localhost:3000`.
Expected: a runtime error is thrown from `getImovelDestaque`/`getImoveis` (Supabase client can't authenticate with empty env vars) — this is the correct, expected state until a human completes Step 7's manual setup. Confirm the error message matches `Falha ao buscar imóveis:` or `Falha ao buscar imóvel em destaque:`, not an unrelated crash (e.g. a TypeScript/import error), to verify the wiring itself is correct.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/0001_init.sql lib/supabase/client.ts lib/supabase/server.ts lib/data/imoveis.ts .env.example HANDOVER.md ARCHITECTURE.md package.json package-lock.json
git rm lib/data/imoveis.test.ts
git commit -m "feat: add Supabase schema migration and wire data-access layer to Supabase"
```

---

### Task 22: `/admin/login` page and middleware route protection

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `middleware.ts`
- Modify: `app/admin/layout.tsx`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient` (Task 21) in the login form; `createServerSupabaseClient` pattern replicated for the Edge middleware (middleware runs in a separate runtime and needs its own `@supabase/ssr` client built on `NextRequest`/`NextResponse`, so it does not import `lib/supabase/server.ts`, which depends on `next/headers`' server-only `cookies()`).
- Produces: any request to `/admin/*` other than `/admin/login` redirects to `/admin/login` when there is no active Supabase session; a logged-in user hitting `/admin/login` is redirected to `/admin/imoveis`.

- [ ] **Step 1: Write `middleware.ts` at the project root**

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Roda em toda requisição para /admin/*. Comentários passo a passo porque é
// código que ninguém mexe com frequência e precisa ser entendido rápido
// quando precisar:
//
// 1. Cria uma resposta "de passagem" e um cliente Supabase que lê/escreve
//    cookies nela (é assim que a sessão de login é repassada ao navegador).
// 2. Pergunta ao Supabase se há um usuário logado (`getUser()`).
// 3. Se a rota pedida é `/admin/login`: usuário já logado é mandado para
//    `/admin/imoveis` (não faz sentido ver a tela de login de novo);
//    usuário sem sessão pode ver a tela normalmente.
// 4. Qualquer outra rota `/admin/*`: sem sessão, redireciona para
//    `/admin/login`; com sessão, deixa passar.
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (isLoginPage) {
    if (user) {
      return NextResponse.redirect(new URL('/admin/imoveis', request.url));
    }
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 2: Write `app/admin/login/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    // Fluxo: valida os campos localmente -> chama o Supabase Auth -> em
    // caso de sucesso o Supabase já grava a sessão nos cookies (feito pelo
    // cliente `@supabase/ssr`) e a gente navega para a lista de imóveis; o
    // middleware (Task 22) passa a deixar `/admin/*` acessível a partir daí.
    if (!email || !senha) {
      setErro('Preencha email e senha.');
      setCarregando(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro('Email ou senha incorretos.');
      setCarregando(false);
      return;
    }

    router.push('/admin/imoveis');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-line rounded-2xl p-8">
        <h1 className="font-display font-extrabold text-xl mb-1">Área administrativa</h1>
        <p className="text-[13px] text-ink-soft mb-6">Luiz Lopes Corretor</p>

        <label htmlFor="email" className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border border-line rounded-lg px-3.5 py-2.5 text-[14px] mb-4"
          autoComplete="username"
        />

        <label htmlFor="senha" className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          className="w-full border border-line rounded-lg px-3.5 py-2.5 text-[14px] mb-5"
          autoComplete="current-password"
        />

        {erro && <p className="text-red-600 text-[13px] mb-4">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="w-full font-display font-bold text-[13px] px-5 py-3 rounded-lg bg-gold text-white disabled:opacity-60"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Move the logged-in admin pages into a `(protegido)` route group so `/admin/login` can stay outside the header/logout chrome**

Next.js route groups (`(name)`) don't affect the URL, only the layout nesting — this lets `/admin/login` be a sibling of the protected pages instead of a child, so it doesn't inherit their header.

Run: `mkdir -p "app/admin/(protegido)"`

Move `app/admin/page.tsx` to `app/admin/(protegido)/page.tsx` (same file content from Task 3, no changes needed). Every admin page built from Task 23 onward (`/admin/imoveis`, `/admin/imoveis/novo`, `/admin/imoveis/[id]/editar`, `/admin/imoveis/[id]/post`) is written directly under `app/admin/(protegido)/imoveis/...` for the same reason.

Replace `app/admin/layout.tsx` with a plain passthrough (no header — `/admin/login` renders through this layout too, and the login screen should not show admin chrome):

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper text-ink font-body">{children}</div>;
}
```

Create `app/admin/(protegido)/layout.tsx` with the header and log-out action:

```tsx
import LogoutButton from '@/components/admin/LogoutButton';

export default function AdminProtegidoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-line">
        <span className="font-display font-bold text-[14px]">Luiz Lopes — Admin</span>
        <LogoutButton />
      </header>
      <div className="p-6 md:p-10">{children}</div>
    </div>
  );
}
```

Create `components/admin/LogoutButton.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className="text-[13px] font-semibold text-ink-soft">
      Sair
    </button>
  );
}
```

- [ ] **Step 4: Run dev server and confirm the redirect behavior**

Run: `npm run dev`, visit `http://localhost:3000/admin`.
Expected: since there's no Supabase session (and no live project yet — Task 21 left env vars empty), the middleware itself will throw the same "empty env var" error as Task 21's Step 8 when it tries to call `supabase.auth.getUser()`. This is expected until a human completes the Task 21 Step 7 manual setup with a real project. Once a real project and `.env.local` are in place (outside the scope of this plan's automated steps), re-run this check: visiting `/admin` redirects to `/admin/login`; submitting the admin email/password created in Task 21 Step 7.3 redirects to `/admin/imoveis` (404 until Task 26) and shows the "Sair" button in the header; clicking "Sair" returns to `/admin/login`.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts "app/admin/login" "app/admin/(protegido)" app/admin/layout.tsx components/admin/LogoutButton.tsx
git commit -m "feat: add admin login and middleware route protection"
```

---

### Task 23: Server Actions for imóvel CRUD, `ImovelForm` component, and `/admin/imoveis/novo`

**Files:**
- Create: `lib/actions/imoveis.ts`
- Create: `components/admin/ImovelForm.tsx`
- Create: `app/admin/(protegido)/imoveis/novo/page.tsx`

**Interfaces:**
- Consumes: `TipoImovel`, `Finalidade`, `StatusImovel` from `lib/types.ts`; `createServerSupabaseClient` (Task 21).
- Produces: `ImovelInput` type and Server Actions `createImovel(input: ImovelInput): Promise<{ id: string }>`, `updateImovel(id: string, input: ImovelInput): Promise<void>`, `deleteImovel(id: string): Promise<void>`, `updateStatusImovel(id: string, status: StatusImovel): Promise<void>` — `deleteImovel`/`updateStatusImovel` are consumed by the list page (Task 26), `updateImovel` by the edit page (Task 25). `ImovelForm` default export, Client Component, props `{ initialValue?: Partial<ImovelInput>; onSubmit: (input: ImovelInput) => Promise<{ id: string } | void>; submitLabel: string; onSuccessRedirect: (id: string | undefined) => string }`.

- [ ] **Step 1: Write `lib/actions/imoveis.ts`**

```ts
'use server';

// Server Actions do CRUD de imóveis. Fluxo de dados em cada função:
// 1. Validação simples dos campos obrigatórios (recusa dados incompletos
//    antes de gastar uma chamada ao banco).
// 2. Chamada ao Supabase usando o cliente autenticado do servidor — as
//    policies de RLS da migração (0001_init.sql) já garantem que só um
//    usuário logado consegue escrever, então não precisamos checar sessão
//    aqui de novo.
// 3. `revalidatePath` invalida o cache do Next.js nas páginas que mostram
//    esses dados, para que a alteração apareça imediatamente sem precisar
//    de refresh manual.

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Finalidade, StatusImovel, TipoImovel } from '@/lib/types';

export interface ImovelInput {
  titulo: string;
  tipo: TipoImovel;
  finalidade: Finalidade;
  endereco: string;
  bairro: string;
  quadra: string | null;
  lote: string | null;
  area_total_m2: number | null;
  area_construida_m2: number | null;
  dimensoes: string | null;
  quartos: number | null;
  vagas: number | null;
  condominio_valor: number | null;
  preco: number;
  preco_observacao: string | null;
  situacao: string[];
  descricao: string;
  status: StatusImovel;
  destaque: boolean;
}

function validar(input: ImovelInput) {
  if (!input.titulo.trim()) throw new Error('Título é obrigatório.');
  if (!input.endereco.trim()) throw new Error('Endereço é obrigatório.');
  if (!input.bairro.trim()) throw new Error('Bairro é obrigatório.');
  if (!input.preco || input.preco <= 0) throw new Error('Preço deve ser maior que zero.');
}

function revalidarPaginasPublicas(id?: string) {
  revalidatePath('/admin/imoveis');
  revalidatePath('/');
  revalidatePath('/imoveis');
  if (id) revalidatePath(`/imoveis/${id}`);
}

export async function createImovel(input: ImovelInput): Promise<{ id: string }> {
  validar(input);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('imoveis').insert(input).select('id').single();
  if (error) throw new Error(`Falha ao criar imóvel: ${error.message}`);

  revalidarPaginasPublicas();
  return { id: data.id as string };
}

export async function updateImovel(id: string, input: ImovelInput): Promise<void> {
  validar(input);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('imoveis').update(input).eq('id', id);
  if (error) throw new Error(`Falha ao atualizar imóvel: ${error.message}`);

  revalidarPaginasPublicas(id);
}

export async function deleteImovel(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('imoveis').delete().eq('id', id);
  if (error) throw new Error(`Falha ao excluir imóvel: ${error.message}`);

  revalidarPaginasPublicas(id);
}

export async function updateStatusImovel(id: string, status: StatusImovel): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('imoveis').update({ status }).eq('id', id);
  if (error) throw new Error(`Falha ao mudar status: ${error.message}`);

  revalidarPaginasPublicas(id);
}
```

- [ ] **Step 2: Write `components/admin/ImovelForm.tsx` with fields conditional on `tipo`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Finalidade, StatusImovel, TipoImovel } from '@/lib/types';
import type { ImovelInput } from '@/lib/actions/imoveis';

const TIPOS: { value: TipoImovel; label: string }[] = [
  { value: 'terreno', label: 'Terreno' },
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'sobrado', label: 'Sobrado' },
];

const FINALIDADES: { value: Finalidade; label: string }[] = [
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
];

const STATUS: { value: StatusImovel; label: string }[] = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
];

const VALOR_PADRAO: ImovelInput = {
  titulo: '',
  tipo: 'terreno',
  finalidade: 'venda',
  endereco: '',
  bairro: '',
  quadra: null,
  lote: null,
  area_total_m2: null,
  area_construida_m2: null,
  dimensoes: null,
  quartos: null,
  vagas: null,
  condominio_valor: null,
  preco: 0,
  preco_observacao: null,
  situacao: [],
  descricao: '',
  status: 'disponivel',
  destaque: false,
};

interface ImovelFormProps {
  initialValue?: Partial<ImovelInput>;
  onSubmit: (input: ImovelInput) => Promise<{ id: string } | void>;
  submitLabel: string;
  onSuccessRedirect: (id: string | undefined) => string;
}

// Campo de texto simples para números que podem ficar vazios (o form usa
// string internamente para não brigar com o <input type="number"> do
// navegador quando o campo está vazio, e converte para number | null só na
// hora de montar o payload em `handleSubmit`).
function paraNumeroOuNulo(valor: string): number | null {
  if (valor.trim() === '') return null;
  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
}

export default function ImovelForm({ initialValue, onSubmit, submitLabel, onSuccessRedirect }: ImovelFormProps) {
  const valorInicial: ImovelInput = { ...VALOR_PADRAO, ...initialValue };

  const [tipo, setTipo] = useState<TipoImovel>(valorInicial.tipo);
  const [finalidade, setFinalidade] = useState<Finalidade>(valorInicial.finalidade);
  const [titulo, setTitulo] = useState(valorInicial.titulo);
  const [endereco, setEndereco] = useState(valorInicial.endereco);
  const [bairro, setBairro] = useState(valorInicial.bairro);
  const [quadra, setQuadra] = useState(valorInicial.quadra ?? '');
  const [lote, setLote] = useState(valorInicial.lote ?? '');
  const [areaTotal, setAreaTotal] = useState(String(valorInicial.area_total_m2 ?? ''));
  const [areaConstruida, setAreaConstruida] = useState(String(valorInicial.area_construida_m2 ?? ''));
  const [dimensoes, setDimensoes] = useState(valorInicial.dimensoes ?? '');
  const [quartos, setQuartos] = useState(String(valorInicial.quartos ?? ''));
  const [vagas, setVagas] = useState(String(valorInicial.vagas ?? ''));
  const [condominioValor, setCondominioValor] = useState(String(valorInicial.condominio_valor ?? ''));
  const [preco, setPreco] = useState(String(valorInicial.preco || ''));
  const [precoObservacao, setPrecoObservacao] = useState(valorInicial.preco_observacao ?? '');
  const [situacaoTexto, setSituacaoTexto] = useState(valorInicial.situacao.join(', '));
  const [descricao, setDescricao] = useState(valorInicial.descricao);
  const [status, setStatus] = useState<StatusImovel>(valorInicial.status);
  const [destaque, setDestaque] = useState(valorInicial.destaque);

  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const mostrarCamposTerreno = tipo === 'terreno';
  const mostrarCamposMoradia = tipo === 'casa' || tipo === 'sobrado' || tipo === 'apartamento';
  const mostrarCondominio = tipo === 'apartamento';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    // Monta o payload só com os campos válidos para o tipo escolhido — se o
    // usuário trocar de "terreno" para "casa" depois de preencher
    // dimensões, por exemplo, esses campos não vão junto (evita lixo no
    // banco que a FichaTecnica dinâmica teria que voltar a filtrar).
    const input: ImovelInput = {
      titulo,
      tipo,
      finalidade,
      endereco,
      bairro,
      quadra: mostrarCamposTerreno && quadra.trim() ? quadra.trim() : null,
      lote: mostrarCamposTerreno && lote.trim() ? lote.trim() : null,
      area_total_m2: mostrarCamposTerreno ? paraNumeroOuNulo(areaTotal) : null,
      area_construida_m2: mostrarCamposMoradia ? paraNumeroOuNulo(areaConstruida) : null,
      dimensoes: mostrarCamposTerreno && dimensoes.trim() ? dimensoes.trim() : null,
      quartos: mostrarCamposMoradia ? paraNumeroOuNulo(quartos) : null,
      vagas: mostrarCamposMoradia ? paraNumeroOuNulo(vagas) : null,
      condominio_valor: mostrarCondominio ? paraNumeroOuNulo(condominioValor) : null,
      preco: Number(preco) || 0,
      preco_observacao: precoObservacao.trim() ? precoObservacao.trim() : null,
      situacao: situacaoTexto
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      descricao,
      status,
      destaque,
    };

    try {
      const resultado = await onSubmit(input);
      const id = resultado && 'id' in resultado ? resultado.id : undefined;
      router.push(onSuccessRedirect(id));
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar imóvel.');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Tipo</label>
          <select
            value={tipo}
            onChange={(event) => setTipo(event.target.value as TipoImovel)}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
          >
            {TIPOS.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Finalidade</label>
          <select
            value={finalidade}
            onChange={(event) => setFinalidade(event.target.value as Finalidade)}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
          >
            {FINALIDADES.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Título</label>
        <input
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
          placeholder="Ex.: Terreno plano — Cidade Jardim I"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Endereço</label>
          <input
            value={endereco}
            onChange={(event) => setEndereco(event.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
          />
        </div>
        <div>
          <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Bairro</label>
          <input
            value={bairro}
            onChange={(event) => setBairro(event.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
          />
        </div>
      </div>

      {/* Campos condicionais — só aparecem para o tipo em que fazem
          sentido, refletindo a regra do spec de que quadra/lote (e o resto
          da ficha técnica) nunca são fixos. */}
      {mostrarCamposTerreno && (
        <fieldset className="border border-line rounded-lg p-4 space-y-4">
          <legend className="text-[11px] font-semibold text-ink-soft px-1">Dados do terreno</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Área total (m²)</label>
              <input
                value={areaTotal}
                onChange={(event) => setAreaTotal(event.target.value)}
                type="number"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Dimensões</label>
              <input
                value={dimensoes}
                onChange={(event) => setDimensoes(event.target.value)}
                placeholder="Ex.: 10m x 20m"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">
                Quadra <span className="normal-case text-ink-soft">(opcional)</span>
              </label>
              <input
                value={quadra}
                onChange={(event) => setQuadra(event.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">
                Lote <span className="normal-case text-ink-soft">(opcional)</span>
              </label>
              <input
                value={lote}
                onChange={(event) => setLote(event.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
              />
            </div>
          </div>
        </fieldset>
      )}

      {mostrarCamposMoradia && (
        <fieldset className="border border-line rounded-lg p-4 space-y-4">
          <legend className="text-[11px] font-semibold text-ink-soft px-1">Dados do imóvel</legend>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Quartos</label>
              <input
                value={quartos}
                onChange={(event) => setQuartos(event.target.value)}
                type="number"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Vagas</label>
              <input
                value={vagas}
                onChange={(event) => setVagas(event.target.value)}
                type="number"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Área (m²)</label>
              <input
                value={areaConstruida}
                onChange={(event) => setAreaConstruida(event.target.value)}
                type="number"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
              />
            </div>
          </div>
          {mostrarCondominio && (
            <div>
              <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">
                Condomínio (R$) <span className="normal-case text-ink-soft">(opcional)</span>
              </label>
              <input
                value={condominioValor}
                onChange={(event) => setCondominioValor(event.target.value)}
                type="number"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
              />
            </div>
          )}
        </fieldset>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Preço (R$)</label>
          <input
            value={preco}
            onChange={(event) => setPreco(event.target.value)}
            type="number"
            className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
          />
        </div>
        <div>
          <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">
            Observação do preço <span className="normal-case text-ink-soft">(opcional)</span>
          </label>
          <input
            value={precoObservacao}
            onChange={(event) => setPrecoObservacao(event.target.value)}
            placeholder="Ex.: aceito propostas"
            className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">
          Situação <span className="normal-case text-ink-soft">(separada por vírgula, opcional)</span>
        </label>
        <input
          value={situacaoTexto}
          onChange={(event) => setSituacaoTexto(event.target.value)}
          placeholder="Ex.: quitado, escriturado"
          className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
        />
      </div>

      <div>
        <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Descrição</label>
        <textarea
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          rows={4}
          className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusImovel)}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-[14px]"
          >
            {STATUS.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-[13px] font-semibold pb-2.5">
          <input type="checkbox" checked={destaque} onChange={(event) => setDestaque(event.target.checked)} />
          Destacar na home
        </label>
      </div>

      {erro && <p className="text-red-600 text-[13px]">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="font-display font-bold text-[13px] px-6 py-3 rounded-lg bg-gold text-white disabled:opacity-60"
      >
        {enviando ? 'Salvando...' : submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Write `app/admin/(protegido)/imoveis/novo/page.tsx`**

```tsx
'use client';

import ImovelForm from '@/components/admin/ImovelForm';
import { createImovel } from '@/lib/actions/imoveis';

export default function NovoImovelPage() {
  return (
    <main>
      <h1 className="font-display font-extrabold text-xl mb-6">Novo imóvel</h1>
      <ImovelForm
        onSubmit={createImovel}
        submitLabel="Criar imóvel"
        onSuccessRedirect={(id) => `/admin/imoveis/${id}/editar`}
      />
    </main>
  );
}
```

Redirecting to the edit page right after creation (rather than back to the list) is deliberate: photo upload (Task 24) only works once the imóvel has an `id` to attach `imovel_fotos` rows to, so "criar" is step one of a two-step flow that ends on `/editar`.

- [ ] **Step 4: Run dev server and confirm the form renders and reacts to `tipo`**

Run: `npm run dev`, visit `http://localhost:3000/admin/imoveis/novo` (requires a logged-in session per Task 22 — if no live Supabase project exists yet, this route redirects to `/admin/login` and then middleware throws the expected empty-env-var error; re-run this check once Task 21's manual setup is complete). Once logged in: selecting "Terreno" shows the "Dados do terreno" fieldset (área total, dimensões, quadra, lote) and hides "Dados do imóvel"; selecting "Casa" does the reverse and additionally hides quadra/lote entirely; selecting "Apartamento" also reveals the "Condomínio" field inside "Dados do imóvel". Submitting a valid form creates a row in Supabase and redirects to `/admin/imoveis/[novo-id]/editar` (404 until Task 25 — expected at this stage).

- [ ] **Step 5: Commit**

```bash
git add lib/actions/imoveis.ts components/admin/ImovelForm.tsx "app/admin/(protegido)/imoveis/novo"
git commit -m "feat: add imovel Server Actions, ImovelForm, and /admin/imoveis/novo"
```

---

### Task 24: `PhotoUploader` component (upload to Storage, reorder, mark cover)

**Files:**
- Create: `components/admin/PhotoUploader.tsx`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient` (Task 21), `ImovelFoto` (Task 4).
- Produces: `PhotoUploader` default export, Client Component, props `{ imovelId: string; fotosIniciais: ImovelFoto[] }`. Consumed by the edit page (Task 25), which is the only place an imóvel already has an `id` to attach photos to.

- [ ] **Step 1: Write `components/admin/PhotoUploader.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { ImovelFoto } from '@/lib/types';

interface PhotoUploaderProps {
  imovelId: string;
  fotosIniciais: ImovelFoto[];
}

export default function PhotoUploader({ imovelId, fotosIniciais }: PhotoUploaderProps) {
  const [fotos, setFotos] = useState<ImovelFoto[]>([...fotosIniciais].sort((a, b) => a.ordem - b.ordem));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Fluxo de upload, arquivo por arquivo:
  // 1. Sobe o binário para o bucket 'imoveis-fotos', numa subpasta por
  //    imóvel (evita colisão de nomes entre imóveis diferentes).
  // 2. Pega a URL pública do arquivo (o bucket é público para leitura —
  //    configurado na migração 0001_init.sql).
  // 3. Cria a linha correspondente em `imovel_fotos`, marcando como capa
  //    automaticamente só se o imóvel ainda não tiver nenhuma foto.
  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = event.target.files;
    if (!arquivos || arquivos.length === 0) return;

    setEnviando(true);
    setErro(null);
    const supabase = createBrowserSupabaseClient();

    try {
      let proximaOrdem = fotos.length > 0 ? Math.max(...fotos.map((f) => f.ordem)) + 1 : 0;
      let jaTemCapa = fotos.some((f) => f.is_capa);

      for (const arquivo of Array.from(arquivos)) {
        const caminho = `${imovelId}/${Date.now()}-${arquivo.name}`;

        const { error: erroUpload } = await supabase.storage.from('imoveis-fotos').upload(caminho, arquivo);
        if (erroUpload) throw new Error(`Falha ao enviar ${arquivo.name}: ${erroUpload.message}`);

        const { data: urlPublica } = supabase.storage.from('imoveis-fotos').getPublicUrl(caminho);

        const marcarComoCapa = !jaTemCapa;
        const { data: fotoInserida, error: erroInsert } = await supabase
          .from('imovel_fotos')
          .insert({
            imovel_id: imovelId,
            url: urlPublica.publicUrl,
            ordem: proximaOrdem,
            is_capa: marcarComoCapa,
          })
          .select()
          .single();
        if (erroInsert) throw new Error(`Falha ao salvar foto ${arquivo.name}: ${erroInsert.message}`);

        setFotos((atual) => [...atual, fotoInserida as ImovelFoto]);
        proximaOrdem += 1;
        if (marcarComoCapa) jaTemCapa = true;
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar fotos.');
    } finally {
      setEnviando(false);
      event.target.value = '';
    }
  }

  // Troca a `ordem` de duas fotos vizinhas — é a forma mais simples de
  // reordenar sem precisar de uma biblioteca de drag-and-drop.
  async function moverFoto(id: string, direcao: 'up' | 'down') {
    const indice = fotos.findIndex((f) => f.id === id);
    const alvo = direcao === 'up' ? indice - 1 : indice + 1;
    if (indice === -1 || alvo < 0 || alvo >= fotos.length) return;

    const fotoA = fotos[indice]!;
    const fotoB = fotos[alvo]!;
    const supabase = createBrowserSupabaseClient();

    const [resultadoA, resultadoB] = await Promise.all([
      supabase.from('imovel_fotos').update({ ordem: fotoB.ordem }).eq('id', fotoA.id),
      supabase.from('imovel_fotos').update({ ordem: fotoA.ordem }).eq('id', fotoB.id),
    ]);
    if (resultadoA.error || resultadoB.error) {
      setErro('Falha ao reordenar fotos.');
      return;
    }

    const novaLista = fotos.map((foto) => {
      if (foto.id === fotoA.id) return { ...foto, ordem: fotoB.ordem };
      if (foto.id === fotoB.id) return { ...foto, ordem: fotoA.ordem };
      return foto;
    });
    novaLista.sort((a, b) => a.ordem - b.ordem);
    setFotos(novaLista);
  }

  async function marcarCapa(id: string) {
    const supabase = createBrowserSupabaseClient();
    const capaAtual = fotos.find((f) => f.is_capa);

    if (capaAtual && capaAtual.id !== id) {
      const { error } = await supabase.from('imovel_fotos').update({ is_capa: false }).eq('id', capaAtual.id);
      if (error) {
        setErro('Falha ao trocar a capa.');
        return;
      }
    }

    const { error } = await supabase.from('imovel_fotos').update({ is_capa: true }).eq('id', id);
    if (error) {
      setErro('Falha ao marcar capa.');
      return;
    }

    setFotos((atual) => atual.map((foto) => ({ ...foto, is_capa: foto.id === id })));
  }

  async function removerFoto(id: string) {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from('imovel_fotos').delete().eq('id', id);
    if (error) {
      setErro('Falha ao remover foto.');
      return;
    }
    setFotos((atual) => atual.filter((foto) => foto.id !== id));
  }

  return (
    <div>
      <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Fotos</label>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        disabled={enviando}
        className="text-[13px] mb-4"
      />
      {enviando && <p className="text-[13px] text-ink-soft mb-3">Enviando...</p>}
      {erro && <p className="text-red-600 text-[13px] mb-3">{erro}</p>}

      <div className="grid grid-cols-3 gap-3">
        {fotos.map((foto, index) => (
          <div key={foto.id} className="border border-line rounded-lg overflow-hidden">
            <div className="relative h-24 bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm de URLs externas do Supabase Storage */}
              <img src={foto.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              {foto.is_capa && (
                <span className="absolute top-1.5 left-1.5 bg-gold text-white text-[9px] font-bold px-2 py-0.5 rounded">
                  CAPA
                </span>
              )}
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 text-[11px]">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moverFoto(foto.id, 'up')}
                  disabled={index === 0}
                  className="disabled:opacity-30"
                  aria-label="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moverFoto(foto.id, 'down')}
                  disabled={index === fotos.length - 1}
                  className="disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
              </div>
              {!foto.is_capa && (
                <button type="button" onClick={() => marcarCapa(foto.id)} className="text-gold font-semibold">
                  Marcar capa
                </button>
              )}
              <button type="button" onClick={() => removerFoto(foto.id)} className="text-red-600">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run a type-check (full visual verification happens in Task 25, once this is wired into the edit page)**

Run: `npx tsc --noEmit`
Expected: no errors — `PhotoUploader` has no consumer yet, so this only confirms the component compiles.

- [ ] **Step 3: Commit**

```bash
git add components/admin/PhotoUploader.tsx
git commit -m "feat: add PhotoUploader component with reorder and cover selection"
```

---

### Task 25: `/admin/imoveis/[id]/editar` page

**Files:**
- Create: `app/admin/(protegido)/imoveis/[id]/editar/page.tsx`
- Create: `app/admin/(protegido)/imoveis/[id]/editar/EditarImovelClient.tsx`

**Interfaces:**
- Consumes: `getImovelById` (Task 6/21), `ImovelForm` (Task 23), `PhotoUploader` (Task 24), `updateImovel` (Task 23).
- Produces: the `/admin/imoveis/[id]/editar` route (server-fetches the imóvel, 404s on unknown id, prefills the form and photo list).

- [ ] **Step 1: Write the client wrapper `app/admin/(protegido)/imoveis/[id]/editar/EditarImovelClient.tsx`**

This is a separate small Client Component (rather than making the whole page a Client Component) so the initial imóvel fetch stays server-side — the page only ships the already-fetched data to the client, not the data-access/Supabase-query code.

```tsx
'use client';

import ImovelForm from '@/components/admin/ImovelForm';
import PhotoUploader from '@/components/admin/PhotoUploader';
import { updateImovel } from '@/lib/actions/imoveis';
import type { Imovel } from '@/lib/types';

interface EditarImovelClientProps {
  imovel: Imovel;
}

export default function EditarImovelClient({ imovel }: EditarImovelClientProps) {
  return (
    <div className="space-y-10">
      <ImovelForm
        initialValue={imovel}
        onSubmit={(input) => updateImovel(imovel.id, input)}
        submitLabel="Salvar alterações"
        onSuccessRedirect={() => '/admin/imoveis'}
      />

      <div className="max-w-2xl">
        <h2 className="font-display font-bold text-base mb-3">Fotos</h2>
        <PhotoUploader imovelId={imovel.id} fotosIniciais={imovel.fotos} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/admin/(protegido)/imoveis/[id]/editar/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getImovelById } from '@/lib/data/imoveis';
import EditarImovelClient from './EditarImovelClient';

interface EditarImovelPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarImovelPage({ params }: EditarImovelPageProps) {
  const { id } = await params;
  const imovel = await getImovelById(id);

  if (!imovel) {
    notFound();
  }

  return (
    <main>
      <h1 className="font-display font-extrabold text-xl mb-6">Editar imóvel</h1>
      <EditarImovelClient imovel={imovel} />
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm (requires a real Supabase project connected per Task 21's manual setup)**

Run: `npm run dev`, log in at `/admin/login`, create a terreno via `/admin/imoveis/novo` (redirects here on success). Expected: the form is pre-filled with the just-created values, the terreno fieldset shows because `tipo` is `terreno`; uploading an image file via the "Fotos" section shows it appear in the 3-column grid tagged "CAPA" (it's the first photo); uploading a second photo and clicking "Marcar capa" on it moves the CAPA tag; clicking the "↑"/"↓" arrows reorders the grid. Visiting `/admin/imoveis/uma-id-que-nao-existe/editar` shows the Next.js 404 page.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protegido)/imoveis/[id]/editar"
git commit -m "feat: add /admin/imoveis/[id]/editar page"
```

---

### Task 26: `/admin/imoveis` list page (search/filter, edit/status/delete actions)

**Files:**
- Modify: `lib/data/imoveis.ts` (add an admin-only read function)
- Create: `components/admin/ImoveisAdminList.tsx`
- Create: `app/admin/(protegido)/imoveis/page.tsx`

**Interfaces:**
- Consumes: `deleteImovel`, `updateStatusImovel` (Task 23).
- Produces: `getImoveisAdmin(): Promise<Imovel[]>` (new — the public `getImoveis` from Task 6/21 excludes `status: 'vendido'`, but the admin list must show every imóvel including sold ones, since the spec's whole point of `status` is letting the corretor keep sold imóveis out of the public site without losing them). `ImoveisAdminList` default export, Client Component, props `{ imoveisIniciais: Imovel[] }`.

- [ ] **Step 1: Add `getImoveisAdmin` to `lib/data/imoveis.ts`**

Add this function to `lib/data/imoveis.ts` (below `getImovelDestaque`):

```ts
// Só para o admin: ao contrário de getImoveis(), NÃO filtra por status —
// o corretor precisa ver (e poder reverter) imóveis reservados/vendidos.
export async function getImoveisAdmin(): Promise<Imovel[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('imoveis')
    .select(SELECT_COM_FOTOS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Falha ao buscar imóveis (admin): ${error.message}`);
  return (data as ImovelRow[]).map(mapRow);
}
```

- [ ] **Step 2: Write `components/admin/ImoveisAdminList.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import type { Imovel, StatusImovel } from '@/lib/types';
import { formatarPreco } from '@/lib/format';
import { deleteImovel, updateStatusImovel } from '@/lib/actions/imoveis';

const STATUS_OPCOES: { value: StatusImovel; label: string }[] = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
];

interface ImoveisAdminListProps {
  imoveisIniciais: Imovel[];
}

export default function ImoveisAdminList({ imoveisIniciais }: ImoveisAdminListProps) {
  const [imoveis, setImoveis] = useState(imoveisIniciais);
  const [busca, setBusca] = useState('');
  const [pendente, startTransition] = useTransition();

  const filtrados = imoveis.filter((imovel) =>
    `${imovel.titulo} ${imovel.bairro}`.toLowerCase().includes(busca.toLowerCase())
  );

  function handleStatusChange(id: string, status: StatusImovel) {
    // Atualiza a tela imediatamente (otimista) e chama a Server Action em
    // segundo plano; se ela falhar, o admin recarrega a página e vê o
    // estado real vindo do banco.
    setImoveis((atual) => atual.map((imovel) => (imovel.id === id ? { ...imovel, status } : imovel)));
    startTransition(async () => {
      await updateStatusImovel(id, status);
    });
  }

  function handleDelete(id: string, titulo: string) {
    const confirmado = window.confirm(`Excluir "${titulo}"? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    setImoveis((atual) => atual.filter((imovel) => imovel.id !== id));
    startTransition(async () => {
      await deleteImovel(id);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por título ou bairro..."
          className="border border-line rounded-lg px-3.5 py-2.5 text-[14px] w-full max-w-xs"
        />
        <Link
          href="/admin/imoveis/novo"
          className="font-display font-bold text-[13px] px-5 py-3 rounded-lg bg-gold text-white shrink-0"
        >
          Novo imóvel
        </Link>
      </div>

      <div className="space-y-3">
        {filtrados.length === 0 && <p className="text-ink-soft text-sm">Nenhum imóvel encontrado.</p>}

        {filtrados.map((imovel) => (
          <div
            key={imovel.id}
            className="flex items-center justify-between gap-4 border border-line rounded-lg px-5 py-4 flex-wrap"
          >
            <div>
              <p className="font-display font-bold text-[14px]">{imovel.titulo}</p>
              <p className="text-[12px] text-ink-soft capitalize">
                {imovel.tipo} · {imovel.finalidade} · {formatarPreco(imovel)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={imovel.status}
                onChange={(event) => handleStatusChange(imovel.id, event.target.value as StatusImovel)}
                disabled={pendente}
                className="border border-line rounded-lg px-2.5 py-2 text-[12.5px]"
              >
                {STATUS_OPCOES.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>

              <Link href={`/admin/imoveis/${imovel.id}/editar`} className="text-[13px] font-semibold text-gold">
                Editar
              </Link>
              <Link href={`/admin/imoveis/${imovel.id}/post`} className="text-[13px] font-semibold text-ink">
                Gerar post
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(imovel.id, imovel.titulo)}
                disabled={pendente}
                className="text-[13px] font-semibold text-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `app/admin/(protegido)/imoveis/page.tsx`**

```tsx
import ImoveisAdminList from '@/components/admin/ImoveisAdminList';
import { getImoveisAdmin } from '@/lib/data/imoveis';

export default async function AdminImoveisPage() {
  const imoveis = await getImoveisAdmin();

  return (
    <main>
      <h1 className="font-display font-extrabold text-xl mb-6">Imóveis</h1>
      <ImoveisAdminList imoveisIniciais={imoveis} />
    </main>
  );
}
```

- [ ] **Step 4: Run dev server and confirm (requires a real Supabase project connected per Task 21's manual setup)**

Run: `npm run dev`, log in at `/admin/login`, visit `/admin/imoveis`. Expected: every imóvel created so far is listed with tipo/finalidade/preço, a status dropdown, and Editar/Gerar post/Excluir actions; typing in the search box filters the list by título/bairro; changing the status dropdown persists (refresh the page and the new status is still there); clicking Excluir asks for confirmation and removes the row after confirming.

- [ ] **Step 5: Commit**

```bash
git add lib/data/imoveis.ts components/admin/ImoveisAdminList.tsx "app/admin/(protegido)/imoveis/page.tsx"
git commit -m "feat: add /admin/imoveis list page with search, status change, and delete"
```

---

### Task 27: `/admin/imoveis/[id]/post` — client-side canvas PNG post generator

**Files:**
- Create: `components/admin/PostGenerator.tsx`
- Create: `app/admin/(protegido)/imoveis/[id]/post/page.tsx`

**Interfaces:**
- Consumes: `getImovelById` (Task 6/21), `buildFichaFields` (Task 10), `formatarPreco` (Task 5).
- Produces: the `/admin/imoveis/[id]/post` route. `PostGenerator` default export, Client Component, props `{ imovel: Imovel }`. Uses a **separate, local** navy/lima color palette (`CORES_POST`) defined only inside this file — never added to `tailwind.config.ts` — per the constraint that this pairing is exclusive to social post templates. No server-side image rendering: the PNG is produced entirely by `<canvas>` in the browser and downloaded via `canvas.toDataURL`.

- [ ] **Step 1: Write `components/admin/PostGenerator.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { Imovel } from '@/lib/types';
import { formatarPreco } from '@/lib/format';
import { buildFichaFields } from '@/components/site/FichaTecnica';

type Template = 'feed' | 'stories';

const TAMANHOS: Record<Template, { largura: number; altura: number }> = {
  feed: { largura: 1080, altura: 1080 },
  stories: { largura: 1080, altura: 1920 },
};

// Identidade visual das redes sociais — navy + lima — usada SÓ neste
// gerador de post. O site (tailwind.config.ts: ink/gold/paper/line) nunca
// usa essas cores; são dois sistemas visuais deliberadamente separados.
const CORES_POST = {
  navy: '#0B1E3D',
  lima: '#C6FF00',
  branco: '#FFFFFF',
};

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não foi possível carregar a foto: ${url}`));
    img.src = url;
  });
}

function desenharImagemCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  largura: number,
  altura: number
) {
  const escala = Math.max(largura / img.width, altura / img.height);
  const larguraDesenhada = img.width * escala;
  const alturaDesenhada = img.height * escala;
  const offsetX = x + (largura - larguraDesenhada) / 2;
  const offsetY = y + (altura - alturaDesenhada) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, largura, altura);
  ctx.clip();
  ctx.drawImage(img, offsetX, offsetY, larguraDesenhada, alturaDesenhada);
  ctx.restore();
}

// Quebra `texto` em linhas que cabem em `larguraMaxima` e já desenha cada
// linha no canvas (usa ctx.measureText, por isso precisa do contexto).
function desenharTextoComQuebra(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  larguraMaxima: number,
  alturaLinha: number
) {
  const palavras = texto.split(' ');
  const linhas: string[] = [];
  let linhaAtual = '';

  for (const palavra of palavras) {
    const linhaTeste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (ctx.measureText(linhaTeste).width > larguraMaxima && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = linhaTeste;
    }
  }
  if (linhaAtual) linhas.push(linhaAtual);

  linhas.forEach((linha, index) => ctx.fillText(linha, x, y + index * alturaLinha));
}

interface PostGeneratorProps {
  imovel: Imovel;
}

export default function PostGenerator({ imovel }: PostGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<Template>('feed');
  const [fotoIndex, setFotoIndex] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const fotos = imovel.fotos.length > 0 ? imovel.fotos : null;
  const fotoAtual = fotos ? fotos[fotoIndex] : undefined;

  useEffect(() => {
    desenhar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, fotoIndex]);

  async function desenhar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setErro(null);

    const { largura, altura } = TAMANHOS[template];
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Espera as fontes (Poppins/Inter, carregadas via next/font no layout
    // raiz) estarem prontas — senão a primeira renderização usa a fonte
    // padrão do navegador em vez da fonte da marca.
    await document.fonts.ready;

    ctx.fillStyle = CORES_POST.navy;
    ctx.fillRect(0, 0, largura, altura);

    const alturaFoto = template === 'feed' ? altura * 0.55 : altura * 0.5;
    if (fotoAtual) {
      try {
        const img = await carregarImagem(fotoAtual.url);
        desenharImagemCover(ctx, img, 0, 0, largura, alturaFoto);
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao carregar a foto.');
      }
    }

    ctx.fillStyle = CORES_POST.lima;
    ctx.fillRect(0, alturaFoto, largura, 90);
    ctx.fillStyle = CORES_POST.navy;
    ctx.font = '700 40px Poppins, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${imovel.tipo.toUpperCase()} PARA ${imovel.finalidade.toUpperCase()}`, 48, alturaFoto + 45);

    ctx.fillStyle = CORES_POST.branco;
    ctx.font = '900 56px Poppins, sans-serif';
    ctx.textBaseline = 'alphabetic';
    desenharTextoComQuebra(ctx, imovel.titulo, 48, alturaFoto + 180, largura - 96, 62);

    const campos = buildFichaFields(imovel);
    let y = alturaFoto + 320;
    ctx.font = '600 32px Inter, sans-serif';
    campos.slice(0, 3).forEach((campo) => {
      ctx.fillStyle = CORES_POST.lima;
      ctx.fillText(campo.label.toUpperCase(), 48, y);
      ctx.fillStyle = CORES_POST.branco;
      ctx.fillText(campo.value, 48, y + 40);
      y += 90;
    });

    ctx.fillStyle = CORES_POST.lima;
    ctx.font = '900 64px Poppins, sans-serif';
    ctx.fillText(formatarPreco(imovel), 48, altura - 120);

    ctx.fillStyle = CORES_POST.branco;
    ctx.font = '600 28px Inter, sans-serif';
    ctx.fillText('Luiz Lopes Corretor · CRECI/MS 8283 · (67) 98429-4178', 48, altura - 48);
  }

  function handleExportar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `post-${imovel.id}-${template}.png`;
      link.click();
    } catch {
      setErro('Não foi possível exportar o PNG (a foto pode estar bloqueando a exportação por CORS).');
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <canvas
        ref={canvasRef}
        className="border border-line rounded-lg bg-ink"
        style={{ width: 320, height: template === 'feed' ? 320 : 569 }}
      />

      <div className="space-y-5 max-w-sm">
        <div>
          <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Template</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTemplate('feed')}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-semibold border ${
                template === 'feed' ? 'bg-ink text-white border-ink' : 'border-line text-ink'
              }`}
            >
              Feed (quadrado)
            </button>
            <button
              type="button"
              onClick={() => setTemplate('stories')}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-semibold border ${
                template === 'stories' ? 'bg-ink text-white border-ink' : 'border-line text-ink'
              }`}
            >
              Stories
            </button>
          </div>
        </div>

        {fotos && fotos.length > 1 && (
          <div>
            <label className="block text-[9.5px] text-ink-soft uppercase tracking-wide mb-1.5">Foto usada</label>
            <div className="flex gap-2 flex-wrap">
              {fotos.map((foto, index) => (
                <button
                  key={foto.id}
                  type="button"
                  onClick={() => setFotoIndex(index)}
                  className={`w-14 h-14 rounded-md overflow-hidden border-2 ${
                    index === fotoIndex ? 'border-gold' : 'border-transparent'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm de URLs externas do Supabase Storage */}
                  <img src={foto.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {erro && <p className="text-red-600 text-[13px]">{erro}</p>}

        <button
          type="button"
          onClick={handleExportar}
          className="font-display font-bold text-[13px] px-6 py-3 rounded-lg bg-gold text-white"
        >
          Baixar PNG
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/admin/(protegido)/imoveis/[id]/post/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getImovelById } from '@/lib/data/imoveis';
import PostGenerator from '@/components/admin/PostGenerator';

interface PostImovelPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostImovelPage({ params }: PostImovelPageProps) {
  const { id } = await params;
  const imovel = await getImovelById(id);

  if (!imovel) {
    notFound();
  }

  return (
    <main>
      <h1 className="font-display font-extrabold text-xl mb-2">Gerar post — {imovel.titulo}</h1>
      <p className="text-[13px] text-ink-soft mb-6">
        Identidade navy/lima das redes sociais — separada da identidade do site.
      </p>
      <PostGenerator imovel={imovel} />
    </main>
  );
}
```

- [ ] **Step 3: Run dev server and confirm (requires a real Supabase project connected per Task 21's manual setup, and at least one imóvel with a photo uploaded via Task 25)**

Run: `npm run dev`, log in, visit `/admin/imoveis/[id]/post` for an imóvel that has at least one photo. Expected: a navy-background canvas preview with a lima accent band, the imóvel's photo, título, up to 3 ficha técnica fields, price, and the footer contact line — visually distinct from the site's ink/gold/paper palette; switching between "Feed (quadrado)" and "Stories" changes the preview's aspect ratio (1:1 vs 9:16); if the imóvel has more than one photo, clicking a thumbnail swaps which one is drawn; clicking "Baixar PNG" downloads a `post-<id>-<template>.png` file that matches the preview.

- [ ] **Step 4: Commit**

```bash
git add components/admin/PostGenerator.tsx "app/admin/(protegido)/imoveis/[id]/post"
git commit -m "feat: add canvas-based Instagram/Facebook post generator"
```

---

### Task 28: Final documentation — `HANDOVER.md`, `ARCHITECTURE.md`, `README.md`

**Files:**
- Modify: `HANDOVER.md` (full rewrite to finished-state content)
- Modify: `ARCHITECTURE.md` (full rewrite to finished-state content)
- Create: `README.md`

**Interfaces:**
- Consumes: nothing code-level — documents the system built by Tasks 1–27.

- [ ] **Step 1: Replace `HANDOVER.md` with the finished-state version**

```markdown
# HANDOVER — Site Luiz Lopes Corretor

Este documento explica o projeto para quem nunca viu o código antes: como
rodar localmente, variáveis de ambiente, como fazer deploy, e como o
corretor (ou o filho dele) usa a área administrativa no dia a dia.

## O que é

Site institucional + portfólio de imóveis para Luiz Lopes, corretor de
imóveis (CRECI/MS 8283) em Dourados/MS. Duas partes:

- **Site público** (`app/(site)`): home, listagem de imóveis, detalhe de
  imóvel, sobre, contato.
- **Área administrativa** (`app/admin`): onde o corretor cadastra imóveis,
  faz upload de fotos e gera artes para Instagram/Facebook a partir dos
  mesmos dados.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local   # depois preencha as duas variáveis, ver seção abaixo
npm run dev
```

Acesse `http://localhost:3000` (site público) e `http://localhost:3000/admin/login` (admin).

## Variáveis de ambiente

Definidas em `.env.local` (nunca commitado — está no `.gitignore`):

| Variável | Onde conseguir | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Painel Supabase → Project Settings → API → Project URL | conecta o app ao banco/storage/auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Painel Supabase → Project Settings → API → chave `anon public` | autentica as chamadas do navegador e do servidor (a segurança real vem das políticas de RLS, não dessa chave) |

Se o projeto Supabase ainda não existir, siga "Passo manual — conectar o
Supabase" mais abaixo antes de preencher essas variáveis.

## Como fazer deploy

O site usa Server Components, Server Actions e um cliente Supabase que lê
cookies em tempo de requisição — isso exige um servidor Node rodando
Next.js, e **não funciona em hospedagem puramente estática como o GitHub
Pages** (que é onde o mockup HTML antigo estava publicado). Para publicar
este projeto:

1. Crie uma conta na [Vercel](https://vercel.com) (feita pela mesma empresa
   do Next.js — é o caminho de deploy mais simples para esse stack) e
   conecte o repositório `brunolop3/corretor`.
2. Nas configurações do projeto na Vercel, adicione as duas variáveis de
   ambiente da tabela acima (Settings → Environment Variables).
3. Faça o deploy (a Vercel builda automaticamente a cada push na branch
   principal).
4. Configure o domínio desejado em Settings → Domains, se houver um
   domínio próprio do corretor.

Se o GitHub Pages precisar continuar servindo alguma coisa nesse domínio
durante a transição, isso é uma decisão de infraestrutura a ser tomada com
o cliente — não é resolvida por este projeto.

## Passo manual — conectar o Supabase

1. Crie um projeto novo em https://supabase.com/dashboard (sugestão de nome
   `luizlopes-corretor`).
2. No **SQL Editor**, cole o conteúdo de `supabase/migrations/0001_init.sql`
   e rode. Isso cria as tabelas `imoveis`/`imovel_fotos`, as policies de RLS
   e o bucket de Storage `imoveis-fotos`.
3. Em **Authentication → Users**, crie manualmente o único usuário admin
   (email + senha) — não existe cadastro público, só esse usuário acessa
   `/admin`.
4. Copie a Project URL e a chave anon public de **Project Settings → API**
   e preencha o `.env.local` (ver seção de variáveis acima).
5. Reinicie `npm run dev` (ou, em produção, redeploy depois de configurar
   as variáveis na Vercel).

## Como o corretor usa o admin no dia a dia

1. Acesse `/admin/login` e entre com o email/senha criados no passo 3
   acima.
2. **Cadastrar um imóvel novo**: em `/admin/imoveis`, clique em "Novo
   imóvel". Preencha tipo, finalidade, endereço, bairro e preço — os campos
   que aparecem embaixo mudam de acordo com o tipo escolhido (terreno pede
   área/dimensões/quadra/lote; casa, sobrado e apartamento pedem
   quartos/vagas/área; apartamento também pede condomínio). Salvar leva
   direto para a tela de edição, onde dá para subir fotos.
3. **Adicionar fotos**: na tela de edição do imóvel, use o campo "Fotos"
   para selecionar uma ou mais imagens do computador/celular. A primeira
   foto enviada vira a capa automaticamente; para trocar, clique em "Marcar
   capa" em outra foto. As setas ↑/↓ reordenam.
4. **Tirar um imóvel do site sem apagar o histórico**: em `/admin/imoveis`,
   mude o status na lista para "Reservado" ou "Vendido" — imóveis vendidos
   somem do site público mas continuam salvos e visíveis no admin.
5. **Destacar um imóvel na home**: marque "Destacar na home" no formulário
   de edição. Só um imóvel deveria ficar marcado por vez (o site sempre
   mostra o mais recente marcado).
6. **Gerar uma arte para Instagram/Facebook**: na lista de imóveis, clique
   em "Gerar post". Escolha entre o template quadrado (feed) ou vertical
   (stories), escolha qual foto usar (se houver mais de uma) e clique em
   "Baixar PNG" — o arquivo é gerado no próprio navegador e baixado para o
   computador/celular, pronto para postar.
7. **Excluir um imóvel**: em `/admin/imoveis`, clique em "Excluir" — pede
   confirmação antes (essa ação não pode ser desfeita; para tirar do site
   sem perder o histórico, use status "Vendido" em vez disso).

## Como rodar os testes

```bash
npx vitest run
```

Cobre: formatação de preço/situação (`lib/format.ts`), a lógica de campos
dinâmicos da ficha técnica (`components/site/FichaTecnica.ts`), o parser de
dimensões do cartão em destaque (`components/site/FeaturedCard.ts`) e o
filtro por aba da home (`components/site/HomeFeed.ts`). A camada de dados
(`lib/data/imoveis.ts`) não tem mais teste automatizado depois da troca para
Supabase — ver "Limitações conhecidas" no `ARCHITECTURE.md`.

## Estrutura de pastas

- `app/(site)/` — páginas públicas (`/`, `/imoveis`, `/imoveis/[id]`,
  `/sobre`, `/contato`).
- `app/admin/` — `/admin/login` (fora da autenticação) e
  `app/admin/(protegido)/` — `/admin/imoveis` e subpáginas (autenticação
  obrigatória via `middleware.ts`).
- `lib/types.ts` — modelo de dados (`Imovel`, `ImovelFoto`).
- `lib/format.ts` — formatação de preço e situação.
- `lib/data/imoveis.ts` — camada de acesso a dados (consulta o Supabase).
- `lib/actions/imoveis.ts` — Server Actions de criar/editar/excluir/mudar
  status de imóvel.
- `lib/supabase/` — clientes Supabase (browser e servidor).
- `lib/mock/imoveis.ts` — dados de exemplo, mantidos como referência de
  formato (não é mais lido pela camada de dados em produção).
- `components/site/` — componentes do site público.
- `components/admin/` — componentes da área administrativa, incluindo o
  gerador de post.
- `supabase/migrations/` — SQL do schema do banco.
```

- [ ] **Step 2: Replace `ARCHITECTURE.md` with the finished-state version**

```markdown
# ARCHITECTURE — Site Luiz Lopes Corretor

## Stack

- **Next.js 15 (App Router) + TypeScript strict** — Server Components para
  buscar dados sem expor a lógica de acesso ao banco no navegador; Server
  Actions para as mutações do admin (criar/editar/excluir imóvel) sem
  precisar manter uma camada de API REST separada.
- **Tailwind CSS**, tokens de cor/tipografia nomeados (`ink`, `gold`,
  `paper`, `line`, `charcoal`, `ink-soft`, `gold-soft`) em vez das cores
  genéricas do Tailwind, para casar exatamente com a paleta aprovada pelo
  cliente (`tailwind.config.ts`).
- **Supabase (Postgres + Storage + Auth)** — banco relacional gerenciado,
  upload de fotos direto do navegador para o Storage, e autenticação de um
  único usuário admin sem precisar manter infraestrutura própria.
- **Vitest** — testes unitários das partes com lógica não-trivial: parsing
  de dimensões, construção de campos da ficha técnica, formatação de
  preço/situação, filtro de abas da home.

## Diagrama de dados

```
┌──────────────┐        1:N        ┌──────────────────┐
│   imoveis    │ ─────────────────▶│  imovel_fotos     │
├──────────────┤                    ├──────────────────┤
│ id (pk)      │                    │ id (pk)          │
│ titulo       │                    │ imovel_id (fk)   │
│ tipo         │                    │ url              │
│ finalidade   │                    │ ordem            │
│ endereco     │                    │ is_capa          │
│ bairro       │                    └──────────────────┘
│ quadra       │  (nullable — só terreno em loteamento)
│ lote         │  (nullable — idem)
│ area_total_m2│  (nullable — terreno)
│ area_construida_m2 │ (nullable — casa/sobrado/apartamento)
│ dimensoes    │  (nullable — terreno)
│ quartos      │  (nullable — casa/sobrado/apartamento)
│ vagas        │  (nullable — casa/sobrado/apartamento)
│ condominio_valor │ (nullable — só apartamento)
│ preco        │
│ preco_observacao │ (nullable)
│ situacao[]   │
│ descricao    │
│ status       │  disponivel | reservado | vendido
│ destaque     │  boolean
│ created_at   │
│ updated_at   │
└──────────────┘

Storage: bucket "imoveis-fotos" (público para leitura, escrita restrita a
usuários autenticados via policy de RLS).
```

## Camada de dados

Toda leitura/escrita de imóveis passa por `lib/data/imoveis.ts` (leitura) e
`lib/actions/imoveis.ts` (escrita). Nenhuma página ou componente consulta o
Supabase diretamente fora desses dois arquivos — isso foi verificado na
prática: a troca de mock (`lib/mock/imoveis.ts`) para Supabase, no meio do
desenvolvimento (ver histórico de commits), não exigiu alterar nenhuma
página, só o interior das funções de `lib/data/imoveis.ts`.

## Ficha técnica dinâmica

`components/site/FichaTecnica.tsx` exporta `buildFichaFields(imovel)`, uma
função pura testada isoladamente. Ela decide quais campos mostrar a partir
de quais dados o imóvel tem preenchido — nenhum campo é fixo. O mesmo código
é reaproveitado pelo gerador de post (`components/admin/PostGenerator.tsx`),
que desenha os 3 primeiros campos retornados no canvas.

## Duas identidades visuais, deliberadamente separadas

- **Site** (`tailwind.config.ts`): paleta ink/gold/paper/line/charcoal,
  aprovada pelo cliente após 5 rodadas de revisão.
- **Posts de redes sociais** (`components/admin/PostGenerator.tsx`): navy +
  lima, igual à identidade que o corretor já usa no Instagram. Essas cores
  só existem dentro desse arquivo (constante `CORES_POST`), nunca no
  `tailwind.config.ts` nem em nenhum componente do site público.

## Autenticação e proteção de rotas

Um único usuário admin, criado manualmente no painel do Supabase (sem
cadastro público). `middleware.ts` roda em toda requisição a `/admin/*`:
sem sessão válida, redireciona para `/admin/login`; com sessão, deixa
passar. `/admin/login` fica fora do grupo de rotas `(protegido)` para não
herdar o cabeçalho/botão "Sair" da área logada.

## Decisões tomadas ao longo do projeto

- **HomeFeed com slot de destaque**: o card em destaque é passado como
  `ReactNode` para `HomeFeed` para poder ficar entre o filtro de abas e a
  lista do feed, preservando a ordem de seções aprovada sem duplicar o
  componente de filtro.
- **Busca**: a home usa uma animação de digitação decorativa só no
  placeholder do campo; ao enviar, navega para `/imoveis?q=...`, onde a
  busca é real (substring simples em título/bairro/endereço/descrição — sem
  full-text search no banco, desnecessário para o volume de imóveis de um
  corretor individual).
- **Fluxo de criação de imóvel em duas etapas**: `/admin/imoveis/novo` só
  pede os dados textuais; ao salvar, redireciona para
  `/admin/imoveis/[id]/editar`, onde o upload de fotos fica disponível —
  fotos exigem um `imovel_id` já existente (chave estrangeira em
  `imovel_fotos`).
- **Reordenação de fotos por botões, não drag-and-drop**: evita adicionar
  uma biblioteca de DnD só para essa tela; setas ↑/↓ trocam a `ordem` de
  duas fotos vizinhas.
- **Deploy**: o GitHub Pages (usado para o mockup HTML estático) não
  suporta Server Components/Actions — o site precisa de um host Node (ver
  "Como fazer deploy" no HANDOVER.md).

## Limitações conhecidas

- `lib/data/imoveis.ts` não tem teste automatizado unitário depois da troca
  para Supabase — depende de `next/headers` e de um projeto Supabase real.
  Verificação é manual (rodar `npm run dev` contra um projeto configurado).
- Busca por texto livre é substring simples, não busca semântica nem
  tolerante a erros de digitação.
- O gerador de post depende de o bucket do Supabase Storage responder com
  cabeçalhos CORS permissivos para que `canvas.toDataURL` funcione (padrão
  em buckets públicos do Supabase; se isso mudar, o botão "Baixar PNG" passa
  a falhar com o erro tratado em `PostGenerator.tsx`).
- Sem paginação no `/admin/imoveis` — assume um volume de imóveis pequeno o
  suficiente (dezenas, não milhares) para listar tudo de uma vez.
```

- [ ] **Step 3: Write `README.md`**

```markdown
# Luiz Lopes Corretor de Imóveis

Site institucional + portfólio de imóveis + área administrativa para Luiz
Lopes, corretor de imóveis (CRECI/MS 8283) em Dourados/MS.

## Setup rápido

```bash
npm install
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Site público: `http://localhost:3000`
Admin: `http://localhost:3000/admin/login`

## Documentação

- `HANDOVER.md` — como rodar, variáveis de ambiente, deploy, uso do admin
  no dia a dia.
- `ARCHITECTURE.md` — stack, modelo de dados, decisões e limitações
  conhecidas.
- `supabase/migrations/0001_init.sql` — schema do banco.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção |
| `npm run lint` | Lint do projeto |
| `npx vitest run` | Roda os testes |
```

- [ ] **Step 4: Run the full test suite and dev server one last time**

Run: `npx vitest run`
Expected: all remaining suites pass (`lib/format.test.ts`, `components/site/FichaTecnica.test.ts`, `components/site/FeaturedCard.test.ts`, `components/site/HomeFeed.test.ts`).

Run: `npm run dev`, visit `http://localhost:3000`, `http://localhost:3000/imoveis`, `http://localhost:3000/sobre`, `http://localhost:3000/contato`, and `http://localhost:3000/admin/login` — confirm every route still renders (public pages fully functional against Supabase once Task 21's manual setup is done; admin routes reachable and gated by login).

- [ ] **Step 5: Commit**

```bash
git add HANDOVER.md ARCHITECTURE.md README.md
git commit -m "docs: finalize HANDOVER, ARCHITECTURE, and README"
```

---
