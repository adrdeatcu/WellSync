// src/routes/emergencyRoutes.ts
import express from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import twilio from 'twilio';

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER!;

const client = twilio(accountSid, authToken);

// POST /api/emergency-call
router.post(
  '/emergency-call',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { contactName, contactPhone, address, fullName } = req.body as {
        contactName?: string;
        contactPhone?: string;
        address?: string;
        fullName?: string;
      };

      if (!contactPhone) {
        return res.status(400).json({ error: 'contactPhone is required' });
      }

      const safeContactName = contactName || 'your contact';
      const safeFullName = fullName || 'the user';
      const safeAddress = address || 'an unknown location';

      // Build TTS message (short and simple)
      const message = `
        This is an automated WellSync alert.
        A possible fall was detected for ${safeFullName}.
        Approximate location: ${safeAddress}.
        This is a demo call. No emergency services have been contacted.
      `;

      // Easiest: send TwiML directly via the twiml property (no extra URL needed) [web:1450][web:1455]
      const twiml = `
        <Response>
          <Say language="en-US" voice="alice">
            ${message}
          </Say>
        </Response>
      `;

      const call = await client.calls.create({
        to: contactPhone,
        from: twilioNumber,
        twiml,
      });

      return res.json({ status: 'ok', callSid: call.sid });
    } catch (err) {
      console.error('Error creating emergency call:', err);
      return res.status(500).json({ error: 'Failed to create emergency call' });
    }
  }
);

export default router;