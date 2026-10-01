import * as z from "zod";

export const LiveTrackPointSchema = z.object({
	ts: z.number().describe("Epoch milliseconds"),
	lat: z.number(),
	lon: z.number(),
	alt: z.number().describe("Altitude in metres"),
	spd: z.number().describe("Ground speed in km/h"),
	hdg: z.number().describe("Heading in degrees"),
	vz: z.number().describe("Vertical speed in m/s"),
});

export const LiveAircraftSchema = LiveTrackPointSchema.extend({
	id: z.string(),
	historyKey: z.string(),
	label: z.string(),
	name: z.string().nullable(),
	member: z.boolean(),
	source: z.string(),
});

export const LivePositionsResponseSchema = z.object({
	aircraft: z.array(LiveAircraftSchema),
});

export const LiveTrackQuerySchema = z.object({
	key: z
		.string()
		.regex(/^[A-Za-z0-9-]{2,16}$/)
		.describe("Callsign the track is recorded under"),
});

export const LiveTrackResponseSchema = z.object({
	points: z.array(LiveTrackPointSchema),
});

export const LiveMemberTrackSchema = z.object({
	id: z.string(),
	historyKey: z.string(),
	name: z.string(),
	label: z.string(),
	points: z.array(LiveTrackPointSchema),
});

export const LiveMemberTracksResponseSchema = z.object({
	members: z.array(LiveMemberTrackSchema),
});

export const LiveSosSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	keys: z.array(z.string()),
	lat: z.number(),
	lon: z.number(),
	alt: z.number().nullable(),
	ts: z.number().nullable(),
	trail: z.array(z.tuple([z.number(), z.number()])),
});

export const LiveSosResponseSchema = z.object({
	sos: z.array(LiveSosSchema),
});
