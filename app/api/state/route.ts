const retired = {
  error: "The legacy JSON-state endpoint has been retired.",
  replacement: "Use the normalized local Supabase tables and Server Actions.",
};

export function GET() {
  return Response.json(retired, { status: 410 });
}

export function PUT() {
  return Response.json(retired, { status: 410 });
}
