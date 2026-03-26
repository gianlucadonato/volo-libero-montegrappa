import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import ModalProvider from "@/components/modals/providers";
import { TailwindIndicator } from "@/components/TailwindIndicator";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { constructMetadata } from "@/config/site";
import { fontJetBrainsMono, fontMontserrat } from "@/fonts";
import { cn } from "@/lib/utils";
import "./globals.css";
interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata = constructMetadata();

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <script
          defer
          src="https://analytics.vololiberomontegrappa.it/script.js"
          data-website-id="f7321e50-a1c5-42ae-ac34-4349667e85b1"
        ></script>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontMontserrat.variable,
          fontJetBrainsMono.variable,
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={0}>
              <ModalProvider>{children}</ModalProvider>
            </TooltipProvider>
            <Toaster
              toastOptions={{ style: { marginTop: "60px" } }}
              position="top-right"
              richColors
              closeButton
            />
            <TailwindIndicator />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
