'use strict';

describe('Opportunities E2E Tests:', function () {
  describe('Test Opportunities page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/opportunities');
      expect(element.all(by.repeater('opportunity in opportunities')).count()).toEqual(0);
    });
  });
});
