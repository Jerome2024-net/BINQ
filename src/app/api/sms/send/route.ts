import { NextRequest, NextResponse } from "next/server";
import { sendSMS, smsTemplates } from "@/lib/twilio";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    // "to" peut être un numéro de téléphone direct OU un userId
    // Si c'est un userId, on récupère le téléphone et on vérifie notificationsSms
    let phoneNumber = to;

    if (data?.userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("telephone, notifications_sms, prenom")
        .eq("id", data.userId)
        .single();

      if (!profile) {
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 404 }
        );
      }

      if (!profile.notifications_sms) {
        return NextResponse.json({
          success: false,
          skipped: true,
          reason: "SMS notifications disabled for this user",
        });
      }

      if (!profile.telephone) {
        return NextResponse.json({
          success: false,
          skipped: true,
          reason: "No phone number on profile",
        });
      }

      phoneNumber = profile.telephone;
      if (!data.prenom) data.prenom = profile.prenom || "Membre";
    }

    if (!type || !phoneNumber) {
      return NextResponse.json(
        { error: "Type et destinataire (numéro ou userId) requis" },
        { status: 400 }
      );
    }

    let smsBody: string;

    switch (type) {
      case "welcome":
        smsBody = smsTemplates.welcome(data.prenom);
        break;

      case "invitation":
        smsBody = smsTemplates.invitation(
          data.prenom,
          data.tontineName,
          data.inviteLink
        );
        break;

      case "payment-reminder":
        smsBody = smsTemplates.paymentReminder(
          data.prenom,
          data.tontineName,
          data.montant,
          data.dateLimite
        );
        break;

      case "payment-confirmation":
        smsBody = smsTemplates.paymentConfirmation(
          data.prenom,
          data.tontineName,
          data.montant
        );
        break;

      case "pot-received":
        smsBody = smsTemplates.potReceived(
          data.prenom,
          data.tontineName,
          data.montant
        );
        break;

      case "tour-notification":
        smsBody = smsTemplates.tourNotification(
          data.prenom,
          data.tontineName,
          data.tourNumero,
          data.montantEstime
        );
        break;

      case "echeance-reminder":
        smsBody = smsTemplates.echeanceReminder(
          data.prenom,
          data.tontineName,
          data.montant,
          data.joursRestants
        );
        break;

      case "tour-started":
        smsBody = smsTemplates.tourStarted(
          data.prenom,
          data.tontineName,
          data.tourNumero,
          data.beneficiaire,
          data.montant,
          data.dateLimite
        );
        break;

      case "payment-late":
        smsBody = smsTemplates.paymentLate(
          data.prenom,
          data.tontineName,
          data.montant,
          data.joursRetard
        );
        break;

      case "tontine-completed":
        smsBody = smsTemplates.tontineCompleted(
          data.prenom,
          data.tontineName
        );
        break;

      default:
        return NextResponse.json(
          { error: `Type SMS inconnu: ${type}` },
          { status: 400 }
        );
    }

    const result = await sendSMS(phoneNumber, smsBody);

    return NextResponse.json(result);
  } catch (error) {
    console.error("SMS API error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
