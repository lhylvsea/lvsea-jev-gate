# lvsea-jev-gate

一个显式触发的 JEV Skill 确认门：先扫描本机可发现的 Skill，调用已配置的 `jev_rerank`，展示真实命中概率、第一名与第二名的差值和证据，等待用户确认后才执行后续业务任务。

它不是业务 Skill，也不会对每个普通新任务自动扫描。使用者可以把它作为共享的任务前置路由规则，其他业务 Skill 仍由各自的说明文件负责。

## 安装

```bash
npx skills add lhylvsea/lvsea-jev-gate --skill lvsea-jev-gate
```

安装后，在任务开头显式输入 `$lvsea-jev-gate` 或 `@lvsea-jev-gate`。

## 你可以这样说

- `$lvsea-jev-gate 先判断这项网页修复任务该调用哪些 Skill，展示概率差后等我确认。`
- `@lvsea-jev-gate 先为这份生产记录做路由预检，不要先改文件。`
- `$lvsea-jev-gate 比较 PPT、图表和文档 Skill，JEV 返回后再问我是否继续。`
- `@lvsea-jev-gate 先判断视频剪辑和字幕任务的候选 Skill，确认后再执行。`

## 包结构

- `SKILL.md`：跨平台主入口和执行边界。
- `USAGE.zh-CN.md`：中文触发词、输入、流程、产物和限制。
- `agents/interface.yaml`：通用 Agent Skills 接口元数据。
- `scripts/prepare_jev_gate.mjs`：扫描、去重、候选摘要和本地回退生成器。
- `evals/trigger_cases.json`：显式触发边界的回归样例。
- `reports/`：Skill IR、触发评测、上下文预算和发布证据。

## 本地验证

需要 Python 3.9+、Node.js 18+ 和 Git。建议在包根目录执行：

- [ ] Python 3.9 or newer is available.
- [ ] Node.js 18 or newer is available.
- [ ] The host has a configured `jev` provider if real Jev probabilities are required.

```bash
python scripts/validate_skill.py .
python scripts/trigger_eval.py . --cases evals/trigger_cases.json --output reports/trigger-eval.json
python scripts/export_skill_ir.py . --output reports/skill-ir.json
python scripts/context_sizer.py . --output reports/context-budget.json
python scripts/release_check.py . --phase local --run-tests
python -m unittest discover -s tests -p "test_*.py"
node --check scripts/prepare_jev_gate.mjs
```

## 重要边界

- 只有用户显式调用本 Skill 才执行预检；它不会把全局普通任务改成自动扫描模式。
- Jev 返回的概率、Jev 返回但无概率、Jev provider 不可用、本地词法回退必须分别标注。
- “继续”之前不得修改文件、启动服务、安装依赖、加载候选 Skill 或执行实际业务动作。
- 公共包不包含 API Key、Cookie、完整私有源码、用户隐私或本机绝对路径。
- 本地静态验证不能证明 provider 账号、密钥、付费额度或人工输出质量已经可用。

本包的治理和发布方法沿用本地 `lvsea-zao-skill` 的证据边界与分支发布约束，并参考了 `qiaomu-meta-skill`、`yao-meta-skill` 的 Skill 工程化思路；没有把上游仓库内容整体复制进来。

## Troubleshooting

- `jev` MCP 未启动或鉴权失败：显示“Jev 未验证”和简短原因，使用本地回退但不能称为 Jev 概率。
- 没有可发现的 Skill：保留空候选事实，不伪造概率，也不自动安装候选。
- `npx skills add` 找不到 Skill：先确认仓库公开可访问、Skill 名为 `lvsea-jev-gate`，再重试干净安装。

## License

MIT
