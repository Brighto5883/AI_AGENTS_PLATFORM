import re

CONTACT_PATTERNS = [
    # Kenyan phone numbers
    re.compile(r"(?:0|\+?254)7\d{8}"),
    re.compile(r"07\d{2}[\s\-]?\d{3}[\s\-]?\d{3}"),

    # Email addresses
    re.compile(
        r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}"
    ),

    # Social media handles
    re.compile(r"(?<![\w.+-])@[a-zA-Z0-9_.]{2,}"),

    # WhatsApp / Telegram
    re.compile(
        r"(?i)\b(whatsapp|wa\.me|telegram|t\.me)\b"
        r"\s*:?\s*[\w./]*"
    ),

    # Social platforms
    re.compile(
        r"(?i)\b(snapchat|instagram)\b\s*:?\s*[\w./]*"
    ),

    # Short social-media references
    re.compile(
        r"(?i)\b(ig|insta)\s*[:\/]\s*[\w.]+"
    ),

    # Social URLs
    re.compile(
        r"(?i)(facebook\.com|twitter\.com|x\.com|fb\.com|fb\.me)/\S+"
    ),

    # Three consecutive number words
    re.compile(
        r"(?i)\b"
        r"(zero|one|two|three|four|five|six|seven|eight|nine)"
        r"[\s\-]"
        r"(zero|one|two|three|four|five|six|seven|eight|nine)"
        r"[\s\-]"
        r"(zero|one|two|three|four|five|six|seven|eight|nine)"
        r"\b"
    ),
]


def scan_text(text: str) -> dict:
    """
    Scan marketplace text for contact information.

    This scanner is local and does not make an API request.

    Returns:
        passed:
            True when no contact information is detected.
            False when contact information is detected.

        flagged:
            The detected pieces of contact information.
    """

    flagged_items: list[str] = []

    for pattern in CONTACT_PATTERNS:
        matches = pattern.findall(text)

        for match in matches:
            value = " ".join(match) if isinstance(match, tuple) else match

            if value not in flagged_items:
                flagged_items.append(value)

    if flagged_items:
        return {
            "passed": False,
            "reason": "Contact information detected in listing text.",
            "flagged": flagged_items,
        }

    return {
        "passed": True,
        "reason": "No contact information detected in listing text.",
        "flagged": [],
    }
