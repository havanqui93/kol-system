"use client";

import { useState } from "react";
import Link from "next/link";

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  summary: string;
  params?: { name: string; in: "query" | "body" | "path"; type: string; required: boolean; desc: string }[];
  responseExample?: string;
  group: string;
}

const ENDPOINTS: Endpoint[] = [
  // Projects
  {
    group: "Projects",
    method: "GET", path: "/api/video-projects",
    summary: "List video projects with pagination, filter, and search",
    params: [
      { name: "q", in: "query", type: "string", required: false, desc: "Search by title" },
      { name: "status", in: "query", type: "string", required: false, desc: "Filter by status" },
      { name: "platform", in: "query", type: "string", required: false, desc: "tiktok | facebook | instagram | youtube_shorts" },
      { name: "page", in: "query", type: "number", required: false, desc: "Page number (default 1)" },
      { name: "sort", in: "query", type: "string", required: false, desc: "newest | oldest | status" },
    ],
    responseExample: '{"projects":[...],"total":42}',
  },
  {
    group: "Projects",
    method: "POST", path: "/api/video-projects",
    summary: "Create a new video project and start the AI pipeline",
    params: [
      { name: "title", in: "body", type: "string", required: true, desc: "Project title" },
      { name: "platform", in: "body", type: "string", required: true, desc: "Target platform" },
      { name: "qualityPreset", in: "body", type: "string", required: true, desc: "cheap | balanced | premium" },
      { name: "durationSeconds", in: "body", type: "number", required: true, desc: "15–60 seconds" },
      { name: "productId", in: "body", type: "string", required: false, desc: "Product to promote" },
      { name: "kolProfileId", in: "body", type: "string", required: false, desc: "KOL profile to use" },
    ],
    responseExample: '{"id":"clx...","status":"script_generating"}',
  },
  {
    group: "Projects",
    method: "GET", path: "/api/video-projects/search",
    summary: "Full-text search across title, product name, and notes",
    params: [{ name: "q", in: "query", type: "string", required: true, desc: "Search term (min 2 chars)" }],
    responseExample: '{"results":[{"id":"...","title":"...","matchField":"title"}]}',
  },
  {
    group: "Projects",
    method: "GET", path: "/api/video-projects/export-csv",
    summary: "Export all projects as a CSV file download",
    responseExample: "text/csv attachment",
  },
  {
    group: "Projects",
    method: "POST", path: "/api/video-projects/bulk-archive",
    summary: "Archive or unarchive up to 50 projects at once",
    params: [
      { name: "ids", in: "body", type: "string[]", required: true, desc: "Project IDs (max 50)" },
      { name: "archive", in: "body", type: "boolean", required: true, desc: "true=archive, false=restore" },
    ],
    responseExample: '{"updated":5}',
  },
  // Project actions
  {
    group: "Project actions",
    method: "POST", path: "/api/video-projects/:id/generate-script",
    summary: "Trigger script generation (or regenerate)",
    params: [{ name: "id", in: "path", type: "string", required: true, desc: "Project ID" }],
    responseExample: '{"ok":true}',
  },
  {
    group: "Project actions",
    method: "POST", path: "/api/video-projects/:id/archive",
    summary: "Soft-archive a project (hide from dashboard)",
    params: [{ name: "id", in: "path", type: "string", required: true, desc: "Project ID" }],
    responseExample: '{"ok":true}',
  },
  {
    group: "Project actions",
    method: "DELETE", path: "/api/video-projects/:id/archive",
    summary: "Restore an archived project",
    params: [{ name: "id", in: "path", type: "string", required: true, desc: "Project ID" }],
    responseExample: '{"ok":true}',
  },
  {
    group: "Project actions",
    method: "POST", path: "/api/video-projects/:id/thumbnail",
    summary: "Set custom thumbnail URL for a project",
    params: [
      { name: "id", in: "path", type: "string", required: true, desc: "Project ID" },
      { name: "thumbnailUrl", in: "body", type: "string", required: true, desc: "Public image URL" },
    ],
    responseExample: '{"ok":true}',
  },
  {
    group: "Project actions",
    method: "GET", path: "/api/video-projects/:id/activity",
    summary: "Get project activity log (up to 100 events)",
    responseExample: '{"events":[{"at":"2024-01-01T...","event":"script_generated","detail":"3 scripts"}]}',
  },
  {
    group: "Project actions",
    method: "POST", path: "/api/video-projects/:id/activity",
    summary: "Append a custom activity event",
    params: [
      { name: "event", in: "body", type: "string", required: true, desc: "Event name" },
      { name: "detail", in: "body", type: "string", required: false, desc: "Optional detail" },
    ],
    responseExample: '{"ok":true}',
  },
  // Templates
  {
    group: "Templates",
    method: "GET", path: "/api/video-projects/templates",
    summary: "List saved project templates (up to 20)",
    responseExample: '{"templates":[{"id":"...","name":"My Template","platform":"tiktok",...}]}',
  },
  {
    group: "Templates",
    method: "POST", path: "/api/video-projects/templates",
    summary: "Save a project as a reusable template",
    params: [
      { name: "name", in: "body", type: "string", required: true, desc: "Template name" },
      { name: "platform", in: "body", type: "string", required: true, desc: "Target platform" },
      { name: "qualityPreset", in: "body", type: "string", required: true, desc: "Quality preset" },
      { name: "durationSeconds", in: "body", type: "number", required: true, desc: "Duration" },
    ],
    responseExample: '{"template":{"id":"...","name":"..."}}',
  },
  {
    group: "Templates",
    method: "DELETE", path: "/api/video-projects/templates/:id",
    summary: "Delete a saved template",
    responseExample: '{"ok":true}',
  },
  // Assets
  {
    group: "Assets",
    method: "GET", path: "/api/assets",
    summary: "List all generated assets with pagination",
    params: [
      { name: "type", in: "query", type: "string", required: false, desc: "audio | video_clip | image | final_video" },
      { name: "page", in: "query", type: "number", required: false, desc: "Page number" },
    ],
    responseExample: '{"assets":[...],"total":120,"page":1,"pageSize":24}',
  },
  // Analytics
  {
    group: "Analytics",
    method: "GET", path: "/api/analytics/tokens",
    summary: "Token usage stats grouped by provider/model/operation",
    params: [{ name: "days", in: "query", type: "number", required: false, desc: "Lookback days (default 30)" }],
    responseExample: '{"rows":[{"provider":"anthropic","model":"claude-3-5-haiku","totalTokens":12345,"costUsd":0.043}]}',
  },
  {
    group: "Analytics",
    method: "GET", path: "/api/analytics/publish-rate",
    summary: "Publish success rate per platform",
    responseExample: '{"platforms":[{"platform":"tiktok","total":10,"published":8,"rate":80}]}',
  },
  // User preferences
  {
    group: "User",
    method: "GET", path: "/api/user/preferences",
    summary: "Get user preferences (platform defaults, voice style, etc.)",
    responseExample: '{"preferences":{"defaultPlatform":"tiktok","defaultQualityPreset":"balanced"}}',
  },
  {
    group: "User",
    method: "PATCH", path: "/api/user/preferences",
    summary: "Partial update of user preferences",
    params: [
      { name: "defaultPlatform", in: "body", type: "string", required: false, desc: "tiktok | facebook | instagram | youtube_shorts" },
      { name: "defaultQualityPreset", in: "body", type: "string", required: false, desc: "cheap | balanced | premium" },
      { name: "preferredVoiceStyle", in: "body", type: "string", required: false, desc: "energetic | professional | funny | calm | authoritative" },
    ],
    responseExample: '{"preferences":{...}}',
  },
  // Webhooks
  {
    group: "Webhooks",
    method: "GET", path: "/api/webhooks/test",
    summary: "Get current webhook URL",
    responseExample: '{"webhookUrl":"https://..."}',
  },
  {
    group: "Webhooks",
    method: "POST", path: "/api/webhooks/test",
    summary: "Set webhook URL and fire a test ping",
    params: [{ name: "url", in: "body", type: "string", required: false, desc: "Leave empty to remove" }],
    responseExample: '{"ok":true,"webhookUrl":"...","testFired":true}',
  },
  // Admin
  {
    group: "Admin",
    method: "GET", path: "/api/admin/failed-jobs",
    summary: "List all failed BullMQ jobs across queues",
    responseExample: '{"jobs":[{"queue":"script","jobId":"1","failedReason":"..."}]}',
  },
  {
    group: "Admin",
    method: "DELETE", path: "/api/admin/failed-jobs",
    summary: "Clear all failed jobs from all queues",
    responseExample: '{"cleared":12}',
  },
  {
    group: "Admin",
    method: "POST", path: "/api/admin/jobs/:queue/:jobId/retry",
    summary: "Retry a specific failed job",
    responseExample: '{"ok":true}',
  },
  // Workers
  {
    group: "Workers",
    method: "GET", path: "/api/workers/heartbeat",
    summary: "List live workers (seen in last 90s)",
    responseExample: '{"workers":[{"id":"w1","type":"script","version":"1.0.0","lastSeen":1234567890}]}',
  },
  {
    group: "Workers",
    method: "POST", path: "/api/workers/heartbeat",
    summary: "Worker heartbeat ping (sets 90s Redis TTL)",
    params: [
      { name: "workerId", in: "body", type: "string", required: true, desc: "Unique worker ID" },
      { name: "workerType", in: "body", type: "string", required: true, desc: "Worker type" },
    ],
    responseExample: '{"ok":true}',
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
  PUT: "bg-purple-100 text-purple-700",
};

export default function DocsPage() {
  const [activeGroup, setActiveGroup] = useState<string>("Projects");
  const [expanded, setExpanded] = useState<string | null>(null);

  const groups = Array.from(new Set(ENDPOINTS.map((e) => e.group)));
  const filtered = ENDPOINTS.filter((e) => e.group === activeGroup);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
          <p className="text-sm text-gray-500 mt-1">Tài liệu tham khảo cho tất cả REST API endpoints</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 flex-shrink-0 space-y-1">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => { setActiveGroup(g); setExpanded(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeGroup === g
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {g}
            </button>
          ))}
        </nav>

        {/* Endpoints */}
        <div className="flex-1 space-y-2 min-w-0">
          {filtered.map((ep) => {
            const key = `${ep.method}:${ep.path}`;
            const isOpen = expanded === key;
            return (
              <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono flex-shrink-0 ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm text-gray-700 font-mono flex-1 min-w-0 truncate">{ep.path}</code>
                  <span className="text-xs text-gray-400 flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    <p className="text-sm text-gray-700">{ep.summary}</p>

                    {ep.params && ep.params.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parameters</h3>
                        <div className="space-y-1">
                          {ep.params.map((p) => (
                            <div key={p.name} className="flex items-start gap-3 text-sm">
                              <code className="font-mono text-brand-700 w-36 flex-shrink-0">{p.name}</code>
                              <span className="text-gray-400 text-xs w-12 flex-shrink-0">{p.in}</span>
                              <span className="text-gray-400 text-xs w-16 flex-shrink-0">{p.type}</span>
                              <span className={`text-xs flex-shrink-0 ${p.required ? "text-red-500" : "text-gray-400"}`}>
                                {p.required ? "required" : "optional"}
                              </span>
                              <span className="text-gray-600 text-xs">{p.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ep.responseExample && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Response</h3>
                        <pre className="bg-gray-900 text-green-400 text-xs rounded-lg px-4 py-3 overflow-x-auto font-mono">
                          {ep.responseExample}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
