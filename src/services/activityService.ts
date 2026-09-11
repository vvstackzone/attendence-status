import api from "./api";
import type { Activity } from "../types";

export async function getActivities(): Promise<Activity[]> {
  const { data } = await api.get<Activity[]>("/activities");
  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function logActivity(
  userId: string,
  userName: string,
  action: string,
  description: string,
  relatedRecord: string | null = null
): Promise<Activity> {
  const { data } = await api.post<Activity>("/activities", {
    userId,
    userName,
    action,
    description,
    relatedRecord,
    timestamp: new Date().toISOString(),
  });
  return data;
}
