<script setup lang="ts">
import usageGuide from "../../doc/项目说明/使用指南.md?raw";
import strategyGuide from "../../doc/项目说明/态马商战快速简介与取胜说明.md?raw";

interface DocSection {
  key: string;
  title: string;
  content: string;
}

const sections: DocSection[] = [
  { key: "usage", title: "系统使用指南", content: usageGuide },
  { key: "strategy", title: "快速简介与取胜说明", content: strategyGuide },
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderInline = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

const renderMarkdown = (source: string) => {
  const html: string[] = [];
  let listType: "ul" | "ol" | undefined;
  let paragraph: string[] = [];
  let codeBlock: string[] = [];
  let inCodeBlock = false;

  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = undefined;
  };
  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${paragraph.map(renderInline).join(" ")}</p>`);
    paragraph = [];
  };

  for (const line of source.split(/\r?\n/)) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeBlock.join("\n"))}</code></pre>`);
        codeBlock = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        closeList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlock.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^-\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${renderInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  return html.join("");
};
</script>

<template>
  <main class="page readme-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">态马说明</h1>
        <p class="page-subtitle">本地打包的系统使用指南、商战快速简介和取胜说明。</p>
      </div>
      <a-tag color="green">离线可读</a-tag>
    </header>

    <a-tabs default-active-key="usage">
      <a-tab-pane v-for="section in sections" :key="section.key" :title="section.title">
        <article class="panel doc-panel" v-html="renderMarkdown(section.content)"></article>
      </a-tab-pane>
    </a-tabs>
  </main>
</template>

<style scoped>
.doc-panel {
  max-width: 980px;
}

.doc-panel :deep(h2) {
  margin: 18px 0 10px;
  color: #111827;
  font-size: 22px;
}

.doc-panel :deep(h3) {
  margin: 16px 0 8px;
  color: #1f2937;
  font-size: 18px;
}

.doc-panel :deep(p),
.doc-panel :deep(li) {
  color: #334155;
  line-height: 1.75;
}

.doc-panel :deep(ul),
.doc-panel :deep(ol) {
  padding-left: 22px;
}

.doc-panel :deep(code) {
  padding: 2px 5px;
  border-radius: 4px;
  background: #eef2f7;
  color: #0f172a;
}

.doc-panel :deep(pre) {
  overflow-x: auto;
  padding: 12px;
  border-radius: 8px;
  background: #0f172a;
}

.doc-panel :deep(pre code) {
  padding: 0;
  color: #e2e8f0;
  background: transparent;
}
</style>
