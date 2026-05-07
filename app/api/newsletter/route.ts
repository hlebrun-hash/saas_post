import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email } = schema.parse(body);

    const { error } = await getSupabase()
      .from("lien_creation_de_poste")
      .insert({
        adree_mail: email,
        "nom et preson": `${firstName} ${lastName}`,
      });

    // Email déjà inscrit → succès silencieux
    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
