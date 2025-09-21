'use client';

import Script from 'next/script';

export default function ExternalScripts() {
  return (
    <>
      {/* Load Tailwind via CDN */}
      <Script
        id="tailwind-cdn"
        src="https://cdn.tailwindcss.com/3.4.10"
        strategy="afterInteractive"
      />

      {/* Configure Tailwind AFTER it's loaded */}
      <Script id="tailwind-config" strategy="afterInteractive">
        {`
          if (window.tailwind) {
            window.tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    slate: {
                      50: "#f8fafc",
                    },
                  },
                },
              },
            };
          }
        `}
      </Script>

      {/* Optional extra UI plugin */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1"
        type="module"
        strategy="afterInteractive"
      />
    </>
  );
}
