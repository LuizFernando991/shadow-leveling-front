export interface Exercise {
  id: string;
  name: string;
  type: "repetition" | "time";
  unit: string;
  created_at: string;
}
