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
