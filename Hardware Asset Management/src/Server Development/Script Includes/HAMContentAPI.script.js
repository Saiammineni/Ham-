var HAMContentAPI = Class.create();
HAMContentAPI.prototype = (function() {

	function _HAMConstants() {
		return sn_hamp.HAMConstants ;
	}
	
	function _ModelUtils() {
		return global.ModelUtils ;
	}

	function _getModelStatus(json, gr) {
		if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
			json.status = (gr.getValue('life_cycle_stage') || '') + ':' + (gr.getValue('life_cycle_stage_status') || '');
		} else {
			json.status = gr.getValue('status') || '';
		}

		return json;
	}
		
	// Common private functions
	function _allowModelToUpload(cmdbModel) {
		// Reverse push is not enabled for models whose model categories are opted out of licensing
		if (cmdbModel.getValue('norm_license_opt_in') === 'N' || !HAMUtils.isNonLicensedModelAllowed(cmdbModel)) {
			return false;
		}

		if (gs.nil(cmdbModel.normalized_product) && gs.nil(cmdbModel.normalized_model)) { return true; }

		if (!gs.nil(cmdbModel.normalized_model)) {
			var model = cmdbModel.normalized_model;
			var modelTable = model.getRefRecord().getTableName();

			// if the norm model is content model then the upload should be enabled.
			if (modelTable === _HAMConstants().CONTENT_TABLES.HW_PRODUCT_MODEL) {
				return true;
			}

			// if norm model is custom and its excluded
			if (model.exclude_content_service_flag) { return false; }
		}

		if (!gs.nil(cmdbModel.normalized_product)) {
			var product = cmdbModel.normalized_product;
			var productTable = product.getRefRecord().getTableName();

			// if norm product is content product then the upload should be enabled.
			if (productTable === _HAMConstants().CONTENT_TABLES.HW_PRODUCT) {
				return true;
			}
			// if norm product is custom and its excluded
			return !product.exclude_content_service_flag;
		}

		// Ideally it should never come here.
		return false;
	}

	function _getModelTableQuery(modelTable) {
		var modelTableGq = new global.GlideQuery(modelTable)
			.where(new global.GlideQuery().where('exclude_content_service_flag', false).orWhereNull('exclude_content_service_flag'))
			.where(new global.GlideQuery().where('reported_flag', false).orWhereNull('reported_flag'))
			.where('normalized_status', '!=', 'new')
			.where('normalized_status', '!=', 'normalized')
			.where('norm_license_opt_in', '!=', 'N')
			.where(new global.GlideQuery().whereNotNull('name').orWhereNotNull('manufacturer').orWhereNotNull('model_number'));

		return modelTableGq.toGlideRecord().getEncodedQuery();
	}

	return {

		cdsNormalizationTables: Object.keys(_HAMConstants().CONTENT_TABLES).map(function(key) {
			return _HAMConstants().CONTENT_TABLES[key];
		}),
		/** ****
		In CONFIG map table configurations are defined where for each table we define all properties such as client table, server table, columns to send, filter query fo each opt - in choice in content service setup.
		ColumnMap is a Map where columns are defined as map, reference type columns should be defined with full heierarchy till required column ( because via dot walk on reference any column is gettable). All other data types columns we can not dot walk we will only get diplay value of it and right side (Values) in each json final expression is further used as keys in JSON sent to staging table.
		For example: "hardware_model_allow_share:
		columnMap: {
				name: 'ModelName',
				manufacturer: {
						name: 'CoreCompany'
						},
				model_number: 'model#'
				}"
		For the opt in property  hardware_model_allow_share,
		cmdb_hardware_product_model.name is outputted as ModelName in JSON
		cmdb_hardware_product_model.manufacturer.name is outputed as CoreCompany in JSON
		cmdb_hardware_product_model.model_number is outputted as model# in JSON
		JSON output would be : { ModelName:'', CoreCompany:'' , model#: ''}
		Note: All keys should be the valid column names of the table as the dot walking is happening on the keys.
		***** */
		CONFIG: {
			hardware_model_allow_share: {
				clientTable: 'cmdb_hardware_product_model',
				serverTable: 'ham_server_hardware_product_model',
				columnMap: {
					sys_id: 'sys_id',
					name: 'name',
					manufacturer: {
						name: 'manufacturer',
					},
					model_number: 'model_number',
					short_description: 'short_description',
					cmdb_model_category: function(json, gr) {
						json.cmdb_model_category = gr.cmdb_model_category.getDisplayValue() || '';
						return json;
					},
					status: _getModelStatus,
					normalized_model: {
						name: 'norm_model',
					},
					normalized_product: {
						name: 'norm_product',
					},
					normalized_company: {
						name: 'norm_company',
					},
					normalized_device_type: {
						name: 'norm_device_type',
					},
					normalized_rule: 'norm_rule',
					normalized_status: 'norm_status',
				},
				query: _getModelTableQuery('cmdb_hardware_product_model'),
				additionalRecordFilter: _allowModelToUpload,
			},

			consumable_model_allow_share: {
				clientTable: 'cmdb_consumable_product_model',
				serverTable: 'ham_server_consumable_product_model',
				columnMap: {
					sys_id: 'sys_id',
					name: 'name',
					manufacturer: {
						name: 'manufacturer',
					},
					model_number: 'model_number',
					short_description: 'short_description',
					cmdb_model_category: function(json, gr) {
						json.cmdb_model_category = gr.cmdb_model_category.getDisplayValue() || '';
						return json;
					},
					status: _getModelStatus,
					normalized_model: {
						name: 'norm_model',
					},
					normalized_product: {
						name: 'norm_product',
					},
					normalized_company: {
						name: 'norm_company',
					},
					normalized_device_type: {
						name: 'norm_device_type',
					},
					normalized_rule: 'norm_rule',
					normalized_status: 'norm_status',
				},
				query:_getModelTableQuery('cmdb_consumable_product_model'),
				additionalRecordFilter: _allowModelToUpload,
			},

			hardware_lifecycle_allow_share: {
				clientTable: 'cmdb_hardware_model_lifecycle',
				serverTable: 'ham_server_hardware_model_lifecycle',
				columnMap: {
					sys_id: 'sys_id',
					lifecycle_type: 'lifecycle_type',
					lifecycle_phase: 'lifecycle_phase',
					source: 'source',
					start_date: 'start_date',
					end_date: 'end_date',
					risk: 'risk',
					model: {
						normalized_model: {
							name: 'norm_model',
						},
						normalized_product: {
							name: 'norm_product',
						},
						normalized_company: {
							name: 'norm_company',
						},
						normalized_device_type: {
							name: 'norm_device_type',
						},
					},
				},
				query: 'exclude_content_service_flag=false^ORexclude_content_service_flagISEMPTY^reported_flag=false^ORreported_flagISEMPTY^active=true^lifecycle_type!=internal^source!=' + _HAMConstants().SOURCE_SERVICENOW,
				additionalRecordFilter: function(gr) {
					// if hardware model marked as exclude
					var cmdbModel = gr.model.getRefRecord();
					if (cmdbModel.exclude_content_service_flag) { return false; }

					return _allowModelToUpload(cmdbModel);
				},
			},

			consumable_lifecycle_allow_share: {
				clientTable: 'cmdb_consumable_model_lifecycle',
				serverTable: 'ham_server_consumable_model_lifecycle',
				columnMap: {
					sys_id: 'sys_id',
					lifecycle_type: 'lifecycle_type',
					lifecycle_phase: 'lifecycle_phase',
					source: 'source',
					start_date: 'start_date',
					end_date: 'end_date',
					risk: 'risk',
					model: {
						normalized_model: {
							name: 'norm_model',
						},
						normalized_product: {
							name: 'norm_product',
						},
						normalized_company: {
							name: 'norm_company',
						},
						normalized_device_type: {
							name: 'norm_device_type',
						},
					},
				},
				query: 'exclude_content_service_flag=false^ORexclude_content_service_flagISEMPTY^reported_flag=false^ORreported_flagISEMPTY^active=true^lifecycle_type!=internal^source!=' + _HAMConstants().SOURCE_SERVICENOW,
				additionalRecordFilter: function(gr) {
					// if consumable model marked as exclude
					var cmdbModel = gr.model.getRefRecord();
					if (cmdbModel.exclude_content_service_flag) { return false; }

					return _allowModelToUpload(cmdbModel);
				},
			},

			custom_product_model_allow_share: {
				clientTable: 'sn_hamp_custom_hw_prod_model',
				serverTable: 'ham_server_custom_hw_product_model',
				columnMap: {
					sys_id: 'sys_id',
					name: 'name',
					model_number: 'model_number',
					hw_product: {
						name: 'product',
						hw_manufacturer: {
							company: {
								name: 'manufacturer',
							},
						},
						device_type: {
							name: 'device_type',
						},
					},
				},
				query: 'exclude_content_service_flag=false^ORexclude_content_service_flagISEMPTY^reported_flag=false^ORreported_flagISEMPTY',
				additionalRecordFilter: function(gr) {
					var product = gr.hw_product;
					var productTable = product.getRefRecord().getTableName();

					// if product is content product then the upload should be enabled.
					if (productTable === _HAMConstants().CONTENT_TABLES.HW_PRODUCT) {
						return true;
					}

					// if product is not content product and its excluded
					return !product.exclude_content_service_flag;
				},
			},
		},

		initialize: function() {
			this.jobLog = new global.AssetJobLogUtil();
			this._modelUtils =  global.ModelUtils();			
		},

		// Get client records according to opt-in options.
		_upload: function() {
			var hamConfigTableGr = new GlideRecord('sn_hamp_configuration');
			var rowCount = 0;
			hamConfigTableGr.addQuery('value', 'true');
			hamConfigTableGr.query();
			while (hamConfigTableGr.next()) {
				var tableConfig = this.CONFIG[hamConfigTableGr.getValue('name')];
				var clientTableGr = new GlideRecord(tableConfig.clientTable);
				clientTableGr.addEncodedQuery(tableConfig.query);
				clientTableGr.query();
				this.jobLog.startJobStep('Upload: ' + tableConfig.clientTable);
				rowCount = 0;
				var stagingRecord = new GlideRecord('cds_client_staging');
				while (clientTableGr.next()) {
					if (tableConfig.additionalRecordFilter(clientTableGr)) {
						rowCount++;
						this._createStagingRecord(stagingRecord, tableConfig, clientTableGr);
					}
				}
				this.jobLog.stopJobStep('Upload: ' + tableConfig.clientTable, 'Records processed : ' + rowCount);
			}
		},

		// Create a client staging record and insert it.
		_createStagingRecord: function(stagingRecord, tableConfig, clientTableGr) {
			stagingRecord.initialize();
			var json = {};
			json = this._getJsonForRecord(json, tableConfig.columnMap, clientTableGr);
			stagingRecord.discovered_name = JSON.stringify(json);
			stagingRecord.source_table = tableConfig.clientTable;
			stagingRecord.table = tableConfig.serverTable;
			stagingRecord.state = 'ready';
			stagingRecord.insert();
			clientTableGr.reported_flag = true;
			
			// hwnorm2hamp clientTableGr.setWorkflow(false);
			// hwnorm2hamp clientTableGr.update();
			_ModelUtils().updateDisableBR(clientTableGr);

		},

		// Build Json for each columnMap
		_getJsonForRecord: function(json, columnMap, clientTableGr) {
			for (var col in columnMap) {
				if (gs.nil(clientTableGr)) {
					json[columnMap[col]] = '';
				} else if (typeof (columnMap[col]) === 'string') {
					json[columnMap[col]] = clientTableGr.getValue(col) || '';
				} else if (typeof (columnMap[col]) === 'function') {
					json = columnMap[col](json, clientTableGr);
				} else { this._getJsonForRecord(json, columnMap[col], clientTableGr[col].getRefRecord()); }
			}
			return json;
		},

		runJob: function() {
			this._hamHardwareAssetManagementContentUpload();
		},

		// Logs in to asset job log and starts upload
		_hamHardwareAssetManagementContentUpload: function() {
			// Track a job log record in the Asset Job Log table for push to CDS instance
			this.jobLog.startJobLog('HAM - Content Upload');
			if (sn_hamp.HAMUtils.isZTMOnlyInstance()) {
				this.jobLog.stopJobLog(this.jobLog.COMPLETED_STATUS, sn_hamp.HAMConstants.ZTM_LOG_MESSAGE);
				return;
			}
			try {
				var message = this._pushMisses();
				this.jobLog.stopJobLog(this.jobLog.COMPLETED_STATUS, message);
			} catch (error) {
				this.jobLog.stopJobLog(this.jobLog.FAILED_STATUS, error.message);
			}
		},

		// We will only push misses if a normalization job has completed after the latest CDS pull
		// CDS pull is a weekly job while normalization and push of misses happens daily
		// After a CDS pull, a push should happen before the next CDS pull
		_pushMisses: function() {
			var result = this._isReadyToPushMisses(); // returning true. because client schedule and client staging will added later.
			if (result.ready === true) { this._upload(); }
			return result.comments;
		},

		// Check if ready to push the misses i.e if pull completed and normalization after it.
		_isReadyToPushMisses: function() {
			var result = {
				ready: false,
				comments: '',
			};

			var latestPullDate = this._getLatestPullDate();
			if (!gs.nil(latestPullDate)) {
				if (this._hasNormalizationRunAfterCDSPull(latestPullDate)) {
					result.ready = true;
					result.comments = 'Upload completed';
				} else {
					result.comments = 'Normalization job did not run after latest pull: ' + latestPullDate;
				}
			} else {
				result.comments = 'CDS pull has NOT occurred on all the tables';
			}
			return result;
		},

		// Get latest pull date from cds pull tables.
		_getLatestPullDate: function() {
			var clientSchedule = new GlideRecord('cds_client_schedule');
			clientSchedule.addQuery('table.table', 'IN', this.cdsNormalizationTables);
			clientSchedule.orderByDesc('last_updated_on');
			clientSchedule.query();
			var latestPullDate;
			while (clientSchedule.next()) {
				if (!clientSchedule.getValue('last_updated_on')) {
					latestPullDate = null;
					break;
				}
				if (!latestPullDate) {
					latestPullDate = clientSchedule.getValue('last_updated_on');
				}
			}
			return latestPullDate;
		},

		// check if normalization job ran after latest pull.
		_hasNormalizationRunAfterCDSPull: function(latestPullDate) {
			var normJobLog = new GlideRecord('asset_job_log');
			normJobLog.addQuery('name', _HAMConstants().NORMALIZATION_JOB_MESSAGES.JOB_LOG_MESSAGE);
			normJobLog.addQuery('status', this.jobLog.COMPLETED_STATUS);
			normJobLog.addQuery('sys_created_on', '>', latestPullDate);
			normJobLog.setLimit(1);
			normJobLog.query();
			return normJobLog.hasNext();
		},

		type: 'HAMContentAPI',
	};
}());