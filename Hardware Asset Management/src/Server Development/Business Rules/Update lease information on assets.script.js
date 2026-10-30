(function executeRule(current, previous) {
	var leaseExpirationDate = current.lease_expiration_date.toString();
	if (leaseExpirationDate === '') { leaseExpirationDate = null; }
	var leaseTermMonths = current.lease_term_months.toString();
	if (leaseTermMonths === '') {
		leaseTermMonths = null;
	} else {
		leaseTermMonths = parseInt(leaseTermMonths, 10);
	}
	new global.GlideQuery('alm_asset')
		.where('lease_contract', current.getUniqueValue())
		.updateMultiple({
			lease_expiration_date: leaseExpirationDate,
			lease_term_months: leaseTermMonths,
		});
}(current, previous));