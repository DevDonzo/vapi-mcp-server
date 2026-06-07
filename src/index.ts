import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { 
  CallMcpProtocolSchema, 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { VapiClient } from "@vapi-ai/api";

const app = express();
const vapi = new VapiClient({
  token: process.env.VAPI_API_KEY || "",
});

const server = new Server(
  {
    name: "vapi-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_call",
        description: "Create a new outbound call using Vapi",
        inputSchema: {
          type: "object",
          properties: {
            assistantId: { type: "string", description: "The ID of the assistant to use" },
            phoneNumberId: { type: "string", description: "The ID of the phone number to use" },
            customerNumber: { type: "string", description: "The phone number to call" },
          },
          required: ["assistantId", "customerNumber"],
        },
      },
      {
        name: "list_calls",
        description: "List recent calls from Vapi",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum number of calls to return" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "create_call") {
      const call = await vapi.calls.create({
        assistantId: args?.assistantId as string,
        phoneNumberId: args?.phoneNumberId as string,
        customer: {
          number: args?.customerNumber as string,
        },
      });
      return {
        content: [{ type: "text", text: JSON.stringify(call, null, 2) }],
      };
    }

    if (name === "list_calls") {
      const calls = await vapi.calls.list({
        limit: (args?.limit as number) || 10,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(calls, null, 2) }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

let transport: SSEServerTransport | null = null;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No SSE connection established");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vapi MCP server running on port ${PORT}`);
});
