/**
 * Unified notification helper — sends both Email + SMS in parallel.
 * Use this from client-side code instead of calling /api/email/send directly.
 * SMS is sent only if the user has a phone number and notifications_sms enabled.
 */

interface NotificationData {
  type: string;
  emailTo?: string; // email address for Resend
  userId?: string; // user id to look up phone + preferences
  phone?: string; // direct phone number (optional)
  data: Record<string, unknown>;
}

export async function sendNotification(params: NotificationData): Promise<void> {
  const promises: Promise<unknown>[] = [];

  // 1. Send email if emailTo provided
  if (params.emailTo) {
    promises.push(
      fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: params.type,
          to: params.emailTo,
          data: params.data,
        }),
      }).catch((e) => console.warn("Email send failed (non-blocking):", e))
    );
  }

  // 2. Send SMS if userId or phone provided
  if (params.userId || params.phone) {
    promises.push(
      fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: params.type,
          to: params.phone || params.userId,
          data: { ...params.data, userId: params.userId },
        }),
      }).catch((e) => console.warn("SMS send failed (non-blocking):", e))
    );
  }

  await Promise.allSettled(promises);
}
