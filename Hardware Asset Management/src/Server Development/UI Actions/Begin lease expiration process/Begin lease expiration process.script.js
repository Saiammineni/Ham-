// Client side onclick function
function beginLeaseExpirationClassic(){
   // Call the UI Action and skip the 'onclick' function
   gsftSubmit(null, g_form.getFormElement(), 'begin_lease_expiration_process'); // MUST call the 'Action name' set in this UI Action
}

// Code that runs without 'onclick'
// Ensure call to server side function with no browser errors
if (typeof window == 'undefined')
   beginExpirationProcess();

function beginExpirationProcess() {
	new sn_hamp.HAMContractManagementUtils().beginLeaseExpirationProcess(current);
	var inputURL = String(gs.action.getGlideURI());
	if (inputURL.indexOf('.do?') === -1) {
		current.update();
	} else {
		action.setRedirectURL(current);
	}
}