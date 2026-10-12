from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from context_sizer import measure  # noqa: E402
from trigger_eval import evaluate  # noqa: E402
from validate_skill import validate  # noqa: E402


class PackageContractTests(unittest.TestCase):
    def test_package_contract(self) -> None:
        result = validate(ROOT)
        self.assertTrue(result["ok"], result)

    def test_trigger_regression(self) -> None:
        result = evaluate(ROOT, ROOT / "evals/trigger_cases.json")
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["summary"]["passed"], result["summary"]["total"])

    def test_context_budget(self) -> None:
        result = measure(ROOT)
        self.assertNotEqual(result["status"], "block")

    def test_public_contract_has_no_machine_absolute_path(self) -> None:
        forbidden = ("C:\\Users\\", "/Users/", "/home/")
        for path in ROOT.rglob("*"):
            if not path.is_file() or ".git" in path.parts or "__pycache__" in path.parts or "tests" in path.parts:
                continue
            if path.relative_to(ROOT).as_posix() == "scripts/validate_skill.py":
                continue
            if path.suffix.lower() not in {".md", ".json", ".yaml", ".yml", ".py", ".mjs"}:
                continue
            text = path.read_text(encoding="utf-8")
            self.assertFalse(any(marker in text for marker in forbidden), path)

    def test_preparation_script_contract(self) -> None:
        completed = subprocess.run(
            ["node", str(ROOT / "scripts/prepare_jev_gate.mjs"), "--json", "--cwd", str(ROOT), "先判断网页任务应该调用哪个 Skill"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        payload = json.loads(completed.stdout)
        self.assertIn("mcp_rerank", payload)
        self.assertIn("localFallback", payload)
        self.assertNotIn("lvsea-jev-gate", {item["name"] for item in payload["localFallback"]})


if __name__ == "__main__":
    unittest.main()
