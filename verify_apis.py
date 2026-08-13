import urllib.request
import json

req = urllib.request.Request("http://127.0.0.1:8787/api/status")
with urllib.request.urlopen(req) as response:
    status_data = json.loads(response.read().decode("utf-8"))
    csrf_token = status_data.get("csrf_token")
    print(f"STATUS OK: Device connected: {status_data['device']['connected']}")
    print(f"CSRF Token: {csrf_token}")

req_logs = urllib.request.Request("http://127.0.0.1:8787/api/logs")
with urllib.request.urlopen(req_logs) as response:
    logs_data = json.loads(response.read().decode("utf-8"))
    print(f"LOGS OK: Total logs count: {len(logs_data['logs'])}")
    for log in logs_data['logs']:
        print(f"  [{log['timestamp']}] [{log['tag']}] {log['message']}")

# Test POST /api/test
test_body = json.dumps({"action": "type_test"}).encode("utf-8")
req_test = urllib.request.Request(
    "http://127.0.0.1:8787/api/test",
    data=test_body,
    headers={"Content-Type": "application/json", "X-CSRF-Token": csrf_token},
    method="POST"
)
with urllib.request.urlopen(req_test) as response:
    test_res = json.loads(response.read().decode("utf-8"))
    print(f"TEST API OK: Response: {test_res}")
