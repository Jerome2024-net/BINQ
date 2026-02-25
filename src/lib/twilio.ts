import twilio from "twilio";

let _client: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!_client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set");
    }

    _client = twilio(accountSid, authToken);
  }
  return _client;
}

const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER || "";

// ========================
// SMS Templates
// ========================
export const smsTemplates = {
  welcome: (prenom: string) =>
    `Bienvenue sur Binq, ${prenom} ! 🚀 Votre portefeuille est prêt. Envoyez, recevez et épargnez sur binq.io`,

  invitation: (prenom: string, tontineName: string, inviteLink: string) =>
    `${prenom} vous invite à rejoindre le groupe d'épargne "${tontineName}" sur Binq. Rejoignez : ${inviteLink}`,

  paymentReminder: (prenom: string, tontineName: string, montant: number, dateLimite: string) =>
    `Binq : ${prenom}, cotisation de ${montant.toFixed(2)} € pour "${tontineName}" due avant le ${dateLimite}. Payez sur binq.io`,

  paymentConfirmation: (prenom: string, tontineName: string, montant: number) =>
    `Binq ✅ : ${prenom}, paiement de ${montant.toFixed(2)} € confirmé pour "${tontineName}".`,

  potReceived: (prenom: string, tontineName: string, montant: number) =>
    `🎉 Binq : ${prenom}, ${montant.toFixed(2)} € crédités sur votre portefeuille depuis "${tontineName}".`,

  tourNotification: (prenom: string, tontineName: string, tourNumero: number, montantEstime: number) =>
    `Binq : ${prenom}, c'est bientôt votre tour (Tour ${tourNumero}) dans "${tontineName}" ! Montant estimé : ${montantEstime.toFixed(2)} €`,

  echeanceReminder: (prenom: string, tontineName: string, montant: number, joursRestants: number) =>
    `⏰ Binq : ${prenom}, plus que ${joursRestants}j pour régler ${montant.toFixed(2)} € pour "${tontineName}".`,

  tourStarted: (prenom: string, tontineName: string, tourNumero: number, beneficiaire: string, montant: number, dateLimite: string) =>
    `Binq : Tour ${tourNumero} de "${tontineName}" lancé. Bénéficiaire : ${beneficiaire}. Cotisation : ${montant.toFixed(2)} € avant le ${dateLimite}.`,

  paymentLate: (prenom: string, tontineName: string, montant: number, joursRetard: number) =>
    `⚠️ Binq : ${prenom}, ${montant.toFixed(2)} € en retard de ${joursRetard}j pour "${tontineName}". Régularisez sur binq.io`,

  tontineCompleted: (prenom: string, tontineName: string) =>
    `🏆 Binq : Le groupe "${tontineName}" est terminé ! Merci ${prenom}. Retrouvez le bilan sur binq.io`,
};

// ========================
// Send SMS
// ========================
export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!FROM_PHONE) {
    console.warn("TWILIO_PHONE_NUMBER not configured, skipping SMS");
    return { success: false, error: "Twilio phone number not configured" };
  }

  // Normaliser le numéro (ajouter +33 si besoin pour la France)
  const phone = normalizePhone(to);
  if (!phone) {
    return { success: false, error: "Numéro de téléphone invalide" };
  }

  try {
    const client = getTwilioClient();
    const message = await client.messages.create({
      body,
      from: FROM_PHONE,
      to: phone,
    });

    return { success: true, sid: message.sid };
  } catch (err) {
    console.error("Twilio SMS error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur envoi SMS",
    };
  }
}

// ========================
// Helpers
// ========================
function normalizePhone(phone: string): string | null {
  if (!phone) return null;

  // Retirer espaces, tirets, points
  let cleaned = phone.replace(/[\s\-.\(\)]/g, "");

  // Déjà au format international
  if (cleaned.startsWith("+")) {
    return cleaned.length >= 10 ? cleaned : null;
  }

  // Format français 0X XX XX XX XX → +33X XX XX XX XX
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "+33" + cleaned.substring(1);
  }

  // Format sans indicatif (9 chiffres français)
  if (/^\d{9}$/.test(cleaned)) {
    return "+33" + cleaned;
  }

  // Retourner tel quel si semble valide
  if (/^\d{10,15}$/.test(cleaned)) {
    return "+" + cleaned;
  }

  return null;
}
