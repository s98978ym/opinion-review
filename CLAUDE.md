# Opinion Review - Development Rules

## Project Overview
Slack message review web app with LLM feedback. Japanese UI.
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Prisma 6.19.2 + PostgreSQL + NextAuth.js v5 beta.30 + OpenAI API

## Architecture Rules

### R1: インフラ依存関数はレンダリングパスで直接呼ばない
**原因**: `auth()` → Prisma → PostgreSQL という依存チェーンが暗黙的に存在する。
Server Component のレンダリング中にこのチェーンが壊れると、ページ全体が 404/500 になる。
同じ構造は Edge Runtime でも発生済み（middleware で `auth()` → `crypto` 依存で失敗）。

**ルール**: DB・認証・外部API に依存する関数を Server Component で呼ぶ場合は、
必ず try-catch で囲み、失敗時のフォールバックを用意する。
特にログイン・ランディングなど「インフラなしでも表示すべきページ」では dynamic import を使う。

```typescript
// BAD: インフラ障害でページ全体が死ぬ
import { auth } from "@/lib/auth";
export default async function Page() {
  const session = await auth(); // DB落ちたら404
}

// GOOD: graceful degradation
export default async function Page() {
  let session = null;
  try {
    const { auth } = await import("@/lib/auth");
    session = await auth();
  } catch {
    // フォールバック処理
  }
}
```

### R2: Next.js の redirect() は throw で動作する — catch 内で飲み込まない
**原因**: `redirect()` は内部的に特殊な Error を throw する。
try-catch で囲むと redirect が無効化される。

**ルール**: `redirect()` を含みうるコードを try-catch する場合、
`digest` プロパティを持つエラーは必ず re-throw する。

```typescript
try {
  // redirect() を呼ぶ可能性があるコード
} catch (e: unknown) {
  if (e && typeof e === "object" && "digest" in e) throw e;
  // その他のエラー処理
}
```

### R3: error.tsx と not-found.tsx はスキャフォルディング時に作る
**原因**: これらがないと、レンダリングエラーが Next.js デフォルトの無情報な画面になる。
「後で追加」は忘れやすく、本番障害の原因になる。

**ルール**: Sprint 0（初期構築）で `src/app/error.tsx` と `src/app/not-found.tsx` を必ず含める。

### R4: 暗黙の依存チェーンに注意する
**背景**: このプロジェクトで3回同じパターンの問題が発生:
1. middleware → `auth()` → Node.js `crypto` (Edge Runtime に `crypto` がない)
2. login/page.tsx → `auth()` → Prisma → PostgreSQL (DB未設定)
3. page.tsx → `auth()` → Prisma → PostgreSQL (同上)

**共通構造**: 関数 A が関数 B を呼び、B が暗黙的にインフラ C に依存している。
A の実行環境で C が利用できないとき、A が原因不明のエラーで壊れる。

**対策**:
- 新しい呼び出しを追加する前に、呼び出し先の依存チェーンを確認する
- 「この関数はどのインフラに依存しているか」を常に意識する
- 依存チェーンの途中が壊れた場合の挙動をテスト or 想定する

## Tech Constraints

- **Prisma 7 は使わない**: Turbopack と非互換（ES module の `import.meta.url`）
- **Edge Runtime で Node.js モジュール不可**: middleware では cookie ベースの簡易チェックのみ
- **Google Fonts 不使用**: ビルド環境にネットワークアクセスがない
- **Prisma Json 型**: `Record<string, unknown>` → `as Prisma.InputJsonValue` でキャスト
- **TypeScript 二重キャスト**: `(obj as unknown as TargetType)` を使う
- **pnpm 使用**: `pnpm approve-builds` がネイティブ依存で必要な場合あり

## Branch
Development branch: `claude/enable-teammate-mode-ZDx9T`
