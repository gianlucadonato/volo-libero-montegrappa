import { AppSidebar } from "@/components/layout/AppSidebar";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider defaultOpen={false}>
			<SidebarInset className="relative w-full">
				<header className="fixed inset-x-0 top-0 z-100 flex h-18 shrink-0 items-center gap-2 border-b bg-white px-4">
					<Navbar />
					<SidebarTrigger className="mr-1 ml-auto rotate-180" />
				</header>
				<main className="w-full pt-18">{children}</main>
				<Footer />
			</SidebarInset>
			<AppSidebar side="right" />
		</SidebarProvider>
	);
}
