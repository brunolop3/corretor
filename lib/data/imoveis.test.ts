import { describe, expect, it } from 'vitest';
import { getImoveis, getImovelById, getImovelDestaque, searchImoveis } from './imoveis';
import { mockImoveis } from '../mock/imoveis';

describe('getImoveis', () => {
  it('retorna todos os imóveis disponíveis por padrão', async () => {
    const resultado = await getImoveis();
    expect(resultado.every((i) => i.status !== 'vendido')).toBe(true);
  });

  it('exclui explicitamente imóveis com status "vendido"', async () => {
    const resultado = await getImoveis();
    expect(resultado.some((i) => i.id === '9')).toBe(false);
    expect(mockImoveis.some((i) => i.status === 'vendido')).toBe(true);
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

  it('filtra por bairro', async () => {
    const resultado = await getImoveis({ bairro: 'Centro' });
    expect(resultado.every((i) => i.bairro === 'Centro')).toBe(true);
    expect(resultado.length).toBeGreaterThan(0);
  });

  it('filtra por faixa de preço', async () => {
    const resultado = await getImoveis({ precoMin: 100000, precoMax: 200000 });
    expect(resultado.every((i) => i.preco >= 100000 && i.preco <= 200000)).toBe(true);
  });

  it('combina múltiplos filtros', async () => {
    const resultado = await getImoveis({ tipo: 'terreno', finalidade: 'venda', precoMax: 100000 });
    expect(resultado.every((i) => i.tipo === 'terreno' && i.finalidade === 'venda' && i.preco <= 100000)).toBe(
      true
    );
    expect(resultado.length).toBeGreaterThan(0);
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

  it('é case-insensitive', () => {
    const resultado = searchImoveis(mockImoveis, 'CIDADE JARDIM');
    expect(resultado.length).toBeGreaterThan(0);
  });

  it('retorna lista vazia sem correspondência', () => {
    expect(searchImoveis(mockImoveis, 'xyzxyzxyz')).toHaveLength(0);
  });

  it('retorna a lista original quando o termo é vazio ou só espaços', () => {
    expect(searchImoveis(mockImoveis, '')).toHaveLength(mockImoveis.length);
    expect(searchImoveis(mockImoveis, '   ')).toHaveLength(mockImoveis.length);
  });
});
