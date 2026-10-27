import type { AdminReport } from "@/lib/admin";
import type { MapBuilding, MapReport } from "@/lib/campus";

export type PanelReport = MapReport & AdminReport;

export type AdminData = {
  userId: string;
  reports: PanelReport[];
  buildings: MapBuilding[];
  units: { id: number; name: string }[];
  unverified: number[];
};
