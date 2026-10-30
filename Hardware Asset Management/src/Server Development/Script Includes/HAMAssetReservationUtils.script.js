var HAMAssetReservationUtils = Class.create();
HAMAssetReservationUtils.prototype = {
	initialize: function () { },

	isLoanerAssetAvailableBetweenDates: function (model, location, fromStartDate, toReturnDate, leadTime) { // eslint-disable-line
		var assetsAvailable = new sn_hamp.HampLoanerUtils().getFunctioningLoanerAssetsCount(location, model);
		if (assetsAvailable === 0) { return false; }

		var startDate = String(fromStartDate);
		var returnDate = String(toReturnDate);
		var leadTimeInDays = parseInt(leadTime, 10);
		var preparationStartDate = HampLoanerUtils.getPreparationStartDate(startDate, leadTimeInDays);

		var overlappingOrdersStartDates = [preparationStartDate];
		var overlappingOrdersEndDates = [returnDate];

		var overlappingOrdersGq = new global.GlideQuery('sn_hamp_loaner_asset_order')
			.where('model', model)
			.where('location', location)
			.where('is_waitlisted', false)
			.where('stage', '!=', HampLoanerUtils.STAGE_COMPLETED)
			.where('stage', '!=', HampLoanerUtils.STAGE_CANCELLED);
		overlappingOrdersGq = HampLoanerUtils.addLoanerOrdersOverlapQuery(
			overlappingOrdersGq,
			startDate,
			returnDate,
			leadTimeInDays,
			true /* isGlideQuery */
		);

		overlappingOrdersGq.select('preparation_start_date', 'return_date')
			.forEach(function (loanerOrder) {
				overlappingOrdersStartDates.push(loanerOrder.preparation_start_date);
				overlappingOrdersEndDates.push(loanerOrder.return_date);
			});

		overlappingOrdersStartDates.sort();
		overlappingOrdersEndDates.sort();

		var totalRequests = overlappingOrdersStartDates.length;
		var assetsReturned = 0;
		var assetsDeparted = 0;
		var assetsNeeded = 0;

		while ((assetsDeparted < totalRequests) && (assetsReturned < totalRequests)) {
			if (overlappingOrdersStartDates[assetsDeparted] <= overlappingOrdersEndDates[assetsReturned]) {
				assetsNeeded += 1;
				assetsDeparted += 1;
			} else if (overlappingOrdersStartDates[assetsDeparted] > overlappingOrdersEndDates[assetsReturned]) {
				assetsNeeded -= 1;
				assetsReturned += 1;
			}
			if (assetsNeeded > assetsAvailable) {
				return false;
			}
		}
		return true;
	},

	type: 'HAMAssetReservationUtils',
};