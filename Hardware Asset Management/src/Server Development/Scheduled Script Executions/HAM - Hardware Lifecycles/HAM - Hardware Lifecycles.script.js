function generateLifecycles() {
	var hamUtils = new sn_hamp.HAMUtils();
	if (hamUtils.isJobRunning('7df6b4a453d01010249addeeff7b12a9')) {
		gs.info('HAM - Hardware Lifecycles job is already running');
		return;
	}

	new sn_hamp.HAMHWModelLifecycleAPI().generateLifecycles();
}

generateLifecycles();