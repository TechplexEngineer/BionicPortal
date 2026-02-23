/*
 * This sample demonstrates how to configure the library for
 * the Intuit Quickbooks API. Instructions for obtaining your
 * Client ID and Client Secret can be found here:
 * https://developer.intuit.com/app/developer/qbo/docs/get-started
 */

// url should start with a leading /
function request(url) {
  var service = getService_();
	if (!service.hasAccess()) {
		// If not authorized, get authorization URL.
		var authorizationUrl = service.getAuthorizationUrl();
		// View the Log to obtain the URL.
    console.log("Make sure to add this redirect URL:" + logRedirectUri())
		Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
    throw new Error("Cannot Proceed. Auth Needed.");
	} else {
    const companyId = service.getStorage().getValue('QuickBooks.companyId');
    const apiUrl = `${API_BASE}/company/${companyId}${url}`;
		const response = UrlFetchApp.fetch(apiUrl, {
			headers: {
				Authorization: 'Bearer ' + service.getAccessToken(),
				Accept: 'application/json'
			}
		});
		return JSON.parse(response.getContentText());
	}
}

// url should start with a leading /
function POSTrequest(url, payload) {
  var service = getService_();
	if (!service.hasAccess()) {
		// If not authorized, get authorization URL.
		var authorizationUrl = service.getAuthorizationUrl();
		// View the Log to obtain the URL.
    console.log("Make sure to add this redirect URL:" + logRedirectUri())
		Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
	} else {
    const companyId = service.getStorage().getValue('QuickBooks.companyId');
    const apiUrl = `${API_BASE}/company/${companyId}${url}`;
		const response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
			headers: {
				Authorization: 'Bearer ' + service.getAccessToken(),
				Accept: 'application/json'
			}
		});
		return JSON.parse(response.getContentText());
	}
}

/**
 * Triggered whenever the spreadheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Data');
  menu.addItem('Update Data', 'UpdateData');
  menu.addToUi();

  UpdateData();
}

/**
 * Log the redirect URI to be pasted in the Intuit Dev Center:
 * https://developer.intuit.com/v2/ui#/app/<YOURAPPID>/keys
 */
function logRedirectUri() {
	return (getService_().getRedirectUri());
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
	var service = getService_();
	service.reset();
}

/**
 * Configures the service.
 */
function getService_() {
	return OAuth2.createService('Quickbooks')
		// Set the endpoint URLs.
		.setAuthorizationBaseUrl('https://appcenter.intuit.com/connect/oauth2')
		.setTokenUrl('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer')
		// Set the client ID and secret.
		.setClientId(CLIENT_ID)
		.setClientSecret(CLIENT_SECRET)
		// Required, set to Accounting for this example,
		// see QB developer portal for additional options.
		.setScope('com.intuit.quickbooks.accounting')
		// Set the name of the callback function in the script referenced
		// above that should be invoked to complete the OAuth flow.
		.setCallbackFunction('authCallback')
		// Set the property store where authorized tokens should be persisted.
		.setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
	var service = getService_();
	var authorized = service.handleCallback(request);
	if (authorized) {
		// Save the Company ID in the service's storage.
		service.getStorage().setValue('QuickBooks.companyId',
			request.parameter.realmId);
		return HtmlService.createHtmlOutput('Success!');
	} else {
		return HtmlService.createHtmlOutput('Denied');
	}
}