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
