import { describe, expect, it } from 'vitest';
import { ESTADO_INICIAL, proximoPasso, type EstadoDigitacao } from './typing-animation';

describe('proximoPasso', () => {
  it('digita a primeira frase caractere a caractere com delay de 55ms', () => {
    const frases = ['oi'];
    let estado = ESTADO_INICIAL;

    const passo1 = proximoPasso(frases, estado);
    expect(passo1.texto).toBe('o');
    expect(passo1.delay).toBe(55);
    expect(passo1.estado.apagando).toBe(false);

    estado = passo1.estado;
    const passo2 = proximoPasso(frases, estado);
    expect(passo2.texto).toBe('oi');
  });

  it('ao terminar de digitar a frase completa, pausa 1400ms e começa a apagar', () => {
    const frases = ['oi'];
    const estado: EstadoDigitacao = { fraseIndex: 0, charIndex: 1, apagando: false };

    const passo = proximoPasso(frases, estado);
    expect(passo.texto).toBe('oi');
    expect(passo.delay).toBe(1400);
    expect(passo.estado.apagando).toBe(true);
    expect(passo.estado.charIndex).toBe(2);
  });

  it('apaga caractere a caractere com delay de 35ms enquanto charIndex > 0', () => {
    const frases = ['oi'];
    const estado: EstadoDigitacao = { fraseIndex: 0, charIndex: 2, apagando: true };

    const passo = proximoPasso(frases, estado);
    expect(passo.texto).toBe('o');
    expect(passo.delay).toBe(35);
    expect(passo.estado.apagando).toBe(true);
    expect(passo.estado.charIndex).toBe(1);
  });

  it('ao apagar o último caractere, avança para a próxima frase e volta a delay de 55ms', () => {
    const frases = ['oi', 'ola'];
    const estado: EstadoDigitacao = { fraseIndex: 0, charIndex: 1, apagando: true };

    const passo = proximoPasso(frases, estado);
    expect(passo.texto).toBe('');
    expect(passo.delay).toBe(55);
    expect(passo.estado.apagando).toBe(false);
    expect(passo.estado.charIndex).toBe(0);
    expect(passo.estado.fraseIndex).toBe(1);
  });

  it('cicla de volta para a primeira frase após apagar a última (wraparound)', () => {
    const frases = ['oi', 'ola'];
    const estado: EstadoDigitacao = { fraseIndex: 1, charIndex: 1, apagando: true };

    const passo = proximoPasso(frases, estado);
    expect(passo.estado.fraseIndex).toBe(0);
    expect(passo.estado.apagando).toBe(false);
  });

  it('percorre um ciclo completo de digitação e remoção reproduzindo a sequência de textos do mockup', () => {
    const frases = ['abc'];
    let estado = ESTADO_INICIAL;
    const textos: string[] = [];
    const delays: number[] = [];

    // 3 passos para digitar "abc" e 3 passos para apagar de volta a "".
    for (let i = 0; i < 6; i++) {
      const passo = proximoPasso(frases, estado);
      textos.push(passo.texto);
      delays.push(passo.delay);
      estado = passo.estado;
    }

    expect(textos).toEqual(['a', 'ab', 'abc', 'ab', 'a', '']);
    expect(delays).toEqual([55, 55, 1400, 35, 35, 55]);
    // Depois do ciclo completo de "abc" (frase única), volta ao início.
    expect(estado).toEqual({ fraseIndex: 0, charIndex: 0, apagando: false });
  });
});
