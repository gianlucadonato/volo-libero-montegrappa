import {
	Caveat,
	JetBrains_Mono,
	Montserrat,
	Noto_Sans_Mono,
} from "next/font/google";

export const fontJetBrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
});

export const fontCaveat = Caveat({
	subsets: ["latin"],
	variable: "--font-caveat",
});

export const fontMontserrat = Montserrat({
	subsets: ["latin"],
	style: ["normal", "italic"],
	variable: "--font-montserrat",
	weight: ["500", "600", "700", "800", "900"],
	preload: true,
});

export const fontNotoSansMono = Noto_Sans_Mono({
	subsets: ["latin"],
	variable: "--font-noto-sans-mono",
});
