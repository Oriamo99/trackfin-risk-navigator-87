/**
 * Checks that API keys are not directly exposed in production builds.
 * In production, calls should go through a backend proxy.
 */
export function checkApiSecurity(): void {
  if (import.meta.env.PROD) {
    const hasDirectMistralKey = !!import.meta.env.VITE_MISTRAL_API_KEY;
    const hasDirectApimoToken = !!import.meta.env.VITE_APIMO_TOKEN;
    const hasMistralProxy = !!import.meta.env.VITE_MISTRAL_PROXY_URL;
    const hasApimoProxy = !!import.meta.env.VITE_APIMO_PROXY_URL;

    if (hasDirectMistralKey && !hasMistralProxy) {
      console.error(
        '[SECURITY] VITE_MISTRAL_API_KEY est exposée dans le bundle client. ' +
        'Configurez VITE_MISTRAL_PROXY_URL pour la production.'
      );
    }

    if (hasDirectApimoToken && !hasApimoProxy) {
      console.error(
        '[SECURITY] VITE_APIMO_TOKEN est exposée dans le bundle client. ' +
        'Configurez VITE_APIMO_PROXY_URL pour la production.'
      );
    }
  }
}
