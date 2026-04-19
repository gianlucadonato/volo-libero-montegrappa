import createClient from "openapi-fetch";
import type { paths } from "@/types/api-client.d.ts";

const api = createClient<paths>({ baseUrl: "/api" });

export const getXcTasksByCategoryApi = async (category: string) =>
	api.GET("/xc/{category}/tasks", {
		params: {
			path: { category },
		},
	});

export const createXcEnrollmentApi = async () => api.POST("/xc/enroll", {});

export const uploadXcTaskTrackApi = async (taskId: string, file: File) => {
	const formData = new FormData();
	formData.append("file", file);

	return api.POST("/xc/tasks/{id}/upload", {
		params: {
			path: { id: taskId },
		},
		body: formData,
		bodySerializer: (body) => body,
	});
};

export interface ValidationWaypoint {
	index: number;
	name: string;
	type: string;
	reached: boolean;
	closestDistanceM: number;
	radiusM: number;
	closestFixIndex: number | null;
}

export interface ValidationResult {
	submissionId: string;
	status: string;
	valid: boolean;
	summary: string;
	pointsAwarded: number;
	waypoints: ValidationWaypoint[];
}

export const validateSubmissionApi = async (
	submissionId: string,
): Promise<ValidationResult> => {
	const res = await fetch(`/api/xc/submissions/${submissionId}/validate`, {
		method: "POST",
	});
	if (!res.ok) {
		const err = await res.json().catch(() => null);
		throw new Error(err?.message ?? "Validation failed");
	}
	return res.json();
};
