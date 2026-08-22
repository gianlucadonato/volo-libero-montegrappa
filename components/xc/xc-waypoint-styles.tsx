import { Flag, MountainSnow, Navigation, Route, Target } from "lucide-react";
import type React from "react";

export const WAYPOINT_TYPE_ICON: Record<string, React.ReactNode> = {
	takeoff: <MountainSnow className="size-4 text-amber-500" />,
	sss: <Navigation className="size-4 text-green-500" />,
	ess: <Flag className="size-4 text-blue-500" />,
	goal: <Target className="size-4 text-red-500" />,
	turnpoint: <Route className="size-4 text-purple-500" />,
};

export const WAYPOINT_TYPE_COLOR: Record<string, string> = {
	takeoff: "bg-amber-500/10 text-amber-600 border-amber-500/30",
	sss: "bg-green-500/10 text-green-600 border-green-500/30",
	ess: "bg-blue-500/10 text-blue-600 border-blue-500/30",
	goal: "bg-red-500/10 text-red-600 border-red-500/30",
	turnpoint: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};
