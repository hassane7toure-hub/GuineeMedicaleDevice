import { mapProviderStatus, type CheckoutInput } from "./provider";

const CHECKOUT_URL = "https://api-checkout.cinetpay.com/v2/payment";
const CHECK_URL = "https://api-checkout.cinetpay.com/v2/payment/check";

export class ProviderUnavailable extends Error {}

function credentials() {
  const apikey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  const currency = process.env.CINETPAY_CURRENCY;
  if (!apikey || !siteId || currency !== "GNF") {
    throw new Error("CinetPay n'est pas configuré pour un encaissement en GNF.");
  }
  return { apikey, siteId, currency };
}

export async function createCinetPayCheckout(input: CheckoutInput) {
  const { apikey, siteId, currency } = credentials();
  if (!Number.isSafeInteger(input.amountGnf) || input.amountGnf <= 0) {
    throw new Error("Montant impossible à transmettre au prestataire.");
  }
  let response: Response;
  try {
    response = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        apikey,
        site_id: siteId,
        transaction_id: input.paymentId,
        amount: input.amountGnf,
        currency,
        description: input.description.slice(0, 180),
        customer_name: input.customerName.slice(0, 80),
        customer_surname: "Client",
        customer_email: input.customerEmail,
        customer_phone_number: input.customerPhone,
        customer_country: "GN",
        notify_url: input.notifyUrl,
        return_url: input.returnUrl,
        channels: "ALL",
        lang: "FR",
        metadata: input.orderReference,
      }),
    });
  } catch {
    throw new ProviderUnavailable("Le prestataire de paiement ne répond pas. La commande est conservée.");
  }
  const body = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
    data?: { payment_url?: string; payment_token?: string };
  } | null;
  const url = body?.data?.payment_url;
  if (!response.ok || !url) {
    throw new Error(body?.message || "Le prestataire n'a pas ouvert de page de paiement.");
  }
  return { redirectUrl: url, providerRef: input.paymentId };
}

export async function verifyCinetPayNotification(raw: string) {
  const params = new URLSearchParams(raw);
  let transactionId = params.get("cpm_trans_id") || params.get("transaction_id");
  if (!transactionId) {
    try {
      const json = JSON.parse(raw) as { cpm_trans_id?: string; transaction_id?: string };
      transactionId = json.cpm_trans_id || json.transaction_id || null;
    } catch {
      transactionId = null;
    }
  }
  if (!transactionId) throw new Error("Notification sans transaction.");
  const site = params.get("cpm_site_id");
  if (site && site !== process.env.CINETPAY_SITE_ID) throw new Error("Site marchand inattendu.");
  const checked = await checkCinetPay(transactionId);
  return {
    paymentId: transactionId,
    provider: "cinetpay",
    providerRef: transactionId,
    providerEventId: `cinetpay:${transactionId}:${checked.status}`,
    status: checked.status,
    method: checked.method,
    payload: raw,
  };
}

async function checkCinetPay(transactionId: string) {
  const { apikey, siteId } = credentials();
  let response: Response;
  try {
    response = await fetch(CHECK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ apikey, site_id: siteId, transaction_id: transactionId }),
    });
  } catch {
    throw new ProviderUnavailable("Vérification prestataire indisponible.");
  }
  if (!response.ok) throw new ProviderUnavailable("Vérification prestataire refusée.");
  const body = (await response.json()) as { data?: { status?: string; payment_method?: string } };
  return {
    status: mapProviderStatus(body.data?.status || "REVIEW"),
    method: body.data?.payment_method || "",
  };
}
