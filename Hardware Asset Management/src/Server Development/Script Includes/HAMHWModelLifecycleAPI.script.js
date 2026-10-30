var HAMHWModelLifecycleAPI = Class.create();
HAMHWModelLifecycleAPI.prototype = {
	initialize: function() {
		this.modelUtils = global.ModelUtils;
		this.jobLog = new global.AssetJobLogUtil();
		this.comments = {
			LIFECYCLES_CREATED: 0,
			LIFECYCLES_DEACTIVATED: 0,
			ACTIVE_LIFECYCLES_PROCESSED: 0,
			DEACTIVATED_LIFECYCLES_PROCESSED: 0,
		};
		this.ASSET_PROPERTY_KEY = 'com.sn_hamp.lifecycle.lastRunDate';
	},
	_getTableName: function(currentHWRecord) {
		var modelClassName = currentHWRecord.getValue('sys_class_name');
		var modelClasses = HAMUtils.getModelClassNames();
		if (modelClasses.indexOf(modelClassName) === -1) {
			throw new Error('the current record of ' + modelClassName + ' is not eligible for lifecycle creation');
		}
		return modelClassName;
	},

	/* The lifecycle phases are ordered by model in ascending and phase start date is descending order. 
	For each model, the first lifecycle phase (with the latest phase start date) is marked as the current lifecycle phase by default. 
	If there exists other lifecycle phases for a model with the same phase start date as the one marked as current, the details of the 
	lifecycle phase (Sys ID, Lifecycle phase value and Current lifecycle phase value) are stored in a dictionary. Once all the 
	lifecycle phase records of a particular model are reviewed, and there exists more than one lifecycle phase with the same start date 
	as the one marked as current (dictionary has more than one record), the _resolveLifecyclePhase function is called. */

	_populateActiveLifecyclePhase: function(tableName) {
		var prevRecord, tniModels; // hwnorm2hamp
		var lifecycleRecords = [];
		if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
			tniModels = HAMUtils.getEntitledTNIModels();
		}
		/* The current lifecycle phase will be inactive for all the lifecyle records which are inactive and whose
		 start date is greater than current date or end date is before the current date */
		var grUpMul = new GlideRecord(tableName); // hwnorm2hamp
		if(!gs.nil(tniModels)) {
			grUpMul.addQuery('model', 'IN', tniModels);
		}
		grUpMul.addQuery('current_lifecycle_phase','true');
		grUpMul.addQuery('active','false').addOrCondition('lifecycle_type','internal').
		addOrCondition('start_date','>','javascript:gs.endOfToday()').
		addOrCondition('end_date','<','javascript:gs.endOfToday()');
		grUpMul.query();
		grUpMul.setValue('current_lifecycle_phase', false);
		// hwnorm2hamp grUpMul.setWorkflow(false);
		// hwnorm2hamp grUpMul.updateMultiple();
		this.modelUtils.updateMultipleDisableBR(grUpMul);
		/* The current lifecycle phase can be active for the lifecyle records which are active and whose start
		 date is less than or equal to the current date and end date is greater than or equal to current date */
		var gr = new GlideRecord(tableName);
		if(!gs.nil(tniModels)) {
			gr.addQuery('model', 'IN', tniModels);
		}
		gr.addQuery('active','true');
		gr.addQuery('lifecycle_type','publisher');
		gr.addQuery('start_date','<=','javascript:gs.endOfToday()');
		gr.addNullQuery('end_date').addOrCondition('end_date','>=','javascript:gs.endOfToday()');
		gr.orderBy('model.sys_id');
		gr.orderByDesc('start_date');
		gr.query();
		var lifecyclePhaseWithSeq = [];
		if (gr.hasNext()) {
			var currentDomain = gs.getSession().getCurrentDomainID();
			if (GlidePluginManager.isActive('com.glide.domain.msp_extensions.installer') && currentDomain !== "global") {
				lifecyclePhaseStr = GlideApplicationProperty.getValue(sn_hamp.HAMConstants.MODEL_LIFECYCLE_PHASE_ORDER_PROPERTY, currentDomain);
			} else {
				lifecyclePhaseStr = gs.getProperty(sn_hamp.HAMConstants.MODEL_LIFECYCLE_PHASE_ORDER_PROPERTY);
			}
			if(gs.nil(lifecyclePhaseStr)) {
				//Falling back on the sequence defined in the dictionary choice options
				lifecyclePhaseWithSeq = this._getLifecyclePhasesWithSeq(tableName);
			}
			else {
				var arr = lifecyclePhaseStr.split(",");
				for (var j = 0; j < arr.length; j++) {
					var temp = {
						'choice_name': arr[j],
						'sequence': j+1
					};
					lifecyclePhaseWithSeq.push(temp);
				}
			}
		}

		while (gr.next()) {
			if (prevRecord === gr.getValue('model') && prevRecStartDate === gr.getValue('start_date')) {
				var lifecycleJson = {'Id': gr.getUniqueValue(), 'lifecyclePhase': gr.getValue('lifecycle_phase'), 'currentLifecyclePhaseSeq': gr.getValue('current_lifecycle_phase')};
				lifecycleRecords.push(lifecycleJson);
			}
			else if(prevRecord != gr.getValue('model')) {
				if(lifecycleRecords.length > 1){
					this._resolveLifecyclePhase(tableName,lifecycleRecords, lifecyclePhaseWithSeq);
				}
				if (!gr.current_lifecycle_phase) {
					gr.current_lifecycle_phase = true;
					// hwnorm2hamp gr.setWorkflow(false);
					// hwnorm2hamp gr.update();
					this.modelUtils.updateDisableBR(gr);
				}
				prevRecord = gr.getValue('model');
				prevRecStartDate = gr.getValue('start_date');
				lifecycleRecords = [];
				lifecycleJson = {'Id': gr.getUniqueValue(), 'lifecyclePhase': gr.getValue('lifecycle_phase'), 'currentLifecyclePhaseSeq': gr.getValue('current_lifecycle_phase')};
				lifecycleRecords.push(lifecycleJson);
			}
			else if (gr.current_lifecycle_phase) {
				gr.current_lifecycle_phase = false;
				// hwnorm2hamp gr.setWorkflow(false);
				// hwnorm2hamp gr.update();
				this.modelUtils.updateDisableBR(gr);
			}
		}
		if(lifecycleRecords.length > 1){
			this._resolveLifecyclePhase(tableName,lifecycleRecords, lifecyclePhaseWithSeq);
		}
	},

	_getLifecyclePhasesWithSeq: function(tableName) {
		var lifecyclePhasesWithSeq = [];
		new global.GlideQuery('sys_choice')
			.where('name', tableName)
			.where('element', 'lifecycle_phase')
			.where('language','en')
			.orderBy('sequence')
			.select('value', 'sequence')
			.forEach(function(phase) {
				var temp = {
					'choice_name': phase.value,
					'sequence': phase.sequence === null ? 0 : phase.sequence
				};
				lifecyclePhasesWithSeq.push(temp);
			});
		if (lifecyclePhasesWithSeq.length == 0) {
			var tableHierarchy = HAMUtils.getHierarchy(tableName);
			if (tableHierarchy.length > 1) {
				var parentLifecyclePhaseWithSeq = this._getLifecyclePhasesWithSeq(tableHierarchy[1]);
				if (parentLifecyclePhaseWithSeq.length !== 0){
					lifecyclePhasesWithSeq = parentLifecyclePhaseWithSeq;
				}
			}
		}
		return lifecyclePhasesWithSeq;
	},

	/* The _resolveLifecyclePhase function sets the current lifecycle phase for the model based on the priority list. 
	The priority list is obtained from the System property "sn_hamp.model_lifecycle_phase_order". 
	If the system property is empty, the default priority order of 
	"Availability -> End of sale -> End of support -> End of extended support -> End of life" is used. */
	
	_resolveLifecyclePhase: function(tableName, lifecycleRecords, lifecyclePhaseWithSeq) {
		var currentLifecycleId, currentLifecyclePhaseSeq = -1;
		for(var i = 0; i < lifecyclePhaseWithSeq.length; i++){
			var filteredArray = lifecycleRecords.filter(function(record) {
					return (record.lifecyclePhase == lifecyclePhaseWithSeq[i]['choice_name']);
			});
			if (filteredArray.length > 0 && !gs.nil(filteredArray[0].lifecyclePhase)) {
				currentLifecycleId = filteredArray[0]['Id'];
				currentLifecyclePhaseSeq = filteredArray[0].lifecyclePhase;
			}
		}

		for(i = 0; i < lifecycleRecords.length; i++){
			if(lifecycleRecords[i]['Id'] == currentLifecycleId) {
				lifecycleRecords[i]['currentLifecyclePhaseSeq'] = true;
			}
			else {
				lifecycleRecords[i]['currentLifecyclePhaseSeq'] = false;
			}
			var gr = new GlideRecord(tableName);
			gr.get(lifecycleRecords[i]['Id']);
			if (gr.getValue('current_lifecycle_phase') != lifecycleRecords[i]['currentLifecyclePhaseSeq']) {
				gr.current_lifecycle_phase = lifecycleRecords[i]['currentLifecyclePhaseSeq'];
				// hwnorm2hamp gr.setWorkflow(false);
				// hwnorm2hamp gr.update();
				this.modelUtils.updateDisableBR(gr);
			}
		}
	},
	
	updateActiveLifecyclePhase: function() {
		var tables = [sn_hamp.HAMConstants.MODEL_TO_LIFECYCLE_MAPS.cmdb_hardware_product_model,
			sn_hamp.HAMConstants.MODEL_TO_LIFECYCLE_MAPS.cmdb_consumable_product_model];
		tables.forEach(function(tableName) { this._populateActiveLifecyclePhase(tableName); }.bind(this));
	},
	_updateIfAlreadyPresent: function(modelLifecycleTable, lifecycleDefinitionSysId, modelSysId, lifecyclePhase) {
		var gr = new GlideRecord(modelLifecycleTable);
		gr.addQuery('model', modelSysId);
		gr.addQuery('lifecycle_phase', lifecyclePhase);
		gr.addQuery('source', sn_hamp.HAMConstants.SOURCE_SERVICENOW);
		gr.orderByDesc('active');
		gr.query();
		while (gr.next()) {
			if (gr.getValue('active') === '1') {
				return true;
			}
			if (gr.getValue('content_lifecycle_definition') === lifecycleDefinitionSysId) {
				if (gr.getValue('content_active_status') === 'false') {
					gr.setValue('active', true);
					gr.setValue('content_active_status', 'true');
					// hwnorm2hamp gr.setWorkflow(false);
					// hwnorm2hamp gr.update();
					this.modelUtils.updateDisableBR(gr);
				}
				return true;
			}
		}
		return false;
	},
	insertPrebuiltLifecycles: function(currentHWRecord) {
		var modelTable;
		try {
			modelTable = this._getTableName(currentHWRecord);
		} catch(error) {
			//If error is thrown then then the model type is not supported. Returning without processing
			return;
		}
		if (!gs.nil(currentHWRecord.normalized_model)) {
			var modelLifecycleTable = sn_hamp.HAMConstants.MODEL_TO_LIFECYCLE_MAPS[modelTable];
			if(gs.nil(modelLifecycleTable) && HAMUtils.HAS_TNI_ENTITLEMENT) {
				modelLifecycleTable = 'cmdb_hardware_model_lifecycle';
			}
			var normModelSysId = currentHWRecord.getValue('normalized_model');
			var hwLifecycleDefGr = new GlideRecord(sn_hamp.HAMConstants.CONTENT_TABLES.HW_LIFECYCLE_DEFINITION);
			hwLifecycleDefGr.addQuery('hw_product_model', normModelSysId);
			hwLifecycleDefGr.addQuery('active', true);
			hwLifecycleDefGr.query();
			while (hwLifecycleDefGr.next()) {
				var lifecyclePhase = hwLifecycleDefGr.getValue('lifecycle_phase');
				var startDate = hwLifecycleDefGr.getValue('start_date');
				var endDate = hwLifecycleDefGr.getValue('end_date');
				var lifecycleDefinitionSysId = hwLifecycleDefGr.getUniqueValue();
				var risk = sn_hamp.HAMConstants.PHASE_TO_RISK_MAP[lifecyclePhase];
				var hwLifecycleGr = new GlideRecord(modelLifecycleTable);
				if (!this._updateIfAlreadyPresent(modelLifecycleTable, lifecycleDefinitionSysId,
					currentHWRecord.getUniqueValue(), lifecyclePhase)) {
					hwLifecycleGr.initialize();
					hwLifecycleGr.setValue('model', currentHWRecord.getUniqueValue());
					hwLifecycleGr.setValue('source', sn_hamp.HAMConstants.SOURCE_SERVICENOW);
					hwLifecycleGr.setValue('lifecycle_type', sn_hamp.HAMConstants.LIFECYCLE_TYPE_PUBLISHER);
					hwLifecycleGr.setValue('lifecycle_phase', lifecyclePhase);
					hwLifecycleGr.setValue('start_date', startDate);
					hwLifecycleGr.setValue('end_date', endDate);
					hwLifecycleGr.setValue('risk', risk);
					hwLifecycleGr.setValue('content_lifecycle_definition', lifecycleDefinitionSysId);
					hwLifecycleGr.setValue('active', true);
					hwLifecycleGr.setValue('content_active_status', 'true');
					hwLifecycleGr.setValue('sys_domain', currentHWRecord.getValue('sys_domain'));
					// hwnorm2hamp hwLifecycleGr.setWorkflow(false);
					// hwnorm2hamp hwLifecycleGr.insert();
					this.modelUtils.insertDisableBR(hwLifecycleGr);
				}
			}
		}
	},
	deactivatePrebuiltLifecycles: function(currentHWRecord) {
		var modelTable;
		try {
			modelTable = this._getTableName(currentHWRecord);
		} catch(error) {
			//If error is thrown then then the model type is not supported. Returning without processing
			return;
		}

		var modelLifecycleTable = sn_hamp.HAMConstants.MODEL_TO_LIFECYCLE_MAPS[modelTable];
		if(gs.nil(modelLifecycleTable) && HAMUtils.HAS_TNI_ENTITLEMENT) {
			modelLifecycleTable = 'cmdb_hardware_model_lifecycle';
		}
		var hwLifecycleGr = new GlideRecord(modelLifecycleTable);
		hwLifecycleGr.addQuery('source', sn_hamp.HAMConstants.SOURCE_SERVICENOW);
		hwLifecycleGr.addQuery('active', true);
		hwLifecycleGr.addQuery('content_active_status', 'true');
		hwLifecycleGr.addQuery('model', currentHWRecord.getUniqueValue());
		hwLifecycleGr.query();
		hwLifecycleGr.setValue('active', false);
		hwLifecycleGr.setValue('content_active_status', 'false');
		// hwnorm2hamp hwLifecycleGr.setWorkflow(false);
		// hwnorm2hamp hwLifecycleGr.updateMultiple();
		this.modelUtils.updateMultipleDisableBR(hwLifecycleGr);
	},
	syncPrebuiltLifecycles: function(currentHWRecord) {
		this.deactivatePrebuiltLifecycles(currentHWRecord);
		if (!(gs.nil(currentHWRecord.normalized_status))) {
			this.insertPrebuiltLifecycles(currentHWRecord);
		}
	},

	_getAssetProperty: function() {
		var assetPropGr = new GlideRecord(sn_hamp.HAMConstants.ASSET_PROPERTY_TABLE);
		assetPropGr.addQuery('key', this.ASSET_PROPERTY_KEY);
		assetPropGr.setLimit(1);
		assetPropGr.query();
		return assetPropGr;
	},
	_determineLastProcessDate: function(assetPropGr) {
		if (assetPropGr.next()) {
			this.lastProcessDate = assetPropGr.getValue('value');
		} else {
			this.lastProcessDate = '';
		}
	},
	_getLifecycleContentWithDateFilter: function() {
		var contentGr = new GlideRecord(sn_hamp.HAMConstants.CONTENT_TABLES.HW_LIFECYCLE_DEFINITION);
		if (this.lastProcessDate) {
			var prevRunDate = new GlideDateTime(this.lastProcessDate);
			contentGr.addEncodedQuery('sys_updated_onBETWEEN' + prevRunDate + '@' + this.start_date);
		}
		return contentGr;
	},
	_deActivateLifecycleForALifecycleDef: function(contentId) {
		var lifecycleGr;
		var lifecycleCount = 0;
		sn_hamp.HAMConstants.MODEL_TYPES.forEach(function(modelTable) {
			lifecycleGr = new GlideRecord(sn_hamp.HAMConstants.MODEL_TO_LIFECYCLE_MAPS[modelTable]);
			lifecycleGr.addQuery('content_lifecycle_definition', contentId);
			lifecycleGr.addQuery('active', true);
			lifecycleGr.addQuery('content_active_status', 'true');
			lifecycleGr.query();
			// hwnorm2hamp lifecycleGr.setWorkflow(false);
			while (lifecycleGr.next()) {
				lifecycleGr.setValue('active', false);
				lifecycleGr.setValue('content_active_status', 'false');
				// hwnorm2hamp lifecycleGr.update();
				this.modelUtils.updateDisableBR(lifecycleGr);
				lifecycleCount += 1;
			}
		}.bind(this));
		this.comments.LIFECYCLES_DEACTIVATED += lifecycleCount;
		this.comments.DEACTIVATED_LIFECYCLES_PROCESSED += 1;
	},

	_isLifecyclePresentForModel: function(modelLifecycleTable, modelId, contentData) {
		// Sanitize user-provided values
		modelId = GlideStringUtil.escapeQueryTermSeparator(modelId);
		var sanitizedContentSysId = GlideStringUtil.escapeQueryTermSeparator(contentData.sys_id);
		var sanitizedContentSource = GlideStringUtil.escapeQueryTermSeparator(contentData.source);
		var sanitizedLifecyclePhase = GlideStringUtil.escapeQueryTermSeparator(contentData.lifecycle_phase);
		// Model ID and Lifecycle Definition ID
		var queryString = 'model=' + modelId + '^content_lifecycle_definition=' + sanitizedContentSysId;
		// OR condition
		// Model ID and Active and Source and Lifecycle Phase
		queryString = queryString + '^NQmodel=' + modelId + '^active=true^source=' + sanitizedContentSource
        + '^lifecycle_phase=' + sanitizedLifecyclePhase;
		var lifecycleGr = new GlideRecord(modelLifecycleTable);
		lifecycleGr.addEncodedQuery(queryString,true);
		lifecycleGr.setLimit(1);
		lifecycleGr.query();
		return lifecycleGr.hasNext();
	},
	_createLifecycleForAModel: function(modelLifecycleTable, modelHash, contentData) {
		var lifecycleGr = new GlideRecord(modelLifecycleTable);
		lifecycleGr.initialize();
		lifecycleGr.setValue('model', modelHash.sys_id);
		lifecycleGr.setValue('source', contentData.source);
		lifecycleGr.setValue('lifecycle_type', contentData.lifecycle_type);
		lifecycleGr.setValue('lifecycle_phase', contentData.lifecycle_phase);
		lifecycleGr.setValue('start_date', contentData.start_date);
		lifecycleGr.setValue('end_date', contentData.end_date);
		lifecycleGr.setValue('content_lifecycle_definition', contentData.sys_id);
		lifecycleGr.setValue('risk', contentData.risk);
		lifecycleGr.setValue('active', true);
		lifecycleGr.setValue('content_active_status', 'true');
		lifecycleGr.setValue('sys_domain', modelHash.sys_domain);
		// hwnorm2hamp lifecycleGr.setWorkflow(false);
		// hwnorm2hamp lifecycleGr.insert();
		this.modelUtils.insertDisableBR(lifecycleGr);
		this.comments.LIFECYCLES_CREATED += 1;
	},
	_insertLifecycle: function(contentGr) {
		var modelTables = sn_hamp.HAMConstants.MODEL_TYPES;
		var hwProductModel = contentGr.getValue('hw_product_model'); // hwnorm2hamp
		var contentData = {};
		contentData.sys_id = contentGr.getUniqueValue();
		contentData.source = sn_hamp.HAMConstants.SOURCE_SERVICENOW;
		contentData.lifecycle_type = sn_hamp.HAMConstants.LIFECYCLE_TYPE_PUBLISHER;
		contentData.lifecycle_phase = contentGr.getValue('lifecycle_phase');
		contentData.start_date = contentGr.getValue('start_date');
		contentData.end_date = contentGr.getValue('end_date');
		contentData.risk = sn_hamp.HAMConstants.PHASE_TO_RISK_MAP[contentData.lifecycle_phase];
		for (var i = 0; i < modelTables.length; i++) {
			var modelLifecycleTable = sn_hamp.HAMConstants.MODEL_TO_LIFECYCLE_MAPS[modelTables[i]];
			var modelTableQuery = new global.GlideQuery(modelTables[i])
				.where('normalized_model', hwProductModel); // hwnorm2hamp
			if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
				var tniModelQuery = new global.GlideQuery().where('sys_id', 'IN', HAMUtils.getEntitledTNIModels());
				modelTableQuery = modelTableQuery.where(tniModelQuery);
			}
			modelTableQuery.select('sys_id', 'sys_domain')
				.forEach(function(modelHash) {
					if (!(this._isLifecyclePresentForModel(modelLifecycleTable, modelHash.sys_id, contentData))) {
						this._createLifecycleForAModel(modelLifecycleTable, modelHash, contentData);
					}
				}.bind(this));
		}
		this.comments.ACTIVE_LIFECYCLES_PROCESSED += 1;
	},
	_processContentLifecycles: function() {
		var stepMessage = 'Processing lifecycles';
		this.jobLog.startJobStep(stepMessage);
		var contentGr = this._getLifecycleContentWithDateFilter();
		contentGr.orderBy('active');
		contentGr.query();
		while (contentGr.next()) {
			if (contentGr.getValue('active') === '0') {
				this._deActivateLifecycleForALifecycleDef(contentGr.getUniqueValue());
			} else {
				this._insertLifecycle(contentGr);
			}
		}
		this.jobLog.stopJobStep(stepMessage);
	},
	_setProcessDate: function(assetPropGr) {
		assetPropGr.setValue('value', this.start_date);
		assetPropGr.update();
	},
	_generateComments: function() {
		var comments = this.comments; // hwnorm2hamp
		return Object.keys(comments).reduce(function(accumulator, key) {
			return (accumulator + key.toUpperCase() + ': ' + comments[key] + '\n');
		}, '');
	},
	generateLifecycles: function() {
		this.jobLog.startJobLog('HAM - Hardware Lifecycles');
		if (sn_hamp.HAMUtils.isZTMOnlyInstance()) {
			this.jobLog.stopJobLog(sn_hamp.HAMConstants.JOB_STATUSES.COMPLETED, sn_hamp.HAMConstants.ZTM_LOG_MESSAGE);
			return;
		}
		try {
			this.start_date = new GlideDateTime();
			// Determine last processed date from asset_property table
			var assetPropGr = this._getAssetProperty();
			this._determineLastProcessDate(assetPropGr);
			this._processContentLifecycles();
			// Set last processed date in asset_property table
			this._setProcessDate(assetPropGr);
			this.jobLog.stopJobLog(sn_hamp.HAMConstants.JOB_STATUSES.COMPLETED, this._generateComments());
		} catch (error) {
			this.jobLog.stopJobLog(sn_hamp.HAMConstants.JOB_STATUSES.FAILED, error.message);
		}
	},
	type: 'HAMHWModelLifecycleAPI',
};