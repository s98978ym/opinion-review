import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const presets = [
  {
    slug: "interpret",
    name: "解釈",
    description: "投稿の意図・文脈・前提を推定して言語化します",
    displayOrder: 1,
    promptTemplate: `あなたはビジネスコミュニケーションの専門家です。
以下はSlackのビジネスチャンネルでの投稿です。
この投稿の意図・文脈・前提を推定して言語化してください。

## 投稿内容
{message_text}

## 出力形式
以下のJSON形式で回答してください。markdownや追加テキストは不要です。
{
  "mode": "interpret",
  "intent": "この投稿の主な意図（1-2文）",
  "context": "推定される文脈や背景（1-2文）",
  "assumptions": ["前提として読み取れること1", "前提2", "前提3"],
  "summary": "総括コメント（1-2文）"
}`,
  },
  {
    slug: "evaluate",
    name: "評価",
    description: "明確さ・説得力・トーン・構造を軸にスコアとコメントで評価します",
    displayOrder: 2,
    promptTemplate: `あなたはビジネスコミュニケーションの専門家です。
以下はSlackのビジネスチャンネルでの投稿です。
明確さ、説得力、トーン、構造の4軸で評価してください。

## 投稿内容
{message_text}

## 出力形式
以下のJSON形式で回答してください。markdownや追加テキストは不要です。
{
  "mode": "evaluate",
  "overall_score": 4.0,
  "axes": [
    { "name": "明確さ", "score": 4, "max": 5, "comment": "評価コメント" },
    { "name": "説得力", "score": 4, "max": 5, "comment": "評価コメント" },
    { "name": "トーン", "score": 4, "max": 5, "comment": "評価コメント" },
    { "name": "構造", "score": 4, "max": 5, "comment": "評価コメント" }
  ],
  "summary": "総合評価コメント（2-3文）"
}`,
  },
  {
    slug: "improve",
    name: "改善提案",
    description: "具体的な改善ポイントと理由を提示します",
    displayOrder: 3,
    promptTemplate: `あなたはビジネスコミュニケーションの専門家です。
以下はSlackのビジネスチャンネルでの投稿です。
具体的な改善ポイントを優先度順に提案してください。

## 投稿内容
{message_text}

## 出力形式
以下のJSON形式で回答してください。markdownや追加テキストは不要です。
{
  "mode": "improve",
  "points": [
    {
      "issue": "指摘事項",
      "suggestion": "改善案",
      "reason": "理由",
      "priority": "high/medium/low"
    }
  ],
  "summary": "改善提案の総括（1-2文）"
}`,
  },
  {
    slug: "rewrite",
    name: "書き換え",
    description: "異なるトーンやスタイルでの書き直し案を提示します",
    displayOrder: 4,
    promptTemplate: `あなたはビジネスコミュニケーションの専門家です。
以下はSlackのビジネスチャンネルでの投稿です。
異なるトーン・スタイルで3パターンの書き直し案を作成してください。

## 投稿内容
{message_text}

## 出力形式
以下のJSON形式で回答してください。markdownや追加テキストは不要です。
{
  "mode": "rewrite",
  "variants": [
    { "style": "より丁寧に", "text": "書き直し案", "explanation": "変更のポイント" },
    { "style": "より簡潔に", "text": "書き直し案", "explanation": "変更のポイント" },
    { "style": "より論理的に", "text": "書き直し案", "explanation": "変更のポイント" }
  ],
  "summary": "書き換え案の総括（1文）"
}`,
  },
  {
    slug: "summarize",
    name: "要約",
    description: "長い投稿の要点をまとめます",
    displayOrder: 5,
    promptTemplate: `あなたはビジネスコミュニケーションの専門家です。
以下はSlackのビジネスチャンネルでの投稿です。
この投稿の要点をまとめてください。

## 投稿内容
{message_text}

## 出力形式
以下のJSON形式で回答してください。markdownや追加テキストは不要です。
{
  "mode": "summarize",
  "one_line": "一行要約",
  "key_points": ["要点1", "要点2", "要点3"],
  "summary": "まとめのコメント（1-2文）"
}`,
  },
];

async function main() {
  console.log("Seeding feedback presets...");
  for (const preset of presets) {
    await prisma.feedbackPreset.upsert({
      where: { slug: preset.slug },
      update: {
        name: preset.name,
        description: preset.description,
        promptTemplate: preset.promptTemplate,
        displayOrder: preset.displayOrder,
      },
      create: preset,
    });
    console.log(`  ✓ ${preset.slug}: ${preset.name}`);
  }
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
