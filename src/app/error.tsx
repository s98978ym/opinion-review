"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-zinc-300 dark:text-zinc-700">500</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          エラーが発生しました
        </p>
        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
          {error.digest ? `Error ID: ${error.digest}` : "予期しないエラーです"}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
