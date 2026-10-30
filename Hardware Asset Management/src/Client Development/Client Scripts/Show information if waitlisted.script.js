function onLoad() {
	if (g_scratchpad.is_waitlisted === 'true') {
		g_form.addInfoMessage(
			getMessage('This request is currently on the waitlist')
		);
	}
}