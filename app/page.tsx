'use client';

import { useState, useEffect, useRef } from 'react';

// Upgraded Ticket Type with scriptExecuted flag
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
  { id: "INC-103", title: "Update IAM policies for newly provisioned service accounts", severity: "Low", status: "Assigned", assignee: "Alex", bountyPoints: 0 }
];

export default function TaskLiaison() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const isRegistered = useRef(false);

  // --- HUMAN UI ACTIONS ---
  
  const handleApprovePatch = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, scriptExecuted: true } : t
    ));
  };

  const handleClaimBounty = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: 'Assigned', assignee: 'Alex' } : t
    ));
  };

  // --- AI AGENT ACTIONS (WebMCP) ---

  useEffect(() => {
    if (isRegistered.current) return; 
    const modelContext = (document as any).modelContext;
    
    if (modelContext) {
      isRegistered.current = true; 
      
      modelContext.registerTool({
        name: "post_bounty_to_market",
        description: "Moves a critical ticket to the Priority Reward Exchange and assigns a bounty point value.",
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
          return { content: [{ type: "text", text: `Success: Ticket ${input.ticketId} posted to exchange for ${input.bountyPoints} pts.` }] };
        }
      });

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
          setTickets(prev => prev.map(t => t.id === input.ticketId ? { ...t, remediationScript: input.scriptContent, scriptExecuted: false } : t));
          return { content: [{ type: "text", text: `Remediation script staged for ${input.ticketId}. Awaiting human approval.` }] };
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-gray-50 text-gray-900">
      
      {/* COLUMN 1: Manager Command Center */}
      <div className="w-1/3 p-6 border-r border-gray-300 overflow-y-auto bg-white">
        <h1 className="text-xl font-bold mb-6 text-gray-800">Command Center</h1>
        <div className="space-y-6">
          {tickets.filter(t => t.status === 'Open').map(ticket => (
            <div key={ticket.id} className="p-4 bg-gray-50 shadow-sm rounded border-l-4 border-red-500">
              <h3 className="font-semibold text-md">{ticket.title}</h3>
              <p className="text-xs text-gray-500 mt-2 mb-3">ID: {ticket.id} | Severity: {ticket.severity}</p>
              
              {ticket.blastRadius && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded">
                  <p className="text-xs font-bold text-red-800 mb-1">⚠️ CASCADING IMPACT DETECTED:</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.blastRadius.map(service => (
                      <span key={service} className="bg-red-200 text-red-900 text-xs px-2 py-1 rounded">{service}</span>
                    ))}
                  </div>
                </div>
              )}

              {ticket.remediationScript && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-blue-800 mb-1">🤖 AI STAGED REMEDIATION (Awaiting Approval):</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap mb-2">
                    {ticket.remediationScript}
                  </pre>
                  {!ticket.scriptExecuted ? (
                    <button onClick={() => handleApprovePatch(ticket.id)} className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700 transition-colors">
                      Approve & Execute Patch
                    </button>
                  ) : (
                    <div className="w-full bg-green-100 border border-green-300 text-green-800 text-center text-xs font-bold py-2 rounded">
                      ✅ Patch Applied Successfully
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 2: Priority Reward Exchange */}
      <div className="w-1/3 p-6 border-r border-gray-300 overflow-y-auto bg-slate-100">
        <h1 className="text-xl font-bold mb-6 text-indigo-900">Priority Reward Exchange</h1>
        <div className="space-y-4">
          {tickets.filter(t => t.status === 'Market').map(ticket => (
            <div key={ticket.id} className="p-4 bg-white shadow rounded border border-indigo-200">
              <h3 className="font-semibold text-indigo-900">{ticket.title}</h3>
              <p className="text-xs text-indigo-700 mt-1 mb-3">ID: {ticket.id}</p>
              
              <div className="flex justify-between items-center pt-3 border-t border-indigo-100">
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                  Reward: {ticket.bountyPoints} pts
                </span>
                <button 
                  onClick={() => handleClaimBounty(ticket.id)}
                  className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded hover:bg-indigo-700 transition-colors"
                >
                  Claim Issue
                </button>
              </div>
            </div>
          ))}
          {tickets.filter(t => t.status === 'Market').length === 0 && (
            <div className="text-center text-sm text-gray-400 italic mt-10">
              The exchange is currently empty.
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 3: Engineer View */}
      <div className="w-1/3 p-6 bg-gray-50 overflow-y-auto">
        <h1 className="text-xl font-bold mb-6 text-gray-800">Engineer View: Alex</h1>
        <div className="space-y-4">
          {tickets.filter(t => t.assignee === 'Alex').map(ticket => (
            <div key={ticket.id} className="p-4 bg-white shadow-sm rounded relative border border-gray-200">
              
              {ticket.bountyPoints > 0 && (
                 <span className="absolute top-4 right-4 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-bold">
                   +{ticket.bountyPoints} pts
                 </span>
              )}

              <h3 className="font-semibold pr-16 text-md">{ticket.title}</h3>
              <p className="text-xs text-gray-500 mt-2">ID: {ticket.id} | Severity: {ticket.severity}</p>
              
              {ticket.blastRadius && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded">
                  <p className="text-xs font-bold text-red-800 mb-1">⚠️ CASCADING IMPACT DETECTED:</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.blastRadius.map(service => (
                      <span key={service} className="bg-red-200 text-red-900 text-xs px-2 py-1 rounded">{service}</span>
                    ))}
                  </div>
                </div>
              )}

              {ticket.remediationScript && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-blue-800 mb-1">🤖 AI STAGED REMEDIATION (Awaiting Approval):</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap mb-2">
                    {ticket.remediationScript}
                  </pre>
                  {!ticket.scriptExecuted ? (
                    <button onClick={() => handleApprovePatch(ticket.id)} className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700 transition-colors">
                      Approve & Execute Patch
                    </button>
                  ) : (
                    <div className="w-full bg-green-100 border border-green-300 text-green-800 text-center text-xs font-bold py-2 rounded">
                      ✅ Patch Applied Successfully
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}