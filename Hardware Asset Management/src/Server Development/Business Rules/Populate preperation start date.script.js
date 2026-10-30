(function executeRule(current, previous /* null when async */) {
	// eslint-disable-next-line  max-len
	current.preparation_start_date = sn_hamp.HampLoanerUtils.getPreparationStartDate(current.start_date, current.lead_time);
}(current, previous));