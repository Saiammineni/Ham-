var HampLoanerAjaxUtils = Class.create();
HampLoanerAjaxUtils.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
	validateDates: function() {
		var MAX_MONTHS_START_DATE = 3; // Allow reservations with start date within 3 months
		var MAX_MONTHS_RETURN_DATE = 6; // Allow reservations with return date within 6 months from start date

		var startDateUserFormat = this.getParameter('sysparm_startdate');
		var startDate = HAMUtils.getDateInInternalFormat(startDateUserFormat);

		var returnDateUserFormat = this.getParameter('sysparm_returndate');
		var returnDate = HAMUtils.getDateInInternalFormat(returnDateUserFormat);

		var gDate = new GlideDateTime();
		var currentDate = gDate.getLocalDate();
		var res = {};
		var sdt;
		if (!gs.nil(startDate)) {
			sdt = new GlideDateTime(startDate);
			var cdt = new GlideDateTime(currentDate);
			var maxsdt = new GlideDateTime(currentDate);
			maxsdt.addMonthsUTC(MAX_MONTHS_START_DATE);
			if (sdt.before(cdt)) {
				res.isStartDateValid = false;
				res.startDateErrorMsg = gs.getMessage(
					'{0} is not valid. Select a start date on or after current date', [startDate]
				);
			} else if (sdt.after(maxsdt)) {
				res.isStartDateValid = false;
				res.startDateErrorMsg = gs.getMessage(
					'{0} is not valid. Select a start date within {1} months from current date',
					[startDate, String(MAX_MONTHS_START_DATE)]
				);
			} else {
				res.isStartDateValid = true;
			}
		}
		if (!gs.nil(returnDate)) {
			sdt = new GlideDateTime(startDate);
			var rdt = new GlideDateTime(returnDate);
			var maxrdt = new GlideDateTime(startDate);
			maxrdt.addMonthsUTC(MAX_MONTHS_RETURN_DATE);
			if (rdt.onOrBefore(sdt)) {
				res.isReturnDateValid = false;
				res.returnDateErrorMsg = gs.getMessage(
					'{0} is not valid. Select a return date after the selected start date', [returnDate]
				);
			} else if (rdt.after(maxrdt)) {
				res.isReturnDateValid = false;
				res.returnDateErrorMsg = gs.getMessage(
					'{0} is not valid. Select a return date within {1} months from the selected start date',
					[returnDate, String(MAX_MONTHS_RETURN_DATE)]
				);
			} else {
				res.isReturnDateValid = true;
			}
		}
		return JSON.stringify(res);
	},
	isLoanerModelsExist: function () {
		var location = this.getParameter('sysparm_location');
		if (!gs.nil(this.getParameter('sysparm_model'))) {
			var model = this.getParameter('sysparm_model');
			if (new sn_hamp.HampLoanerUtils().isLoanerAssetExist(location, model)) {
				return 'yes';
			}
		}
		if (new sn_hamp.HampLoanerUtils().isLoanerAssetExist(location)) {
			return 'modelNotPresent';
		}
		return 'noLoanerModels';
	},
	isLoanerAssetAvailable: function () {
		var model = this.getParameter('sysparm_model');
		var location = this.getParameter('sysparm_location');
		var startDateUserFormat = this.getParameter('sysparm_start_date');
		var returnDateUserFormat = this.getParameter('sysparm_return_date');
		var leadTimeInDays = this.getParameter('sysparm_lead_time');

		var startDate = HAMUtils.getDateInInternalFormat(startDateUserFormat);
		var returnDate = HAMUtils.getDateInInternalFormat(returnDateUserFormat);

		var isLoanerAssetAvailable = new sn_hamp.HAMAssetReservationUtils().isLoanerAssetAvailableBetweenDates(
			model,
			location,
			startDate,
			returnDate,
			leadTimeInDays
		);

		var message = '';
		if (!isLoanerAssetAvailable) {
			message = gs.getMessage(
				'There are no loaner assets available for this time period. If you choose to submit, your request will join a waitlist.' // eslint-disable-line
			);
		}

		return JSON.stringify({
			isAvailable: isLoanerAssetAvailable,
			message: message,
		});
	},
	getLoanerOrder: function() {
		var sysId = this.getParameter('sysparm_loaner');
		var loanerId;
		var tableName = this.getParameter('sysparm_table');
		if (tableName === sn_hamp.HampLoanerUtils.LOANER_TASK_TABLE) {
			loanerId = new global.GlideQuery(sn_hamp.HampLoanerUtils.LOANER_TASK_TABLE)
				.withAcls()
				.where('sys_id', sysId)
				.select('loaner_order')
				.toArray(1);
			loanerId = loanerId[0].loaner_order;
		} else {
			loanerId = sysId;
		}
		var response = new global.GlideQuery(sn_hamp.HampLoanerUtils.LOANER_ORDER_TABLE)
			.withAcls()
			.where('sys_id', loanerId)
			.selectOne('asset.sys_id', 'asset.display_name', 'asset_stockroom')
			.get();
		return JSON.stringify(response);
	},
	cancelLoanerAsset: function () {
		var loanerAssetId = this.getParameter('sysparm_loaner_asset');
		var loanerUtils = new sn_hamp.HampLoanerUtils();
		if (!gs.nil(loanerAssetId) && loanerUtils.canOrderBeCancelled(loanerAssetId)) {
			loanerUtils.cancelLoanerOrder(loanerAssetId);
		}
	},
	type: 'HampLoanerAjaxUtils',
});