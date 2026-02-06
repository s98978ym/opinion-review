/**
 * Convert Slack mrkdwn to plain text for LLM consumption,
 * or to HTML-safe text for display.
 */

export function slackMrkdwnToPlainText(text: string): string {
  let result = text;

  // User mentions: <@U123ABC> → @user
  result = result.replace(/<@([A-Z0-9]+)>/g, "@user");

  // Channel references: <#C123ABC|channel-name> → #channel-name
  result = result.replace(/<#[A-Z0-9]+\|([^>]+)>/g, "#$1");
  result = result.replace(/<#([A-Z0-9]+)>/g, "#channel");

  // URLs: <https://example.com|Display Text> → Display Text (URL)
  result = result.replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, "$2 ($1)");
  // URLs without display text: <https://example.com> → https://example.com
  result = result.replace(/<(https?:\/\/[^>]+)>/g, "$1");

  // Bold: *text* → text
  result = result.replace(/\*([^*]+)\*/g, "$1");

  // Italic: _text_ → text
  result = result.replace(/_([^_]+)_/g, "$1");

  // Strikethrough: ~text~ → text
  result = result.replace(/~([^~]+)~/g, "$1");

  // Inline code: `text` → text (keep backticks for LLM context)
  // Code blocks: ```text``` → keep as-is for context

  // HTML entities
  result = result.replace(/&amp;/g, "&");
  result = result.replace(/&lt;/g, "<");
  result = result.replace(/&gt;/g, ">");

  return result;
}

export function slackMrkdwnToHtml(text: string): string {
  let result = escapeHtml(text);

  // User mentions
  result = result.replace(
    /&lt;@([A-Z0-9]+)&gt;/g,
    '<span class="text-blue-600 font-medium">@user</span>',
  );

  // Channel references
  result = result.replace(
    /&lt;#[A-Z0-9]+\|([^&]+)&gt;/g,
    '<span class="text-blue-600 font-medium">#$1</span>',
  );

  // URLs
  result = result.replace(
    /&lt;(https?:\/\/[^|&]+)\|([^&]+)&gt;/g,
    '<a href="$1" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$2</a>',
  );
  result = result.replace(
    /&lt;(https?:\/\/[^&]+)&gt;/g,
    '<a href="$1" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Code blocks
  result = result.replace(
    /```([^`]+)```/g,
    '<pre class="bg-zinc-100 dark:bg-zinc-800 rounded p-2 text-sm overflow-x-auto"><code>$1</code></pre>',
  );

  // Inline code
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="bg-zinc-100 dark:bg-zinc-800 rounded px-1 text-sm">$1</code>',
  );

  // Bold
  result = result.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");

  // Italic
  result = result.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Strikethrough
  result = result.replace(/~([^~]+)~/g, "<del>$1</del>");

  // Line breaks
  result = result.replace(/\n/g, "<br />");

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
