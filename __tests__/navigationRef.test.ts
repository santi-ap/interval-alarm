import { navigationRef } from '../utils/navigationRef';

describe('navigationRef', () => {
  it('exports isReady function', () => {
    expect(typeof navigationRef.isReady).toBe('function');
  });

  it('exports navigate function', () => {
    expect(typeof navigationRef.navigate).toBe('function');
  });
});
