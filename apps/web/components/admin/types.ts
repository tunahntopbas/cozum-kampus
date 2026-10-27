import type { AdminReport } from "@/lib/admin";
import type { MapBuilding, MapReport } from "@/lib/campus";

export type PanelReport = MapReport & AdminReport & { isHidden?: boolean };

export type AdminData = {
  userId: string;
  reports: PanelReport[];
  buildings: MapBuilding[];
  units: { id: number; name: string }[];
  unverified: number[];
};
