import { BaseModule } from '../base-module';
import { MagicPayloadMethod, LoginWithMagicLinkConfiguration } from '../../types';
import { createJsonRpcRequestPayload } from '../../core/json-rpc';

type LoginWithMagicLinkEvents = {
  'email-sent': () => void;
  'email-not-deliverable': () => void;
  retry: () => void;
};

export class AuthModule extends BaseModule {
  /**
   * Initiate the "magic link" login flow for a user. If the flow is successful,
   * this method will return a Decentralized ID token (with a default lifespan
   * of 15 minutes).
   */
  public loginWithMagicLink(configuration: LoginWithMagicLinkConfiguration) {
    const { email, showUI = true } = configuration;
    const requestPayload = createJsonRpcRequestPayload(MagicPayloadMethod.LoginWithMagicLink, [{ email, showUI }]);
    return this.request<string | null, LoginWithMagicLinkEvents>(requestPayload);
  }
}
