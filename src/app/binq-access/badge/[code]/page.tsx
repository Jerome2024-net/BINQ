import { createClient } from "@supabase/supabase-js";
import BadgeContent from "./BadgeContent";
import { notFound } from "next/navigation";

// Server component — fetches member data by QR code
export default async function BadgePage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: member } = await supabase
    .from("access_members")
    .select("id, nom, prenom, email, role, qr_code, actif, photo_url, access_spaces(nom, adresse)")
    .eq("qr_code", params.code)
    .single();

  if (!member) {
    notFound();
  }

  // Supabase returns access_spaces as array for joined select; normalize to single object
  const normalized = {
    ...member,
    access_spaces: Array.isArray(member.access_spaces)
      ? member.access_spaces[0] || null
      : member.access_spaces,
  };

  return <BadgeContent member={normalized} />;
}
