// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

          {/* Meta tags */}
          <meta name="description" content="Build, parse, and visually evaluate CRON expressions. Validate syntax across multiple dialects and preview executions." />
          <link rel="canonical" href="https://rutin.namchee.dev/" />
          <meta name="robots" content="index, max-image-preview:large" />
          <meta name="theme-color" content="#FFFFFF" />

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://rutin.namchee.dev/" />
          <meta property="og:title" content="Rutin – Your one stop CRON playground" />
          <meta property="og:description" content="Build, parse, and visually evaluate CRON expressions. Validate syntax across multiple dialects and preview executions." />
          <meta property="og:site_name" content="Rutin" />

          <meta property="og:image" content="https://rutin.namchee.dev/og-image.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Rutin – Build and validate CRON expressions." />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Rutin – Your one stop CRON playground" />
          <meta name="twitter:description" content="Build, parse, and visually evaluate CRON expressions. Validate syntax across multiple dialects and preview executions." />
          <meta name="twitter:image" content="https://rutin.namchee.dev/og-image.png" />

          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
