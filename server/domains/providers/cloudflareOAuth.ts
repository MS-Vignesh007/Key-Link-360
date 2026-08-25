/**
 * Backward-compatible re-exports.
 * Implementation lives in ../cloudflare/CloudflareOAuthService.ts
 */
export {
  isCloudflareOAuthConfigured,
  cloudflareOAuthRedirectUri,
  createCloudflareOAuthAuthorizeUrl,
  takeOAuthState,
  takeOAuthStateAsync,
  exchangeCloudflareOAuthCode,
  refreshCloudflareAccessToken,
  oauthReturnAppUrl
} from "../cloudflare/CloudflareOAuthService";
