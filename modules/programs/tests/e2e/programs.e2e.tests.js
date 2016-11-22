'use strict';

describe('Programs E2E Tests:', function () {
  describe('Test Programs page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/programs');
      expect(element.all(by.repeater('program in programs')).count()).toEqual(0);
    });
  });
});
