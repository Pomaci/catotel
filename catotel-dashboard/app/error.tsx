'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportClientError } from '@/lib/utils/client-error-reporter';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global application error', error);
    void reportClientError(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand-50 px-6 text-center text-cocoa-700">
      <div className="w-full max-w-xl rounded-3xl bg-white px-10 py-12 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cocoa-400">
          Bir şeyler ters gitti
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-cocoa-900">
          Beklenmeyen bir hata oluştu
        </h1>
        <p className="mt-4 text-base text-cocoa-500">
          Ekibimiz olayı incelemesi için bilgilendirildi. Sayfayı yenilemeyi
          veya kontrol paneline geri dönmeyi deneyebilirsin.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-cocoa-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cocoa-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa-600"
          >
            Tekrar dene
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-cocoa-200 px-6 py-3 text-sm font-semibold text-cocoa-700 transition hover:border-cocoa-300 hover:text-cocoa-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa-300"
          >
            Kontrol Paneline Git
          </Link>
        </div>
        {error?.digest ? (
          <p className="mt-6 text-xs text-cocoa-400">
            Hata kodu: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
