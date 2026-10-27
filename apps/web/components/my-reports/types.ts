import type { MapReport } from "@/lib/campus";
import type { ReportEvent } from "@/lib/my-reports";

export type ReportPhotos = { once: string[]; sonra: string[]; ek: string[] };

export type MyReportItem = MapReport & { events: ReportEvent[]; photos: ReportPhotos };
