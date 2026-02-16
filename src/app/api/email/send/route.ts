import { NextRequest, NextResponse } from "next/server";
import { resend, FROM_EMAIL, emailTemplates } from "@/lib/resend";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: "Type et destinataire requis" },
        { status: 400 }
      );
    }

    let emailContent;

    switch (type) {
      case "welcome":
        emailContent = emailTemplates.welcome(data.prenom);
        break;

      case "invitation":
        emailContent = emailTemplates.invitation(
          data.prenom,
          data.tontineName,
          data.inviteLink
        );
        break;

      case "payment-reminder":
        emailContent = emailTemplates.paymentReminder(
          data.prenom,
          data.tontineName,
          data.montant,
          data.dateLimite
        );
        break;

      case "payment-confirmation":
        emailContent = emailTemplates.paymentConfirmation(
          data.prenom,
          data.tontineName,
          data.montant
        );
        break;

      case "pot-received":
        emailContent = emailTemplates.potReceived(
          data.prenom,
          data.tontineName,
          data.montant
        );
        break;

      default:
        return NextResponse.json(
          { error: `Type d'email inconnu: ${type}` },
          { status: 400 }
        );
    }

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result?.id });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
