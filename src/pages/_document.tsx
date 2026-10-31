// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';
import { themeScript } from '@/hooks/usePreferences';

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/* Sets the theme class before first paint, so dark mode never flashes */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#f5f7fb"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#0b0f17"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon/favicon-96x96.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/favicon/web-app-manifest-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/favicon/web-app-manifest-512x512.png"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
