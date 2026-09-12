from io import BytesIO
from typing import BinaryIO

import pytesseract
from PIL import Image

from app.marketplace.moderation.text_scanner import scan_text


class ImageContactScanner:
    """Extract visible text from marketplace images and apply text moderation.

    OCR is deliberately kept behind this small service boundary so it can later
    be replaced or supplemented with a vision model without changing marketplace
    services or API contracts.
    """

    def scan(self, file: BinaryIO) -> dict:
        current_position = file.tell()
        file.seek(0)
        data = file.read()
        file.seek(current_position)

        try:
            image = Image.open(BytesIO(data))
            text = pytesseract.image_to_string(image)
        except Exception as exc:
            raise ValueError("Unable to scan the uploaded image for contact information.") from exc

        result = scan_text(text)
        if not result["passed"]:
            result["reason"] = "Contact information detected in marketplace image text."
        return result
