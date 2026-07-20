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

## Notas / pendências

- **Mobile nav (aberto):** Conforme mockup aprovado (nenhuma media query no
  arquivo de referência), os links secundários do nav (Início/Sobre/Contato)
  ficam ocultos abaixo do breakpoint `md`; logo e botão WhatsApp continuam
  visíveis. Isso entra em tensão com o requisito mobile-first quando as
  páginas `/sobre` e `/contato` existirem (o footer não replica essas rotas).
  Precisa de decisão do cliente sobre um padrão de navegação mobile — não
  inventar um menu hambúrguer ou outro elemento sem aprovação.

Este arquivo será atualizado a cada fase do projeto.
