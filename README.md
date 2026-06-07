# Vapi MCP Server

This is a Model Context Protocol (MCP) server for Vapi, designed to be deployed on Vercel.

## Features

- **create_call**: Start an outbound call with a specific assistant.
- **list_calls**: List recent call logs.

## Setup

1. Fork or clone this repository.
2. Deploy to Vercel.
3. Set the `VAPI_API_KEY` environment variable in Vercel.
4. Add the SSE endpoint to your MCP client (e.g., Cursor or Claude Desktop):
   - URL: `https://your-deployment.vercel.app/sse`
