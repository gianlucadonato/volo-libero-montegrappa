import { Button } from "./ui/button";

export default function PrimaryButton({
	children,
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<Button
			{...props}
			className="rounded-lg bg-linear-to-r from-amber-500 to-amber-600 px-6 font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700 hover:text-white disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:hover:scale-100"
		>
			{children}
		</Button>
	);
}
