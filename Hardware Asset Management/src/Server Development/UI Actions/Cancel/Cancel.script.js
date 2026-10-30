function check () {
	gsftSubmit(null, g_form.getFormElement(), 'cancel_zero_touch_request');
}

function cancelZeroTouchRequest () {
	var zeroTouch = new HAMZeroTouchAssetRefreshUtils();
	zeroTouch.markActiveTaskClosedIncomplete(current);
	current.setValue('stage', 'cancelled_complete');
	current.setValue('state', 4);
	current.update();
	action.setRedirectURL(current);
}

if (typeof window === 'undefined') { cancelZeroTouchRequest(); }