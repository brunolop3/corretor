import type { Imovel } from './types';

// R$ 105.000 — sempre sem casas decimais (preços de imóvel não usam centavos
// na forma como o corretor os informa).
//
// Node/ICU insere um espaço não separável (U+00A0) entre "R$" e o valor;
// normalizamos para um espaço comum para ter uma string previsível de se
// comparar e de se estilizar (evita quebra de linha estranha no meio do
// preço em telas estreitas, ex.: "R$\n105.000").
export function formatarMoeda(valor: number): string {
  return valor
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
    .replace(/ /g, ' ');
}

// Aluguel mostra "/mês" (ex.: "R$ 1.800/mês"); venda mostra só o valor.
export function formatarPreco(imovel: Pick<Imovel, 'preco' | 'finalidade'>): string {
  const base = formatarMoeda(imovel.preco);
  return imovel.finalidade === 'aluguel' ? `${base}/mês` : base;
}

// ["quitado", "escriturado"] -> "Quitado e escriturado"
// Apenas a primeira letra da frase é maiúscula — os itens não são nomes
// próprios, então capitalizar cada um deixaria "Quitado e Escriturado".
export function formatarSituacao(situacao: string[]): string {
  if (situacao.length === 0) return '';
  const juntas =
    situacao.length === 1
      ? situacao[0]!
      : `${situacao.slice(0, -1).join(', ')} e ${situacao[situacao.length - 1]}`;
  return juntas.charAt(0).toUpperCase() + juntas.slice(1);
}
