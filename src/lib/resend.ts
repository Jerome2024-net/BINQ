import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const FROM_EMAIL = "Binq <noreply@binq.io>";

// Logo HTML inline compatible tous clients mail
const LOGO_HTML = `
  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
    <tr>
      <td style="vertical-align: middle;">
        <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/0BBAEE5D-B790-4A3E-9345-A4975C84546D_xfvmso" alt="Binq" width="140" style="height: auto; display: block;" />
      </td>
    </tr>
  </table>
`;

// ── Composants réutilisables ──
const emailWrapper = (headerBg: string, headerContent: string, body: string) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
    <div style="background-color: ${headerBg}; padding: 40px 30px; text-align: center;">
      ${LOGO_HTML}
      ${headerContent}
    </div>
    <div style="padding: 30px;">
      ${body}
    </div>
    <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq — Votre portefeuille intelligent. Tous droits réservés.</p>
    </div>
  </div>
`;

const ctaButton = (text: string, href: string, bg: string = "#4f46e5") => `
  <div style="text-align: center; margin: 30px 0;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
      <td align="center" bgcolor="${bg}" style="border-radius: 10px;">
        <a href="${href}" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">${text}</a>
      </td>
    </tr></table>
  </div>
`;

const infoCard = (content: string, border: string = "#e2e8f0", bg: string = "white") => `
  <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 12px; padding: 20px; margin: 20px 0;">
    ${content}
  </div>
`;

const tableRow = (label: string, value: string, valueColor: string = "#1e293b", valueFontSize: string = "15px") => `
  <tr>
    <td style="color: #64748b; padding: 8px 0; font-size: 14px;">${label}</td>
    <td style="color: ${valueColor}; font-weight: 600; text-align: right; padding: 8px 0; font-size: ${valueFontSize};">${value}</td>
  </tr>
`;

// ── Templates d'emails ──
export const emailTemplates = {
  // ─── Bienvenue ───
  welcome: (prenom: string) => ({
    subject: "Bienvenue sur Binq ! 🚀",
    html: emailWrapper("#4f46e5",
      `<p style="color: rgba(255,255,255,0.9); margin-top: 12px; font-size: 16px;">Votre portefeuille intelligent</p>`,
      `
        <h2 style="color: #1e293b; margin-top: 0;">Bienvenue ${prenom} ! 🎉</h2>
        <p style="color: #475569; line-height: 1.6;">
          Votre compte Binq est prêt. Découvrez tout ce que vous pouvez faire :
        </p>
        <ul style="color: #475569; line-height: 2;">
          <li>Envoyer et recevoir de l'argent instantanément</li>
          <li>Créer des liens de paiement</li>
          <li>Épargner avec les Coffres automatiques</li>
          <li>Suivre toutes vos transactions en temps réel</li>
        </ul>
        ${ctaButton("Accéder à mon espace", "https://binq.io/dashboard")}
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">
          Si vous n'avez pas créé ce compte, ignorez cet email.
        </p>
      `
    ),
  }),

  // ─── Invitation tontine ───
  invitation: (prenom: string, tontineName: string, inviteLink: string) => ({
    subject: `${prenom} vous invite à rejoindre "${tontineName}" sur Binq`,
    html: emailWrapper("#4f46e5", "",
      `
        <h2 style="color: #1e293b; margin-top: 0;">Vous êtes invité(e) ! 🎊</h2>
        <p style="color: #475569; line-height: 1.6;">
          <strong>${prenom}</strong> vous invite à rejoindre le groupe d'épargne <strong>"${tontineName}"</strong> sur Binq.
        </p>
        ${infoCard(`
          <p style="color: #64748b; margin: 0; font-size: 14px;">Groupe d'épargne</p>
          <p style="color: #1e293b; margin: 4px 0 0; font-size: 18px; font-weight: 600;">${tontineName}</p>
        `)}
        ${ctaButton("Rejoindre le groupe", inviteLink, "#10b981")}
      `
    ),
  }),

  // ─── Rappel de cotisation ───
  paymentReminder: (prenom: string, tontineName: string, montant: number, dateLimite: string) => ({
    subject: `Rappel : cotisation de ${montant}€ pour "${tontineName}"`,
    html: emailWrapper("#4f46e5", "",
      `
        <h2 style="color: #1e293b; margin-top: 0;">Cotisation en attente 💰</h2>
        <p style="color: #475569; line-height: 1.6;">
          Bonjour <strong>${prenom}</strong>, une cotisation est en attente de paiement.
        </p>
        ${infoCard(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${tableRow("Groupe", tontineName)}
            ${tableRow("Montant", `${montant} €`, "#4f46e5", "18px")}
            ${tableRow("Échéance", dateLimite, "#ef4444")}
          </table>
        `)}
        ${ctaButton("Payer maintenant", "https://binq.io/paiements")}
      `
    ),
  }),

  // ─── Confirmation de paiement ───
  paymentConfirmation: (prenom: string, tontineName: string, montant: number) => ({
    subject: `Paiement de ${montant}€ confirmé ✅`,
    html: emailWrapper("#10b981",
      `<h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">✅ Paiement confirmé</h2>`,
      `
        <p style="color: #475569; line-height: 1.6;">
          Bonjour <strong>${prenom}</strong>, votre paiement a bien été traité.
        </p>
        ${infoCard(`
          <div style="text-align: center;">
            <p style="color: #64748b; margin: 0;">Montant payé</p>
            <p style="color: #10b981; font-size: 32px; font-weight: 700; margin: 8px 0;">${montant} €</p>
            <p style="color: #64748b; margin: 0;">pour <strong>${tontineName}</strong></p>
          </div>
        `)}
        ${ctaButton("Voir mes transactions", "https://binq.io/transactions")}
      `
    ),
  }),

  // ─── Argent reçu (pot) ───
  potReceived: (prenom: string, tontineName: string, montant: number) => ({
    subject: `Vous avez reçu ${montant}€ ! 🎉`,
    html: emailWrapper("#f59e0b",
      `<h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">🎉 Argent reçu !</h2>`,
      `
        <p style="color: #475569; line-height: 1.6;">
          Félicitations <strong>${prenom}</strong> ! Vous avez reçu un versement.
        </p>
        ${infoCard(`
          <div style="text-align: center;">
            <p style="color: #64748b; margin: 0;">Montant crédité</p>
            <p style="color: #f59e0b; font-size: 36px; font-weight: 700; margin: 8px 0;">${montant} €</p>
            <p style="color: #64748b; margin: 0;">Groupe : <strong>${tontineName}</strong></p>
          </div>
        `)}
        ${ctaButton("Voir mon portefeuille", "https://binq.io/portefeuille")}
      `
    ),
  }),

  // ─── C'est votre tour ───
  tourNotification: (prenom: string, tontineName: string, tourNumero: number, datePrevue: string, montantEstime: number) => ({
    subject: `C'est bientôt votre tour ! Tour ${tourNumero} de "${tontineName}"`,
    html: emailWrapper("#8b5cf6",
      `<h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">🎯 C'est votre tour !</h2>`,
      `
        <p style="color: #475569; line-height: 1.6;">
          Bonjour <strong>${prenom}</strong>, vous êtes le prochain bénéficiaire du groupe <strong>"${tontineName}"</strong>.
        </p>
        ${infoCard(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${tableRow("Tour", `Tour ${tourNumero}`)}
            ${tableRow("Date prévue", datePrevue)}
            ${tableRow("Montant estimé", `${montantEstime} €`, "#8b5cf6", "20px")}
          </table>
        `)}
        <p style="color: #475569; line-height: 1.6; font-size: 14px;">
          Le montant sera crédité sur votre portefeuille Binq une fois les cotisations collectées.
        </p>
        ${ctaButton("Voir le groupe", "https://binq.io/dashboard", "#8b5cf6")}
      `
    ),
  }),

  // ─── Échéance imminente ───
  echeanceReminder: (prenom: string, tontineName: string, montant: number, dateLimite: string, joursRestants: number) => ({
    subject: `⏰ Plus que ${joursRestants}j pour votre cotisation "${tontineName}"`,
    html: emailWrapper("#ef4444",
      `<h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">⏰ Échéance imminente</h2>`,
      `
        <p style="color: #475569; line-height: 1.6;">
          Bonjour <strong>${prenom}</strong>, il vous reste <strong style="color: #ef4444;">${joursRestants} jour${joursRestants > 1 ? 's' : ''}</strong> pour régler votre cotisation.
        </p>
        ${infoCard(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${tableRow("Groupe", tontineName)}
            ${tableRow("Montant", `${montant} €`, "#ef4444", "20px")}
            ${tableRow("Date limite", dateLimite, "#ef4444")}
          </table>
        `, "#fecaca", "#fef2f2")}
        <p style="color: #94a3b8; font-size: 13px;">
          Un retard peut entraîner des pénalités sur votre score de confiance Binq.
        </p>
        ${ctaButton("Payer maintenant", "https://binq.io/dashboard", "#ef4444")}
      `
    ),
  }),

  // ─── Nouveau tour démarré ───
  tourStarted: (prenom: string, tontineName: string, tourNumero: number, beneficiaire: string, montant: number, dateLimite: string) => ({
    subject: `Tour ${tourNumero} de "${tontineName}" a démarré`,
    html: emailWrapper("#4f46e5",
      `<h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">🔄 Nouveau tour</h2>`,
      `
        <p style="color: #475569; line-height: 1.6;">
          Bonjour <strong>${prenom}</strong>, un nouveau cycle a démarré dans votre groupe d'épargne.
        </p>
        ${infoCard(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${tableRow("Groupe", tontineName)}
            ${tableRow("Tour", `Tour ${tourNumero}`)}
            ${tableRow("Bénéficiaire", beneficiaire, "#4f46e5")}
            ${tableRow("Cotisation", `${montant} €`, "#1e293b", "18px")}
            ${tableRow("Date limite", dateLimite, "#ef4444")}
          </table>
        `)}
        ${ctaButton("Payer ma cotisation", "https://binq.io/dashboard")}
      `
    ),
  }),

  // ─── Retard de paiement ───
  paymentLate: (prenom: string, tontineName: string, montant: number, joursRetard: number) => ({
    subject: `⚠️ Cotisation en retard de ${joursRetard}j pour "${tontineName}"`,
    html: emailWrapper("#dc2626",
      `<h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">⚠️ Retard de paiement</h2>`,
      `
        <p style="color: #475569; line-height: 1.6;">
          Bonjour <strong>${prenom}</strong>, votre cotisation pour <strong>"${tontineName}"</strong> a <strong style="color: #dc2626;">${joursRetard} jour${joursRetard > 1 ? 's' : ''}</strong> de retard.
        </p>
        ${infoCard(`
          <div style="text-align: center;">
            <p style="color: #64748b; margin: 0;">Montant dû</p>
            <p style="color: #dc2626; font-size: 32px; font-weight: 700; margin: 8px 0;">${montant} €</p>
            <p style="color: #dc2626; font-size: 13px; margin: 0;">Retard de ${joursRetard} jour${joursRetard > 1 ? 's' : ''}</p>
          </div>
        `, "#fecaca", "#fef2f2")}
        <p style="color: #475569; line-height: 1.6; font-size: 14px;">
          Régularisez votre situation rapidement. Les retards impactent votre score de confiance Binq.
        </p>
        ${ctaButton("Régulariser maintenant", "https://binq.io/dashboard", "#dc2626")}
      `
    ),
  }),

  // ─── Groupe d'épargne terminé ───
  tontineCompleted: (prenom: string, tontineName: string, totalTours: number, totalMontant: number) => ({
    subject: `🏆 Le groupe "${tontineName}" est terminé !`,
    html: emailWrapper("#059669",
      `<h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">🏆 Groupe terminé !</h2>`,
      `
        <p style="color: #475569; line-height: 1.6;">
          Félicitations <strong>${prenom}</strong> ! Le groupe d'épargne <strong>"${tontineName}"</strong> est maintenant terminé.
        </p>
        ${infoCard(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align: center; padding: 12px;">
                <p style="color: #64748b; margin: 0; font-size: 13px;">Tours complétés</p>
                <p style="color: #059669; font-size: 28px; font-weight: 700; margin: 4px 0;">${totalTours}</p>
              </td>
              <td style="text-align: center; padding: 12px;">
                <p style="color: #64748b; margin: 0; font-size: 13px;">Total distribué</p>
                <p style="color: #059669; font-size: 28px; font-weight: 700; margin: 4px 0;">${totalMontant} €</p>
              </td>
            </tr>
          </table>
        `)}
        <p style="color: #475569; line-height: 1.6; font-size: 14px;">
          Merci de votre participation ! Retrouvez votre historique dans votre portefeuille Binq.
        </p>
        ${ctaButton("Voir mon portefeuille", "https://binq.io/portefeuille", "#059669")}
      `
    ),
  }),
};
