#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SKIP_DIRS = new Set([".git", "node_modules", "__pycache__", ".venv", "dist", "build"]);
const STOPWORDS = new Set([
  "and", "the", "for", "with", "from", "this", "that", "into", "then", "task", "need",
  "请", "帮我", "我要", "需要", "一个", "进行", "完成", "处理", "相关", "以及", "并且", "一下",
  "做成", "检查", "实现", "修复", "使用", "生成", "制作", "任务"
]);
const ALIASES = [
  ["ppt", "slides", "演示", "幻灯片", "汇报"],
  ["web", "website", "网页", "网站", "前端", "浏览器"],
  ["video", "视频", "剪辑", "字幕", "音频", "media"],
  ["document", "文档", "报告", "word", "docx"],
  ["data", "数据", "分析", "统计", "看板", "报表"],
  ["test", "测试", "回归", "验证", "验收"],
  ["persist", "持久化", "保存", "存储", "数据库", "sqlite"],
  ["research", "研究", "搜索", "资料", "来源", "调研"]
];

function parseArgs(argv) {
  const result = { json: false, cwd: process.cwd(), topK: 8, task: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") result.json = true;
    else if (arg === "--cwd") result.cwd = argv[++i] ?? result.cwd;
    else if (arg === "--top-k") result.topK = Number(argv[++i] ?? result.topK);
    else if (arg === "--") result.task.push(...argv.slice(i + 1));
    else result.task.push(arg);
  }
  return result;
}

function tokenize(value) {
  const text = String(value ?? "").toLowerCase();
  const english = text.match(/[a-z0-9][a-z0-9_+#.-]*/g) ?? [];
  const han = [...text.matchAll(/[\u4e00-\u9fff]+/g)].flatMap((match) => {
    const chars = [...match[0]];
    const tokens = [];
    for (let size = 2; size <= 4; size += 1) {
      for (let index = 0; index + size <= chars.length; index += 1) {
        tokens.push(chars.slice(index, index + size).join(""));
      }
    }
    return tokens;
  });
  return [...new Set([...english, ...han].filter((token) => !STOPWORDS.has(token)))];
}

function expandQuery(task) {
  const primary = tokenize(task);
  const expanded = new Set(primary);
  for (const group of ALIASES) {
    if (group.some((term) => primary.includes(term))) group.forEach((term) => expanded.add(term));
  }
  return { primary, all: [...expanded] };
}

function parseSkill(content, filePath, scope) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*["']?([^\r\n"']+)["']?\s*$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  if (!name || !description) return null;
  return { name, description, path: filePath, scope };
}

async function walkSkills(root, scope, current = root, depth = 0) {
  if (depth > 4) return [];
  let entries;
  try {
    entries = await fs.promises.readdir(current, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  const skillFile = path.join(current, "SKILL.md");
  try {
    const content = await fs.promises.readFile(skillFile, "utf8");
    const skill = parseSkill(content, skillFile, scope);
    if (skill) found.push(skill);
    return found;
  } catch {
    // Continue scanning nested plugin and skill directories.
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
    found.push(...await walkSkills(root, scope, path.join(current, entry.name), depth + 1));
  }
  return found;
}

function scopePriority(scope) {
  return scope === "codex" ? 0 : scope === "agents" ? 1 : 2;
}

function uniqueSkills(skills) {
  const byName = new Map();
  for (const skill of skills) {
    const previous = byName.get(skill.name);
    if (!previous || scopePriority(skill.scope) < scopePriority(previous.scope)) byName.set(skill.name, skill);
  }
  return [...byName.values()];
}

function localRank(task, skill) {
  const query = expandQuery(task);
  const nameTokens = new Set(tokenize(skill.name.replaceAll("-", " ")));
  const descriptionTokens = new Set(tokenize(skill.description));
  const primary = new Set(query.primary);
  const all = new Set(query.all);
  const nameHits = [...primary].filter((token) => nameTokens.has(token)).length;
  const descriptionHits = [...primary].filter((token) => descriptionTokens.has(token)).length;
  const expandedHits = [...all].filter((token) => descriptionTokens.has(token)).length;
  const raw = nameHits * 7 + descriptionHits * 2 + expandedHits * 0.35;
  const score = Math.min(1, raw / Math.max(6, query.primary.length * 3));
  const evidence = [];
  if (nameHits) evidence.push(`名称命中 ${nameHits}`);
  if (descriptionHits) evidence.push(`描述命中 ${descriptionHits}`);
  if (expandedHits > descriptionHits) evidence.push("同义词命中");
  return { nameHits, descriptionHits, expandedHits, score, evidence };
}

function localFallback(task, skills, topK) {
  const ranked = skills.map((skill) => ({ ...skill, local: localRank(task, skill) }))
    .sort((a, b) => b.local.score - a.local.score || a.name.localeCompare(b.name))
    .slice(0, topK);
  const total = ranked.reduce((sum, item) => sum + Math.exp(item.local.score * 5), 0) || 1;
  return ranked.map((item) => ({
    id: item.name,
    name: item.name,
    path: item.path,
    scope: item.scope,
    probability: Number((Math.exp(item.local.score * 5) / total).toFixed(4)),
    score: Number(item.local.score.toFixed(4)),
    evidence: item.local.evidence,
    description: item.description.slice(0, 900)
  }));
}

function toCard(item) {
  return {
    id: item.name,
    text: [
      `Skill: ${item.name}`,
      `Scope: ${item.scope}`,
      `Path: ${item.path}`,
      `Description: ${item.description.slice(0, 900)}`
    ].join("\n")
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const task = args.task.join(" ").trim();
  if (!task) throw new Error("缺少用户任务文本");
  const home = os.homedir();
  const codexRoot = process.env.CODEX_HOME || path.join(home, ".codex");
  const rootSpecs = [
    { root: path.join(codexRoot, "skills"), scope: "codex" },
    { root: path.join(home, ".agents", "skills"), scope: "agents" }
  ];
  for (const extra of (process.env.TYPEAHEAD_EXTRA_ROOTS || "").split(";").filter(Boolean)) {
    rootSpecs.push({ root: path.resolve(extra), scope: "other" });
  }
  const scanned = (await Promise.all(rootSpecs.map((spec) => walkSkills(spec.root, spec.scope)))).flat()
    .filter((skill) => !new Set(["codex-jev-gate", "lvsea-jev-gate"]).has(skill.name));
  const skills = uniqueSkills(scanned);
  const fallback = localFallback(task, skills, Math.max(2, Math.min(args.topK, 12)));
  const cards = fallback.map(toCard);
  const result = {
    task,
    cwd: path.resolve(args.cwd),
    generatedAt: new Date().toISOString(),
    catalog: { rawCount: scanned.length, uniqueCount: skills.length, duplicateCount: scanned.length - skills.length },
    provider: { server: "jev", tool: "jev_rerank", status: "pending_mcp_call" },
    mcp_rerank: {
      server: "jev",
      tool: "jev_rerank",
      arguments: {
        query: `用户任务：${task}\n只选择能实质改变交付物的 Skill，拒绝仅凭共享关键词的命中。`,
        candidates: cards,
        top_k: Math.min(8, cards.length)
      }
    },
    localFallback: fallback,
    policy: {
      probabilityDiff: "显示第一名与第二名的真实概率及 Δ；若 Jev 不返回概率，不得自行补算为 Jev 概率。",
      confirmation: "展示差异后必须询问用户是否继续，未确认不得执行实际任务。"
    }
  };
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`catalog=${skills.length} raw=${scanned.length}`);
    for (const item of fallback.slice(0, 5)) console.log(`${item.name}: local=${item.probability} ${item.path}`);
    console.log("Next: call jev_rerank, show probability diff, then ask the user whether to continue.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
