import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const supabase = supabaseServerClient();
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get("bucket") || "images";
  const { data: files, error } = await supabase.storage.from(bucket).list("", { limit: 200 });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const mapped = await Promise.all(
    (files || []).filter((f) => f?.name).map(async (file) => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(file.name);
      return { name: file.name, url: data.publicUrl };
    })
  );

  return Response.json({ files: mapped });
}


