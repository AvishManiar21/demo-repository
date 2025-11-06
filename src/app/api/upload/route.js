import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(req) {
  const supabase = supabaseServerClient();
  const formData = await req.formData();
  const files = formData.getAll("file");
  const bucket = formData.get("bucket") || "images";

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const path = file.name;
    const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}


