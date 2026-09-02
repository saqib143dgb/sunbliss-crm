import { generateText } from 'ai';

export const maxDuration = 30;

const SYSTEM = `You are Ask CRM, a read-only assistant for Sunbliss Residences CRM.
Answer ONLY from the CRM snapshot supplied with the request.
Never invent a customer, unit, amount, date, status, count, salesperson, broker, receipt, document status, extension or action.
If the snapshot does not support the answer, say that the available CRM snapshot is not enough to answer accurately.
If the question is unrelated to CRM data, say you can answer questions about the CRM data only.
The assistant is strictly read-only: never claim to create, update, delete, send, approve or change anything.
Prefer the precomputed aggregates in the snapshot for totals and counts. Use detail rows only when the question needs filtering or a named customer/unit.
Keep answers concise and professional. Use AED for money. When a customer name is ambiguous, identify the matching unit(s) instead of guessing.`;

function bodyOf(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, feature: 'ask-crm-ai-preview', readOnly: true });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = bodyOf(req);
  const question = String(body.question || '').trim();
  const snapshot = body.snapshot && typeof body.snapshot === 'object' ? body.snapshot : null;
  if (!question) return res.status(400).json({ error: 'Question is required' });
  if (!snapshot) return res.status(400).json({ error: 'CRM snapshot is required' });
  if (question.length > 1200) return res.status(400).json({ error: 'Question is too long' });

  const snapshotText = JSON.stringify(snapshot);
  if (snapshotText.length > 150000) {
    return res.status(413).json({ error: 'CRM snapshot is too large for this preview request' });
  }

  try {
    const { text } = await generateText({
      model: 'openai/gpt-5.6-sol',
      system: SYSTEM,
      prompt: `CRM SNAPSHOT (authoritative for this answer):\n${snapshotText}\n\nUSER QUESTION:\n${question}`,
      maxOutputTokens: 600,
      providerOptions: {
        gateway: {
          disallowPromptTraining: true,
          tags: ['feature:ask-crm', 'environment:preview']
        }
      }
    });
    return res.status(200).json({ answer: String(text || '').trim(), mode: 'ai', readOnly: true });
  } catch (error) {
    console.error('Ask CRM AI error', error);
    return res.status(503).json({ error: 'AI answer service is temporarily unavailable' });
  }
}
