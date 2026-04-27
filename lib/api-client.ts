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

export const validateSubmissionApi = async (submissionId: string) =>
	api.POST("/xc/submissions/{id}/validate", {
		params: { path: { id: submissionId } },
	});

export const deleteSubmissionApi = async (submissionId: string) =>
	api.DELETE("/xc/submissions/{id}", {
		params: { path: { id: submissionId } },
	});
