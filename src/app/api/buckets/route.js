import { supabaseServerClient } from "@/lib/supabaseServerClient";

function validateBucketName(name) {
  if (typeof name !== "string") return "Bucket name must be a string";
  const trimmed = name.trim();
  if (!trimmed) return "Bucket name is required";
  if (trimmed.length < 3 || trimmed.length > 63) return "Bucket name must be 3-63 characters";
  // Allow lowercase letters, numbers, dashes, underscores, dots
  if (!/^[a-z0-9._-]+$/.test(trimmed)) return "Use lowercase letters, numbers, dashes, underscores, or dots only";
  // Must start and end with alphanumeric
  if (!/^[a-z0-9].*[a-z0-9]$/.test(trimmed)) return "Bucket name must start and end with a letter or number";
  return null;
}

export async function GET() {
  try {
    const supabase = supabaseServerClient();
    const { data, error } = await supabase.storage.listBuckets();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ buckets: data || [] });
  } catch (e) {
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = supabaseServerClient();
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();

    const validationError = validateBucketName(name);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    // Attempt to create the bucket as public
    const { data, error } = await supabase.storage.createBucket(name, { public: true });
    if (error) {
      const message = String(error.message || error);
      // Surface conflict as 409 when bucket already exists
      if (/already exists|duplicate|conflict/i.test(message)) {
        return Response.json({ error: "Bucket already exists", bucket: { name } }, { status: 409 });
      }
      return Response.json({ error: message }, { status: 500 });
    }
    return Response.json({ bucket: data }, { status: 201 });
  } catch (e) {
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
}


