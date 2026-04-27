/**
 * Z-API — envio de texto. Mesmo padrão usado em zapi-monitor/server.js.
 */
export type ZapiResult = {
  ok: boolean;
  status: number;
  data: unknown;
  dryRun?: boolean;
};

export async function sendZapiText(
  phone: string,
  message: string,
): Promise<ZapiResult> {
  const dryRun = process.env.ZAPI_DRY_RUN === 'true';
  if (dryRun) {
    console.log('[zapi:DRY_RUN] →', phone);
    console.log(message);
    return { ok: true, status: 200, data: { dryRun: true }, dryRun: true };
  }

  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    throw new Error(
      'Z-API não configurado: defina ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN',
    );
  }

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': clientToken,
    },
    body: JSON.stringify({ phone, message }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
