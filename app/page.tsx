'use client';

import { useState, useEffect, useRef } from 'react';
import { initialTickets, Ticket } from '../data';

export default function TaskLiaison() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  
  // This ref ensures we only register the tools once, bypassing React Strict Mode issues
  const isRegistered = useRef(false);

  useEffect(() => {
    // If already registered, stop immediately
    if (isRegistered.current) return; 

    const modelContext = (document as any).modelContext;
    
    if (modelContext) {
      isRegistered.current = true; // Mark as registered so it never runs again
      
      // TOOL 1: The Bounty Poster
      modelContext.registerTool({
        name: "post_bounty_to_market",
        description: "Moves a critical infrastructure ticket to the open market and assigns a bounty point value.",
        inputSchema: {
          type: "object",
          properties: {
            ticketId: { type: "string", description: "The ID of the ticket (e.g., INC-101)" },
            bountyPoints: { type: "number", description: "The calculated point value for the bounty (e.g., 500)" }
          },
          required: ["ticketId", "bountyPoints"]
        },
        execute: async (input: { ticketId: string; bountyPoints: number }) => {
          setTickets(prevTickets => 
            prevTickets.map(t => 
              t.id === input.ticketId 
                ? { ...t, status: 'Market', bountyPoints: input.bountyPoints } 
                : t
            )
          );
          return {
            content: [{ type: "text", text: `Success: Ticket ${input.ticketId} is now on the market with a ${input.bountyPoints} point bounty.` }]
          };
        }
      });

      // TOOL 2: The AI Negotiator
      modelContext.registerTool({
        name: "propose_ticket_swap",
        description: "Assigns a critical ticket to an engineer and moves one of their low-priority tickets back to the open queue to balance workload.",
        inputSchema: {
          type: "object",
          properties: {
            engineerName: { type: "string", description: "Name of the engineer (e.g., Alex)" },
            ticketToAssign: { type: "string", description: "ID of the critical ticket to assign (e.g., INC-101)" },
            ticketToRemove: { type: "string", description: "ID of the low-priority ticket to remove from their queue (e.g., INC-103)" }
          },
          required: ["engineerName", "ticketToAssign", "ticketToRemove"]
        },
        execute: async (input: { engineerName: string; ticketToAssign: string; ticketToRemove: string }) => {
          setTickets(prevTickets => 
            prevTickets.map(t => {
              if (t.id === input.ticketToAssign) {
                return { ...t, status: 'Assigned', assignee: input.engineerName, bountyPoints: 0 };
              }
              if (t.id === input.ticketToRemove) {
                return { ...t, status: 'Open', assignee: null };
              }
              return t;
            })
          );
          
          return {
            content: [{ 
              type: "text", 
              text: `Negotiation successful. Assigned ${input.ticketToAssign} to ${input.engineerName} and removed ${input.ticketToRemove} from their queue.` 
            }]
          };
        }
      });

      console.log("WebMCP Tools registered successfully.");
    }
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-gray-50 text-gray-900">
      
      {/* LEFT: Manager Command Center */}
      <div className="w-1/2 p-8 border-r border-gray-300">
        <h1 className="text-2xl font-bold mb-6">Task-Liaison: Command Center (Rahman)</h1>
        
        <div className="space-y-4">
          {tickets.filter(t => t.status === 'Open').map(ticket => (
            <div key={ticket.id} className="p-4 bg-white shadow rounded border-l-4 border-red-500 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{ticket.title}</h3>
                <p className="text-sm text-gray-500">Severity: {ticket.severity}</p>
                <p className="text-xs text-gray-400 mt-1">ID: {ticket.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Engineer View (Alex) */}
      <div className="w-1/2 p-8 bg-gray-100">
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
                  <h3 className="font-semibold">{ticket.title}</h3>
                  <p className="text-xs text-green-600 mt-1">ID: {ticket.id}</p>
                </div>
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded font-bold">
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