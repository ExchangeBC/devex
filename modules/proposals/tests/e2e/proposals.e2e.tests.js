'use strict';

describe('Proposals E2E Tests:', function () {
  describe('Test Proposals page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/proposals');
      expect(element.all(by.repeater('proposal in proposals')).count()).toEqual(0);
    });
  });
});
