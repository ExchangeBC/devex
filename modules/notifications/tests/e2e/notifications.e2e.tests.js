'use strict';

describe('Notifications E2E Tests:', function () {
  describe('Test Notifications page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/notifications');
      expect(element.all(by.repeater('notification in notifications')).count()).toEqual(0);
    });
  });
});
