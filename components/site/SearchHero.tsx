'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ESTADO_INICIAL, FRASES, proximoPasso, type EstadoDigitacao } from '@/lib/typing-animation';

// Placeholder "digita e apaga" — a mesma técnica do campo de busca do
// realtor.com, adaptada em português e portada do <script> vanilla-JS do
// mockup (docs/reference/luiz-lopes-site-mockup-v5.html) para um efeito
// React com useEffect + setTimeout. A progressão de estado/tempo em si
// (proximoPasso) é pura e testada em lib/typing-animation.test.ts; aqui só
// ligamos essa lógica ao ciclo de vida do componente.
export default function SearchHero() {
  const [placeholder, setPlaceholder] = useState('');
  const [busca, setBusca] = useState('');
  const router = useRouter();

  const estadoRef = useRef<EstadoDigitacao>(ESTADO_INICIAL);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function tick() {
      const passo = proximoPasso(FRASES, estadoRef.current);
      estadoRef.current = passo.estado;
      setPlaceholder(passo.texto);
      timeoutRef.current = setTimeout(tick, passo.delay);
    }

    timeoutRef.current = setTimeout(tick, 55);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (busca.trim()) params.set('q', busca.trim());
    router.push(`/imoveis${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <section className="px-6 md:px-14 pt-14 md:pt-16 pb-8 max-w-2xl mx-auto text-center">
      <p className="font-display font-bold text-[11.5px] tracking-[1.8px] uppercase text-gold">
        Dourados / MS
      </p>
      <h1 className="font-display font-black text-[28px] md:text-[34px] leading-tight my-2.5 mb-7">
        Descreva o imóvel que você <span className="text-gold">procura</span>
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 bg-white border-[1.5px] border-ink rounded-2xl py-2 pl-5 pr-2 max-w-xl mx-auto"
      >
        <label htmlFor="busca-hero" className="sr-only">
          Buscar imóvel
        </label>
        <input
          id="busca-hero"
          type="text"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 text-left text-[15px] text-ink outline-none bg-transparent placeholder:text-ink"
        />
        <button type="submit" className="font-display font-bold text-[13px] px-5 py-3 rounded-lg bg-gold text-white shrink-0">
          Buscar
        </button>
      </form>
      <p className="text-xs text-ink-soft mt-3.5">
        Ex.: &quot;terreno plano perto do centro&quot; ou &quot;casa com 3 quartos e quintal&quot;
      </p>
    </section>
  );
}
