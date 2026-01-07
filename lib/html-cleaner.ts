/**
 * Cleans an HTML string by removing:
 * - Unnecessary line breaks and whitespace
 * - Empty attributes (e.g., class="", style="", id="")
 * - Extra spaces between tags
 * - Leading/trailing whitespace
 * 
 * PRESERVES:
 * - Conditional comments (<!--[if !mso]><!-->, <!--<![endif]-->, etc.)
 * - MSO-specific tags for email client compatibility
 * 
 * @param html - The HTML string to clean
 * @returns The cleaned HTML string
 */
export function cleanHtmlString(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    let cleaned = html;

    // Step 0: Preserve conditional comments by temporarily replacing them with placeholders
    const conditionalComments: string[] = [];
    const commentPlaceholder = '___CONDITIONAL_COMMENT_';

    // Match all conditional comments including:
    // <!--[if mso]>, <!--[if !mso]><!-->, <!--<![endif]-->, etc.
    cleaned = cleaned.replace(/<!--\[if[^\]]*\]><!-->|<!--\[if[^\]]*\]>|<!--<!\[endif\]-->|<!\[endif\]-->/g, (match) => {
        const index = conditionalComments.length;
        conditionalComments.push(match);
        return `${commentPlaceholder}${index}___`;
    });

    // Step 1: Remove line breaks and normalize whitespace
    cleaned = cleaned
        .replace(/\r\n/g, ' ')           // Replace Windows line breaks with space
        .replace(/\n/g, ' ')             // Replace Unix line breaks with space
        .replace(/\r/g, ' ')             // Replace Mac line breaks with space
        .replace(/\t/g, ' ')             // Replace tabs with space
        .replace(/\s{2,}/g, ' ');        // Replace multiple spaces with single space

    // Step 2: Remove empty attributes
    // Matches attributes like: class="", style="", id="", data-*="", etc.
    cleaned = cleaned.replace(/\s+[\w-]+=""\s*/g, ' ');
    cleaned = cleaned.replace(/\s+[\w-]+='\s*'\s*/g, ' ');

    // Step 3: Remove whitespace between tags (but preserve space in text content and around placeholders)
    cleaned = cleaned.replace(/>\s+</g, '><');

    // Step 4: Remove leading/trailing whitespace from the entire string
    cleaned = cleaned.trim();

    // Step 5: Normalize spaces around = in attributes
    cleaned = cleaned.replace(/\s*=\s*/g, '=');

    // Step 6: Remove empty tags (optional - be careful with this)
    // This removes tags that have no content and no attributes
    // Example: <div></div>, <span></span>
    // cleaned = cleaned.replace(/<(\w+)(\s*)><\/\1>/g, '');

    // Step 7: Clean up any remaining multiple spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    // Step 8: Restore conditional comments
    cleaned = cleaned.replace(/___CONDITIONAL_COMMENT_(\d+)___/g, (match, index) => {
        return conditionalComments[parseInt(index)];
    });

    return cleaned;
}
