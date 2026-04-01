import TaskBrevettoCard from "@/components/TaskBrevettoCard";
import TaskBrevetto from "../TaskBrevetto";

export default function XcMontegrappaAdvancedPage() {
	const advancedTasks = TaskBrevetto.filter((task) => task.type === "advanced");
	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/banner-panetun.jpg')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							BREVETTO AVANZATO
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							Brevetto Cross Country Montegrappa
						</h3>
					</div>
				</div>
			</div>
			<section className="px-4 py-20">
				<div className="container mx-auto flex min-h-[310px] flex-col items-center gap-16">
					<div>
						<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
							<div className="block">XC Montegrappa</div>
							<div className="highlight block">BREVETTO AVANZATO</div>
						</h1>

						<div className="py-10">
							<div className="container mx-auto">
								{advancedTasks.map((task) => (
									<TaskBrevettoCard key={task.id} task={task} />
								))}
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
