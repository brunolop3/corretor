import { describe, expect, it } from 'vitest';
import { formatarMoeda, formatarPreco, formatarSituacao } from './format';

describe('formatarMoeda', () => {
  it('formata em reais sem casas decimais', () => {
    expect(formatarMoeda(105000)).toBe('R$ 105.000');
  });
});

describe('formatarPreco', () => {
  it('adiciona "/mês" para aluguel', () => {
    expect(formatarPreco({ preco: 1800, finalidade: 'aluguel' })).toBe('R$ 1.800/mês');
  });

  it('não adiciona sufixo para venda', () => {
    expect(formatarPreco({ preco: 320000, finalidade: 'venda' })).toBe('R$ 320.000');
  });
});

describe('formatarSituacao', () => {
  it('junta itens com "e" e capitaliza', () => {
    expect(formatarSituacao(['quitado', 'escriturado'])).toBe('Quitado e escriturado');
  });

  it('retorna string vazia para lista vazia', () => {
    expect(formatarSituacao([])).toBe('');
  });

  it('capitaliza item único sem juntar com "e"', () => {
    expect(formatarSituacao(['quitado'])).toBe('Quitado');
  });
});
