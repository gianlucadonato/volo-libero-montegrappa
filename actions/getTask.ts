import TaskBrevetto from "@/app/(public)/xc-montegrappa/TaskBrevetto";

export default async function getTask(id: string) {
	const task = TaskBrevetto.find((task) => task.id === Number(id));
	return task;
}
