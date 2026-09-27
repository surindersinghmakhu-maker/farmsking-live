import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Google Search Console Verification & SEO Meta Tags */}
        <meta name="google-site-verification" content="cLbkUgC7i1XUv8vvpPcjQP-UuD3FKtdXKH2o9DZik2o" />
        <meta name="description" content="FarmsKing - India's leading Smart Farming & Crop Advisory Platform. AI crop intelligence, disease diagnosis, weather advisory & farmer rewards." />
        <meta name="keywords" content="FarmsKing, Smart Farming, Crop Advisory, Agriculture Doctor, Kisan App, Crop Disease Scan, Reverse Sowing" />
        <meta property="og:title" content="FarmsKing - Smart Farming & Crop Intelligence Platform" />
        <meta property="og:description" content="India's leading Smart Farming & Crop Advisory Platform. Empowering farmers with AI crop intelligence and expert advice." />
        <meta property="og:image" content="https://farmsking.in/farmsking_logo.png" />
        <meta property="og:url" content="https://farmsking.in" />

        {/* App Favicon & Official FarmsKing Logo Icons */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" sizes="192x192" href="/icon.png" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
