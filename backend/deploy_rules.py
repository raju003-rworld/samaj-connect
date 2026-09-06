"""Deploy Firestore + Storage rules via Firebase Rules REST API using the service account. Run: python deploy_rules.py"""
import json, os, sys, time
from pathlib import Path
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

ROOT = Path(__file__).parent
sa = json.loads((ROOT / "firebase-admin.json").read_text())
project = sa["project_id"]
creds = service_account.Credentials.from_service_account_info(sa, scopes=["https://www.googleapis.com/auth/firebase", "https://www.googleapis.com/auth/cloud-platform"])
s = AuthorizedSession(creds)
BASE = f"https://firebaserules.googleapis.com/v1/projects/{project}"
BUCKET = os.environ.get("FIREBASE_STORAGE_BUCKET", "samaj-connect-6ad91.firebasestorage.app")


def deploy(release_name: str, rules_file: str):
    src = (ROOT.parent / "firebase" / rules_file).read_text()
    r = s.post(f"{BASE}/rulesets", json={"source": {"files": [{"name": rules_file, "content": src}]}})
    r.raise_for_status()
    ruleset = r.json()["name"]
    rel = f"{BASE}/releases/{release_name}"
    r = s.patch(rel, json={"release": {"name": f"projects/{project}/releases/{release_name}", "rulesetName": ruleset}})
    if r.status_code == 404:
        r = s.post(f"{BASE}/releases", json={"name": f"projects/{project}/releases/{release_name}", "rulesetName": ruleset})
    r.raise_for_status()
    print("deployed", release_name, "->", ruleset)


deploy("cloud.firestore", "firestore.rules")
deploy(f"firebase.storage/{BUCKET}", "storage.rules")
