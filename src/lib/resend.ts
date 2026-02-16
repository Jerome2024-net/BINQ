import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = "Binq <noreply@binq.io>";

// Templates d'emails
export const emailTemplates = {
  // Email de bienvenue après inscription
  welcome: (prenom: string) => ({
    subject: "Bienvenue sur Binq ! 🌟",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⭐ Binq</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">La tontine moderne et sécurisée</p>
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
            <a href="https://binq.io/dashboard" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Accéder à mon espace
            </a>
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
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⭐ Binq</h1>
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
            <a href="${inviteLink}" style="background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Rejoindre la tontine
            </a>
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
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⭐ Binq</h1>
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
            <a href="https://binq.io/paiements" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Payer maintenant
            </a>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
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
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Paiement confirmé</h1>
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
            <a href="https://binq.io/transactions" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Voir mes transactions
            </a>
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
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Pot reçu !</h1>
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
            <a href="https://binq.io/portefeuille" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Voir mon portefeuille
            </a>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 20px 30px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Binq. Tous droits réservés.</p>
        </div>
      </div>
    `,
  }),
};
