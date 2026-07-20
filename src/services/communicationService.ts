import { AppSettings, CommunicationLog, Party } from '../types';

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
  documentName?: string;
}

export async function sendWhatsAppMessage(
  message: WhatsAppMessage,
  settings: AppSettings,
  onLog: (log: Omit<CommunicationLog, 'id' | 'timestamp'>) => void
): Promise<{ success: boolean; message: string; usedNumber: string }> {
  const { alternateNumberVerification, requirePinForShare } = settings.whatsappSettings;
  let targetNumber = message.to;
  let status: 'Sent' | 'Delivered' | 'Failed' = 'Sent';
  let usedNumber = targetNumber;

  // Simulate failover logic
  if (!targetNumber || targetNumber.length < 10) {
    if (alternateNumberVerification && settings.company.alternatePhone) {
      targetNumber = settings.company.alternatePhone;
      usedNumber = targetNumber;
      console.log(`Primary number invalid. Failing over to alternate: ${targetNumber}`);
    } else {
      status = 'Failed';
      onLog({
        type: 'WhatsApp',
        recipient: 'Unknown',
        recipientNumber: targetNumber || 'N/A',
        status: 'Failed',
        subject: 'WhatsApp Dispatch',
        content: message.body,
        direction: 'Outbound'
      });
      return { success: false, message: 'Invalid recipient number and no alternate available.', usedNumber: targetNumber };
    }
  }

  // Simulate API Call
  console.log(`[WhatsApp API] Sending to ${targetNumber}: ${message.body}`);
  
  onLog({
    type: 'WhatsApp',
    recipient: targetNumber,
    recipientNumber: targetNumber,
    status: 'Sent',
    subject: 'WhatsApp Dispatch',
    content: message.body,
    direction: 'Outbound'
  });

  return { success: true, message: 'Message queued for delivery.', usedNumber: targetNumber };
}
