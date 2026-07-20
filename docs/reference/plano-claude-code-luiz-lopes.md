# Plano de execução — Site Luiz Lopes Corretor de Imóveis

Prompt para Claude Code. Execute em fases, com aprovação minha entre cada uma antes de seguir para a próxima. Não pule fases.

## Contexto

Site institucional + portfólio de imóveis para Luiz Lopes, corretor de imóveis (CRECI/MS 8283), atuando em Dourados/MS. O site lista imóveis à venda/aluguel e tem uma área de admin onde o corretor (ou o filho dele, que administra o site) cadastra imóveis e gera artes para Instagram/Facebook a partir dos mesmos dados.

Identidade visual real já em uso:
- Logo em azul-marinho (ícone de casa formando um monograma "LL"), arquivo em anexo
- Posts atuais de Instagram usam fundo verde-escuro / lima, Poppins Black/ExtraBold nos títulos — mantido só nas artes de redes sociais, **não** no site (o site usa a paleta abaixo)

O design abaixo já passou por 5 rodadas de revisão comigo e está aprovado. Não reabrir decisões de paleta/estrutura sem eu pedir — o mockup final de referência é `luiz-lopes-site-mockup-v5.html` (em anexo), implemente exatamente essa direção.

## Paleta (aprovada — v5)
- Tinta `#1C1C1C` (texto principal / fundo do footer)
- Tinta suave `#767676` (texto secundário)
- Carvão `#2E2E2E`
- Dourado `#A9832F` (destaque/CTA/preço em foco)
- Dourado suave `#F3ECDC` (fundo de apoio, uso pontual)
- Papel `#FAFAF8` (fundo geral, limpo, sem textura/malha)
- Linha `#E6E4DD` (divisores)

**Não usar** a malha de loteamento pontilhada nem o par navy+lima em nenhuma tela nova — foram testados e descartados.

## Tipografia
- Display: Poppins 800/900 (títulos)
- Corpo: Inter 400-700
- Dados/ficha técnica: IBM Plex Mono 500/600

## Estrutura da home (aprovada — v5)

Página única e direta, sem seções de enchimento ("por que nós", depoimento, banner de CTA foram removidos por decisão do cliente). Do topo pro fim:

1. **Nav** fixa: logo, links (Início/Sobre/Contato), botão WhatsApp
2. **Hero de busca**: eyebrow "Dourados/MS" + título curto ("Descreva o imóvel que você procura") + campo de busca com efeito de digitação automática, ciclando por exemplos (`"terreno plano perto do centro"`, `"casa com 3 quartos e quintal"`, etc.), botão "Buscar" ao lado. Replicar o comportamento de texto digitando/apagando do campo de busca do `realtor.com`, adaptado em português. Abaixo, uma dica de exemplo em texto pequeno.
3. **Filtro simples** por abas de texto (Todos/Terrenos/Casas/Apartamentos/Aluguel), sem pills decoradas
4. **Imóvel em destaque** — cartão "documento": foto com tag do tipo do imóvel (não usar quadra/lote aqui, ver regra de dados abaixo) e, **somente para terrenos**, a anotação de dimensão (linhas com seta indicando `10m`/`20m`) sobre a própria foto. Ficha técnica ao lado com campos dinâmicos (ver modelo de dados), preço e dois botões de ação.
5. **Feed contínuo de imóveis** — não é grid de cards iguais: itens em largura cheia, alternando o lado da foto (esquerda/direita) a cada item, para dar ritmo. Cada item tem selo de finalidade (venda/aluguel), tipo do imóvel, endereço, specs relevantes ao tipo, preço e botão "ver detalhes". Termina com link "Carregar mais imóveis" (paginação/infinite scroll na versão real).
6. **Footer** enxuto: dados do corretor, contato, Instagram.

**Sem emojis em nenhum lugar da interface** — usar apenas tipografia, formas e ícones desenhados (SVG/linha), nunca caracteres de emoji como ícone.

## Regra de dados — quadra/lote é opcional

Nem todo imóvel tem quadra/lote (isso só existe pra terrenos em loteamento). O campo é **opcional** no modelo de dados e só aparece na interface quando preenchido — nunca mostrar "Quadra — / Lote —" vazio. Da mesma forma, os campos da ficha técnica devem ser dinâmicos por tipo de imóvel:
- Terreno: área total, dimensões, bairro, situação (quadra/lote se houver)
- Casa/Sobrado: quartos, vagas, área construída, situação
- Apartamento: quartos, vagas, área, condomínio (se houver)

Não force campos fixos do mockup — o mockup é a referência visual do componente `FichaTecnica`, mas os campos que ele renderiza vêm de quais dados o imóvel tem preenchido.

## Fase 1 — Confirmação do mockup estático

Já aprovado. Não recriar — usar `luiz-lopes-site-mockup-v5.html` como fonte de verdade visual e extrair os componentes dele (nav, hero de busca, cartão-documento, item de feed, footer) para os componentes React da Fase 4.

## Fase 2 — Setup do projeto

- Next.js 15 (App Router) + TypeScript strict
- Supabase (Postgres + Storage + Auth) — projeto novo, nome sugerido `luizlopes-corretor`
- Tailwind configurado com os tokens de cor/tipografia acima como `theme.extend` (nomear as cores como `ink`, `gold`, `paper`, `line`, não como `blue-900` genérico do Tailwind)
- Estrutura de pastas: `app/(site)` para público, `app/admin` para área logada
- `HANDOVER.md` criado desde o commit inicial, atualizado a cada fase, escrito para alguém sem contexto prévio do projeto
- `ARCHITECTURE.md` com decisões de stack e por quê

## Fase 3 — Modelo de dados (Supabase)

Tabela `imoveis`:
- `id` (uuid)
- `titulo`, `tipo` (`terreno` | `casa` | `apartamento` | `sobrado`), `finalidade` (`venda` | `aluguel`)
- `endereco`, `bairro`
- `quadra` (nullable), `lote` (nullable) — só preenchido quando aplicável
- `area_total_m2` (nullable), `area_construida_m2` (nullable), `dimensoes` (texto, nullable, ex: "10m x 20m")
- `quartos` (nullable), `vagas` (nullable), `condominio_valor` (nullable)
- `preco`, `preco_observacao` (ex: "aceito propostas")
- `situacao` (array de texto, ex: `["quitado", "escriturado"]`)
- `descricao`
- `status` (`disponivel` | `reservado` | `vendido`) — importante pro corretor tirar do site sem apagar o histórico
- `destaque` (boolean, pra aparecer no card-documento da home)
- `created_at`, `updated_at`

Tabela `imovel_fotos`:
- `id`, `imovel_id` (fk), `url` (Supabase Storage), `ordem`, `is_capa` (boolean)

Bucket de Storage: `imoveis-fotos`, público para leitura.

Auth: um único usuário admin (o corretor ou o filho), sem cadastro público.

## Fase 4 — Site público

Páginas:
- `/` — home conforme estrutura aprovada acima
- `/imoveis` — listagem completa com os mesmos filtros do hero (finalidade, tipo, bairro, faixa de preço) e busca por texto livre (o mesmo campo de busca da home, sem a animação de digitação, com busca real)
- `/imoveis/[id]` — detalhe: galeria de fotos, ficha técnica completa (campos dinâmicos por tipo), descrição, botão WhatsApp com mensagem pré-preenchida citando o imóvel
- `/sobre` — corretor, CRECI, forma de atuação
- `/contato` — WhatsApp, Instagram, telefone

Componente `FichaTecnica` deve receber o imóvel e decidir quais campos renderizar (ver regra de dados acima), nunca campos fixos hardcoded.

## Fase 5 — Admin

- `/admin/login` — Supabase Auth
- `/admin/imoveis` — lista com busca/filtro, ações de editar/mudar status/excluir
- `/admin/imoveis/novo` e `/admin/imoveis/[id]/editar` — formulário completo (campos condicionais por tipo de imóvel — não mostrar quadra/lote no formulário se o tipo não for terreno, por exemplo), upload de fotos direto pro Storage, reordenação de fotos, marcar foto de capa
- `/admin/imoveis/[id]/post` — gerador de post: escolhe o template (feed quadrado ou stories, usando a identidade das redes sociais — navy/lima — que é separada da identidade do site), preenche automaticamente com os dados do imóvel, permite trocar a foto usada, exporta PNG (renderização client-side via canvas, sem servidor de imagem)

Todo código do admin com comentários inline explicando o fluxo de dados (fetch → validação → Supabase), pensando em alguém que nunca viu o projeto.

## Fase 6 — Documentação final

- `HANDOVER.md` final: como rodar localmente, variáveis de ambiente, como fazer deploy, como o corretor deve usar o admin no dia a dia
- `ARCHITECTURE.md`: diagrama de dados, decisões de stack, limitações conhecidas
- README com setup rápido

## Regras gerais para todas as fases
- Sempre mostrar o resultado (tela ou resumo do que foi feito) antes de prosseguir para a fase seguinte
- Não reabrir decisões de paleta, malha de fundo ou estrutura da home sem eu pedir explicitamente — já foram testadas e descartadas nas versões anteriores
- Todo texto em português, tom direto, sem clichê de marketing genérico, sem emoji como ícone
- Campos de ficha técnica são sempre condicionais aos dados do imóvel, nunca fixos
- Mobile-first: a maioria dos clientes do corretor acessa pelo WhatsApp/Instagram no celular
