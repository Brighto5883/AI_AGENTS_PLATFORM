export type AgentStatus =
  | "Idle"
  | "Running"
  | "Completed"
  | "Error";

export type AgentResult = {
  method: string; 
  answer: string; 
  document: string; 
  cost: number;
};
