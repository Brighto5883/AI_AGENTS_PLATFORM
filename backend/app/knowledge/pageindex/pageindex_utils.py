import os
import hashlib, time
from pathlib import Path
import json
from pageindex import PageIndexClient
from dotenv import load_dotenv

load_dotenv()

PAGEINDEX_API_KEY = os.getenv('PAGEINDEX_API_KEY')
pi_client = PageIndexClient(api_key=PAGEINDEX_API_KEY)

from app.core.paths import PAGEINDEX_STATE_FILE
STATE_FILE = PAGEINDEX_STATE_FILE


def compute_sha256(file_path: str) -> str:
    """Compute the SHA256 hash of a PDF."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha.update(chunk)
    return sha.hexdigest()


def get_document_id(pdf_path: str) -> str:
    """
    Returns the PageIndex document_id.
    If the PDF has already been uploaded, reuse its document_id.
    Otherwise upload it and cache the returned document_id.
    """
    pdf_hash = compute_sha256(pdf_path)

    # -----------------------------
    # Load upload cache
    # -----------------------------
    if STATE_FILE.exists() and STATE_FILE.stat().st_size > 0:
        with open(STATE_FILE, "r") as f:
            state = json.load(f)
    else:
        state = {}

    # -----------------------------
    # Already uploaded?
    # -----------------------------
    if pdf_hash in state:
        print(f"✅ Using cached PageIndex document: {Path(pdf_path).name}")
        return state[pdf_hash]["document_id"]

    # -----------------------------
    # Upload to PageIndex
    # -----------------------------
    print(f"⬆ Uploading {Path(pdf_path).name}...")
    document = pi_client.submit_document(pdf_path)
    print("DEBUG - PageIndex response:", document) 
    document_id = document["document_id"]

    # -----------------------------
    # Save upload information
    # -----------------------------
    state[pdf_hash] = {
        "document_id": document_id,
        "pdf_path": str(Path(pdf_path).resolve()),
        "uploaded_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)

    print("✅ Upload complete.")
    return document_id