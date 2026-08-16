import sys
import unittest
from pathlib import Path
from unittest.mock import patch

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import run_test_gate


class TestGateRuntimeTests(unittest.TestCase):
    def test_pytest_uses_the_active_python_runtime(self):
        with patch("run_test_gate.importlib.util.find_spec", return_value=object()):
            command = run_test_gate.unit_test_command()
        self.assertEqual(command[0], sys.executable)
        self.assertEqual(command[1:3], ["-m", "pytest"])

    def test_missing_pytest_falls_back_to_unittest_on_the_active_runtime(self):
        with patch("run_test_gate.importlib.util.find_spec", return_value=None):
            command = run_test_gate.unit_test_command()
        self.assertEqual(command[0], sys.executable)
        self.assertEqual(command[1:4], ["-m", "unittest", "discover"])


if __name__ == "__main__":
    unittest.main()
