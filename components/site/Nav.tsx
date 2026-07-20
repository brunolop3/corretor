'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WHATSAPP_NUMERO = '5567984294178';
const WHATSAPP_MENSAGEM_PADRAO = 'Olá! Vim pelo site e gostaria de mais informações.';

const LINKS = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between gap-4 px-6 md:px-14 py-5 border-b border-line sticky top-0 bg-paper/95 backdrop-blur-sm z-10">
      <Link href="/" className="flex items-center gap-2.5">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path
            d="M50 10 L90 42 L82 42 L82 88 L60 88 L60 55 L40 55 L40 88 L18 88 L18 42 L10 42 Z"
            stroke="#1C1C1C"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M50 30 L50 78 Q50 88 60 88" stroke="#1C1C1C" strokeWidth="5" fill="none" />
        </svg>
        <span>
          <span className="block font-display font-extrabold text-[16px] leading-tight">LUIZ LOPES</span>
          <span className="block font-semibold text-[9px] text-ink-soft tracking-wide uppercase">
            Corretor · CRECI/MS 8283
          </span>
        </span>
      </Link>

      <div className="hidden md:flex gap-7 font-semibold text-[13.5px]">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'text-gold' : 'text-ink'}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAGEM_PADRAO)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-display font-bold text-[13px] px-5 py-3 rounded-lg border-[1.5px] border-ink text-ink"
      >
        Fale no WhatsApp
      </a>
    </nav>
  );
}
