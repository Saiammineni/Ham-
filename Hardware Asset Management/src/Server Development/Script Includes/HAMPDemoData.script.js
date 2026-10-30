/* global sn_sc sn_itam_common */
var HAMPDemoData = Class.create();
HAMPDemoData.prototype = (function () {
	var DAILY_JOB_NAME = 'HAM - Daily Job';
	var hardwareManufacturers = {
		APPLE: 'd237f2b8db63f78015d2110b0b9619b4',
		ASUS: '4a3736b0dbabb30424cd68461b961966',
		CISCO: 'c23776b0dbabb30424cd68461b96190a',
		DELL: '823776b0dbabb30424cd68461b96190c',
		HP: '823776b0dbabb30424cd68461b961907',
		LENOVO: 'fa2da4bddb573f4023d061094b961973',
		MICROSOFT: '7a37f2b0dbabb30424cd68461b961998',
		ORACLE: '363776b8db63f78015d2110b0b96195e',
	};

	var coreCompaniesDemo = {
		APPLE: 'b7e9e843c0a80169009a5a485bb2a2b5',
		ASUS: 'a4bfed3737e3100044e0bfc8bcbe5dbe',
		CISCO: 'b7e831bdc0a80169015ae101f3c4d6cd',
		DELL: 'b7e7d7d8c0a8016900a5d7f291acce5c',
		HP: 'b7e7a507c0a8016900920ee7d71d6df9',
		LENOVO: 'aa0a6df8c611227601cd2ed45989e0ac',
		MICROSOFT: '0e8b8e650a0a0b3b004f285ffbb1a4fc',
		ORACLE: '0c43d5e2c6112275000025158d32ba9b',
	};

	var disposalOrdersData = [
		{
			stockroom: '2eaa2b3f3763100044e0bfc8bcbe5de2',
			location: 'f90aa2f50a0a0b9100576930575aa596',
			assigned_to: '62826bf03710200044e0bfc8bcbe5df1',
			vendor: 'd32bf3951bff001021888487dc4bcb47',
			planned_assets: [
				'57c1fa8837f3100044e0bfc8bcbe5d63',
				'5fc1fa8837f3100044e0bfc8bcbe5d52',
				'97c1fa8837f3100044e0bfc8bcbe5d44',
				'67c1fa8837f3100044e0bfc8bcbe5da5',
				'63c1fa8837f3100044e0bfc8bcbe5d7c',
				'6fc1fa8837f3100044e0bfc8bcbe5d73',
				'93c1fa8837f3100044e0bfc8bcbe5d3c',
			],
		},
		{
			stockroom: 'eaaa2b3f3763100044e0bfc8bcbe5de3',
			location: 'f90b5d600a0a0b91001d8bf44240ad32',
			assigned_to: 'a8f98bb0eb32010045e1a5115206fe3a',
			vendor: 'f91b37951bff001021888487dc4bcbcd',
			planned_assets: [
				'3fc13e8837f3100044e0bfc8bcbe5d3e',
				'ccc13e8837f3100044e0bfc8bcbe5d45',
				'dfc1fa8837f3100044e0bfc8bcbe5d20',
				'c7c1ba8837f3100044e0bfc8bcbe5db1',
				'd3c1fa8837f3100044e0bfc8bcbe5d2e',
				'8fc1ba8837f3100044e0bfc8bcbe5da9',
				'f000cf4c37f3100044e0bfc8bcbe5db1',
				'3bc1fa8837f3100044e0bfc8bcbe5de5',
				'7fc1fa8837f3100044e0bfc8bcbe5df2',
			],
		},
		{
			stockroom: '22aa2b3f3763100044e0bfc8bcbe5de4',
			location: 'f90e06af0a0a0b9100a6defd15c548e9',
			assigned_to: '62826bf03710200044e0bfc8bcbe5df1',
			vendor: 'd32bf3951bff001021888487dc4bcb47',
			planned_assets: [
				'eac1ba8837f3100044e0bfc8bcbe5d4d',
				'e6c1ba8837f3100044e0bfc8bcbe5d51',
				'2ac1ba8837f3100044e0bfc8bcbe5d3d',
				'e2c1ba8837f3100044e0bfc8bcbe5d55',
				'fac1ba8837f3100044e0bfc8bcbe5d7e',
				'0fc1ba8837f3100044e0bfc8bcbe5dab',
				'67c1fa8837f3100044e0bfc8bcbe5dd6',
				'07c1ba8837f3100044e0bfc8bcbe5dbf',
				'f2c1ba8837f3100044e0bfc8bcbe5d64',
				'0fc1ba8837f3100044e0bfc8bcbe5dd7',
			],
		},
	];

	var refreshReqVariablesData = [
		{
			type_of_refresh: 'single_model',
			sn_hamp_process: 'sn_hamp_hw_refresh',
			replacement_model: 'c9df4a0d0f9000109e7463cda8767ec1',
			assets: '76c1ba8837f3100044e0bfc8bcbe5d93, 8bc1ba8837f3100044e0bfc8bcbe5df7',
		},
		{
			type_of_refresh: 'multi_model',
			sn_hamp_process: 'sn_hamp_hw_refresh',
			multi_model_set: [
				{
					multi_replacement_model: 'd5df8a0d0f9000109e7463cda8767e38',
					asset: '59a9204d3790200044e0bfc8bcbe5d06',
				},
				{
					multi_replacement_model: '5f878143c0a8010e01d707883c05a1f9',
					asset: 'dfc1fa8837f3100044e0bfc8bcbe5d20 ',
				}],
		},
	];

	var leaseContracts = [
		'7a64a1989770300000f8d7b8fa2975cc',
	];

	var rmaOrdersData = [
		[{
			asset: '84ba2fb5890f2010f8777f7d45273af0',
			quantity: 1,
		},
		{
			asset: '9d1c67b1898f2010f8777f7d45273a98',
			quantity: 1,
		},
		],
		[{
			asset: '383c67b1898f2010f8777f7d45273aaa',
			quantity: 1,
		},
		{
			asset: '934ca7b1898f2010f8777f7d45273afe',
			quantity: 1,
		},
		],
	];

	function _addSecondsToGlideDateTime(addSeconds) {
		var gdt = new GlideDateTime();
		gdt.addSeconds(addSeconds);
		return gdt;
	}

	function _getDate(addDays) {
		var gdt = new GlideDateTime();
		gdt.addDaysUTC(addDays);
		return String(gdt.getDate());
	}

	function _updateManufacturerDemoData() {
		Object.keys(hardwareManufacturers).forEach(function (key) {
			var hwManSysId = hardwareManufacturers[key];
			var companySysId = coreCompaniesDemo[key];
			if (!gs.nil(companySysId)) {
				var manufacturerGr = new GlideRecord(sn_hamp.HAMConstants.HW_MANUFACTURER_TABLE);
				if (!manufacturerGr.isValid()) { return; }
				if (manufacturerGr.get(hwManSysId) && gs.nil(manufacturerGr.getValue('company'))) {
					manufacturerGr.setWorkflow(false);
					manufacturerGr.setValue('company', companySysId);
					manufacturerGr.update();
				}
			}
		});
	}

	function _runScheduleJob(pJobName) {
		var rec = new GlideRecord('sysauto_script');
		rec.get('name', pJobName);
		gs.executeNow(rec);
	}

	function insertDisposalOrder(disposalOrder) {
		var disposalOrderGr = new GlideRecord('sn_hamp_hardware_disposal');
		disposalOrderGr.initialize();
		disposalOrderGr.stockroom = disposalOrder.stockroom;
		disposalOrderGr.location = disposalOrder.location;
		disposalOrderGr.assigned_to = disposalOrder.assigned_to;
		disposalOrderGr.vendor = disposalOrder.vendor;
		var disposalOrderId = disposalOrderGr.insert();
		var plannedAssetGr = new GlideRecord('sn_hamp_m2m_hw_asset_disposal');
		disposalOrder.planned_assets.forEach(function (hardware) {
			plannedAssetGr.initialize();
			plannedAssetGr.hardware = hardware;
			plannedAssetGr.hardware_disposal = disposalOrderId;
			plannedAssetGr.insert();
		});
	}

	function _createRefreshReq(varMap) {
		var REFRESH_REQ_CAT_ITEM_SYS_ID = '57be3d29b7121010189e22b5de11a937';
		var cart = new sn_sc.CartJS('hamp_refreshDemoData');
		cart.setRequestedFor('62826bf03710200044e0bfc8bcbe5df1');
		cart.addToCart({
			sysparm_id: REFRESH_REQ_CAT_ITEM_SYS_ID,
			variables: varMap,
		});
		cart.checkoutCart();
	}

	function _triggerLeaseExpiration(leaseContractId) {
		var leaseGr = new global.GlideQuery('ast_contract')
			.where('sys_id', leaseContractId)
			.limit(1)
			.toGlideRecord();
		leaseGr.query();
		if (leaseGr.next()) {
			new sn_hamp.HAMContractManagementUtils().beginLeaseExpirationProcess(leaseGr);
		}
	}

	function autoApproveRequest(requestID) {
		new global.GlideQuery('sysapproval_approver')
			.where('sysapproval', requestID)
			.updateMultiple({ state: 'approved' });
	}

	/* *************************************************************************
		Create Standard Hardware Requests
	************************************************************************* */
	// sysparm_id: Items with flow 'Standard Hardware Asset Request'
	var standardHardwareRequests = [
		{
			sysparm_id: '32048788f8832010f87707e483ab5d47', // iPhone 12 Pro Max - Graphite - 128 GB
			sysparm_quantity: '1',
		},
		{
			sysparm_id: '3e07b348f8072010f87707e483ab5d57', // Jetpack MiFi 8800L
			sysparm_quantity: '1',
		},
		{
			sysparm_id: '7acbb0b4f84b6010f87707e483ab5d0e', // Galaxy Note20 5G - mystic gray - 5G - 128 GB
			sysparm_quantity: '1',
		},
		{
			sysparm_id: 'a0e7f348f8072010f87707e483ab5d64', // Ellipsis Jetpack MHS900L
			sysparm_quantity: '1',
		},
	];

	function createStandardHardwareRequests() {
		standardHardwareRequests.forEach(function (requestInformation) {
			var cartJS = new sn_sc.CartJS();
			cartJS.addToCart(requestInformation);
			var request = cartJS.checkoutCart();
			autoApproveRequest(request.request_id);
		});
	}

	/* *************************************************************************
		Create Hardware Inventory Stock Orders
	************************************************************************* */
	var stockOrderVariableMap = [
		{
			model: 'bec6eba0446e7010f877c1d6e11bbd62', // Microsoft Surface Pro 4 Laptop
			quantity: '10',
			stockroom: '2eaa2b3f3763100044e0bfc8bcbe5de2', // San Diego Border - Pickup/Dropoff
		},
		{
			model: 'd7ddc54d446eb010f877c1d6e11bbddc', // Logitech Wireless Keyboard
			quantity: '40',
			stockroom: 'eaaa2b3f3763100044e0bfc8bcbe5de3', // San Diego North - Pickup/Dropoff
		},
		{
			model: 'a4dbefe0446e7010f877c1d6e11bbd50', // Hewlett-Packard EliteBook 850 Gen 4 852 G4
			quantity: '20',
			stockroom: '62aa2b3f3763100044e0bfc8bcbe5de3', // San Diego North Central - Pickup/Dropoff
		},
		{
			model: '11c8d02cf88f2010f87707e483ab5d70', // Samsung Galaxy Tab S5e - tablet - Android 9.0 (Pie) - 64 GB - 10.5"
			quantity: '50',
			stockroom: 'e6aa2b3f3763100044e0bfc8bcbe5de2', // San Diego South - Pickup/Dropoff
		},
		{
			model: '87792f24446e7010f877c1d6e11bbd29', // Lenovo Thinkpad T490 20N20009MB
			quantity: '25',
			stockroom: 'a2aa2b3f3763100044e0bfc8bcbe5de2', // Southern California Warehouse
		},
	];

	function createHardwareInventoryStockOrders() {
		var HARDWARE_INVENTORY_STOCK_ORDER_ID = '4109aa5fdb22001015a8ffefbf961984';
		stockOrderVariableMap.forEach(function (variable) {
			var cart = new sn_sc.CartJS();
			cart.addToCart({
				sysparm_id: HARDWARE_INVENTORY_STOCK_ORDER_ID,
				variables: variable,
			});
			cart.checkoutCart();
		});
	}

	/* *************************************************************************
		Create Loaner Asset Order data
	************************************************************************* */
	var loanerOrdersData = [{
		location: 'f90ad9120a0a0b91005146ebac892a09',
		model: 'd3bb6a2eac10019b4fa294baf5775f21',
		opened_by: '0a826bf03710200044e0bfc8bcbe5d7a',
		requested_for: '0a826bf03710200044e0bfc8bcbe5d7a',
		start_date: _getDate(0),
		return_date: _getDate(2),
		lead_time: 2,
		justification: 'Assigned laptop is being repaired',
	},
	{
		location: 'f90ad9120a0a0b91005146ebac892a09',
		model: 'd3bb6a2eac10019b4fa294baf5775f21',
		opened_by: 'a8f98bb0eb32010045e1a5115206fe3a',
		requested_for: '87d7d839db8c1010ad2b5635dc961997',
		start_date: _getDate(0),
		return_date: _getDate(15),
		lead_time: 2,
		justification: 'Employee is travelling to location for on-site tasks',
	},
	{
		location: 'f90ad9120a0a0b91005146ebac892a09',
		model: 'd3bb6a2eac10019b4fa294baf5775f21',
		opened_by: 'a8f98bb0eb32010045e1a5115206fe3a',
		requested_for: 'a8f98bb0eb32010045e1a5115206fe3a',
		start_date: _getDate(30),
		return_date: _getDate(90),
		lead_time: 2,
		justification: 'Temporary laptop for a contracted employee',
	},
	{
		location: 'f90ad9120a0a0b91005146ebac892a09',
		model: 'd3bb6a2eac10019b4fa294baf5775f21',
		opened_by: 'a8f98bb0eb32010045e1a5115206fe3a',
		requested_for: 'a8f98bb0eb32010045e1a5115206fe3a',
		start_date: _getDate(1),
		return_date: _getDate(10),
		lead_time: 2,
		justification: 'Temporary laptop for a contracted employee',
		is_waitlisted: true,
	},
	{
		location: 'f90735e70a0a0b9100de208fbc63907d',
		model: '0c43b318c611227501522de23fcbfb9a',
		opened_by: 'a8f98bb0eb32010045e1a5115206fe3a',
		requested_for: 'a8f98bb0eb32010045e1a5115206fe3a',
		start_date: _getDate(1),
		return_date: _getDate(10),
		lead_time: 2,
		is_waitlisted: true,
	},
	];

	var loanerOrdersStatusReportData = [{
		location: 'f90735e70a0a0b9100de208fbc63907d',
		model: 'd3bb6a2eac10019b4fa294baf5775f21',
		opened_by: 'a8f98bb0eb32010045e1a5115206fe3a',
		requested_for: 'a8f98bb0eb32010045e1a5115206fe3a',
		start_date: _getDate(1),
		return_date: _getDate(5),
		lead_time: 2,
		justification: 'Travelling',
		asset: '42cda65fadfea010f877568b4aa80d90',
	},
	{
		location: 'f90aa2f50a0a0b9100576930575aa596',
		model: 'd3bb6a2eac10019b4fa294baf5775f21',
		opened_by: '0a826bf03710200044e0bfc8bcbe5d7a',
		requested_for: '0a826bf03710200044e0bfc8bcbe5d7a',
		start_date: _getDate(1),
		return_date: _getDate(15),
		lead_time: 2,
		justification: 'Temporary laptop for business trip',
		asset: '408e669fadfea010f877568b4aa80d07',
	},
	{
		location: 'f90735e70a0a0b9100de208fbc63907d',
		model: 'c736b784f8072010f87707e483ab5d82',
		opened_by: 'a8f98bb0eb32010045e1a5115206fe3a',
		requested_for: 'a8f98bb0eb32010045e1a5115206fe3a',
		start_date: _getDate(1),
		return_date: _getDate(2),
		lead_time: 2,
		justification: 'Business travel',
		asset: '79cf24bcf80b6010f87707e483ab5d80',
	},
	{
		location: 'f90aa2f50a0a0b9100576930575aa596',
		model: 'd3bb6a2eac10019b4fa294baf5775f21',
		opened_by: '0a826bf03710200044e0bfc8bcbe5d7a',
		requested_for: '0a826bf03710200044e0bfc8bcbe5d7a',
		start_date: _getDate(1),
		return_date: _getDate(2),
		lead_time: 2,
		justification: 'Laptop went to repair',
		asset: 'c99ea69fadfea010f877568b4aa80d13',
	},
	];

	var loanerConsumables = [{
		model_category: '218323293743100044e0bfc8bcbe5d61',
		model: 'bd58860637732000158bbfc8bcbe5d98',
		stockroom: '62aa2b3f3763100044e0bfc8bcbe5de3',
		location: 'f90ad9120a0a0b91005146ebac892a09',
		install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
		substatus: HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
		asset_function: HAMConstants.ASSET_FUNCTION.LOANER,
		quantity: 5,
	}];

	var consumableLoanerOrdersData = [{
		location: 'f90ad9120a0a0b91005146ebac892a09',
		model: 'bd58860637732000158bbfc8bcbe5d98',
		opened_by: '0a826bf03710200044e0bfc8bcbe5d7a',
		requested_for: '0a826bf03710200044e0bfc8bcbe5d7a',
		start_date: _getDate(0),
		return_date: _getDate(7),
		lead_time: 2,
		justification: 'Need a phone for official communications while travelling',
	}];

	function _moveLoanerOrderToDeployed(loanerOrderID) {
		var MAX_TIME_ALLOWED_FOR_PROCESS_TO_COMPLETE = 600000; /* milliseconds */

		var loanerOrderGr = new GlideRecord(HampLoanerUtils.LOANER_ORDER_TABLE);
		loanerOrderGr.get(loanerOrderID);
		if (!loanerOrderGr.isValidRecord()) { return; }

		if (gs.nil(loanerOrderGr.getValue('asset'))) {
			loanerOrderGr.setValue('asset', '048de65fadfea010f877568b4aa80df1');
			var isUpdateSuccessful = loanerOrderGr.update();
			if (gs.nil(isUpdateSuccessful)) { return; }
		}

		var gdt1 = new GlideDateTime(loanerOrderGr.getValue('sys_created_on'));
		var gdt2 = new GlideDateTime();
		var gdtDiff = GlideDateTime.subtract(gdt1, gdt2).getNumericValue();

		if (gdtDiff > MAX_TIME_ALLOWED_FOR_PROCESS_TO_COMPLETE) { return; }

		var job = new global.AssetManagementBaseJob();
		var script = 'new sn_hamp.HAMPDemoData().moveLoanerOrderToDeployed(\'' + loanerOrderID + '\');';

		var prepareTaskGr = new GlideRecord(HampLoanerUtils.LOANER_TASK_TABLE);
		prepareTaskGr.addQuery('loaner_order', loanerOrderGr.getUniqueValue());
		prepareTaskGr.addQuery('task_name', 'prepare');
		prepareTaskGr.query();
		prepareTaskGr.next();
		if (!prepareTaskGr.isValidRecord()) {
			job.runScriptByJob(script, _addSecondsToGlideDateTime(60),
				'HAM Demo Data: Prepare Loaner');
			return;
		}
		if (prepareTaskGr.getValue('state') !== '3' /* closed complete */) {
			prepareTaskGr.setValue('state', '3');
			prepareTaskGr.update();
		}

		var deployTaskGr = new GlideRecord(HampLoanerUtils.LOANER_TASK_TABLE);
		deployTaskGr.addQuery('loaner_order', loanerOrderGr.getUniqueValue());
		deployTaskGr.addQuery('task_name', 'deploy');
		deployTaskGr.query();
		deployTaskGr.next();
		if (!deployTaskGr.isValidRecord()) {
			job.runScriptByJob(script, _addSecondsToGlideDateTime(60),
				'HAM Demo Data: Deploy Loaner');
			return;
		}
		if (deployTaskGr.getValue('state') !== '3' /* closed complete */) {
			deployTaskGr.setValue('state', '3');
			deployTaskGr.update();
		}
	}

	function _setDatesinPast(loanerOrderId) {
		var loanerOrderGr = new GlideRecord(HampLoanerUtils.LOANER_ORDER_TABLE);
		loanerOrderGr.get(loanerOrderId);
		loanerOrderGr.setValue('start_date', _getDate(-5));
		loanerOrderGr.setValue('return_date', _getDate(-3));
		loanerOrderGr.update();
	}

	function createLoanerAssetOrderData() {
		var loanerOrderIds = [];
		var loanerOrderReportIds = [];
		var insertedLoanerOrder;
		var createdLoanerOrder;
		loanerOrdersData.forEach(function (loanerOrder) {
			insertedLoanerOrder = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
				.insert(loanerOrder)
				.get();
			loanerOrderIds.push(insertedLoanerOrder.sys_id);
		});

		loanerOrdersStatusReportData.forEach(function (loanerOrder) {
			createdLoanerOrder = new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
				.insert(loanerOrder)
				.get();
			loanerOrderReportIds.push(createdLoanerOrder.sys_id);
		});

		_moveLoanerOrderToDeployed(loanerOrderIds[0]);
		loanerOrderReportIds.forEach(function (loanerOrderReportId) {
			_moveLoanerOrderToDeployed(loanerOrderReportId);
		});

		// set the start and end dates to the past for 2 return overdue loaner orders
		_setDatesinPast(loanerOrderReportIds[2]);
		_setDatesinPast(loanerOrderReportIds[3]);

		if (HAMUtils.isConsumablesSupportedByProcess()) {
			loanerConsumables.forEach(function (consumable) {
				new global.GlideQuery('alm_consumable')
					.insert(consumable);
			});

			consumableLoanerOrdersData.forEach(function (loanerOrder) {
				new global.GlideQuery(HampLoanerUtils.LOANER_ORDER_TABLE)
					.insert(loanerOrder);
			});
		}
	}
    /* ************************************************************************
        Donation Order Data
     ************************************************************************ */
        var donationOrdersData =[
            {
             charity: '6d6ee2d3a1831110f877613344e94277',
             donation_description: '2 Laptops',
             planned_assets: [
                 '26ab7ece31631110f8779586b9e80f1b',
                 '1b3cfe0231631110f8779586b9e80f5e',
             ],
            },
            {
                charity: '6d6ee2d3a1831110f877613344e94277',
                donation_description: '2 Laptops',
            },    
         ];
        
         function createDonationOrderData(){
            var donationOrderIds=[];
           
            
            donationOrdersData.forEach(function (donationOrder){
                var insertedDonationOrders = new GlideRecord('sn_itam_common_donation_order');
                
                insertedDonationOrders.initialize();
                insertedDonationOrders.charity = donationOrder.charity;
                insertedDonationOrders.donation_description = donationOrder.donation_description;
                var donationsys_id=insertedDonationOrders.insert();
                donationOrderIds.push(donationsys_id);
            });
            _moveDonationOrderToPrepare(donationOrderIds[0]);
        }
        
        function _moveDonationOrderToPrepare(donationOrderID){
            var MAX_TIME_ALLOWED_FOR_PROCESS_TO_COMPLETE = 600000; /* milliseconds */
            
            var donationOrderGr = new GlideRecord('sn_itam_common_donation_order');
            donationOrderGr.get(donationOrderID);
            if (!donationOrderGr.isValidRecord()) { return; }
            
            var approveGr= new GlideRecord('sysapproval_approver');
            
            var job = new global.AssetManagementBaseJob();
            var script = 'new sn_hamp.HAMPDemoData().moveDonationOrderToPrepare(\'' + donationOrderID + '\');';
            approveGr.addQuery('sysapproval',donationOrderGr.sys_id);
            approveGr.query();
            approveGr.next();
            
            if(!approveGr.isValidRecord())
            {
                job.runScriptByJob(script, _addSecondsToGlideDateTime(60),
                'HAM Demo Data: Approve Donation');
                return;
            }

            approveGr.setValue('state','approved');
            approveGr.update();

			donationOrdersData[0].planned_assets.forEach(function (hardware){
                var plannedAssetGr = new GlideRecord('sn_itam_common_m2m_ast_donation');
                plannedAssetGr.initialize();
                plannedAssetGr.asset=hardware;
                plannedAssetGr.asset_donation_order=donationOrderID;
                plannedAssetGr.stage='prepared';
                plannedAssetGr.insert();
            });

			var gdt = GlideDateTime();
			gdt.addDaysLocalTime(+3);
			donationOrderGr.scheduled_date= gdt;
			donationOrderGr.update();
        

            _moveDonationOrderToTransit(donationOrderID);
        }

        function _moveDonationOrderToTransit(donationOrderID){
            
            var donationOrderGr = new GlideRecord('sn_itam_common_donation_order');
            donationOrderGr.get(donationOrderID);

            var job = new global.AssetManagementBaseJob();
            var script = 'new sn_hamp.HAMPDemoData().moveDonationOrderToTransit(\'' + donationOrderID + '\');';
                    

            var prepareTaskGr = new GlideRecord('sn_itam_common_donation_task');
            prepareTaskGr.addQuery('asset_donation_order', donationOrderGr.getUniqueValue());
            prepareTaskGr.addQuery('task_name', 'prepare_and_schedule');
            prepareTaskGr.query();
            prepareTaskGr.next();

            if (!prepareTaskGr.isValidRecord()) {
                job.runScriptByJob(script, _addSecondsToGlideDateTime(60),
                    'HAM Demo Data: Prepare Donation');
                return;
                }
            if (prepareTaskGr.getValue('state') !== '3' /* closed complete */) {
                prepareTaskGr.setValue('state', '3');
                prepareTaskGr.update();
                }

        }
   

	/** **********************
	 * RMA Demo Data
	 *********************** */

	function _verifyRMAAssets(rmaOrder) {
		var verifiedRMAOrder = [];
		rmaOrder.forEach(function (lineInfo) {
			var assetId = lineInfo.asset;
			var asserPresent = new global.GlideQuery(HAMConstants.ALM_ASSET_TABLE)
				.where('sys_id', assetId)
				.whereNull('process_id')
				.selectOne()
				.isPresent();
			if (asserPresent) {
				verifiedRMAOrder.push(lineInfo);
			}
		});
		return verifiedRMAOrder;
	}

	function _createRMAROrder(rmaOrder) {
		var rmaReqGr = new GlideRecord(HAMRMAUtils.RMA_REQUEST_TABLE);
		rmaReqGr.initialize();
		rmaReqGr.setNewGuidValue(gs.generateGUID());
		var mockRecordProducer = {};
		mockRecordProducer.rma_assets = JSON.stringify(rmaOrder);
		HAMRMAUtils.createRMALines(rmaReqGr, mockRecordProducer);
		return rmaReqGr.insert();
	}

	/** ***********************************************************************
	_updateRMAAssessmentTasks function is used to close RMA assessment tasks.

	Function checks if assessment task is created for RMA Request Line.
		If task is created, it will marked as closed complete.
		Else a scheduled job is triggered after 1 minute to run same function.

	Above process will be repeated for 10 minutes until the RMA assessment task
	are closed.
	************************************************************************ */
	function _updateRMAAssessmentTasks(rmaRequestId) {
		var MAX_TIME_ALLOWED_FOR_PROCESS_TO_COMPLETE = 600000; /* milliseconds */

		var rmaReqArr = new global.GlideQuery(HAMRMAUtils.RMA_REQUEST_TABLE)
			.where('sys_id', rmaRequestId)
			.where('stage', 'open')
			.limit(1)
			.select(['sys_id', 'sys_created_on'])
			.toArray(1);
		if (rmaReqArr.length === 0) {
			return;
		}

		var rmaLineArr = new global.GlideQuery(HAMRMAUtils.RMA_REQUEST_LINE_TABLE)
			.where('rma_request', rmaReqArr[0].sys_id)
			.where('stage', 'NOT IN', ['completed', 'cancelled'])
			.limit(2)
			.select('sys_id')
			.toArray(2);
		if (rmaLineArr.length === 0) {
			return;
		}

		var gdt1 = new GlideDateTime(rmaReqArr[0].sys_created_on);
		var gdt2 = new GlideDateTime();
		var gdtDiff = GlideDateTime.subtract(gdt1, gdt2).getNumericValue();

		if (gdtDiff > MAX_TIME_ALLOWED_FOR_PROCESS_TO_COMPLETE) { return; }

		var job = new global.AssetManagementBaseJob();
		var script = 'new sn_hamp.HAMPDemoData().updateRMAAssessmentTasks("' + rmaRequestId + '");';

		var assetRMATaskGr;

		if (rmaLineArr.length >= 1) {
			assetRMATaskGr = new GlideRecord(HAMRMAUtils.ASSET_RMA_TASK_TABLE);
			assetRMATaskGr.addQuery('rma_request_line', rmaLineArr[0].sys_id);
			assetRMATaskGr.addQuery('task_name', 'assessment');
			assetRMATaskGr.query();
			assetRMATaskGr.next();
			if (!assetRMATaskGr.isValidRecord()) {
				job.runScriptByJob(script, _addSecondsToGlideDateTime(60),
					'HAM Demo Data: RMA close task');
				return;
			}

			if (assetRMATaskGr.getValue('state') !== HAMConstants.TASK_STATES.CLOSED_COMPLETE.toString()
				&& assetRMATaskGr.getValue('state') !== HAMConstants.TASK_STATES.CLOSED_INCOMPLETE.toString()) {
				if (!gs.nil(assetRMATaskGr.getValue('vendor'))
					&& !gs.nil(assetRMATaskGr.getValue('stockroom'))) {
					assetRMATaskGr.setValue('state', '3');
					assetRMATaskGr.setValue('rma_action', 'onsite');
					assetRMATaskGr.update();
				}
			}
		}

		if (rmaLineArr.length >= 2) {
			assetRMATaskGr = new GlideRecord(HAMRMAUtils.ASSET_RMA_TASK_TABLE);
			assetRMATaskGr.addQuery('rma_request_line', rmaLineArr[1].sys_id);
			assetRMATaskGr.addQuery('task_name', 'assessment');
			assetRMATaskGr.query();
			assetRMATaskGr.next();
			if (!assetRMATaskGr.isValidRecord()) {
				job.runScriptByJob(script, _addSecondsToGlideDateTime(60),
					'HAM Demo Data: RMA close task');
				return;
			}

			if (assetRMATaskGr.getValue('state') !== HAMConstants.TASK_STATES.CLOSED_COMPLETE.toString()
				&& assetRMATaskGr.getValue('state') !== HAMConstants.TASK_STATES.CLOSED_INCOMPLETE.toString()) {
				if (!gs.nil(assetRMATaskGr.getValue('vendor'))
					&& !gs.nil(assetRMATaskGr.getValue('stockroom'))) {
					assetRMATaskGr.setValue('state', '3');
					assetRMATaskGr.setValue('rma_action', 'offsite');
					assetRMATaskGr.update();
				}
			}
		}
	}

	var arrData = [
		{
			requested_by: 'hr',
			requested_for: '4439e5dd8cbe3010fa9bf0818badc15d',
			assets: '369a21d18cfe3010fa9bf0818badc198,109b359d8cfe3010fa9bf0818badc1cf,809b359d8cfe3010fa9bf0818badc1cc',
			reclaim_date: _getDate(2),
			reclaim_method: 'ship',
		},
		{
			requested_by: 'user',
			requested_for: 'dc09e1918cfe3010fa9bf0818badc1d6',
			assets: 'e2bb759d8cfe3010fa9bf0818badc10b',
			reclaim_date: _getDate(7),
			reclaim_method: 'drop_off',
		},
		{
			requested_by: 'user',
			requested_for: '787961918cfe3010fa9bf0818badc183',
			assets: '564badd18cfe3010fa9bf0818badc16a',
			reclaim_date: _getDate(15),
			reclaim_method: 'pick_up',
		},
	];

	function _createAssetReclamationRequest(arrMap) {
		new global.GlideQuery('asset_reclamation_request')
			.insert(arrMap);
	}

	/** ****************************************************
	* Contract Renewal Demo Data
	***************************************************** */
	var contractRenewalData = {
		'1721a0dcf9768110f87713197603efb3': {
			contract_selection_task_data: [{
				sys_id: '9bca6418f9b68110f87713197603ef8d',
				renewal_decision: 'Y',
			},
			{
				sys_id: 'ca592494f9b68110f87713197603ef6e',
				renewal_decision: 'Y',
			},
			{
				sys_id: '061aa8d4f9b68110f87713197603ef27',
				renewal_decision: 'N',
			},
			],
		},
		'4ba972e5f936c510f87713197603ef50': {
			contract_selection_task_data: [{
				sys_id: '287083adf936c510f87713197603ef8c',
				renewal_decision: 'Y',
			},
			{
				sys_id: 'd3214fadf936c510f87713197603eff9',
				renewal_decision: 'Y',
			},
			],
		},
	};

	function _completeChildContractSelection(contractRenewalRequestID) {
		var contractSelectionDecisionData = [];
		var contractRenewalInfo = {};

		var childContractTaskDetails = {
			sys_id: '-1',
			contract_renewal_request: {
				sys_id: '-1',
				contract: '-1',
			},
		};

		new global.GlideQuery(sn_itam_common.ContractRenewalUtils.RENEWAL_TASK_TABLE)
			.where('contract_renewal_request', contractRenewalRequestID)
			.where('task_name', sn_itam_common.ContractRenewalUtils.RENEWAL_TASK_TASK_NAMES.CONTRACT_SELECTION)
			.where('state', 1)
			.limit(1)
			.select('sys_id', 'contract_renewal_request.sys_id', 'contract_renewal_request.contract')
			.forEach(function(payLoad) {
				childContractTaskDetails = payLoad;
			});

		var childContractTaskSysID = childContractTaskDetails.sys_id;
		contractRenewalInfo = contractRenewalData[childContractTaskDetails.contract_renewal_request.contract];
		if (childContractTaskSysID !== '-1') {
			contractSelectionDecisionData = contractRenewalInfo.contract_selection_task_data;
			contractSelectionDecisionData.forEach(function(data) {
				new global.GlideQuery(sn_itam_common.ContractRenewalUtils.RENEWAL_CONTRACT_M2M)
					.where('renewal_task', childContractTaskSysID)
					.where('contract', data.sys_id)
					.whereNull('renewal_decision')
					.updateMultiple({
						renewal_decision: data.renewal_decision,
					});
			});

			new global.GlideQuery(sn_itam_common.ContractRenewalUtils.RENEWAL_TASK_TABLE)
				.where('sys_id', childContractTaskSysID)
				.updateMultiple({
					state: 3,
				});
		}
	}

	function _requestContractRenewal(contractSysId) {
		var renewalGr = new GlideRecord('ast_contract');
		var requestID = '';

		if (renewalGr.get(contractSysId)) {
			var renewalUtils = new sn_itam_common.ContractRenewalUtils();
			// eslint-disable-next-line max-len
			if ((renewalUtils.isRenewAllowed(renewalGr).isRenewAllowed) && !(renewalUtils.newRenewalRequestActive(renewalGr))) {
				var childContractValidationResult = sn_itam_common.ContractRenewalUtils.verifyContractValidation(renewalGr.getValue('sys_id'));
				if (childContractValidationResult.shouldAllowRenewal) {
					requestID = renewalUtils.createRenewRequest(renewalGr.getValue('sys_id'));
				}
			}
			if (gs.nil(requestID)) {
				requestID = new global.GlideQuery(sn_itam_common.ContractRenewalUtils.RENEWAL_REQUEST_TABLE)
					.getBy({
						contract: renewalGr.getValue('sys_id'),
					}, ['sys_id'])
					.orElse({
						sys_id: '-1',
					})
					.sys_id;
			}

			if (requestID !== -1) {
				var script = ' new sn_hamp.HAMPDemoData().completeChildContractSelection( "' + requestID + '" );';
				new global.AssetManagementBaseJob().runScriptByJob(script, _addSecondsToGlideDateTime(120),
					'HAMDemoData:SelectContractChild');
			}
		}
	}

	function _submitContractsForRenewal() {
		var contracts = Object.keys(contractRenewalData);

		contracts.forEach(function(contractSysId) {
			_requestContractRenewal(contractSysId);
		});
	}

	//Storing the status of Resource category before opt-in
	var resCategoryStates = { };
	function getResourceCategoryOptinStatus() {
		var resourceCategoryGR =  new GlideRecord(sn_hamp.HAMConstants.RESOURCE_CATEGORY_TABLE);
		resourceCategoryGR.query();
		while(resourceCategoryGR.next()) {
			resCategoryStates[resourceCategoryGR.getUniqueValue()] = resourceCategoryGR.getValue('opt_in');
		}
	}

	//Function to wait for job completion
	function waitCompletionOfBackgroundJob(waitTime) {
		var t1 = new GlideDateTime().getNumericValue();
		var t2 = t1;
		var duration = t2 - t1;
		while(duration < waitTime){
			t2 = new GlideDateTime().getNumericValue();
			duration = t2 - t1;
		}
	}

	//function to check if optin/optout job is complete
	function isOptInOptOutComplete() {
		//Wait for job submission
		waitCompletionOfBackgroundJob(5000);

		//Wait for job completion
		var flag = true;
		while(flag) {
			var sysTriggerGr = new GlideRecord('sys_trigger');
			sysTriggerGr.addQuery('name', 'CONTAINS', 'HAM - Optin/Optout');
			sysTriggerGr.addQuery('state', '1');
			sysTriggerGr.query();
			if (sysTriggerGr.getRowCount() == 0) {
				flag = false;
			}
			else {
				waitCompletionOfBackgroundJob(10000);
			}
		}
	}

	//function to optin/optout resource categories
	function optInResourceCategories(resCategoryStates, type) {
		HAMConstants.LICENSABLE_RESOURCE_CATEGORIES.forEach(function (resCat) {
			var flag = type === 'opt-in' ? '1' : resCategoryStates[resCat];
			if(HAMConstants.TNI_RESOURCE_CAT_SYSID === resCat) {
				if(GlidePluginManager.isActive('sn_ni_core')) {
					HAMUtils.updateOptInStatus(resCat, flag);
				}
			}
			else {
				HAMUtils.updateOptInStatus(resCat, flag);
			}
		});

		//Wait till all resource categories are opted in or out
		isOptInOptOutComplete();
	}
	/** ****************************************************
	* Pallets Demo Data - start
	***************************************************** */
	var palletAssets = ['17c1fa8837f3100044e0bfc8bcbe5d40',
						'1bc1fa8837f3100044e0bfc8bcbe5d48',
						'53c1fa8837f3100044e0bfc8bcbe5d3a',
						'57c1fa8837f3100044e0bfc8bcbe5d42',
						'5bc1fa8837f3100044e0bfc8bcbe5d4a',
						'93c1fa8837f3100044e0bfc8bcbe5d3c',
						'97c1fa8837f3100044e0bfc8bcbe5d44',
						'd3c1fa8837f3100044e0bfc8bcbe5d3e',
						'd7c1fa8837f3100044e0bfc8bcbe5d46'];
	var palletId = 'bf4755cfc822d510f87756d7e3d1e4e8';
	
	function updatePalletAsset() {
		for (var i = 0; i < palletAssets.length; i++) {
			var palAssetGr = new GlideRecord('alm_asset');
			palAssetGr.get(palletAssets[i]);
			if (palAssetGr.getValue('install_status') === '6' &&
				palAssetGr.getValue('substatus') === 'available') {
				palAssetGr.setValue('parent', palletId);
				palAssetGr.update();
			}
		}
	}
	/** ****************************************************
	* Pallets Demo Data - End
	***************************************************** */

	function _loadDemoDataFromHWNorm() { }

	function _loadDemoDataFromHAM () {
		if (sn_hamp.HAMUtils.isZTMOnlyInstance()) {
			return;
		}
		
		var scheduleJobs = [DAILY_JOB_NAME];
		
		//Opting in resouce categories
		try {
		getResourceCategoryOptinStatus();
		optInResourceCategories(resCategoryStates, 'opt-in');

		_updateManufacturerDemoData();

		scheduleJobs.forEach(function (job) {
			_runScheduleJob(job);
		});

		// Create Donation orders
        createDonationOrderData();
		
		// create Contract renewal
		_submitContractsForRenewal();

		// Create disposal orders
		disposalOrdersData.forEach(function (disposalOrder) {
			insertDisposalOrder(disposalOrder);
		});

		// Create loaner asset orders
		createLoanerAssetOrderData();

		// Create Refresh requests
		refreshReqVariablesData.forEach(function (varMap) {
			_createRefreshReq(varMap);
		});

		// Trigger lease expiration flow
		leaseContracts.forEach(function (leaseContractId) {
			_triggerLeaseExpiration(leaseContractId);
		});

		// Create RMA orders
		var rmaRequestIds = [];
		rmaOrdersData.forEach(function (rmaOrder) {
			var verifiedRMAOrder = _verifyRMAAssets(rmaOrder);
			if (verifiedRMAOrder.length > 0) {
				rmaRequestIds.push(_createRMAROrder(verifiedRMAOrder));
			}
		});
		if (rmaRequestIds.length > 0) {
			_updateRMAAssessmentTasks(rmaRequestIds[0]);
		}

		// Create asset reclamation requests
		arrData.forEach(function(arrMap) {
			_createAssetReclamationRequest(arrMap);
		});

		// Create standard hardware requests
		createStandardHardwareRequests();

		// Hardware Inventory Stock Orders
		createHardwareInventoryStockOrders();
    
		// Create pallet asset
		updatePalletAsset();

		} catch (e) {
			gs.error(e);
		} 
	}

	return {
		initialize: function () { },

		loadDemoData: _loadDemoDataFromHWNorm,
		loadDemoDataFromHAM: _loadDemoDataFromHAM,

		updateRMAAssessmentTasks: _updateRMAAssessmentTasks,

		moveLoanerOrderToDeployed: _moveLoanerOrderToDeployed,

        moveDonationOrderToPrepare:_moveDonationOrderToPrepare,

        moveDonationOrderToTransit:_moveDonationOrderToTransit,

		completeChildContractSelection: _completeChildContractSelection,

		type: HAMPDemoData,
	};
}());