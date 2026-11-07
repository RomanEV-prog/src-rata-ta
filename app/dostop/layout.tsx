import type { Metadata, Viewport } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Dostop — ŠRC Ra-Ta-Ta",
  description: "Odpiranje vhodnih vrat ŠRC Ra-Ta-Ta",
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ŠRC Dostop",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff3000",
};

export default function DostopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('${basePath}/sw.js');`,
        }}
      />
      {children}
    </>
  );
}
