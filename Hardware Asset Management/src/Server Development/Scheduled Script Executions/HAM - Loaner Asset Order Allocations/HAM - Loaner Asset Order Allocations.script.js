function allocateAssetsToLoanerOrders() {
	var isJobRunning = new sn_hamp.HAMUtils().isJobRunning('d19e1141535220106b86ddeeff7b129c');
	if (isJobRunning) {
		// If there is already one job running, no need to run the current one
		return;
	}

	try {
		new sn_hamp.HampLoanerOrderAssetAllocations().process();
	} catch (error) {
		gs.error(JSON.stringify(error));
	}
}
allocateAssetsToLoanerOrders();