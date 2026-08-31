'use client';

import { useState, useEffect, useRef } from 'react';

// Upgraded Ticket Type
export type Ticket = {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'Critical';
  status: 'Open' | 'Market' | 'Assigned';
  assignee: string | null;
  bountyPoints: number;
  blastRadius?: string[];
  remediationScript?: string;
};

const initialTickets: Ticket[] = [
  { id: "INC-101", title: "Cloud SQL production database CPU spike at 98%", severity: "Critical", status: "Open", assignee: null, bountyPoints: 0 },
  { id: "INC-102", title: "GKE Node Pool auto-scaling failure in us-central1", severity: "Critical", status: "Assigned", assignee: "Alex", bountyPoints: 0 },
  { id: "INC-103", title: "Update IAM policies for newly provisioned service accounts", severity: "Low", status: "Assigned", assignee: "Alex", bountyPoints: 0 }
];

export default function TaskLiaison() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const isRegistered = useRef(false);

  useEffect(() => {
    if (isRegistered.current) return; 
    const modelContext = (document as any).modelContext;
    
    if (modelContext) {
      isRegistered.current = true; 
      
      // TOOL 1: The Bounty Poster
      modelContext.registerTool({
        name: "post_bounty_to_market",
        description: "Moves a critical ticket to the open market and assigns a bounty point value.",
        inputSchema: {
          type: "object",
          properties: {
            ticketId: { type: "string" },
            bountyPoints: { type: "number" }
          },
          required: ["ticketId", "bountyPoints"]
        },
        execute: async (input: { ticketId: string; bountyPoints: number }) => {
          setTickets(prev => prev.map(t => t.id === input.ticketId ? { ...t, status: 'Market', bountyPoints: input.bountyPoints } : t));
          return { content: [{ type: "text", text: `Success: Ticket ${input.ticketId} on market for ${input.bountyPoints} pts.` }] };
        }
      });

      // TOOL 2: The AI Negotiator
      modelContext.registerTool({
        name: "propose_ticket_swap",
        description: "Assigns a critical ticket to an engineer and moves a low-priority ticket back to the open queue.",
        inputSchema: {
          type: "object",
          properties: {
            engineerName: { type: "string" },
            ticketToAssign: { type: "string" },
            ticketToRemove: { type: "string" }
          },
          required: ["engineerName", "ticketToAssign", "ticketToRemove"]
        },
        execute: async (input: { engineerName: string; ticketToAssign: string; ticketToRemove: string }) => {
          setTickets(prev => prev.map(t => {
            if (t.id === input.ticketToAssign) return { ...t, status: 'Assigned', assignee: input.engineerName, bountyPoints: 0 };
            if (t.id === input.ticketToRemove) return { ...t, status: 'Open', assignee: null };
            return t;
          }));
          return { content: [{ type: "text", text: `Assigned ${input.ticketToAssign} to ${input.engineerName}. Removed ${input.ticketToRemove}.` }] };
        }
      });

      // TOOL 3: Blast Radius Analyzer (NEW)
      modelContext.registerTool({
        name: "analyze_blast_radius",
        description: "Analyzes a ticket and renders the downstream services that will be impacted if not resolved.",
        inputSchema: {
          type: "object",
          properties: {
            ticketId: { type: "string" },
            impactedServices: { 
              type: "array", 
              items: { type: "string" },
              description: "List of services that will fail (e.g., ['Auth Service', 'Payment Gateway'])"
            }
          },
          required: ["ticketId", "impactedServices"]
        },
        execute: async (input: { ticketId: string; impactedServices: string[] }) => {
          setTickets(prev => prev.map(t => t.id === input.ticketId ? { ...t, blastRadius: input.impactedServices } : t));
          return { content: [{ type: "text", text: `Blast radius updated for ${input.ticketId}.` }] };
        }
      });

      // TOOL 4: Stage Remediation Script (NEW)
      modelContext.registerTool({
        name: "stage_remediation_script",
        description: "Drafts a shell, Terraform, or workflow patch and stages it in the UI for human review.",
        inputSchema: {
          type: "object",
          properties: {
            ticketId: { type: "string" },
            scriptContent: { type: "string", description: "The raw code or command to fix the issue." }
          },
          required: ["ticketId", "scriptContent"]
        },
        execute: async (input: { ticketId: string; scriptContent: string }) => {
          setTickets(prev => prev.map(t => t.id === input.ticketId ? { ...t, remediationScript: input.scriptContent } : t));
          return { content: [{ type: "text", text: `Remediation script staged for ${input.ticketId}. Awaiting human approval.` }] };
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-gray-50 text-gray-900">
      
      {/* LEFT: Manager Command Center */}
      <div className="w-1/2 p-8 border-r border-gray-300 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Task-Liaison: Command Center (Rahman)</h1>
        <div className="space-y-6">
          {tickets.filter(t => t.status === 'Open').map(ticket => (
            <div key={ticket.id} className="p-4 bg-white shadow rounded border-l-4 border-red-500">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{ticket.title}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">ID: {ticket.id} | Severity: {ticket.severity}</p>
              
              {/* NEW: Blast Radius Visualizer */}
              {ticket.blastRadius && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded">
                  <p className="text-xs font-bold text-red-800 mb-1">⚠️ CASCADING IMPACT DETECTED:</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.blastRadius.map(service => (
                      <span key={service} className="bg-red-200 text-red-900 text-xs px-2 py-1 rounded">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Remediation Sandbox */}
              {ticket.remediationScript && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-blue-800 mb-1">🤖 AI STAGED REMEDIATION (Awaiting Approval):</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                    {ticket.remediationScript}
                  </pre>
                  <button className="mt-2 w-full bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700">
                    Approve & Execute Patch
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Engineer View (Alex) */}
      <div className="w-1/2 p-8 bg-gray-100 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Engineer View: Alex</h1>
        
        <h2 className="text-lg font-semibold mb-2">Active Queue</h2>
        <div className="space-y-4 mb-8">
          {tickets.filter(t => t.assignee === 'Alex').map(ticket => (
            <div key={ticket.id} className="p-4 bg-white shadow rounded">
              <h3 className="font-semibold">{ticket.title}</h3>
              <p className="text-xs text-gray-400 mt-2">ID: {ticket.id} | Severity: {ticket.severity}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-2 text-green-700">Open Bounty Market</h2>
        <div className="space-y-4">
          {tickets.filter(t => t.status === 'Market').map(ticket => (
            <div key={ticket.id} className="p-4 bg-green-50 shadow rounded border border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-green-900">{ticket.title}</h3>
                  <p className="text-xs text-green-700 mt-1">ID: {ticket.id}</p>
                </div>
                <span className="bg-green-200 text-green-900 text-xs px-2 py-1 rounded font-bold whitespace-nowrap ml-2">
                  {ticket.bountyPoints} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}