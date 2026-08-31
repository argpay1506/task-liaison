export type Ticket = {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'Critical';
  status: 'Open' | 'Market' | 'Assigned';
  assignee: string | null;
  bountyPoints: number;
};

export const initialTickets: Ticket[] = [
  {
    id: "INC-101",
    title: "Cloud SQL production database CPU spike at 98%",
    severity: "Critical",
    status: "Open",
    assignee: null,
    bountyPoints: 0,
  },
  {
    id: "INC-102",
    title: "GKE Node Pool auto-scaling failure in us-central1",
    severity: "Critical",
    status: "Assigned",
    assignee: "Alex",
    bountyPoints: 0,
  },
  {
    id: "INC-103",
    title: "Update IAM policies for newly provisioned service accounts",
    severity: "Low",
    status: "Assigned",
    assignee: "Alex",
    bountyPoints: 0,
  }
];