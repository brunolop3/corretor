import Link from 'next/link';

export default function AdminIndexPage() {
  return (
    <main className="p-10">
      <h1 className="font-display font-bold text-xl">Área administrativa</h1>
      <p className="mt-2 text-ink-soft">
        <Link href="/admin/imoveis" className="text-gold font-semibold">Ir para a lista de imóveis</Link>
      </p>
    </main>
  );
}
