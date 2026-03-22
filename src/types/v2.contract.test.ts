import { describe, expect, it } from 'vitest';
import { ErrorCode } from './v2';

describe('v2 contracts', () => {
  it('contains mandatory error codes', () => {
    expect(ErrorCode.ERR_LAYOUT_CONFLICT).toBeDefined();
    expect(ErrorCode.ERR_WINDOW_NOT_FOUND).toBeDefined();
    expect(ErrorCode.ERR_MIGRATION_FAILED).toBeDefined();
  });
});
