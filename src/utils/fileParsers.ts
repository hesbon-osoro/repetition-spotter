// src/utils/fileParsers.ts
// Utilities to extract plain text from various file types in the browser

export type ParseProgress = { phase: string; progress?: number };

export async function parseFile(
  file: File,
  onProgress?: (p: ParseProgress) => void
): Promise<string> {
  const name = file.name.toLowerCase();
  const ext = (name.split('.').pop() || '').trim();

  // Quick paths: direct text-like types
  if (
    file.type.startsWith('text/') ||
    ['txt', 'md', 'csv', 'json', 'html', 'htm', 'rtf'].includes(ext)
  ) {
    onProgress?.({ phase: 'Reading text' });
    const raw = await file.text();
    // For HTML, preserve formatting by returning sanitized HTML
    if (ext === 'html' || ext === 'htm') return await sanitizeHtml(raw);
    if (ext === 'md') {
      try {
        onProgress?.({ phase: 'Rendering Markdown' });
        const { marked } = await import('marked');
        const html = marked.parse(raw);
        return await sanitizeHtml(String(html));
      } catch {
        return raw;
      }
    }
    if (ext === 'json') {
      try {
        const pretty = JSON.stringify(JSON.parse(raw), null, 2);
        const escaped = pretty
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<pre>${escaped}</pre>`;
      } catch {
        return `<pre>${raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
      }
    }
    if (ext === 'csv') {
      // Basic CSV to HTML table conversion (no external deps)
      const rows = raw.split(/\r?\n/).map(r => r.split(','));
      const table =
        `\n<table class="table-auto border-collapse w-full">` +
        rows
          .map(
            (cells, i) =>
              `<tr>${cells
                .map(
                  c =>
                    `<${i === 0 ? 'th' : 'td'} class="border px-2 py-1">${escapeHtml(c)}</${i === 0 ? 'th' : 'td'}>`
                )
                .join('')}</tr>`
          )
          .join('') +
        `</table>`;
      return await sanitizeHtml(table);
    }
    if (ext === 'rtf') return rtfToText(raw);
    return raw;
  }

  onProgress?.({ phase: 'Loading file' });
  // Use ArrayBuffer for binary formats
  const buffer = await file.arrayBuffer();

  if (ext === 'docx') {
    try {
      onProgress?.({ phase: 'Parsing DOCX' });
      const mammoth = await import('mammoth');
      const { value: html } = await mammoth.convertToHtml({
        arrayBuffer: buffer,
      });
      // Return sanitized HTML so the editor can render formatting
      return await sanitizeHtml(html || '');
    } catch (e) {
      console.warn('DOCX parse failed, falling back to text()', e);
      return await file.text();
    }
  }

  if (ext === 'pdf') {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      // Configure worker to suppress warnings in some bundlers
      try {
        if (typeof window !== 'undefined') {
          const { GlobalWorkerOptions, version } =
            (pdfjsLib as unknown as {
              GlobalWorkerOptions?: { workerSrc?: string };
              version?: string;
            }) || {};
          if (GlobalWorkerOptions && !GlobalWorkerOptions.workerSrc) {
            GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version ?? '4.0.379'}/pdf.worker.min.js`;
          }
        }
      } catch (e) {
        // Non-fatal, continue without explicit worker config
        console.warn('PDF worker config failed, falling back to text()', e);
      }

      onProgress?.({ phase: 'Parsing PDF', progress: 0 });
      const loadingTask = (pdfjsLib as any).getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const strings = content.items
          // item comes from pdfjs; its exact type is version-dependent
          .map((item: unknown) => {
            const it = item as { str?: string; item?: { str?: string } };
            return typeof it.str === 'string' ? it.str : it.item?.str;
          })
          .filter(Boolean);
        fullText += strings.join(' ') + '\n\n';
        onProgress?.({
          phase: 'Parsing PDF',
          progress: Math.min(1, pageNumber / pdf.numPages),
        });
      }
      return fullText.trim();
    } catch (e) {
      console.warn('PDF parse failed, falling back to text()', e);
      return await file.text();
    }
  }

  if (ext === 'xlsx' || ext === 'xls') {
    try {
      onProgress?.({ phase: 'Parsing spreadsheet' });
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buffer, { type: 'array' });
      const parts: string[] = [];
      wb.SheetNames.forEach((name: string) => {
        const ws = wb.Sheets[name];
        if (ws) {
          const html = XLSX.utils.sheet_to_html(ws);
          if (html && html.trim()) {
            parts.push(`<h3>${escapeHtml(name)}</h3>${html}`);
          }
        }
      });
      return await sanitizeHtml(parts.join('\n'));
    } catch (e) {
      console.warn('XLS/XLSX parse failed, falling back to text()', e);
      return await file.text();
    }
  }

  if (ext === 'doc') {
    // Legacy .doc is not reliably parsable in-browser
    // Attempt to read as text; if it fails, surface a helpful message
    try {
      onProgress?.({ phase: 'Attempting to read legacy .doc' });
      return await file.text();
    } catch {
      return 'Unsupported legacy .doc format. Please convert to DOCX or PDF and try again.';
    }
  }

  // Fallback: try to read as text
  try {
    onProgress?.({ phase: 'Reading as text' });
    return await file.text();
  } catch {
    return 'Unable to extract text from this file type. Please provide a text-based document.';
  }

  // Basic HTML sanitizer: removes scripts/styles, event handlers, javascript: URLs.
  // Note: For production-grade sanitization, consider DOMPurify. This regex-based
  // approach is intentionally conservative but keeps most formatting tags.
  async function getDOMPurify() {
    if (typeof window === 'undefined') return null;
    const mod: unknown = await import('dompurify');
    const dp = (mod as any).default || (mod as any);
    // If default export already has sanitize (browser builds), use it.
    if (dp && typeof dp.sanitize === 'function') {
      return dp.sanitize.bind(dp) as (dirty: string, cfg?: any) => string;
    }
    // Otherwise, default is a factory: call with window to get instance
    const instance = typeof dp === 'function' ? dp(window) : null;
    if (instance && typeof instance.sanitize === 'function') {
      return instance.sanitize.bind(instance) as (
        dirty: string,
        cfg?: unknown
      ) => string;
    }
    return null;
  }

  async function sanitizeHtml(html: string): Promise<string> {
    try {
      const sanitize = await getDOMPurify();
      if (!sanitize) return html; // SSR fallback (shouldn't happen for file uploads)
      return sanitize(html, {
        USE_PROFILES: { html: true },
        ALLOWED_ATTR: [
          'href',
          'src',
          'alt',
          'title',
          'class',
          'style',
          'colspan',
          'rowspan',
          'align',
        ],
        // prettier-ignore
        ALLOWED_TAGS: [
        'a','b','i','u','s','em','strong','blockquote','code','pre','br','p','div','span',
        'ul','ol','li','h1','h2','h3','h4','h5','h6','table','thead','tbody','tfoot','tr','th','td',
        'img'
      ],
        FORBID_ATTR: [/^on/i],
        FORBID_TAGS: ['script', 'style'],
        ALLOW_DATA_ATTR: false,
        ADD_TAGS: [],
      });
    } catch {
      return html;
    }
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Simple RTF to text conversion for common cases (not perfect but works for basic docs)
  function rtfToText(rtf: string): string {
    // Remove RTF groups and control words
    const text = rtf
      .replace(/\\par[d]?/g, '\n')
      .replace(/\\tab/g, '\t')
      .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16));
        } catch {
          return '';
        }
      })
      .replace(/\\[a-zA-Z]+-?\d*\s?/g, '') // control words
      .replace(/[{}]/g, '') // group braces
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  }
}
