'use strict';

import passport from 'passport';
import passportGithub from 'passport-github';
import UserAuthenticationController from '../../controllers/users/UserAuthenticationController';

export default class GitHubAuthStrategy {

	public init = (config) => {

		// Required due to @types for passport-github missing passReqToCallback parameter
		const passportAny: any = passport;
		const stratAny: any = passportGithub.Strategy;

		// Use github strategy
		passportAny.use('github',
			new stratAny(
				{
					clientID: config.github.clientID,
					clientSecret: config.github.clientSecret,
					callbackURL: config.github.callbackURL,
					passReqToCallback: true
				},
				(req, accessToken, refreshToken, profile, done) => {
					// Set the provider data and include tokens
					const providerData = profile._json;
					providerData.accessToken = accessToken;
					providerData.refreshToken = refreshToken;

					// Create the user OAuth profile
					const displayName = profile.displayName ? profile.displayName.trim() : profile.username.trim();
					const iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
					const firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
					const lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';

					const providerUserProfile = {
						firstName,
						lastName,
						displayName,
						email: profile.emails && profile.emails.length ? profile.emails[0].value : undefined,
						username: profile.username,
						// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
						profileImageURL: providerData.avatar_url ? providerData.avatar_url : undefined,
						// jscs:enable
						provider: 'github',
						providerIdentifierField: 'id',
						providerData
					};

					// Save the user OAuth profile
					UserAuthenticationController.saveOAuthUserProfile(req, providerUserProfile, done);
				}
			)
		);
	};

}
