export function verifyHtml(html: string): boolean {
    if (!html || typeof html !== 'string') return false;

    // 1. Security: Check for malicious content
    const maliciousPatterns = [
        /<script\b[^>]*>[\s\S]*?(?:<\/script\s*>|$)/gi,
        /<(?:iframe|object|embed)\b[^>]*>/gi,
        /\bon[\w-]+\s*=\s*(?:['"][^'"]*['"]|[^\s>]+)/gi,
        /(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi,
        /\bsrcdoc\s*=/gi,
    ];

    for (const pattern of maliciousPatterns) {
        if (pattern.test(html)) {
            return false;
        }
    }

    // 2. Table Format Check: Ensure it's a valid table-based layout
    // Minimal requirement: contains <table>, <tr>, and <td> tags
    const hasTable = /<table\b[^>]*>/i.test(html);
    const hasTr = /<tr\b[^>]*>/i.test(html);
    const hasTd = /<td\b[^>]*>/i.test(html);

    if (!hasTable || !hasTr || !hasTd) {
        return false;
    }

    // 3. General HTML Sanity: Ensure it contains tags and not just plain text
    if (!/<[a-z][\s\S]*>/i.test(html)) {
        return false;
    }

    return true;
}