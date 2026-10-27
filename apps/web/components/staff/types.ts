import type { MapReport } from "@/lib/campus";

export type StaffJob = MapReport & {
  place: string;
  buildingLat: number | null;
  buildingLng: number | null;
  beforePath: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
};
