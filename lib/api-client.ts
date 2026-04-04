import createClient from "openapi-fetch";
import type { paths } from "@/types/api-client.d.ts";

const api = createClient<paths>({ baseUrl: "/api" });

export const getXcTasksByCategoryApi = async (category: string) =>
	api.GET("/xc/{category}/tasks", {
		params: {
			path: { category },
		},
	});
