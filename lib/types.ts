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
