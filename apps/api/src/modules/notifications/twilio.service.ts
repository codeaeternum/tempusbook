import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
    private client?: Twilio;
    private readonly logger = new Logger(TwilioService.name);

    // Credentials
    private readonly accountSid = process.env.TWILIO_ACCOUNT_SID;
    private readonly authToken = process.env.TWILIO_AUTH_TOKEN;
    private readonly fromWhatsapp = process.env.TWILIO_WHATSAPP_FROM;
    private readonly fromSms = process.env.TWILIO_SMS_FROM;

    constructor() {
        if (this.accountSid && this.authToken && !this.accountSid.includes('mock')) {
            this.client = new Twilio(this.accountSid, this.authToken);
        } else {
            this.logger.warn('Twilio credentials missing or mocked in .env. SMS/WhatsApp will be simulated in the console.');
        }
    }

    /**
     * Dispatch an Omnichannel B2C Message
     * @param to Phone number with country code (e.g. +521234567890)
     * @param body The message content
     * @param channel 'SMS' or 'WHATSAPP'
     */
    async sendOmnichannelB2CMessage(to: string, body: string, channel: 'SMS' | 'WHATSAPP' = 'WHATSAPP') {
        const isMockMode = !this.client;

        if (isMockMode) {
            this.logger.log(`\n==============================================\n[MOCK TWILIO ${channel}]\nTo: ${to}\nMessage: ${body}\n==============================================`);
            return { status: 'mocked', sid: `mock_${Date.now()}` };
        }

        try {
            if (channel === 'WHATSAPP') {
                const message = await this.client!.messages.create({
                    body: body,
                    from: `whatsapp:${this.fromWhatsapp}`,
                    to: `whatsapp:${to}`
                });
                this.logger.log(`WhatsApp sent successfully to ${to}. SID: ${message.sid}`);
                return message;
            } else {
                // SMS
                const message = await this.client!.messages.create({
                    body: body,
                    from: this.fromSms as string,
                    to: to
                });
                this.logger.log(`SMS sent successfully to ${to}. SID: ${message.sid}`);
                return message;
            }
        } catch (error) {
            this.logger.error(`Failed to send ${channel} via Twilio to ${to}:`, error);
            // Non-blocking for the rest of the application
            return null;
        }
    }
}
