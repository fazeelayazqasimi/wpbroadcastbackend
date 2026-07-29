import { Setting } from '../models/Setting.js';

export interface WACreds {
  token: string;
  phoneId: string;
  apiVersion?: string;
}

async function getWACreds(overrideCreds?: WACreds) {
  if (overrideCreds?.token && overrideCreds?.phoneId) {
    return {
      token: overrideCreds.token,
      phoneId: overrideCreds.phoneId,
      verifyToken: 'broadcast_verify',
    };
  }
  const token = await Setting.findOne({ key: 'WHATSAPP_ACCESS_TOKEN' });
  const phoneId = await Setting.findOne({ key: 'WHATSAPP_PHONE_NUMBER_ID' });
  const verifyToken = await Setting.findOne({ key: 'WHATSAPP_VERIFY_TOKEN' });
  return {
    token: token?.value || process.env.WA_TOKEN || '',
    phoneId: phoneId?.value || process.env.WA_PHONE_ID || '',
    verifyToken: verifyToken?.value || 'broadcast_verify',
  };
}

export async function sendWAMessage(to: string, body: string, companyCreds?: WACreds) {
  const { token, phoneId } = await getWACreds(companyCreds);
  if (!token || !phoneId) {
    throw new Error('WhatsApp credentials not configured');
  }

  const apiVersion = companyCreds?.apiVersion || 'v22.0';

  const cleanNum = to.replace(/[^0-9]/g, '');
  const res = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanNum,
        type: 'text',
        text: { body },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'WhatsApp API error');
  }

  return {
    waMessageId: data.messages?.[0]?.id || null,
  };
}

export async function verifyWebhook(
  mode: string,
  token: string,
  challenge: string
): Promise<string | null> {
  if (mode === 'subscribe' && token === (await getWACreds()).verifyToken) {
    return challenge;
  }
  return null;
}

export function parseWebhookPayload(body: any) {
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value) return null;

  const messages = value.messages;
  const metadata = value.metadata;

  if (!messages || !metadata) return null;

  const msg = messages[0];
  return {
    from: msg.from,
    msgBody: msg.text?.body || '',
    waMessageId: msg.id,
    timestamp: msg.timestamp,
    displayPhone: metadata.display_phone_number,
    phoneId: metadata.phone_number_id,
  };
}
