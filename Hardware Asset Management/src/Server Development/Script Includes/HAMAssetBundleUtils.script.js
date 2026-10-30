var HAMAssetBundleUtils = Class.create();
HAMAssetBundleUtils.prototype = {
	QUANTITY_MULTIPLIER: 30,
	ASSET_REQ_FIELDS: [
		'substatus',
		'install_status',
		'location',
		'stockroom',
		'company',
		'department',
		'assigned_to',
		'managed_by',
		'owned_by',
		'assigned',
		'cost_cc',
		'cost_center',
		'parent',
		'sys_class_name',
		'sys_id',
	],

	initialize: function() {
		this.ConsumableUtil = new global.Consumables();
	},

	isConsumableSubClass: function(className) {
		var gr = new GlideRecord(className);
		return global.ModelUtils.isAncestor(gr, 'alm_consumable');
	},

	/**
        Queries child components under a Bundled model
        returns hash with information of components.
    */
	getChildModelInfo: function(bundledAsset) {
		var mHash = {};
		var mSysId;
		var assetClass;

		new global.GlideQuery('cmdb_m2m_model_component')
			.where('parent', bundledAsset.getValue('model'))
			.select('child.sys_id', 'model_category.asset_class', 'child$DISPLAY', 'child.bundle_assets')
			.forEach(function(m2mHash) {
				assetClass = m2mHash.model_category.asset_class;

				// if asset bundle, then and assetClass not defined, we hardcode it.
				if (!assetClass && m2mHash.child.bundle_assets === true) {
					assetClass = sn_hamp.HAMConstants.BUNDLE_ASSET_TABLE;
				}

				if (assetClass) {
					mSysId = m2mHash.child.sys_id;

					if (mHash[mSysId]) {
						mHash[mSysId].count += 1;
					} else {
						mHash[mSysId] = {
							name: m2mHash.child$DISPLAY,
							modelId: mSysId,
							assetClass: assetClass,
							isConsumable: this.isConsumableSubClass(assetClass),
							count: 1,
						};
					}
				}
			}.bind(this));

		var mArr = [];

		Object.keys(mHash).forEach(function(modelId) {
			if (mHash[modelId].isConsumable) {
				mArr.unshift(mHash[modelId]);
			} else {
				mArr.push(mHash[modelId]);
			}
		});

		return mArr;
	},

	// splits getChildModelInfo method array into individual quantity based on model type.
	// If model category is of type consumable, we dont have to split.
	_splitModelRecordsByCategory: function(models) {
		var unMergedModels = [];
		var cloneObj;

		models.forEach(function(modelInfo) {
			if (modelInfo.count > 1 && !modelInfo.isConsumable) {
				for (var i = 0; i < modelInfo.count; i++) {
					cloneObj = JSON.parse(JSON.stringify(modelInfo));
					cloneObj.count = 1;
					cloneObj.id = modelInfo.modelId + i;
					unMergedModels.push(cloneObj);
				}
			} else {
				modelInfo.id = modelInfo.modelId;
				unMergedModels.push(modelInfo);
			}
		});

		return unMergedModels;
	},

	getBundleAssetGr: function(assetId) {
		var assetGr = new GlideRecord('alm_bundle');
		assetGr.get(assetId);
		return assetGr;
	},

	isIncompleteBundle: function(bundledAssetId) {
		return this.getUnfilledBundledAssetInfo(bundledAssetId, true).length > 0;
	},

	isIncompleteBundleAllowedForStatus: function(status, subStatus) {
		// InComplete bundle is allowed for statuses - Build, Retire.
		var assetStatus = sn_hamp.HAMConstants.ASSET_STATUSES;
		return [assetStatus.BUILD, assetStatus.RETIRED].indexOf(status) !== -1
		|| (assetStatus.IN_STOCK === status && subStatus === sn_hamp.HAMConstants.ASSET_SUB_STATUSES.PENDING_DISPOSAL);
	},

	isInCompleteBundleAllowed: function(bundledAsset) {
		var status = bundledAsset.getValue('install_status');
		var incompleteAllowedStatus = this.isIncompleteBundleAllowedForStatus(status);
		return incompleteAllowedStatus || !this.isIncompleteBundle(bundledAsset.getUniqueValue());
	},

	getUnfilledBundledAssetInfo: function(bundleAssetId, dontSplit) {
		var assetGr = this.getBundleAssetGr(bundleAssetId);

		var modelQuantityHash = {};
		// get assets assoicated with bundled model
		new global.GlideQuery('alm_asset')
			.where('parent', assetGr.getValue('sys_id'))
			.select('model.sys_id', 'quantity')
			.forEach(function(asset) {
				if (asset.model) {
					if (asset.model.sys_id in modelQuantityHash) {
						modelQuantityHash[asset.model.sys_id] += asset.quantity;
					} else {
						modelQuantityHash[asset.model.sys_id] = asset.quantity;
					}
				}
			});

		var models = this.getChildModelInfo(assetGr);

		var nonZeroModels = [];

		models.forEach(function(modelInfo) {
			if (modelQuantityHash[modelInfo.modelId]) {
				modelInfo.count -= modelQuantityHash[modelInfo.modelId];
			}

			if (modelInfo.count > 0) {
				nonZeroModels.push(modelInfo);
			}
		});

		if (dontSplit) {
			return nonZeroModels;
		}
		return this._splitModelRecordsByCategory(nonZeroModels);
	},

	availableStatusQuery: function(gQuery) {
		return gQuery
			.where('install_status', parseInt(sn_hamp.HAMConstants.ASSET_STATUSES.IN_STOCK, 10))
			.where('substatus', sn_hamp.HAMConstants.ASSET_SUB_STATUSES.AVAILABLE)
			.where(
				new global.GlideQuery()
					.whereNull('asset_function')
					.orWhere('asset_function', '!=', sn_hamp.HAMConstants.ASSET_FUNCTION.LOANER)
			)
			.whereNull('parent');
	},

	whereClauseForBundleCreation: function(gQuery, modelId, stockroom) {
		var whereQuery = this.availableStatusQuery(gQuery)
			.where('model', modelId);

		if (!gs.nil(stockroom)) {
			whereQuery = whereQuery.where('stockroom', stockroom);
		}

		return whereQuery;
	},

	getAssetsIfStockAvailabe: function(assetClass, modelId, stockroom, reqQuantity, domainId) {
		var assetIds = [];
		var quantityAvailable = 0;

		var whereClause = this.whereClauseForBundleCreation(new global.GlideQuery(assetClass), modelId, stockroom);

		if (!gs.nil(domainId) && String(domainId) !== 'global') {
			whereClause = whereClause.where('sys_domain', domainId);
		}
		var assetGr = whereClause.toGlideRecord();
		if (HAMLicensingUtility.isExclusionSupportedClass(assetClass)) {
			assertGr = HAMLicensingUtility.addHAMFlowsInclusionCriteria(assetGr);
		}
		assetGr.setLimit(reqQuantity * this.QUANTITY_MULTIPLIER);
		assetGr.query();
		while(assetGr.next()) {
			quantityAvailable += parseInt(assetGr.getValue('quantity'),10);
			assetIds.push(assetGr.getUniqueValue());
		}

		if (reqQuantity <= quantityAvailable) {
			return {
				isInstock: true,
				quantityAvailable: quantityAvailable,
				assetIds: assetIds,
			};
		}

		return {
			isInstock: false,
			quantityAvailable: quantityAvailable,
			assetIds: [],
		};
	},

	allocateConsumablesInstockToParent: function(assetClass, assetIds, stockroom, reqQuantity, parent) {
		var quantityFilled = 0;
		var assetAttrs;
		var sysId;
		var allocatedAssets = [];
		var assetGr;
		var quantityFromAsset;

		for (var i = 0; i < assetIds.length; i++) {
			assetGr = new GlideRecord(assetClass);
			assetGr.get(assetIds[i]);

			if (this.isAssetAvailable(assetGr, stockroom)) {
				assetAttrs = this.getAssetAttrHash(assetGr, this.ASSET_REQ_FIELDS);

				if (assetGr.getValue('quantity') <= (reqQuantity - quantityFilled)) {
					quantityFromAsset = parseInt(assetGr.getValue('quantity'), 10);
				} else {
					quantityFromAsset = (reqQuantity - quantityFilled);
				}

				sysId = this.ConsumableUtil.split(
					assetIds[i],
					quantityFromAsset,
					assetGr.getValue('install_status'),
					assetGr.getValue('substatus'),
					parent,
					stockroom,
					assetGr.getValue('location'),
					assetGr.getValue('assigned_to'),
					sn_hamp.HAMConstants.ASSET_FUNCTION.ASSET_BUNDLE
				);

				if (typeof sysId === 'string') {
					// if sys_ids are not equal, it implies a split happened.
					if (sysId !== assetIds[i]) {
						assetAttrs.sys_id = sysId;
					}

					assetAttrs.quantity = quantityFromAsset;
					quantityFilled += quantityFromAsset;
					allocatedAssets.push(assetAttrs);
				} else {
					// rare scenario: some quantity of consumables are taken away after
					// isAssetAvailable and assetGr is taken from db and before allocation happened.
					// We can decrement the i value by 1 so that this consumable
					// is looped in again with the current available quantity.
					// But this may lead to infinite loop / a bigger loop when the above scenario happens repeatedly.
					// For now we just skip processing and iterate to next record.

				}
			}

			if (reqQuantity === quantityFilled) {
				break;
			}
		}

		if (quantityFilled < reqQuantity) {
			return {
				isAllocated: false,
				quantityAvailable: quantityFilled,
				allocatedAssets: allocatedAssets,
			};
		}

		return {
			isAllocated: true,
			allocatedAssets: allocatedAssets,
		};
	},

	allocateNonConsumablesInStockToParent: function(assetClass, assetIds, stockroom, reqQuantity, parent) {
		var quantityFilled = 0;
		var assetAttrs;
		var allocatedAssets = [];
		var assetGr;

		for (var i = 0; i < assetIds.length; i++) {
			assetGr = new GlideRecord(assetClass);
			assetGr.get(assetIds[i]);
			if (this.isAssetAvailable(assetGr, stockroom)) {
				assetAttrs = this.getAssetAttrHash(assetGr, this.ASSET_REQ_FIELDS);
				assetGr.setValue('parent', parent);
				assetGr.setValue('asset_function', sn_hamp.HAMConstants.ASSET_FUNCTION.ASSET_BUNDLE);
				assetGr.update();
				quantityFilled += 1;
				allocatedAssets.push(assetAttrs);
			}

			if (quantityFilled === reqQuantity) {
				break;
			}
		}

		if (quantityFilled < reqQuantity) {
			return {
				isAllocated: false,
				quantityAvailable: quantityFilled,
				allocatedAssets: allocatedAssets,
			};
		}

		return {
			isAllocated: true,
			allocatedAssets: allocatedAssets,
		};
	},

	getAssetAttrHash: function(assetGr, columns) {
		var assetAttrHash = {};
		for (var field in assetGr) {
			if (columns.indexOf(field) !== -1) {
				assetAttrHash[field] = assetGr.getValue(field);
			}
		}

		return assetAttrHash;
	},

	isAssetAvailable: function(assetGr, stockroom) {
		return (gs.nil(stockroom) || assetGr.getValue('stockroom') === stockroom)
            && assetGr.getValue('install_status') === sn_hamp.HAMConstants.ASSET_STATUSES.IN_STOCK
            && assetGr.getValue('substatus') === sn_hamp.HAMConstants.ASSET_SUB_STATUSES.AVAILABLE
            && assetGr.getValue('asset_function') !== sn_hamp.HAMConstants.ASSET_FUNCTION.LOANER
            && !assetGr.getValue('parent');
	},

	addInsufficientAssetsErrorMsg: function(modelName, requiredCount, actualCount) {
		var msgParams = [modelName, String(requiredCount), String(actualCount)];
		// eslint-disable-next-line max-len
		var errorMessage = gs.getMessage('Insufficient stock for model: {0} (Expected - {1}, Available - {2})', msgParams);
		gs.addErrorMessage(errorMessage);
	},

	resetAssetState: function(tableName, columnHash) {
		if (gs.nil(columnHash.sys_id)) {
			gs.error('Failed to update. sys_id is empty.');
		}

		var gr = new GlideRecord(tableName);
		gr.get(columnHash.sys_id);

		Object.keys(columnHash).forEach(function(column) {
			if (gr.isValidField(column) && column.indexOf('sys_') === -1) {
				gr.setValue(column, columnHash[column]);
			}
		});

		gr.update();

		return gr;
	},

	getAssetsForBundle: function(bundledAssetId) {
		var assetGr = this.getBundleAssetGr(bundledAssetId);

		var whereClauseFn = function(gQuery) {
			return gQuery.where('parent', assetGr.getValue('sys_id'));
		};

		return this.getAssets(whereClauseFn);
	},

	getAssets: function(whereClauseFn) {
		var gQuery = new global.GlideQuery('alm_asset');

		if (whereClauseFn) {
			gQuery = whereClauseFn(gQuery);
		}

		var assets = [];
		// eslint-disable-next-line max-len
		gQuery.select('sys_id', 'display_name', 'stockroom', 'model', 'sys_class_name', 'quantity', 'parent', 'serial_number', 'excluded_from_ham')
			.forEach(function(asset) {
				assets.push({
					sys_id: asset.sys_id,
					display_name: asset.display_name,
					stockroom: asset.stockroom,
					model: asset.model,
					sys_class_name: asset.sys_class_name,
					quantity: asset.quantity,
					parent: asset.parent,
					isConsumable: this.isConsumableSubClass(asset.sys_class_name),
					serial_number: asset.serial_number,
					excluded_from_ham: asset.excluded_from_ham,
				});
			}.bind(this));

		return assets;
	},

	// This method is called when assets selected from UI action is submitted.
	associateAssets: function(bundledAssetId, modelAssetHash) {
		var models = this.getUnfilledBundledAssetInfo(bundledAssetId, true);

		var reqQuantity;
		var allocatedStatus;

		var assetIds = [];

		Object.keys(modelAssetHash).forEach(function(modelId) {
			modelAssetHash[modelId].forEach(function(assetId) {
				assetIds.push(assetId);
			});
		});

		var whereClauseFn = function(gQuery) {
			return gQuery.where('sys_id', 'IN', assetIds);
		};

		var assets = this.getAssets(whereClauseFn);

		var assetHash = {};

		assets.forEach(function(asset) {
			assetHash[asset.sys_id] = asset;
		});

		var compatibleAssetIds;
		var currentAllocatedAssets = [];
		var errorMessages = [];

		var bundledAssetGr = this.getBundleAssetGr(bundledAssetId);
		models.forEach(function(modelInfo) {
			compatibleAssetIds = [];
			if (modelInfo.modelId in modelAssetHash) {
				// defaulting reqQuantity to actual required quantity and not the count of asset ids got from UI page.
				// for consumables, we always get count of asset ids as 1.
				// If before submit of modal few non-consumable assets are allocated
				// then required quantity colud be less than asset ids got from UI page. In that case consider
				reqQuantity = modelInfo.count;

				modelAssetHash[modelInfo.modelId].forEach(function(assetId) {
					var assetRecClass = String(assetHash[assetId].sys_class_name);
					var isAssetExcludedFromHAM = false; 
					if (HAMLicensingUtility.isExclusionSupportedClass(String(assetRecClass))) {
						isAssetExcludedFromHAM = assetHash[assetId].excluded_from_ham;
					}
					if (assetHash[assetId] && !isAssetExcludedFromHAM) {
						if (modelInfo.modelId === assetHash[assetId].model) {
							compatibleAssetIds.push(assetId);
						} else {
							errorMessages.push(
								gs.getMessage('Selected asset {0} is not compatible for model {1}.',
									[assetHash[assetId].display_name, modelInfo.name])
							);
						}
					} else if (isAssetExcludedFromHAM) {
						errorMessages.push(
							gs.getMessage('Selected asset {0} is not compatible for model {1}.It is excluded', [assetHash[assetId].display_name, modelInfo.name]));
					}
				});

				if (compatibleAssetIds.length > 0) {
					if (modelInfo.isConsumable) {
						allocatedStatus = this.allocateConsumablesInstockToParent(
							modelInfo.assetClass,
							compatibleAssetIds,
							undefined,
							reqQuantity,
							bundledAssetGr.getUniqueValue()
						);
					} else {
						if (modelInfo.count > compatibleAssetIds.length) {
							reqQuantity = compatibleAssetIds.length;
						}

						allocatedStatus = this.allocateNonConsumablesInStockToParent(
							modelInfo.assetClass,
							compatibleAssetIds,
							undefined,
							reqQuantity,
							bundledAssetGr.getUniqueValue()
						);
					}

					allocatedStatus.allocatedAssets.forEach(function(ah) {
						currentAllocatedAssets.push(ah);
					});

					if (!allocatedStatus.isAllocated) {
						var nonAllocatedAssets = [];
						compatibleAssetIds.forEach(function(assetId) {
							if (allocatedStatus.allocatedAssets.indexOf(assetId) === -1) {
								nonAllocatedAssets.push(assetId);
							}
						});

						nonAllocatedAssets.forEach(function(assetId) {
							errorMessages.push(
								gs.getMessage('Failed to associate asset {0} to bundle. Asset is not In stock.',
									[assetHash[assetId].display_name])
							);
						});
					}
				}
			}
		}.bind(this));

		// Sync asset columns with parent.
		var assetGr;

		currentAllocatedAssets.forEach(function(asset) {
			assetGr = new GlideRecord('alm_asset');
			assetGr.get(asset.sys_id);
			this.syncWithParent(assetGr, bundledAssetGr);
		}.bind(this));

		if (errorMessages.length > 0) {
			errorMessages.forEach(function(errorMsg) {
				gs.addErrorMessage(errorMsg);
			});
		} else {
			gs.addInfoMessage(gs.getMessage('Successfully added assets to bundle.'));
		}
	},

	replaceAssets: function(bundledAssetId, replaceAssetHash) {
		var bundledAssetGr = this.getBundleAssetGr(bundledAssetId);
		var models = this.getChildModelInfo(bundledAssetGr);

		var modelHash = {};
		models.forEach(function(model) {
			modelHash[model.modelId] = model;
		});

		var sourceAssetGr;
		var sourceAssetExists;

		var destAssetGr;
		var destAssetExists;

		var modelInfo;
		var userInputQuantity;
		var sourceQuantity;
		var destQuantity;
		var oldModelComponentFieldPresent = false; 

		var errorMessages = [];

		Object.keys(replaceAssetHash).forEach(function(assetId) {
			sourceAssetGr = new GlideRecord('alm_asset');
			sourceAssetExists = sourceAssetGr.get(assetId);
			destAssetGr = new GlideRecord('alm_asset');
			destAssetExists = destAssetGr.get(replaceAssetHash[assetId].sysId);

			if (destAssetGr.isValidField('model_component')) {
				oldModelComponentFieldPresent = true;
			}

			// Default false for all classes, will be checked if true based on sys_class_name
			var isDestAssetExcluded = false;
			if (HAMLicensingUtility.isExclusionSupportedClass(String(destAssetGr.sys_class_name))) {
				isDestAssetExcluded =sn_hamp.HAMLicensingUtility.isAssetExcludedFromHAMFlows(destAssetGr);
			}

			// Check if asset and replacemenet asset exist and are of same model.
			if (sourceAssetExists
                && destAssetExists
                && (sourceAssetGr.getValue('model') === destAssetGr.getValue('model'))
                && !gs.nil(sourceAssetGr.getValue('model'))
                && this.isAssetAvailable(destAssetGr)
				&& !isDestAssetExcluded) {
				modelInfo = modelHash[sourceAssetGr.getValue('model')];
				userInputQuantity = replaceAssetHash[assetId].quantity;

				if (modelInfo.isConsumable) {
					sourceQuantity = sourceAssetGr.getValue('quantity');
					destQuantity = destAssetGr.getValue('quantity');

					if (userInputQuantity > sourceQuantity) {
						errorMessages.push(
							// eslint-disable-next-line max-len
							gs.getMessage('Failed to replace asset. Provided more quantity than on bundle for asset {0}',
								[sourceAssetGr.getDisplayValue()])
						);
					} else if (userInputQuantity > destQuantity) {
						errorMessages.push(
							// eslint-disable-next-line max-len
							gs.getMessage('Failed to replace asset. Provided more quantity than available for asset {0}',
								[sourceAssetGr.getDisplayValue()])
						);
					} else if (userInputQuantity <= 0) {
						if (userInputQuantity < 0) {
							errorMessages.push(
								// eslint-disable-next-line max-len
								gs.getMessage('Failed to replace asset. Provided negative quantity for asset {0}',
									[sourceAssetGr.getDisplayValue()])
							);
						} else {
							errorMessages.push(
								// eslint-disable-next-line max-len
								gs.getMessage('Failed to replace asset. Provided zero quantity for asset {0}',
									[sourceAssetGr.getDisplayValue()])
							);
						}
					} else {
						this.ConsumableUtil.split(
							destAssetGr.getUniqueValue(),
							userInputQuantity,
							bundledAssetGr.getValue('install_status'),
							bundledAssetGr.getValue('substatus'),
							'',
							destAssetGr.getValue('stockroom'),
							destAssetGr.getValue('location'),
							destAssetGr.getValue('assigned_to')
						);
					}
				} else {
					var updateParams = {
						install_status: parseInt(sourceAssetGr.getValue('install_status'), 10),
						substatus: sourceAssetGr.getValue('substatus'),
						model_component_id: null,
					};

					if (oldModelComponentFieldPresent) {
						updateParams.model_component = null;
					}

					if (!sourceAssetGr.getValue('stockroom')) {
						updateParams.stockroom = destAssetGr.getValue('stockroom');
						updateParams.location = destAssetGr.getValue('location');
					}

					sn_hamp.HAMUtils.releaseAssets(
						bundledAssetGr.getUniqueValue(),
						[sourceAssetGr.getUniqueValue()],
						updateParams,
						true
					);
					this.syncWithParent(destAssetGr, bundledAssetGr);
				}
			} else if (isDestAssetExcluded) {
				errorMessages.push(HAMLicensingUtility.getAssetWorkNotesMessage(destAssetGr));
			} else {
				// Handle error case.
				errorMessages.push(gs.getMessage('Failed to replace assets. Please try again later.'));
			}
		}.bind(this));

		if (errorMessages.length > 0) {
			errorMessages.forEach(function(errorMsg) {
				gs.addErrorMessage(errorMsg);
			});
			return false;
		}
		gs.addInfoMessage(gs.getMessage('Successfully replaced assets.'));
		return true;
	},

	canAddToBundle: function(asset) {
		var assetInfo = new sn_hamp.HAMAssetBundleUtils().getUnfilledBundledAssetInfo(String(asset.parent));

		// eslint-disable-next-line max-len
		var errorMessage = gs.getMessage('Cannot add asset to bundle. Verify this asset is compatible with bundle or similar asset already exists in asset bundle');
		var currentModelId = asset.getValue('model');

		var canAdd = false;

		for (var i = 0; i < assetInfo.length; i++) {
			if (assetInfo[i].modelId === currentModelId) {
				if (parseInt(asset.getValue('quantity'), 10) <= assetInfo[i].count) {
					canAdd = true;
				} else {
					// eslint-disable-next-line max-len
					errorMessage = gs.getMessage('Cannot add asset to bundle. Quantity available on asset is {0} whereas quantity required for bundle is {1}', [asset.getValue('quantity'), String(assetInfo[i].count)]);
				}

				break;
			}
		}

		return { canAdd: canAdd, errorMessage: errorMessage };
	},

	syncWithParent: function(assetGr, parent) {
		// Setting parent and asset_function.
		assetGr.setValue('parent', parent.getUniqueValue());
		assetGr.setValue('asset_function', sn_hamp.HAMConstants.ASSET_FUNCTION.ASSET_BUNDLE);
		var assetCI = new global.AssetandCI();
		assetCI.inheritInfoFromParentAsset(assetGr, parent);
		var consumablClassess = HAMUtils.getTableExtensions('alm_consumable');
		if (consumablClassess.indexOf(String(assetGr.sys_class_name)) === -1) {
			this.setModelComponentOnChild(parent, assetGr);
		}
		assetGr.update();
	},

	setModelComponentOnChild: function(parent, childGr) {
		var mcGr = new GlideRecord('cmdb_m2m_model_component');
		mcGr.addQuery('child', childGr.model);
		mcGr.addQuery('parent', parent.model);
		mcGr.query();
		var rowCount = mcGr.getRowCount();

		if (rowCount === 1) {
			mcGr.next();
			childGr.setValue('model_component_id', mcGr.sys_id);
		} else {
			var allComponentIds = [];
			while (mcGr.next()) {
				allComponentIds.push(String(mcGr.sys_id));
			}

			var selectedComponentIDs = [];
			new global.GlideQuery('alm_asset')
				.where('parent', parent.sys_id)
				.where('model', childGr.model)
				.select('model_component_id')
				.forEach(function(asset) {selectedComponentIDs.push(asset.model_component_id);});

			for (var i=0;i<allComponentIds.length;i++){
				if (selectedComponentIDs.indexOf(allComponentIds[i]) === -1) {
					childGr.setValue('model_component_id', allComponentIds[i]);
					break;
				}
			}
		}
	},


	autoAssociateAssets: function(bundledAsset) {
		var modelArr = this.getUnfilledBundledAssetInfo(bundledAsset.getUniqueValue(), true);

		var abortAction = false;
		var reqQuantity;
		var inStockStatus;
		var allocatedStatus;
		var modelInfo;
		var currentAllocatedAssets = [];
		var i;

		for (i = 0; i < modelArr.length; i++) {
			modelInfo = modelArr[i];
			reqQuantity = modelInfo.count;
			inStockStatus = this.getAssetsIfStockAvailabe(
				modelInfo.assetClass,
				modelInfo.modelId,
				bundledAsset.getValue('stockroom'),
				reqQuantity,
				bundledAsset.getValue('sys_domain')
			);

			if (!inStockStatus.isInstock) {
				// Add error message
				this.addInsufficientAssetsErrorMsg(
					modelInfo.name,
					reqQuantity,
					inStockStatus.quantityAvailable
				);
				abortAction = true;
			}

			// attaching inStockStatus to modelInfo object for future calculations.
			modelInfo.inStockStatus = inStockStatus;
		}

		if (abortAction) {
			bundledAsset.setAbortAction(true);
			return;
		}

		for (i = 0; i < modelArr.length; i++) {
			modelInfo = modelArr[i];
			reqQuantity = modelInfo.count;
			if (modelInfo.isConsumable) {
				allocatedStatus = this.allocateConsumablesInstockToParent(
					modelInfo.assetClass,
					modelInfo.inStockStatus.assetIds,
					bundledAsset.getValue('stockroom'),
					reqQuantity,
					bundledAsset.getUniqueValue()
				);
			} else {
				allocatedStatus = this.allocateNonConsumablesInStockToParent(
					modelInfo.assetClass,
					modelInfo.inStockStatus.assetIds,
					bundledAsset.getValue('stockroom'),
					reqQuantity,
					bundledAsset.getUniqueValue()
				);
			}

			allocatedStatus.allocatedAssets.forEach(function(assetHash) {
				currentAllocatedAssets.push(assetHash);
			});

			if (!allocatedStatus.isAllocated) {
				this.addInsufficientAssetsErrorMsg(
					modelInfo.name,
					reqQuantity,
					allocatedStatus.quantityAvailable
				);

				abortAction = true;
				break;
			}
		}

		if (abortAction) {
			bundledAsset.setAbortAction(true);

			var gr;
			var assetAttrs;
			// Revert
			for (i = 0; i < currentAllocatedAssets.length; i++) {
				assetAttrs = currentAllocatedAssets[i];
				assetAttrs.parent = '';
				assetAttrs.asset_function = '';
				gr = this.resetAssetState(assetAttrs.sys_class_name, assetAttrs);

				if (this.isConsumableSubClass(assetAttrs.sys_class_name)) {
					this.ConsumableUtil.mergeConsumable(gr);
				}
			}

			return;
		}

		gs.addInfoMessage(gs.getMessage('Assets are auto-selected successfully'));

		// Sync asset columns with parent.
		var assetGr;

		currentAllocatedAssets.forEach(function(asset) {
			assetGr = new GlideRecord('alm_asset');
			assetGr.get(asset.sys_id);
			this.syncWithParent(assetGr, bundledAsset);
		}.bind(this));
	},
	type: 'HAMAssetBundleUtils',
};

HAMAssetBundleUtils.isParentBundle = function (parentSysId) {
	var parentGr = new GlideRecord('alm_asset');
	parentGr.get(parentSysId);
	if (global.ModelUtils.isAncestor(parentGr, 'alm_bundle')) {
		return true;
	}
	return false;
};