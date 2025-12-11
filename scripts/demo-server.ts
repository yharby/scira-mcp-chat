
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";

// Create server instance
const server = new Server(
  {
    name: "ui-demo-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_weather",
        description: "Get current weather for a location",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "City and state, e.g. San Francisco, CA",
            },
          },
          required: ["location"],
        },
      },
      {
        name: "show_on_map",
        description: "Show a location on an interactive map",
        inputSchema: {
          type: "object",
          properties: {
            latitude: { type: "number", description: "Latitude coordinate" },
            longitude: { type: "number", description: "Longitude coordinate" },
            title: { type: "string", description: "Location name or title" },
            description: { type: "string", description: "Optional description" },
            zoom: { type: "number", description: "Zoom level (1-20)" },
          },
          required: ["latitude", "longitude", "title"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_weather") {
    const location = String(args?.location || "Unknown");
    
    // Simulate some logic to return different weather based on location name length
    const isRainy = location.length % 2 === 0;
    const isCloudy = location.length % 3 === 0;
    
    let condition = "Sunny";
    if (isRainy) condition = "Rainy";
    else if (isCloudy) condition = "Cloudy";
    
    const temperature = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            location,
            temperature,
            condition,
            humidity: Math.floor(Math.random() * 50) + 30,
            windSpeed: Math.floor(Math.random() * 20) + 5,
          }),
        },
      ],
    };
  }
  
  if (name === "show_on_map") {
      const { latitude, longitude, title, description, zoom } = args as any;
      return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                latitude,
                longitude,
                title,
                description,
                zoom: zoom || 12
              })
            }
          ]
      };
  }

  throw new Error(`Tool not found: ${name}`);
});

const app = express();
app.use(cors());

// Store active transport
let transport: SSEServerTransport | null = null;

app.get("/sse", async (req, res) => {
  console.log("New SSE connection established");
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).json({ error: "No active transport" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`UI Demo MCP Server running on http://localhost:${PORT}/sse`);
});
