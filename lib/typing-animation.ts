// Lógica pura do efeito "digitar e apagar" do campo de busca do herói —
// portada do <script> vanilla-JS do mockup v5 (docs/reference/luiz-lopes-site-mockup-v5.html).
// Extraída do componente React para poder ser testada sem precisar montar
// DOM/JSDOM (o projeto ainda não tem Testing Library configurada).
//
// Timings idênticos ao mockup: 55ms por caractere digitado, 35ms por
// caractere apagado, pausa de 1400ms com a frase completa antes de começar
// a apagar. Não altere esses valores sem atualizar também o mockup de
// referência — a intenção é reproduzir o comportamento existente, não
// inventar um novo.

export const FRASES = [
  'terreno plano perto do centro',
  'casa com 3 quartos e quintal',
  'apartamento pra alugar até R$ 1.500',
  'sobrado com 2 vagas de garagem',
  'terreno de esquina na Cidade Jardim',
] as const;

export interface EstadoDigitacao {
  fraseIndex: number;
  charIndex: number;
  apagando: boolean;
}

export const ESTADO_INICIAL: EstadoDigitacao = {
  fraseIndex: 0,
  charIndex: 0,
  apagando: false,
};

export interface PassoDigitacao {
  estado: EstadoDigitacao;
  texto: string;
  delay: number;
}

// Dado o estado atual, calcula o próximo "quadro" da animação: o texto a
// exibir, o novo estado, e quanto esperar até o próximo passo. Espelha o
// `tick()` do mockup: `pIndex`/`cIndex`/`deleting` viram
// `fraseIndex`/`charIndex`/`apagando`, e `el.innerHTML = ...` vira o
// `texto` retornado (sem o cursor piscando, que era só CSS no mockup).
export function proximoPasso(
  frases: readonly string[],
  estado: EstadoDigitacao,
): PassoDigitacao {
  const atual = frases[estado.fraseIndex]!;
  let { fraseIndex, charIndex, apagando } = estado;

  if (!apagando) {
    charIndex++;
    const texto = atual.slice(0, charIndex);
    if (charIndex === atual.length) {
      // Frase completa: pausa mais longa antes de começar a apagar.
      return { estado: { fraseIndex, charIndex, apagando: true }, texto, delay: 1400 };
    }
    return { estado: { fraseIndex, charIndex, apagando }, texto, delay: 55 };
  }

  charIndex--;
  const texto = atual.slice(0, charIndex);
  if (charIndex === 0) {
    // Terminou de apagar: avança (com wraparound) para a próxima frase.
    apagando = false;
    fraseIndex = (fraseIndex + 1) % frases.length;
  }
  return { estado: { fraseIndex, charIndex, apagando }, texto, delay: apagando ? 35 : 55 };
}
