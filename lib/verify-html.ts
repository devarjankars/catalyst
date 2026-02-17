export function verifyHtml(html: string): boolean {
    if (!html || typeof html !== 'string') return false;

    // 1. Security: Check for malicious content
    const maliciousPatterns = [
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
        /<object\b[^>]*>[\s\S]*?<\/object>/gi,
        /<embed\b[^>]*>[\s\S]*?<\/embed>/gi,
        /on\w+\s*=\s*['"][^'"]*['"]/gi, // inline event handlers
        /javascript:/gi
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