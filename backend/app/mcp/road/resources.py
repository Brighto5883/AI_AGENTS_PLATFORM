from pathlib import Path

from app.core.paths import RAW_DATA_DIR

def get_manuals():

    manuals = []

    for file in RAW_DATA_DIR.rglob("*.pdf"):
        manuals.append(
            {
                "title": file.stem,
                "file_name": file.name,
                "type": "pdf",
                "description": (
                    "Kenya Road Design Manual document "
                    "available for retrieval."
                ),
                "uri": f"manual://{file.stem}",
            }
        )

    return manuals