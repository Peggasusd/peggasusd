import type { SendInput } from '@/types/domain';
import type { LnurlPayRequestDetails, LnurlAuthRequestDetails } from '@breeztech/breez-sdk-spark';
import { t } from '@/services/locale';

export function getPaymentMethodName(input: SendInput | null): string {
  if (!input) return '';
  switch (input.parsedInput.type) {
    case 'bolt11Invoice':
      return t('send.lightningInvoice');
    case 'sparkAddress':
      return t('send.sparkAddress');
    case 'bitcoinAddress':
      return t('send.bitcoinAddress');
    case 'lnurlPay':
      return t('send.lnurlPay');
    case 'lightningAddress':
      return t('send.lightningAddress');
    case 'lnurlAuth':
      return t('send.lnurlAuth');
    case 'crossChainAddress':
      return t('send.sendUsd');
    default:
      return t('send.payment');
  }
}

export function getLnurlPayRequestDetails(input: SendInput | null): LnurlPayRequestDetails | null {
  if (input && input.parsedInput.type === 'lnurlPay') {
    return input.parsedInput;
  }
  if (input && input.parsedInput.type === 'lightningAddress') {
    return input.parsedInput.payRequest;
  }
  return null;
}

export function getLnurlAuthRequestDetails(input: SendInput | null): LnurlAuthRequestDetails | null {
  if (input && input.parsedInput.type === 'lnurlAuth') {
    return input.parsedInput;
  }
  return null;
}
