'use strict';

import angular from 'angular';

(() => {
	angular
		.module('capabilities')
		// Controller the view of the capability page
		.controller('CapabilityEditController', [
			'$window',
			'$scope',
			'$state',
			'capability',
			'Authentication',
			'Notification',
			'TINYMCE_OPTIONS',
			'CapabilitySkillsService',
			'ask',
			function($window, $scope, $state, capability, Authentication, Notification, TINYMCE_OPTIONS, CapabilitySkillsService, ask) {
				const qqq = this;
				qqq.capability = capability;
				qqq.auth = Authentication.permissions();
				qqq.tinymceOptions = TINYMCE_OPTIONS;
				qqq.newskill = '';
				qqq.editingskill = false;

				// check for duplicate skills
				qqq.isDuplicateSkill = (needle, haystack) => {
					let found = false;
					let i = 0;
					while (!found && i < haystack.length) {
						found = haystack[i++].name.toLowerCase() === needle.toLowerCase();
					}
					return found;
				};

				// save the capability, could be added or edited (post or put)
				qqq.savenow = isValid => {
					if (!isValid) {
						$scope.$broadcast('show-errors-check-validity', 'qqq.capabilityForm');
						return false;
					}

					// Create a new capability, or update the current instance
					qqq.capability
						.createOrUpdate()

						// success, notify and return to list
						.then(result => {
							qqq.capabilityForm.$setPristine();
							Notification.success({
								title: 'Success',
								message: '<i class="fas fa-check-circle"></i> Capability saved'
							});
							qqq.capability = result;
						})

						// fail, notify
						.catch(res => {
							Notification.error({
								title: 'Error',
								message: "<i class='fas fa-exclamation-triangle'></i> Save failed: " + res.message
							});
						});
				};

				// add a new capability skill
				qqq.addSkill = () => {
					// leave if no string
					if (!qqq.newskill) {
						Notification.error({
							message: 'No Skill was supplied',
							title: "<i class='fas fa-exclamation-triangle'></i> Missing Skill"
						});
						qqq.newskill = '';
						return;
					}

					// check that this is not a duplicate within the current set
					qqq.capability.skills = qqq.capability.skills ? qqq.capability.skills : [];
					if (qqq.isDuplicateSkill(qqq.newskill, qqq.capability.skills)) {
						Notification.error({
							message: 'Duplicate Skill',
							title: "<i class='fas fa-exclamation-triangle'></i> Duplicate Skill"
						});
						qqq.newskill = '';
						return;
					}
					const capabilitySkill = new CapabilitySkillsService({
						name: qqq.newskill
					});

					capabilitySkill
						.createOrUpdate()
						.then(result => {
							// reset newskill, push the new one on the capability and save the capability
							qqq.capability.skills.push(result);
							qqq.savenow(true);
						})
						.catch(res => {
							Notification.error({
								message: res.data.message,
								title: "<i class='fas fa-exclamation-triangle'></i> Error Saving Skill"
							});
						});
					qqq.newskill = '';
				};

				// update a skill
				qqq.editSkill = capabilitySkill => {
					qqq.newskill = capabilitySkill.name;
					qqq.editingskill = capabilitySkill;
				};
				qqq.updateSkill = () => {
					// leave if no string
					if (!qqq.newskill) {
						Notification.error({
							message: 'No Skill was supplied',
							title: "<i class='fas fa-exclamation-triangle'></i> Missing Skill"
						});
						qqq.newskill = '';
						return;
					}

					// check that this is not a duplicate within the current set
					if (!qqq.editingskill) {
						if (qqq.isDuplicateSkill(qqq.newskill, qqq.capability.skills)) {
							Notification.error({
								message: 'Duplicate Skill',
								title: "<i class='fas fa-exclamation-triangle'></i> Duplicate Skill"
							});
							qqq.newskill = '';
							return;
						}
					}

					qqq.editingskill.name = qqq.newskill;
					new CapabilitySkillsService(qqq.editingskill)
						.createOrUpdate()
						.then(result => {
							Notification.success({
								title: 'Success',
								message: '<i class="fas fa-check-circle"></i> Skill updated'
							});
						})
						.catch(res => {
							Notification.error({
								title: 'Error',
								message: "<i class='fas fa-exclamation-triangle'></i> Error Updating Skill"
							});
						});
					qqq.newskill = '';
					qqq.editingskill = null;
				};

				// delete a skill - confirm first
				qqq.deleteSkill = capabilitySkill => {
					const question = 'Confirm you want to delete this skill.  This cannot be undone.';
					ask.yesNo(question).then(response => {
						if (response) {
							new CapabilitySkillsService(capabilitySkill).$remove(
								() => {
									qqq.capability.skills = qqq.capability.skills.reduce((accum, current) => {
										if (current.code !== capabilitySkill.code) {
											accum.push(current);
										}
										return accum;
									}, []);
									qqq.savenow(true);
								},
								res => {
									Notification.error({
										title: 'Error',
										message: "<i class='fas fa-exclamation-triangle'></i> Error Removing Skill"
									});
								}
							);
						}
					});
				};

				// remove the capability with some confirmation
				qqq.remove = () => {
					const question = 'Confirm you want to delete this capability.  This cannot be undone.';
					ask.yesNo(question).then(response => {
						if (response) {
							qqq.capability.skills.forEach(capabilitySkill => {
								new CapabilitySkillsService(capabilitySkill).$remove();
							});
							qqq.capability.$remove(() => {
								$state.go('capabilities.list');
								Notification.success({
									title: 'Success',
									message: '<i class="fas fa-check-circle"></i> Capability deleted'
								});
							});
						}
					});
				};

				// close the edit view and return to the capability list or capability view
				qqq.close = () => {
					if (qqq.capability._id) {
						$state.go('capabilities.view', { capabilityId: qqq.capability._id });
					} else {
						$state.go('capabilities.list');
					}
				};
			}
		]);
})();
