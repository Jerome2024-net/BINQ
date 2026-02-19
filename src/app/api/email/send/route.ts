import { NextRequest, NextResponse } from "next/server";
import { getResend, FROM_EMAIL, emailTemplates } from "@/lib/resend";
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

      case "tour-notification":
        emailContent = emailTemplates.tourNotification(
          data.prenom,
          data.tontineName,
          data.tourNumero,
          data.datePrevue,
          data.montantEstime
        );
        break;

      case "echeance-reminder":
        emailContent = emailTemplates.echeanceReminder(
          data.prenom,
          data.tontineName,
          data.montant,
          data.dateLimite,
          data.joursRestants
        );
        break;

      case "tour-started":
        emailContent = emailTemplates.tourStarted(
          data.prenom,
          data.tontineName,
          data.tourNumero,
          data.beneficiaire,
          data.montant,
          data.dateLimite
        );
        break;

      case "payment-late":
        emailContent = emailTemplates.paymentLate(
          data.prenom,
          data.tontineName,
          data.montant,
          data.joursRetard
        );
        break;

      case "tontine-completed":
        emailContent = emailTemplates.tontineCompleted(
          data.prenom,
          data.tontineName,
          data.totalTours,
          data.totalMontant
        );
        break;

      default:
        return NextResponse.json(
          { error: `Type d'email inconnu: ${type}` },
          { status: 400 }
        );
    }

    const { data: result, error } = await getResend().emails.send({
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

    // === SMS parallèle (non-bloquant) ===
    // Si un userId est fourni, envoyer le SMS en parallèle
    if (data?.userId || data?.phone) {
      trySendSMS(type, data).catch((e) =>
        console.warn("SMS send failed (non-blocking):", e)
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

// ========================
// SMS Helper (envoi parallèle)
// ========================
async function trySendSMS(type: string, data: Record<string, unknown>) {
  let phone = data.phone as string | undefined;

  // Si pas de numéro direct, chercher via userId
  if (!phone && data.userId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("telephone, notifications_sms")
      .eq("id", data.userId)
      .single();

    if (!profile?.notifications_sms || !profile?.telephone) return;
    phone = profile.telephone;
  }

  if (!phone) return;

  const templateFn: Record<string, () => string> = {
    "welcome": () => smsTemplates.welcome(data.prenom as string),
    "invitation": () => smsTemplates.invitation(data.prenom as string, data.tontineName as string, data.inviteLink as string),
    "payment-reminder": () => smsTemplates.paymentReminder(data.prenom as string, data.tontineName as string, data.montant as number, data.dateLimite as string),
    "payment-confirmation": () => smsTemplates.paymentConfirmation(data.prenom as string, data.tontineName as string, data.montant as number),
    "pot-received": () => smsTemplates.potReceived(data.prenom as string, data.tontineName as string, data.montant as number),
    "tour-notification": () => smsTemplates.tourNotification(data.prenom as string, data.tontineName as string, data.tourNumero as number, data.montantEstime as number),
    "echeance-reminder": () => smsTemplates.echeanceReminder(data.prenom as string, data.tontineName as string, data.montant as number, data.joursRestants as number),
    "tour-started": () => smsTemplates.tourStarted(data.prenom as string, data.tontineName as string, data.tourNumero as number, data.beneficiaire as string, data.montant as number, data.dateLimite as string),
    "payment-late": () => smsTemplates.paymentLate(data.prenom as string, data.tontineName as string, data.montant as number, data.joursRetard as number),
    "tontine-completed": () => smsTemplates.tontineCompleted(data.prenom as string, data.tontineName as string),
  };

  const fn = templateFn[type];
  if (!fn) return;

  await sendSMS(phone, fn());
}
