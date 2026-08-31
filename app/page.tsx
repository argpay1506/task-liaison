'use client';

import { useState, useEffect, useRef } from 'react';

export type Ticket = {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'Critical';
  status: 'Open' | 'Market' | 'Assigned';
  assignee: string | null;
  bountyPoints: number;
  blastRadius?: string[];
  remediationScript?: string;
  scriptExecuted?: boolean;
};

const initialTickets: Ticket[] = [
  { id: "INC-101", title: "Cloud SQL production database CPU spike at 98%", severity: "Critical", status: "Open", assignee: null, bountyPoints: 0 },
  { id: "INC-102", title: "GKE Node Pool auto-scaling failure in us-central1", severity: "Critical", status: "Assigned", assignee: "Alex", bountyPoints: 0 },
  { id: "INC-103", title: "Update IAM policies for newly provisioned service accounts", severity: "Low", status: "Assigned", assignee: "Alex", bountyPoints: 0 },
  { id: "INC-104", title: "Redis cache memory fragmentation ratio exceeds 2.8", severity: "Critical", status: "Open", assignee: null, bountyPoints: 0 },
  { id: "INC-105", title: "Payment Gateway webhook timeouts exceeding 2500ms SLA", severity: "Critical", status: "Assigned", assignee: "Sarah", bountyPoints: 0 },
  { id: "INC-106", title: "Automate lifecycle archiving policy for Cloud Storage cold logs", severity: "Low", status: "Assigned", assignee: "Sarah", bountyPoints: 0 }
];

export default function TaskLiaison() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const isRegistered = useRef(false);

  // --- Human Interaction Handlers ---
  const handleApprovePatch = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, scriptExecuted: true } : t
    ));
  };

  const handleClaimBounty = (ticketId: string, engineerName: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: 'Assigned', assignee: engineerName } : t
    ));
  };

  // --- WebMCP Tool Registration ---
  useEffect(() => {
    if (isRegistered.current) return;
    const modelContext = (document as any).modelContext;

    if (modelContext) {
      isRegistered.current = true;

      // Tool 1: Post to Priority Reward Exchange
      modelContext.registerTool({
        name: "post_bounty_to_market",
        description: "Moves an unassigned critical ticket to the Priority Reward Exchange with a specified bounty point value.",
        inputSchema: {
          type: "object",
          properties: {
            ticketId: { type: "string" },
            bountyPoints: { type: "number" }
          },
          required: ["ticketId", "bountyPoints"]
        },
        execute: async (input: { ticketId: string; bountyPoints: number }) => {
          setTickets(prev => prev.map(t => 
            t.id === input.ticketId ? { ...t, status: 'Market', assignee: null, bountyPoints: input.bountyPoints } : t
          ));
          return { content: [{ type: "text", text: `Ticket ${input.ticketId} posted to Priority Reward Exchange for ${input.bountyPoints} pts.` }] };
        }
      });

      // Tool 2: Engineer Workload Swap / Reassignment
      modelContext.registerTool({
        name: "propose_ticket_swap",
        description: "Assigns a critical ticket to an engineer while offloading a lower-priority ticket or transferring tasks between Alex and Sarah.",
        inputSchema: {
          type: "object",
          properties: {
            engineerName: { type: "string", description: "Target engineer taking the critical ticket ('Alex' or 'Sarah')" },
            ticketToAssign: { type: "string" },
            ticketToRemove: { type: "string", description: "Ticket to unassign or return to open status to balance workload" }
          },
          required: ["engineerName", "ticketToAssign", "ticketToRemove"]
        },
        execute: async (input: { engineerName: string; ticketToAssign: string; ticketToRemove: string }) => {
          setTickets(prev => prev.map(t => {
            if (t.id === input.ticketToAssign) return { ...t, status: 'Assigned', assignee: input.engineerName, bountyPoints: 0 };
            if (t.id === input.ticketToRemove) return { ...t, status: 'Open', assignee: null };
            return t;
          }));
          return { content: [{ type: "text", text: `Assigned ${input.ticketToAssign} to ${input.engineerName}. Reassigned ${input.ticketToRemove} to Open Command Center.` }] };
        }
      });

      // Tool 3: Direct Engineer-to-Engineer Transfer
      modelContext.registerTool({
        name: "transfer_ticket_between_engineers",
        description: "Transfers an assigned ticket directly from one engineer to another (e.g., from Alex to Sarah).",
        inputSchema: {
          type: "object",
          properties: {
            ticketId: { type: "string" },
            fromEngineer: { type: "string" },
            toEngineer: { type: "string" }
          },
          required: ["ticketId", "fromEngineer", "toEngineer"]
        },
        execute: async (input: { ticketId: string; fromEngineer: string; toEngineer: string }) => {
          setTickets(prev => prev.map(t => 
            t.id === input.ticketId ? { ...t, assignee: input.toEngineer, status: 'Assigned' } : t
          ));
          return { content: [{ type: "text", text: `Transferred ${input.ticketId} from ${input.fromEngineer} to ${input.toEngineer}.` }] };
        }
      });

      // Tool 4: Blast Radius Visualizer
      modelContext.registerTool({
        name: "analyze_blast_radius",
        description: "Calculates and renders downstream service dependencies at risk for a specific incident.",
        inputSchema: {
          type: "object",
          properties: {
            ticketId: { type: "string" },
            impactedServices: { 
              type: "array", 
              items: { type: "string" },
              description: "Array of service names at risk (e.g., ['Auth Service', 'Checkout API'])"
            }
          },
          required: ["ticketId", "impactedServices"]
        },
        execute: async (input: { ticketId: string; impactedServices: string[] }) => {
          setTickets(prev => prev.map(t => t.id === input.ticketId ? { ...t, blastRadius: input.impactedServices } : t));
          return { content: [{ type: "text", text: `Blast radius updated for ${input.ticketId}.` }] };
        }
      });

      // Tool 5: Stage Remediation Sandbox
      modelContext.registerTool({
        name: "stage_remediation_script",
        description: "Stages a mock bash, Terraform, or gcloud remediation script in the UI awaiting human approval.",
        inputSchema: {
          type: "object",
          properties: {
            ticketId: { type: "string" },
            scriptContent: { type: "string", description: "Executable script or IaC configuration" }
          },
          required: ["ticketId", "scriptContent"]
        },
        execute: async (input: { ticketId: string; scriptContent: string }) => {
          setTickets(prev => prev.map(t => t.id === input.ticketId ? { ...t, remediationScript: input.scriptContent, scriptExecuted: false } : t));
          return { content: [{ type: "text", text: `Remediation script staged for ${input.ticketId}. Awaiting human execution.` }] };
        }
      });
    }
  }, []);

  const renderTicketDetails = (ticket: Ticket) => (
    <>
      {ticket.blastRadius && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded">
          <p className="text-xs font-bold text-red-800 mb-1">⚠️ CASCADING IMPACT DETECTED:</p>
          <div className="flex flex-wrap gap-2">
            {ticket.blastRadius.map(service => (
              <span key={service} className="bg-red-200 text-red-900 text-xs px-2 py-1 rounded font-medium">
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {ticket.remediationScript && (
        <div className="mt-3">
          <p className="text-xs font-bold text-blue-800 mb-1">🤖 AI STAGED REMEDIATION (Awaiting Approval):</p>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap mb-2">
            {ticket.remediationScript}
          </pre>
          {!ticket.scriptExecuted ? (
            <button 
              onClick={() => handleApprovePatch(ticket.id)} 
              className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Approve & Execute Patch
            </button>
          ) : (
            <div className="w-full bg-green-100 border border-green-300 text-green-800 text-center text-xs font-bold py-2 rounded">
              ✅ Patch Applied Successfully
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-gray-50 text-gray-900">
      
      {/* COLUMN 1: Manager Command Center */}
      <div className="w-1/3 p-6 border-r border-gray-300 overflow-y-auto bg-white">
        <h1 className="text-xl font-bold mb-1 text-gray-800">Command Center</h1>
        <p className="text-xs text-gray-500 mb-6">Unassigned Incident Queue</p>

        <div className="space-y-4">
          {tickets.filter(t => t.status === 'Open').map(ticket => (
            <div key={ticket.id} className="p-4 bg-gray-50 shadow-sm rounded border-l-4 border-red-500 border border-gray-200">
              <h3 className="font-semibold text-sm leading-snug">{ticket.title}</h3>
              <p className="text-xs text-gray-500 mt-1">ID: {ticket.id} | Severity: {ticket.severity}</p>
              {renderTicketDetails(ticket)}
            </div>
          ))}
          {tickets.filter(t => t.status === 'Open').length === 0 && (
            <div className="text-center text-sm text-gray-400 italic mt-8">
              No unassigned incidents in command queue.
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2: Priority Reward Exchange */}
      <div className="w-1/3 p-6 border-r border-gray-300 overflow-y-auto bg-slate-100">
        <h1 className="text-xl font-bold mb-1 text-indigo-900">Priority Reward Exchange</h1>
        <p className="text-xs text-indigo-600 mb-6">Incentivized Bounty Market</p>

        <div className="space-y-4">
          {tickets.filter(t => t.status === 'Market').map(ticket => (
            <div key={ticket.id} className="p-4 bg-white shadow rounded border border-indigo-200">
              <h3 className="font-semibold text-indigo-950 text-sm">{ticket.title}</h3>
              <p className="text-xs text-indigo-700 mt-1 mb-3">ID: {ticket.id}</p>
              
              <div className="flex flex-col gap-2 pt-3 border-t border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-bold">
                    Reward: {ticket.bountyPoints} pts
                  </span>
                </div>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => handleClaimBounty(ticket.id, 'Alex')}
                    className="w-1/2 bg-indigo-600 text-white text-xs font-semibold py-1.5 rounded hover:bg-indigo-700 transition-colors"
                  >
                    Claim as Alex
                  </button>
                  <button 
                    onClick={() => handleClaimBounty(ticket.id, 'Sarah')}
                    className="w-1/2 bg-purple-600 text-white text-xs font-semibold py-1.5 rounded hover:bg-purple-700 transition-colors"
                  >
                    Claim as Sarah
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tickets.filter(t => t.status === 'Market').length === 0 && (
            <div className="text-center text-sm text-gray-400 italic mt-8">
              The exchange is currently empty.
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 3: Active Engineering Queues (Stacked) */}
      <div className="w-1/3 p-6 bg-gray-50 overflow-y-auto">
        <h1 className="text-xl font-bold mb-1 text-gray-800">Engineering Workloads</h1>
        <p className="text-xs text-gray-500 mb-6">Active On-Call Assignments</p>

        {/* Stack 1: Alex */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Alex (SRE Lead)</h2>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
              {tickets.filter(t => t.assignee === 'Alex').length} Active
            </span>
          </div>

          <div className="space-y-3">
            {tickets.filter(t => t.assignee === 'Alex').map(ticket => (
              <div key={ticket.id} className="p-3.5 bg-white shadow-sm rounded border border-gray-200 relative">
                {ticket.bountyPoints > 0 && (
                  <span className="absolute top-3 right-3 bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                    +{ticket.bountyPoints} pts
                  </span>
                )}
                <h3 className="font-semibold pr-14 text-xs leading-snug">{ticket.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1">ID: {ticket.id} | Severity: {ticket.severity}</p>
                {renderTicketDetails(ticket)}
              </div>
            ))}
          </div>
        </div>

        {/* Stack 2: Sarah */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Sarah (Platform Eng)</h2>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
              {tickets.filter(t => t.assignee === 'Sarah').length} Active
            </span>
          </div>

          <div className="space-y-3">
            {tickets.filter(t => t.assignee === 'Sarah').map(ticket => (
              <div key={ticket.id} className="p-3.5 bg-white shadow-sm rounded border border-gray-200 relative">
                {ticket.bountyPoints > 0 && (
                  <span className="absolute top-3 right-3 bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                    +{ticket.bountyPoints} pts
                  </span>
                )}
                <h3 className="font-semibold pr-14 text-xs leading-snug">{ticket.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1">ID: {ticket.id} | Severity: {ticket.severity}</p>
                {renderTicketDetails(ticket)}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}