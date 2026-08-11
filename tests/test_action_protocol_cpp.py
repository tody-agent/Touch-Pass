import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FIRMWARE = ROOT / "firmware" / "tiny_touch_keyboard"


class ActionProtocolCppTests(unittest.TestCase):
    def test_action_decoder_executes_valid_steps_and_rejects_truncation(self):
        source = textwrap.dedent(
            r"""
            #include <cassert>
            #include <cstdint>
            #include <string>
            #include "action_protocol.h"

            struct State { std::string text; int key = 0; int delay = 0; };
            static bool onText(void *ctx, const uint8_t *data, size_t len) {
              static_cast<State *>(ctx)->text.append(reinterpret_cast<const char *>(data), len);
              return true;
            }
            static bool onKey(void *ctx, uint8_t modifiers, uint8_t key) {
              static_cast<State *>(ctx)->key = modifiers * 100 + key;
              return true;
            }
            static bool onDelay(void *ctx, uint16_t milliseconds) {
              static_cast<State *>(ctx)->delay = milliseconds;
              return true;
            }

            int main() {
              State state;
              TinyTouchAction::Executor executor{&state, onText, onKey, onDelay};
              const uint8_t valid[] = {1, 3, 1, 0, 2, 'o', 'k', 2, 1, 1, 3, 0, 25};
              assert(TinyTouchAction::execute(valid, sizeof(valid), executor));
              assert(state.text == "ok");
              assert(state.key == 101);
              assert(state.delay == 25);
              const uint8_t truncated[] = {1, 1, 1, 0, 4, 'x'};
              assert(!TinyTouchAction::execute(truncated, sizeof(truncated), executor));
              return 0;
            }
            """
        )
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            harness = directory / "harness.cpp"
            binary = directory / "harness"
            harness.write_text(source, encoding="utf-8")
            compile_result = subprocess.run(
                ["c++", "-std=c++17", "-Wall", "-Wextra", "-Werror", "-I", str(FIRMWARE), str(harness), "-o", str(binary)],
                text=True,
                capture_output=True,
            )
            self.assertEqual(compile_result.returncode, 0, compile_result.stderr)
            run_result = subprocess.run([str(binary)], text=True, capture_output=True)
            self.assertEqual(run_result.returncode, 0, run_result.stderr)


if __name__ == "__main__":
    unittest.main()
