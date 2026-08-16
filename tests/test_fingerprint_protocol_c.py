import shutil
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FIRMWARE = ROOT / "firmware" / "tiny_touch_smartcard" / "main"


class FingerprintProtocolCTests(unittest.TestCase):
    def test_packet_validation_and_image_states(self):
        compiler = shutil.which("cc") or shutil.which("gcc") or shutil.which("clang")
        if not compiler:
            self.skipTest("No C compiler found in PATH")

        source = textwrap.dedent(
            r"""
            #include <assert.h>
            #include <stdbool.h>
            #include <stdint.h>
            #include "fingerprint_protocol.h"

            int main(void) {
              const uint8_t body[] = {0x00, 0x00, 0x03, 0x00, 0x91};
              uint8_t ack[] = {
                0xef, 0x01, 0xff, 0xff, 0xff, 0xff,
                0x07, 0x00, 0x07,
                0x00, 0x00, 0x03, 0x00, 0x91,
                0x00, 0x00
              };
              uint16_t checksum = fp_protocol_checksum(0x07, 0x00, 0x07, body, sizeof(body));
              ack[14] = (uint8_t)(checksum >> 8);
              ack[15] = (uint8_t)checksum;

              fp_ack_t parsed = {0};
              assert(fp_protocol_parse_ack(ack, sizeof(ack), &parsed));
              assert(parsed.confirm == 0x00);
              assert(parsed.data_length == 4);
              assert(parsed.data[0] == 0x00 && parsed.data[1] == 0x03);
              assert(parsed.data[2] == 0x00 && parsed.data[3] == 0x91);

              ack[15] ^= 0x01;
              assert(!fp_protocol_parse_ack(ack, sizeof(ack), &parsed));

              assert(fp_protocol_image_state(true, 0x00) == FP_IMAGE_PRESENT);
              assert(fp_protocol_image_state(true, 0x02) == FP_IMAGE_ABSENT);
              assert(fp_protocol_image_state(true, 0x03) == FP_IMAGE_ERROR);
              assert(fp_protocol_image_state(false, 0xff) == FP_IMAGE_TRANSPORT_ERROR);
              return 0;
            }
            """
        )

        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            harness = directory / "harness.c"
            binary = directory / "harness.exe"
            harness.write_text(source, encoding="utf-8")
            compile_result = subprocess.run(
                [
                    compiler,
                    "-std=c11",
                    "-Wall",
                    "-Wextra",
                    "-Werror",
                    "-I",
                    str(FIRMWARE),
                    str(harness),
                    str(FIRMWARE / "fingerprint_protocol.c"),
                    "-o",
                    str(binary),
                ],
                text=True,
                capture_output=True,
            )
            self.assertEqual(compile_result.returncode, 0, compile_result.stderr)
            run_result = subprocess.run([str(binary)], text=True, capture_output=True)
            self.assertEqual(run_result.returncode, 0, run_result.stderr)


if __name__ == "__main__":
    unittest.main()
