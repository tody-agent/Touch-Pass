# Design: Sketch Arduino test ZW101 doc lap

## Context & Technical Approach

Can mot sketch doc lap cho ESP32-S3 Super Mini de kiem tra ZW101 bang Arduino IDE,
khong phu thuoc firmware TouchPass va khong can thu vien ngoai. Sketch dung giao
thuc goi EF-01 cua ZW101 tren UART 57.600 baud, tu dong thu cac cap GPIO da duoc
firmware TouchPass xac nhan: TX/RX 43/44, 42/41 va 1/3.

## Proposed Changes

### `firmware/zw101_hardware_test/zw101_hardware_test.ino`

- Xac minh mat khau mac dinh bang lenh `VerifyPassword` (`0x13`).
- Doc so mau vân tay bang lenh `TemplateCount` (`0x1D`).
- Theo doi `TouchOut` tai GPIO2 va thu chup anh bang `GetImage` (`0x01`).
- Tu dong fallback sang opcode `GetEnrollImage` (`0x29`) cua bien the ZW101.
- In ket qua, goi TX/RX va ma ACK ra Serial Monitor 115.200 baud.
- Khong gui lenh dang ky, luu, xoa hoac xoa tat ca.

### `firmware/zw101_hardware_test/README.md`

- So do dau noi 3.3 V.
- Cach mo, cau hinh, Verify, Upload va xem Serial Monitor trong Arduino IDE 2.x.
- Bang y nghia ket qua va xu ly loi ket noi pho bien.

### `tests/test_zw101_hardware_test_sketch.py`

- Kiem tra hop dong cau truc sketch, chan UART, baud va cac lenh chi-doc.
- Chan cac opcode ghi/xoa khoi sketch test.

## Verification

- Chay test hop dong rieng, sau do cac test firmware lien quan.
- Chay GPIO safety audit.
- Bien dich sketch bang `arduino-cli` cho `ESP32S3 Dev Module` voi USB CDC.
- Viec xac minh cam bien vat ly can nguoi dung nap sketch va quan sat Serial Monitor.

