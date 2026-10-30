var HampLoanerOrderAssetAllocations = Class.create();
HampLoanerOrderAssetAllocations.prototype = Object.extendsObject(global.AssetManagementBaseJob, {
	initialize: function () {
		this.nowTimeUTC = new GlideDateTime();
		this.JOB_TIME_LOWER_LIMIT = '00:00:00';
		this.JOB_TIME_UPPER_LIMIT = '04:00:00';
		this.JOB_NAME = 'HAM - Loaner Asset Order Allocations';
		this.jobLogUtil = new global.AssetJobLogUtil();
	},

	/** ****************************************************************
	* Get domains with orders in New & Prepare stages
	***************************************************************** */
	getDomains: function () {
		var uniqueDomains = [];
		var domainColumn = 'sys_domain';

		var loanerOrdersGa = new GlideAggregate(HampLoanerUtils.LOANER_ORDER_TABLE);
		this.addOrdersPendingAllocationsQuery(loanerOrdersGa);
		loanerOrdersGa.groupBy(domainColumn);
		loanerOrdersGa.query();

		while (loanerOrdersGa.next()) {
			var curDomain = loanerOrdersGa.getValue(domainColumn) + '_'
				+ loanerOrdersGa[domainColumn].sys_domain_path.toString();
			if (uniqueDomains.indexOf(curDomain) === -1) { uniqueDomains.push(curDomain); }
		}

		uniqueDomains.sort(function (d1, d2) { return d2.length - d1.length; });
		return uniqueDomains.map(function (domain) { return domain.split('_')[0]; });
	},

	runJob: function () {
		try {
			this.jobLogUtil.startJobLog(this.JOB_NAME);

			/** ****************************************************************
			* Get locations with orders pending allocations.
			***************************************************************** */
			var locations = this.getLocationsWithOrdersPendingAllocations();

			var location;
			var locationTimezone;
			var dateTimeAtLocation;
			var dateAtLocation;
			var upperLimit;
			var lowerLimit;
			var upperLimitComp;
			var lowerLimitComp;
			var loanerOrdersByModel;
			var loanerOrdersGq;

			for (var i = 0; i < locations.length; i++) {
				location = locations[i];

				/** ****************************************************************
				 * Get the date at location
				 **************************************************************** */
				locationTimezone = HampLoanerUtils.getTimezoneOfLocation(location);
				dateTimeAtLocation = HampLoanerUtils.convertUTCtoTimezone(this.nowTimeUTC, locationTimezone);
				dateAtLocation = dateTimeAtLocation.getDate().toString();

				/** *****************************************************************
				 * Check if the time is between lower and upper limits at location.
				 * 0 = Dates are equal
				 * 1 = The object's date is after the date specified in the parameter
				 * -1 = The object's date is before the date specified in the parameter
				 ***************************************************************** */
				upperLimit = new GlideDateTime(dateAtLocation + ' ' + this.JOB_TIME_UPPER_LIMIT);
				lowerLimit = new GlideDateTime(dateAtLocation + ' ' + this.JOB_TIME_LOWER_LIMIT);

				upperLimitComp = dateTimeAtLocation.compareTo(upperLimit);
				lowerLimitComp = dateTimeAtLocation.compareTo(lowerLimit);

				if (!((upperLimitComp === 0 || lowerLimitComp === 0)
					|| (upperLimitComp === -1 && lowerLimitComp === 1))) {
					continue; // The time at location is not between limits. Skip allocations for the location.
				}

				/** *****************************************************************
				 * Get non-waitlisted loaner orders with preparation start date today
				 * grouped by model ordered by creation date
				 ***************************************************************** */
				loanerOrdersByModel = {}; /* { MODEL: [ASSETS] } */
				loanerOrdersGq = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
					.where('location', location)
					.where('is_waitlisted', false)
					.where('preparation_start_date', dateAtLocation);
				loanerOrdersGq = this.addOrdersPendingAllocationsQuery(loanerOrdersGq, true);
				loanerOrdersGq = this.addDomainFilterQuery(loanerOrdersGq, true);
				loanerOrdersGq = loanerOrdersGq.orderBy('sys_created_on');
				loanerOrdersGq.select('model')
					.forEach(function (loanerOrder) { // eslint-disable-line
						if (!loanerOrdersByModel[loanerOrder.model]) {
							loanerOrdersByModel[loanerOrder.model] = [];
						}
						if (loanerOrdersByModel[loanerOrder.model].indexOf(loanerOrder.sys_id) === -1) {
							loanerOrdersByModel[loanerOrder.model].push(loanerOrder.sys_id);
						}
					});

				/** *****************************************************************
				 * Get loaner orders in prepare stage without assets
				 * with start date no later than today
				 * grouped by model
				 * ordered by is_waitlisted and creation date
				 * (gets non-waitlisted orders first and sorts by creation date)
				 ***************************************************************** */
				loanerOrdersGq = null;
				loanerOrdersGq = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
					.where('location', location)
					.where('stage', HampLoanerUtils.STAGE_PREPARE)
					.where('start_date', '>=', dateAtLocation)
					.whereNull('asset')
					.orderBy('is_waitlisted')
					.orderBy('sys_created_on');
				loanerOrdersGq = this.addDomainFilterQuery(loanerOrdersGq, true);
				loanerOrdersGq.select('model')
					.forEach(function (loanerOrder) { // eslint-disable-line
						if (!loanerOrdersByModel[loanerOrder.model]) {
							loanerOrdersByModel[loanerOrder.model] = [];
						}
						if (loanerOrdersByModel[loanerOrder.model].indexOf(loanerOrder.sys_id) === -1) {
							loanerOrdersByModel[loanerOrder.model].push(loanerOrder.sys_id);
						}
					});

				/** *****************************************************************
				 * Fulfil orders with assets available at that location.
				 ***************************************************************** */
				this.fulfilLoanerOrders(loanerOrdersByModel, location);
			}
			this.jobLogUtil.stopJobLog(sn_hamp.HAMConstants.JOB_STATUSES.COMPLETED, this.JOB_NAME + ' completed');
		} catch (error) {
			this.jobLogUtil.stopJobLog(sn_hamp.HAMConstants.JOB_STATUSES.FAILED, JSON.stringify(error));
		}
	},

	addOrdersPendingAllocationsQuery: function (records, isGlideQuery) {
		var stages = [HampLoanerUtils.STAGE_NEW, HampLoanerUtils.STAGE_PREPARE];
		if (isGlideQuery) {
			var enhancedQuery = records.where('stage', 'IN', stages);
			enhancedQuery = enhancedQuery.whereNull('asset');
			return enhancedQuery;
		}
		records.addQuery('stage', stages);
		records.addNullQuery('asset');
		return records;
	},

	addDomainFilterQuery: function (records, isGlideQuery) {
		if (isGlideQuery) {
			if (!this.fIsDomainDataSeparationEnabled) { return records; }
			records.where('sys_domain', this.getCurrentDomainSysId());
			return records;
		}
		if (!this.fIsDomainDataSeparationEnabled) { return records; }
		records.addQuery('sys_domain', this.getCurrentDomainSysId());
		return records;
	},

	fulfilLoanerOrders: function (loanerOrdersByModel, location) {
		var assetIDs = {};
		var loanerOrderIDs = [];
		for (var model in loanerOrdersByModel) {
			assetIDs = this.getAssetsForAllocation(model, location);
			loanerOrderIDs = loanerOrdersByModel[model];
			this.fulfilLoanerOrdersWithAssets(loanerOrderIDs, assetIDs);
		}
	},

	fulfilLoanerOrdersWithAssets: function (loanerOrderIDs, assetIDs) {
		var loanerOrderID;
		var assetUsedIndex;
		var response = { isFulfilled: false, assetUsed: null };
		for (var i = 0; i < loanerOrderIDs.length; i++) {
			loanerOrderID = loanerOrderIDs[i];
			response = this.fulfilLoanerOrderWithAssets(loanerOrderID, assetIDs);
			if (response.isFulfilled) {
				this.moveLoanerOrderAwayFromWaitlist(loanerOrderID);
				assetUsedIndex = assetIDs.assetsForAllocations.indexOf(response.assetUsed);
				if (assetIDs.type !== 'alm_consumable') {
					assetIDs.assetsForAllocations.splice(assetUsedIndex, 1);
				}
			} else {
				this.moveLoanerOrderIntoWaitlist(loanerOrderID);
			}
		}
	},

	fulfilLoanerOrderWithAssets: function (loanerOrderID, assetIDs) {
		var assetID = null;
		var isUpdateSuccessful = false;
		var loanerOrderGr;
		for (var i = 0; i < assetIDs.assetsForAllocations.length; i++) {
			loanerOrderGr = HAMUtils.getAsGlideRecord(HampLoanerUtils.LOANER_ORDER_TABLE, loanerOrderID);
			assetID = assetIDs.assetsForAllocations[i];
			loanerOrderGr.setValue('asset', assetID);
			isUpdateSuccessful = loanerOrderGr.update();
			if (isUpdateSuccessful) {
				break;
			}
		}
		return { isFulfilled: isUpdateSuccessful, assetUsed: assetID };
	},

	moveLoanerOrderIntoWaitlist: function (loanerOrderID) {
		new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
			.where('sys_id', loanerOrderID)
			.updateMultiple({ is_waitlisted: true });
	},

	moveLoanerOrderAwayFromWaitlist: function (loanerOrderID) {
		new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
			.where('sys_id', loanerOrderID)
			.updateMultiple({ is_waitlisted: false });
	},

	getLocationsWithOrdersPendingAllocations: function () {
		var locations = [];
		var loanerOrdersGq = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE);
		loanerOrdersGq = this.addOrdersPendingAllocationsQuery(loanerOrdersGq, true);
		loanerOrdersGq = this.addDomainFilterQuery(loanerOrdersGq, true);
		loanerOrdersGq.select('location')
			.forEach(function (loanerOrder) {
				if (locations.indexOf(loanerOrder.location) === -1) {
					locations.push(loanerOrder.location);
				}
			});
		return locations;
	},

	getAssetsForAllocation: function (model, location) {
		var validInstallStatus = HAMConstants.ASSET_STATUSES.IN_STOCK;
		var validSubstatus = [
			HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
			HAMConstants.ASSET_SUB_STATUSES.RESERVED,
		];

		var assetsGa = new GlideAggregate('alm_asset');
		assetsGa.addQuery('install_status', validInstallStatus);
		assetsGa.addQuery('substatus', validSubstatus)
			.addOrCondition('substatus', '');
		assetsGa = sn_hamp.HAMLicensingUtility.addHAMFlowsInclusionCriteria(assetsGa);
		HampLoanerUtils.addLoanerBaseQuery(assetsGa, location, model);
		assetsGa.setGroup(true);
		assetsGa.groupBy('sys_id');
		assetsGa.orderBy('location');
		assetsGa.query();
		var assets = {
			assetsForAllocations: [],
			type: '',
		};
		var assetsForAllocations = {};
		while (assetsGa.next()) {
			var assetLocation = assetsGa.getValue('location');
			if(gs.nil(assetsForAllocations[assetLocation])) {
				var assetsArray = [];
				assetsArray.push(assetsGa.getValue('sys_id'));
				assetsForAllocations[assetLocation] = assetsArray;
			} else {
				assetsForAllocations[assetLocation].push(assetsGa.getValue('sys_id'));
			}
		}
		if (Object.keys(assetsForAllocations).length > 0) {
			assets.assetsForAllocations = this.orderLoanerAssetsBasedOnLocation(assetsForAllocations, location);
			assets.type = this.getTypeOfAsset(assets.assetsForAllocations[0]);
		}
		return assets;
	},
	getTypeOfAsset: function (assetId) {
		var gr = new GlideRecord('alm_asset');
		gr.get(assetId);
		return gr.getValue('sys_class_name');
	},
	/*
	* Function to order assets based on location
	* Assets located on user location will get priority
	*/
	orderLoanerAssetsBasedOnLocation: function(assetsForAllocations, location) {
		var sortedAssetsForAllocations = [];
		if(!gs.nil(assetsForAllocations[location])) {
			sortedAssetsForAllocations.push.apply(sortedAssetsForAllocations, assetsForAllocations[location]);
			delete assetsForAllocations[location];
		}
		var assetLocations = this.orderAssetLocations(Object.keys(assetsForAllocations));
		assetLocations.forEach(function (key) {
			var values = assetsForAllocations[key];
			sortedAssetsForAllocations.push.apply(sortedAssetsForAllocations, values);
		});
		return sortedAssetsForAllocations;
	},
	/*
	* Function to order assets depending on proximity of user location
	* Assets with accurate location location will get priority
	*/
	orderAssetLocations: function(assetLocations) {
		var stockroomGr = new GlideRecord("sn_itam_common_m2m_stockroom_location");
		stockroomGr.addQuery('stockroom.location', 'IN', assetLocations);
		stockroomGr.addQuery('active', true);
		stockroomGr.orderByDesc('location.full_name');
		stockroomGr.query();
		var orderedStockrooms = [];
		while(stockroomGr.next()) {
			var index = orderedStockrooms.indexOf(String(stockroomGr.stockroom.location.sys_id));
			if (index == -1) {
				orderedStockrooms.push(String(stockroomGr.stockroom.location.sys_id));
			}
		}
		return orderedStockrooms;
	},

	/** ****************************************************************
	* Set and Get functions for Job Time Limits
	***************************************************************** */
	setJobTimeUpperLimit: function (time) { this.JOB_TIME_UPPER_LIMIT = time; },
	setJobTimeLowerLimit: function (time) { this.JOB_TIME_LOWER_LIMIT = time; },
	getJobTimeUpperLimit: function () { return this.JOB_TIME_UPPER_LIMIT; },
	getJobTimeLowerLimit: function () { return this.JOB_TIME_LOWER_LIMIT; },

	type: 'HampLoanerOrderAssetAllocations',
});