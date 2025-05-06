import { stringify, withDefaults } from "../../../../utils.js";

const defaultProviders = [
  '$$createProvider(WagmiProvider, { config: wagmiConfig })$$',
  '$$createProvider(QueryClientProvider, { client: queryClient })$$',
  '$$createProvider(ProgressBar, { height: "3px", color: "#2299dd" })$$',
  '$$createProvider(RainbowKitProvider, { avatar: BlockieAvatar, theme: mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme() })$$',
]

const contents = ({ preConfigContent, globalClassNames, extraProviders, overrideProviders }) => {
  const providers = overrideProviders?.[0].length > 0 ? overrideProviders[0] : [...defaultProviders, ...(extraProviders[0] || [])]

  return `"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { composeProviders, createProvider } from "~~/utils/scaffold-eth/composeProviders";
${preConfigContent[0] || ''}

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();

  return (
    <>
      <div className={\`flex flex-col min-h-screen ${globalClassNames}\`}>
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const providers = ${stringify(providers)};

  const ComposedProviders = composeProviders(providers);

  return (
    <ComposedProviders>
      <ScaffoldEthApp>{children}</ScaffoldEthApp>
    </ComposedProviders>
  );
};`;
};

export default withDefaults(contents, {
  preConfigContent: "",
  globalClassNames: "",
  extraProviders: [],
  overrideProviders: [],
});
