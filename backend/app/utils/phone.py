import re

PHONE_PATTERN = re.compile(r"^254(7|1)\d{8}$")


def normalize_kenyan_phone_number(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if digits.startswith("0"):
        digits = "254" + digits[1:]
    elif digits.startswith("7") or digits.startswith("1"):
        digits = "254" + digits
    if not PHONE_PATTERN.match(digits):
        raise ValueError("Enter a valid Kenyan phone number, e.g. 0712345678")
    return digits