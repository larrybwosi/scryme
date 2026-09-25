import os
import json
import urllib.request
import urllib.error

def get_api_url() -> str:
    return os.getenv("SCRYME_API_URL", "http://localhost:3000").rstrip("/")

def get_v3_headers(org_slug: str = "default") -> dict:
    api_key = os.getenv("SCRYME_V3_API_KEY", "")
    return {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "x-org-slug": org_slug,
    }

def make_v3_request(endpoint: str, method: str = "GET", data: dict = None, org_slug: str = "default") -> dict:
    url = f"{get_api_url()}{endpoint}"
    headers = get_v3_headers(org_slug)

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = response.read().decode("utf-8")
            return json.loads(res_data)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8") if e.fp else str(e)
        return {"success": False, "error": f"HTTP {e.code}: {err_msg}"}
    except Exception as e:
        return {"success": False, "error": str(e)}
