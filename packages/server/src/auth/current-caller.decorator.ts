import { createParamDecorator, NotImplementedException } from '@nestjs/common';
import { CallerContext } from './caller-context';

/**
 * Stub decorator — throws until real auth is wired.
 * Replace this factory body with actual JWT/session extraction.
 * All controller signatures referencing @CurrentCaller() remain unchanged.
 */
export const CurrentCaller = createParamDecorator((): CallerContext => {
	throw new NotImplementedException('Auth is not yet wired. Replace CurrentCaller decorator factory body.');
});
