import { initContract } from '@ts-rest/core';
import { consentContract } from './consent.contract';
import { testResultContract } from './test-result.contract';

const c = initContract();

export const contract = c.router(
	{
		testResults: testResultContract,
		consent: consentContract,
	},
	{
		pathPrefix: '/api',
	},
);
