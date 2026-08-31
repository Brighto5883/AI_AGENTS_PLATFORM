from pathlib import Path

# backend/
BACKEND_DIR = Path(__file__).resolve().parents[2]

# app/
APP_DIR = BACKEND_DIR / "app"

#data
DATA_DIR = BACKEND_DIR / 'data'

# data/
RAW_DATA_DIR = BACKEND_DIR / "data"/"raw"

# faiss_store/
FAISS_DIR = BACKEND_DIR / "faiss_store"

# pageindex_state.json
PAGEINDEX_STATE_FILE = BACKEND_DIR / "pageindex_state.json"

# servers.json file
CONFIG_PATH = BACKEND_DIR/'app'/'config'/'servers.json'

#Temporary uploaded documents
TEMP_DOCUMENTS_DIR = DATA_DIR / 'temporary_documents'

#Marketplace media
MARKETPLACE_MEDIA_DIR = DATA_DIR / "marketplace_media"