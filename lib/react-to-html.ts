"use client"

import { renderToStaticMarkup } from 'react-dom/server';

export function reactToHtml(element: React.ReactElement): string {
    const bodyHtml = renderToStaticMarkup(element);
    
    // Wrap with full HTML doc so styles/fonts load correctly
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <!-- Add your global CSS / Tailwind CDN / font links here -->
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: sans-serif; }
            </style>
        </head>
        <body>
            ${bodyHtml}
        </body>
        </html>
    `;
}