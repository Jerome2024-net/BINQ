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

// Logo HTML inline compatible tous clients mail (identique au logo de l'app)
const LOGO_HTML = `
  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
    <tr>
      <td style="vertical-align: middle;">
        <img src="https://res.cloudinary.com/dn8ed1doa/image/upload/ChatGPT_Image_24_f%C3%A9vr._2026_15_44_47_sgwgvi" alt="Binq" width="140" style="height: auto; display: block;" />
      </td>
    </tr>
  </table>
`;

// Templates d'emails
export const emailTemplates = {
  // Email de bienvenue après inscription
  welcome: (prenom: string) => ({
    subject: "Bienvenue sur Binq ! 🌟",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
          <p style="color: rgba(255,255,255,0.9); margin-top: 12px; font-size: 16px;">La tontine moderne et sécurisée</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Bienvenue ${prenom} ! 🎉</h2>
          <p style="color: #475569; line-height: 1.6;">
            Votre compte Binq a été créé avec succès. Vous pouvez maintenant :
          </p>
          <ul style="color: #475569; line-height: 2;">
            <li>Créer ou rejoindre une tontine</li>
            <li>Inviter vos proches</li>
            <li>Gérer vos cotisations en toute sécurité</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#4f46e5" style="border-radius: 8px;">
                <a href="https://binq.io/dashboard" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Accéder à mon espace</a>
              </td>
            </tr></table>
          </div>
          <p style="color: #94a3b8; font-size: 13px; text-align: center;">
            Si vous n'avez pas créé ce compte, ignorez cet email.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Notification d'invitation à une tontine
  invitation: (prenom: string, tontineName: string, inviteLink: string) => ({
    subject: `${prenom} vous invite à rejoindre "${tontineName}" sur Binq`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Vous êtes invité(e) ! 🎊</h2>
          <p style="color: #475569; line-height: 1.6;">
            <strong>${prenom}</strong> vous invite à rejoindre la tontine <strong>"${tontineName}"</strong> sur Binq.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #64748b; margin: 0; font-size: 14px;">Tontine</p>
            <p style="color: #1e293b; margin: 4px 0 0; font-size: 18px; font-weight: 600;">${tontineName}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#10b981" style="border-radius: 8px;">
                <a href="${inviteLink}" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Rejoindre la tontine</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Rappel de paiement
  paymentReminder: (prenom: string, tontineName: string, montant: number, dateLimite: string) => ({
    subject: `Rappel : cotisation de ${montant}€ pour "${tontineName}"`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin-top: 0;">Rappel de cotisation 💰</h2>
          <p style="color: #475569; line-height: 1.6;">
            Bonjour <strong>${prenom}</strong>, un paiement est en attente pour votre tontine.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b;">Tontine</span>
              <span style="color: #1e293b; font-weight: 600;">${tontineName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b;">Montant</span>
              <span style="color: #4f46e5; font-weight: 700; font-size: 18px;">${montant} €</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Date limite</span>
              <span style="color: #ef4444; font-weight: 600;">${dateLimite}</span>
            </div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#4f46e5" style="border-radius: 8px;">
                <a href="https://binq.io/paiements" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Payer maintenant</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Confirmation de paiement
  paymentConfirmation: (prenom: string, tontineName: string, montant: number) => ({
    subject: `Paiement de ${montant}€ confirmé pour "${tontineName}" ✅`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
          <h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">✅ Paiement confirmé</h2>
        </div>
        <div style="padding: 30px;">
          <p style="color: #475569; line-height: 1.6;">
            Bonjour <strong>${prenom}</strong>, votre paiement a bien été reçu !
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #64748b; margin: 0;">Montant payé</p>
            <p style="color: #10b981; font-size: 32px; font-weight: 700; margin: 8px 0;">${montant} €</p>
            <p style="color: #64748b; margin: 0;">pour <strong>${tontineName}</strong></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#4f46e5" style="border-radius: 8px;">
                <a href="https://binq.io/transactions" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Voir mes transactions</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Notification de pot reçu
  potReceived: (prenom: string, tontineName: string, montant: number) => ({
    subject: `Vous avez reçu ${montant}€ de "${tontineName}" ! 🎉`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #f59e0b; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
          <h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">🎉 Pot reçu !</h2>
        </div>
        <div style="padding: 30px;">
          <p style="color: #475569; line-height: 1.6;">
            Félicitations <strong>${prenom}</strong> ! C'est votre tour !
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #64748b; margin: 0;">Montant reçu</p>
            <p style="color: #f59e0b; font-size: 36px; font-weight: 700; margin: 8px 0;">${montant} €</p>
            <p style="color: #64748b; margin: 0;">de la tontine <strong>${tontineName}</strong></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#4f46e5" style="border-radius: 8px;">
                <a href="https://binq.io/portefeuille" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Voir mon portefeuille</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Notification : c'est votre tour (prochain bénéficiaire)
  tourNotification: (prenom: string, tontineName: string, tourNumero: number, datePrevue: string, montantEstime: number) => ({
    subject: `C'est bientôt votre tour ! Tour ${tourNumero} de "${tontineName}"`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #8b5cf6; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
          <h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">🎯 C'est votre tour !</h2>
        </div>
        <div style="padding: 30px;">
          <p style="color: #475569; line-height: 1.6;">
            Bonjour <strong>${prenom}</strong>, vous êtes le prochain bénéficiaire de la tontine <strong>"${tontineName}"</strong>.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Tour</td>
                <td style="color: #1e293b; font-weight: 600; text-align: right; padding: 8px 0;">Tour ${tourNumero}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Date prévue</td>
                <td style="color: #1e293b; font-weight: 600; text-align: right; padding: 8px 0;">${datePrevue}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Montant estimé</td>
                <td style="color: #8b5cf6; font-weight: 700; font-size: 20px; text-align: right; padding: 8px 0;">${montantEstime} €</td>
              </tr>
            </table>
          </div>
          <p style="color: #475569; line-height: 1.6; font-size: 14px;">
            Assurez-vous que tous les membres ont payé leur cotisation pour recevoir le pot à temps.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#8b5cf6" style="border-radius: 8px;">
                <a href="https://binq.io/dashboard" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Voir ma tontine</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Notification : échéance de cotisation imminente (J-3 / J-1)
  echeanceReminder: (prenom: string, tontineName: string, montant: number, dateLimite: string, joursRestants: number) => ({
    subject: `⏰ Plus que ${joursRestants}j pour payer votre cotisation "${tontineName}"`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #ef4444; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
          <h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">⏰ Échéance imminente</h2>
        </div>
        <div style="padding: 30px;">
          <p style="color: #475569; line-height: 1.6;">
            Bonjour <strong>${prenom}</strong>, il vous reste <strong style="color: #ef4444;">${joursRestants} jour${joursRestants > 1 ? 's' : ''}</strong> pour régler votre cotisation.
          </p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Tontine</td>
                <td style="color: #1e293b; font-weight: 600; text-align: right; padding: 8px 0;">${tontineName}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Montant</td>
                <td style="color: #ef4444; font-weight: 700; font-size: 20px; text-align: right; padding: 8px 0;">${montant} €</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Date limite</td>
                <td style="color: #ef4444; font-weight: 600; text-align: right; padding: 8px 0;">${dateLimite}</td>
              </tr>
            </table>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">
            Un retard de paiement peut entraîner des pénalités et affecter les autres membres.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#ef4444" style="border-radius: 8px;">
                <a href="https://binq.io/dashboard" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Payer maintenant</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Notification : nouveau tour démarré
  tourStarted: (prenom: string, tontineName: string, tourNumero: number, beneficiaire: string, montant: number, dateLimite: string) => ({
    subject: `Tour ${tourNumero} de "${tontineName}" a démarré`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
          <h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">🔄 Nouveau tour</h2>
        </div>
        <div style="padding: 30px;">
          <p style="color: #475569; line-height: 1.6;">
            Bonjour <strong>${prenom}</strong>, un nouveau tour vient de démarrer dans votre tontine.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Tontine</td>
                <td style="color: #1e293b; font-weight: 600; text-align: right; padding: 8px 0;">${tontineName}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Tour</td>
                <td style="color: #1e293b; font-weight: 600; text-align: right; padding: 8px 0;">Tour ${tourNumero}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Bénéficiaire</td>
                <td style="color: #4f46e5; font-weight: 600; text-align: right; padding: 8px 0;">${beneficiaire}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Cotisation</td>
                <td style="color: #1e293b; font-weight: 700; font-size: 18px; text-align: right; padding: 8px 0;">${montant} €</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0;">Date limite</td>
                <td style="color: #ef4444; font-weight: 600; text-align: right; padding: 8px 0;">${dateLimite}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#4f46e5" style="border-radius: 8px;">
                <a href="https://binq.io/dashboard" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Payer ma cotisation</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Notification : retard de paiement
  paymentLate: (prenom: string, tontineName: string, montant: number, joursRetard: number) => ({
    subject: `⚠️ Cotisation en retard de ${joursRetard}j pour "${tontineName}"`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
          <h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">⚠️ Retard de paiement</h2>
        </div>
        <div style="padding: 30px;">
          <p style="color: #475569; line-height: 1.6;">
            Bonjour <strong>${prenom}</strong>, votre cotisation pour <strong>"${tontineName}"</strong> est en retard de <strong style="color: #dc2626;">${joursRetard} jour${joursRetard > 1 ? 's' : ''}</strong>.
          </p>
          <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #64748b; margin: 0;">Montant dû</p>
            <p style="color: #dc2626; font-size: 32px; font-weight: 700; margin: 8px 0;">${montant} €</p>
            <p style="color: #dc2626; font-size: 13px; margin: 0;">Retard de ${joursRetard} jour${joursRetard > 1 ? 's' : ''}</p>
          </div>
          <p style="color: #475569; line-height: 1.6; font-size: 14px;">
            Régularisez votre situation au plus vite pour éviter les pénalités et ne pas pénaliser les autres membres de votre tontine.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#dc2626" style="border-radius: 8px;">
                <a href="https://binq.io/dashboard" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Régulariser maintenant</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),

  // Notification : tontine terminée (tous les tours complétés)
  tontineCompleted: (prenom: string, tontineName: string, totalTours: number, totalMontant: number) => ({
    subject: `🏆 La tontine "${tontineName}" est terminée !`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #059669; padding: 40px 30px; text-align: center;">
          ${LOGO_HTML}
          <h2 style="color: white; margin: 0; font-size: 22px; margin-top: 12px;">🏆 Tontine terminée !</h2>
        </div>
        <div style="padding: 30px;">
          <p style="color: #475569; line-height: 1.6;">
            Félicitations <strong>${prenom}</strong> ! La tontine <strong>"${tontineName}"</strong> est maintenant terminée.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
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
          </div>
          <p style="color: #475569; line-height: 1.6; font-size: 14px;">
            Merci d'avoir participé ! Vous pouvez créer ou rejoindre une nouvelle tontine dès maintenant.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>
              <td align="center" bgcolor="#059669" style="border-radius: 8px;">
                <a href="https://binq.io/explorer" target="_blank" style="display: block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Découvrir d'autres tontines</a>
              </td>
            </tr></table>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),
};
