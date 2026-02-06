"use client";

interface Props {
  outputJson: Record<string, unknown>;
}

export function FeedbackResultDisplay({ outputJson }: Props) {
  const mode = outputJson.mode as string;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
      {mode === "evaluate" && <EvaluateResult data={outputJson} />}
      {mode === "interpret" && <InterpretResult data={outputJson} />}
      {mode === "improve" && <ImproveResult data={outputJson} />}
      {mode === "rewrite" && <RewriteResult data={outputJson} />}
      {mode === "summarize" && <SummarizeResult data={outputJson} />}
      {!["evaluate", "interpret", "improve", "rewrite", "summarize"].includes(
        mode,
      ) && <GenericResult data={outputJson} />}
    </div>
  );
}

function EvaluateResult({ data }: { data: Record<string, unknown> }) {
  const axes = (data.axes as Array<Record<string, unknown>>) ?? [];
  const overallScore = data.overall_score as number;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {overallScore?.toFixed(1)}
        </span>
        <span className="text-sm text-zinc-500">/ 5.0</span>
        <ScoreBar score={overallScore} max={5} />
      </div>
      <div className="space-y-3">
        {axes.map((axis, i) => (
          <div key={i}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {axis.name as string}
              </span>
              <span className="text-sm text-zinc-500">
                {axis.score as number}/{axis.max as number}
              </span>
            </div>
            <ScoreBar
              score={axis.score as number}
              max={axis.max as number}
            />
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {axis.comment as string}
            </p>
          </div>
        ))}
      </div>
      {typeof data.summary === "string" && (
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
          {data.summary as string}
        </p>
      )}
    </div>
  );
}

function InterpretResult({ data }: { data: Record<string, unknown> }) {
  const assumptions = (data.assumptions as string[]) ?? [];

  return (
    <div className="space-y-3">
      <Section label="意図" content={data.intent as string} />
      <Section label="文脈" content={data.context as string} />
      {assumptions.length > 0 && (
        <div>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            前提
          </span>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
      {typeof data.summary === "string" && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {data.summary as string}
        </p>
      )}
    </div>
  );
}

function ImproveResult({ data }: { data: Record<string, unknown> }) {
  const points = (data.points as Array<Record<string, unknown>>) ?? [];
  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="space-y-4">
      {points.map((point, i) => (
        <div
          key={i}
          className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${priorityColors[point.priority as string] ?? priorityColors.medium}`}
            >
              {point.priority as string}
            </span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {point.issue as string}
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            💡 {point.suggestion as string}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            理由: {point.reason as string}
          </p>
        </div>
      ))}
      {typeof data.summary === "string" && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {data.summary as string}
        </p>
      )}
    </div>
  );
}

function RewriteResult({ data }: { data: Record<string, unknown> }) {
  const variants = (data.variants as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-4">
      {variants.map((v, i) => (
        <div
          key={i}
          className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mb-2 text-xs font-medium uppercase text-zinc-500">
            {v.style as string}
          </div>
          <p className="text-sm text-zinc-800 dark:text-zinc-200">
            {v.text as string}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {v.explanation as string}
          </p>
        </div>
      ))}
      {typeof data.summary === "string" && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {data.summary as string}
        </p>
      )}
    </div>
  );
}

function SummarizeResult({ data }: { data: Record<string, unknown> }) {
  const keyPoints = (data.key_points as string[]) ?? [];

  return (
    <div className="space-y-3">
      {typeof data.one_line === "string" && (
        <p className="text-base font-medium text-zinc-800 dark:text-zinc-200">
          {data.one_line as string}
        </p>
      )}
      {keyPoints.length > 0 && (
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {keyPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {typeof data.summary === "string" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {data.summary as string}
        </p>
      )}
    </div>
  );
}

function GenericResult({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="overflow-x-auto text-sm text-zinc-700 dark:text-zinc-300">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Section({ label, content }: { label: string; content?: string }) {
  if (!content) return null;
  return (
    <div>
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
        {content}
      </p>
    </div>
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
      <div
        className="h-2 rounded-full bg-blue-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
