'use strict';

describe('Activities E2E Tests:', function () {
  describe('Test Activities page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/activities');
      expect(element.all(by.repeater('activity in activities')).count()).toEqual(0);
    });
  });
});
