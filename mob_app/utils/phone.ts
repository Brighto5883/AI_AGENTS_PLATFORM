export function validatePhone(value: string): string | null {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "Phone number is required.";
    if (!/^(0|254)?(7|1)\d{8}$/.test(digits)) {
      return "Enter a valid phone number, e.g. 0712345678";
    }
    return null;
  }
  
  export function normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("0")) return "254" + digits.slice(1);
    if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
    return digits;
  }

  export function buildWhatsAppUrl(phone: string, message: string): string {
    const normalized = normalizePhone(phone);
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  }

  export function buildCallUrl(phone: string): string {
    return `tel:+${normalizePhone(phone)}`;
  }

  export function buildSmsUrl(phone: string): string {
    return `sms:+${normalizePhone(phone)}`;
  }