/* eslint-disable no-new, class-methods-use-this, global-require */

import browserEnv from '@ikscodes/browser-env';
import test, { ExecutionContext } from 'ava';
import sinon from 'sinon';
import { MAGIC_RELAYER_FULL_URL, TEST_API_KEY } from '../../../constants';
import { TestMagicSDK } from '../../../factories';
import { mockConfigConstant, mockSDKEnvironmentConstant } from '../../../mocks';
import { createReactNativeEndpointConfigurationWarning } from '../../../../src/core/sdk-exceptions';

/**
 * We have a circular dependency breaking test code when referencing
 * constructors extending `BaseModule`. Rather than refactor the SDK code, it
 * was quicker to fix the issue with JS getters.
 */
const ModuleCtors = {
  get AuthModule() {
    return (require('../../../../src/modules/auth') as typeof import('../../../../src/modules/auth')).AuthModule;
  },

  get UserModule() {
    return (require('../../../../src/modules/user') as typeof import('../../../../src/modules/user')).UserModule;
  },

  get RPCProviderModule() {
    return (require('../../../../src/modules/rpc-provider') as typeof import('../../../../src/modules/rpc-provider'))
      .RPCProviderModule;
  },

  get Extension() {
    return (require('../../../../src/modules/base-extension') as typeof import('../../../../src/modules/base-extension'))
      .Extension;
  },
};

test.beforeEach(t => {
  browserEnv.restore();
  mockConfigConstant('VERSION', '1.0.0-test');
});

function assertEncodedQueryParams(t: ExecutionContext, encodedQueryParams: string, expectedParams: any = {}) {
  const defaultExpectedParams = {
    API_KEY: TEST_API_KEY,
    DOMAIN_ORIGIN: 'null',
    host: 'auth.magic.link',
    sdk: 'magic-sdk',
    version: '1.0.0-test',
  };

  t.deepEqual(JSON.parse(atob(encodedQueryParams)), {
    ...defaultExpectedParams,
    ...expectedParams,
  });
}

function assertModuleInstanceTypes(t: ExecutionContext, sdk: any) {
  t.true(sdk.auth instanceof ModuleCtors.AuthModule);
  t.true(sdk.user instanceof ModuleCtors.UserModule);
  t.true(sdk.rpcProvider instanceof ModuleCtors.RPCProviderModule);
}

test.serial('Initialize `MagicSDK`', t => {
  const magic = new TestMagicSDK(TEST_API_KEY);

  t.is(magic.apiKey, TEST_API_KEY);
  t.is(magic.endpoint, MAGIC_RELAYER_FULL_URL);
  assertEncodedQueryParams(t, magic.encodedQueryParams);
  assertModuleInstanceTypes(t, magic);
});

test.serial('Fail to initialize `MagicSDK`', t => {
  try {
    new TestMagicSDK(undefined as any);
  } catch (err) {
    t.is(
      err.message,
      'Magic SDK Error: [MISSING_API_KEY] Please provide an API key that you acquired from the Magic developer dashboard.',
    );
  }
});

test.serial('Initialize `MagicSDK` with custom endpoint', t => {
  const magic = new TestMagicSDK(TEST_API_KEY, { endpoint: 'https://example.com' });

  t.is(magic.apiKey, TEST_API_KEY);
  t.is(magic.endpoint, 'https://example.com');
  assertEncodedQueryParams(t, magic.encodedQueryParams, {
    host: 'example.com',
  });
  assertModuleInstanceTypes(t, magic);
});

test.serial('Initialize `MagicSDK` when `window.location` is missing', t => {
  browserEnv.stub('location', undefined);

  const magic = new TestMagicSDK(TEST_API_KEY);

  t.is(magic.apiKey, TEST_API_KEY);
  t.is(magic.endpoint, MAGIC_RELAYER_FULL_URL);
  assertEncodedQueryParams(t, magic.encodedQueryParams, {
    DOMAIN_ORIGIN: '',
  });
  assertModuleInstanceTypes(t, magic);
});

test.serial('Initialize `MagicSDK` with custom Web3 network', t => {
  const magic = new TestMagicSDK(TEST_API_KEY, { network: 'mainnet' });

  t.is(magic.apiKey, TEST_API_KEY);
  t.is(magic.endpoint, MAGIC_RELAYER_FULL_URL);
  assertEncodedQueryParams(t, magic.encodedQueryParams, {
    ETH_NETWORK: 'mainnet',
  });
  assertModuleInstanceTypes(t, magic);
});

class NoopExtNoConfig extends ModuleCtors.Extension<'noop'> {
  name = 'noop' as const;
  helloWorld() {}
}

class NoopExtWithConfig extends ModuleCtors.Extension.Internal<'noop'> {
  name = 'noop' as const;
  config = { hello: 'world' };
  helloWorld() {}
}

class NoopExtWithEmptyConfig extends ModuleCtors.Extension.Internal<'noop'> {
  name = 'noop' as const;
  config = {};
  helloWorld() {}
}

test.serial('Initialize `MagicSDK` with config-less extensions via array', t => {
  const magic = new TestMagicSDK(TEST_API_KEY, { extensions: [new NoopExtNoConfig()] });

  assertEncodedQueryParams(t, magic.encodedQueryParams);
  t.true(magic.noop instanceof NoopExtNoConfig);
});

test.serial('Initialize `MagicSDK` with config-ful extensions via array (non-empty config)', t => {
  const magic = new TestMagicSDK(TEST_API_KEY, { extensions: [new NoopExtWithConfig()] });

  assertEncodedQueryParams(t, magic.encodedQueryParams, {
    ext: { noop: { hello: 'world' } },
  });

  t.true(magic.noop instanceof NoopExtWithConfig);
});

test.serial('Initialize `MagicSDK` with config-ful extensions via array (empty config)', t => {
  const magic = new TestMagicSDK(TEST_API_KEY, { extensions: [new NoopExtWithEmptyConfig()] });

  assertEncodedQueryParams(t, magic.encodedQueryParams);

  t.true(magic.noop instanceof NoopExtWithEmptyConfig);
});

test.serial('Initialize `MagicSDK` with config-less extensions via dictionary', t => {
  const magic = new TestMagicSDK(TEST_API_KEY, { extensions: { foobar: new NoopExtNoConfig() } });

  assertEncodedQueryParams(t, magic.encodedQueryParams);

  t.true(magic.foobar instanceof NoopExtNoConfig);
});

test.serial('Initialize `MagicSDK` with config-ful extensions via dictionary (non-empty config)', t => {
  const magic = new TestMagicSDK(TEST_API_KEY, { extensions: { foobar: new NoopExtWithConfig() } });

  assertEncodedQueryParams(t, magic.encodedQueryParams, {
    ext: { noop: { hello: 'world' } },
  });

  t.true(magic.foobar instanceof NoopExtWithConfig);
});

test.serial('Initialize `MagicSDK` with config-ful extensions via dictionary (empty config)', t => {
  const magic = new TestMagicSDK(TEST_API_KEY, { extensions: { foobar: new NoopExtWithEmptyConfig() } });

  assertEncodedQueryParams(t, magic.encodedQueryParams);

  t.true(magic.foobar instanceof NoopExtWithEmptyConfig);
});

test.serial(
  'Warns upon construction of `MagicSDK` instance if `endpoint` parameter is provided with `react-native` target.',
  t => {
    mockSDKEnvironmentConstant('target', 'react-native');

    const consoleWarnStub = sinon.stub();
    browserEnv.stub('console.warn', consoleWarnStub);
    const expectedWarning = createReactNativeEndpointConfigurationWarning();

    new TestMagicSDK(TEST_API_KEY, { endpoint: 'https://example.com' } as any);

    t.true(consoleWarnStub.calledWith(expectedWarning.message));
  },
);

test.serial(
  'Does not warn upon construction of `MagicSDK` instance if `endpoint` parameter is omitted with `react-native` target.',
  t => {
    mockSDKEnvironmentConstant('target', 'react-native');

    const consoleWarnStub = sinon.stub();
    browserEnv.stub('console.warn', consoleWarnStub);

    new TestMagicSDK(TEST_API_KEY);

    t.false(consoleWarnStub.called);
  },
);
