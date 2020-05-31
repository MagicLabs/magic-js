import browserEnv from '@ikscodes/browser-env';
import test from 'ava';
import sinon from 'sinon';
import { getPayloadIdStub } from '../../../mocks';
import { createMagicSDK } from '../../../factories';
import { BaseModule } from '../../../../src/modules/base-module';

test.beforeEach(t => {
  browserEnv.restore();
  (BaseModule as any).prototype.request = sinon.stub();
});

test('Generate JSON RPC request payload with method `magic_auth_logout`', async t => {
  const magic = createMagicSDK();

  const idStub = getPayloadIdStub();
  idStub.returns(999);

  magic.user.logout();

  /* Assertion */
  const requestPayload = (magic.user as any).request.args[0][0];
  t.is(requestPayload.id, 999);
  t.is(requestPayload.method, 'magic_auth_logout');
  t.deepEqual(requestPayload.params, []);
});
