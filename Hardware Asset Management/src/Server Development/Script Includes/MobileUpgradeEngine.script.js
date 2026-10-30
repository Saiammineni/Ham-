var MobileUpgradeEngine = Class.create();
MobileUpgradeEngine.prototype = {
    initialize: function() {
    },
	   
	upgradeForLegacyCardsDeprecate: function() {
		var FORM_SCREEN_TABLE = 'sys_sg_form_screen';
		var LIST_SCREEN_TABLE = 'sys_sg_master_item';
		// List of all the cards
		var SCREEN_TABLE_MAP = {
			legacyCard: 'sys_sg_item_view_' ,
			uiStyles: 'sys_sg_ui_style_',
		};
		var	formScreenArray =
			[{
				legacyCardSysId: 'efc886fc00230010fa9b161c34f87393',
				screenSysId: '63c886fc00230010fa9b161c34f87395',
				cardSysId:'15f33152f1301110fa9bdef034c8d3d2',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: 'edd51136b5421010fa9b1db771f5b99b',
				screenSysId: 'acf79176b5421010fa9b1db771f5b940',
				cardSysId:'897f8bc477911110814d99f69c5a99d5',
				uiStyles: ['8d5898d605d21010fa9b8e9c93c0383a', '568a945a05d21010fa9b8e9c93c038d4']
			},
			{
				legacyCardSysId: '6e34da8f530210103595ddeeff7b1277',
				screenSysId: '2634da8f530210103595ddeeff7b127a',
				cardSysId:'ead8b925d5051110fa9bfa6163dd2b76',
				uiStyles: []
			},
			{
				legacyCardSysId: '70b21e4f530210103595ddeeff7b12e1',
				screenSysId: '38b21e4f530210103595ddeeff7b12e3',
				cardSysId:'644b712dd5451110fa9bfa6163dd2b44',
				uiStyles: []
			},
			{
				legacyCardSysId: '91d4b58b530210103595ddeeff7b12db',
				screenSysId: '9dd4b58b530210103595ddeeff7b12dc',
				cardSysId:'d111caa9d5451110fa9bfa6163dd2b97',
				uiStyles: []
			},
			{
				legacyCardSysId: '48af82f000630010fa9b161c34f873fb',
				screenSysId: 'c0af82f000630010fa9b161c34f873fe',
				cardSysId:'36b16d6208895110fa9be7013b856773',
				uiStyles: []
			},
			{
				legacyCardSysId: 'df41124f530210103595ddeeff7b121c',
				screenSysId: '9741124f530210103595ddeeff7b121f',
				cardSysId:'f24ef9a9d5451110fa9bfa6163dd2b90',
				uiStyles: []
			},
			{
				legacyCardSysId: 'd7a4d8ba530210103595ddeeff7b12e8',
				screenSysId: '17a4d8ba530210103595ddeeff7b12ea',
				cardSysId:'4dc7ed5438c11110fa9b69bd3394f30c',
				uiStyles: []
			},
			{
				legacyCardSysId: 'f8c9023000630010fa9b161c34f8730e',
				screenSysId: '74c9023000630010fa9b161c34f87310',
				cardSysId:'8d6f018284b01110fa9bd39e5ee7c1a6',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: '63342a3000a30010fa9b161c34f873c2',
				screenSysId: '67342a3000a30010fa9b161c34f873c4',
				cardSysId:'8d6f018284b01110fa9bd39e5ee7c1a6',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: '6a22e6fc00630010fa9b161c34f8738f',
				screenSysId: 'ae22e6fc00630010fa9b161c34f87391',
				cardSysId:'15f33152f1301110fa9bdef034c8d3d2',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: '9b64fdf6530210103595ddeeff7b128a',
				screenSysId: '9764fdf6530210103595ddeeff7b128c',
				cardSysId:'11e52a1c38451110fa9b69bd3394f37e',
				uiStyles: []
			},
			{
				legacyCardSysId: 'a8afa2c9530210103595ddeeff7b1272',
				screenSysId: 'a8afa2c9530210103595ddeeff7b12b2',
				cardSysId:'85be1ed2f1701110fa9bdef034c8d314',
				uiStyles: []
			},
			{
				legacyCardSysId: 'c651f8eb53b110103595ddeeff7b12db',
				screenSysId: '4e51f8eb53b110103595ddeeff7b12dd',
				cardSysId:'566260c058411110fa9b4a569581a322',
				uiStyles: []
			}];
		var	listScreenArray =
			[{
				legacyCardSysId: '27c886fc00230010fa9b161c34f87393',
				screenSysId: '77c49e7400630010fa9b161c34f873a9',
				cardSysId:'15f33152f1301110fa9bdef034c8d3d2',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: '27c886fc00230010fa9b161c34f87393',
				screenSysId: 'abc886fc00230010fa9b161c34f87397',
				cardSysId:'15f33152f1301110fa9bdef034c8d3d2',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: 'cd9559f2b5421010fa9b1db771f5b9a7',
				screenSysId: '7f77d136b5421010fa9b1db771f5b927',
				cardSysId:'897f8bc477911110814d99f69c5a99d5',
				uiStyles: ['adda54d605d21010fa9b8e9c93c038a2', '4df8d81a05d21010fa9b8e9c93c03803']
			},
			{
				legacyCardSysId: 'ee34da8f530210103595ddeeff7b1248',
				screenSysId: '2e34da8f530210103595ddeeff7b1281',
				cardSysId:'ead8b925d5051110fa9bfa6163dd2b76',
				uiStyles: []
			},
			{
				legacyCardSysId: 'f4b21e4f530210103595ddeeff7b12d7',
				screenSysId: 'f0b21e4f530210103595ddeeff7b12eb',
				cardSysId:'644b712dd5451110fa9bfa6163dd2b44',
				uiStyles: []
			},
			{
				legacyCardSysId: 'd9d4b58b530210103595ddeeff7b126f',
				screenSysId: '59d4b58b530210103595ddeeff7b12f0',
				cardSysId:'d111caa9d5451110fa9bfa6163dd2b97',
				uiStyles: []
			},
			{
				legacyCardSysId: '9341de0f530210103595ddeeff7b127e',
				screenSysId: '5741124f530210103595ddeeff7b1233',
				cardSysId:'f24ef9a9d5451110fa9bfa6163dd2b90',
				uiStyles: []
			},
			{
				legacyCardSysId: '4fa4d8ba530210103595ddeeff7b12ba',
				screenSysId: '13a4d8ba530210103595ddeeff7b12fe',
				cardSysId:'4dc7ed5438c11110fa9b69bd3394f30c',
				uiStyles: []
			},
			{
				legacyCardSysId: 'b4c98efc00230010fa9b161c34f873d0',
				screenSysId: '298c123c00630010fa9b161c34f8736a',
				cardSysId:'8d6f018284b01110fa9bd39e5ee7c1a6',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: 'db34663000a30010fa9b161c34f87320',
				screenSysId: '4dc9023000630010fa9b161c34f87316',
				cardSysId:'8d6f018284b01110fa9bd39e5ee7c1a6',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: 'db34663000a30010fa9b161c34f87320',
				screenSysId: 'af342a3000a30010fa9b161c34f873d7',
				cardSysId:'8d6f018284b01110fa9bd39e5ee7c1a6',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: '6a2226fc00630010fa9b161c34f87369',
				screenSysId: 'a622e6fc00630010fa9b161c34f873a6',
				cardSysId:'15f33152f1301110fa9bdef034c8d3d2',
				uiStyles: ['51034bfe5d730010fa9b14bb9d321e3d', '7d54156bd1330010fa9bacb346f9aa28', 'cf1ca5a3d1730010fa9bacb346f9aa1b', '454b2736b5330010fa9b90f686fba390']
			},
			{
				legacyCardSysId: 'd764bdf6530210103595ddeeff7b120d',
				screenSysId: '5764fdf6530210103595ddeeff7b1293',
				cardSysId:'11e52a1c38451110fa9b69bd3394f37e',
				uiStyles: []
			},
			{
				legacyCardSysId: 'e0afa2c9530210103595ddeeff7b126a',
				screenSysId: '28afa2c9530210103595ddeeff7b12ba',
				cardSysId:'85be1ed2f1701110fa9bdef034c8d314',
				uiStyles: []
			},
			{
				legacyCardSysId: '4e51f8eb53b110103595ddeeff7b12ac',
				screenSysId: '8251f8eb53b110103595ddeeff7b12e5',
				cardSysId:'566260c058411110fa9b4a569581a322',
				uiStyles: []
			}];
		formScreenArray.forEach(function(card) {
			// Check if legacy card or associated UI style is customised
			if (MobileUpgradeEngine.isCustomised(SCREEN_TABLE_MAP.legacyCard + card.legacyCardSysId) || MobileUpgradeEngine.isAnyCustomised(SCREEN_TABLE_MAP.uiStyles , card.uiStyles)) {
				// Update screen to legacyCard and use_view_config = false
				new global.GlideQuery(FORM_SCREEN_TABLE)
					.where('sys_id', card.screenSysId)
					.updateMultiple({item_view: card.legacyCardSysId, use_view_config: false});
			}
		});
		listScreenArray.forEach(function(card) {
			// Check if legacy card or associated UI style is customised
			if (MobileUpgradeEngine.isCustomised(SCREEN_TABLE_MAP.legacyCard + card.legacyCardSysId) || MobileUpgradeEngine.isAnyCustomised(SCREEN_TABLE_MAP.uiStyles , card.uiStyles)) {
				// Update screen to legacyCard and use_view_config = false
				new global.GlideQuery(LIST_SCREEN_TABLE)
					.where('sys_id', card.screenSysId)
					.updateMultiple({item_view: card.legacyCardSysId, use_view_config: false});
			}
		});
	},
	upgradeForButtonInstanceDeprecate: function() {
		var FUNCTION_INSTANCE_TABLE  = 'sys_sg_button_instance';

		var FUNCTION_INSTANCE_TABLE_MAP = {
			functionInstance: 'sys_sg_button_instance_',
			functionTable:'sys_sg_button_',
			actionItem:'sys_sg_write_back_action_item_',
			UIParameter:'sys_sg_ui_parameter_',
			itemParameter:'sys_sg_item_parameter_',
			actionParmMap:'sys_sg_action_param_map_',
			groupedInput: 'sys_sg_grouped_input_',
		};

		// List of all the button (function) instance
		var	functionDetailsArray =
			[{
				functionInstanceSysId: ['cf2fa6b400a30010fa9b161c34f87339', 'ff3f6ab400a30010fa9b161c34f8738e'],
				functionSysId: '12ed6e7400a30010fa9b161c34f873c0',
				actionItemSysId:'924de67400a30010fa9b161c34f873a3',
				UIParameterSysId: ['398ee2b400a30010fa9b161c34f87391', 'db5e62b400a30010fa9b161c34f873f9'],
				groupedIpSysId: '',
				itemParameter: ['a6cd6e7400a30010fa9b161c34f87305', 'dabd6a7400a30010fa9b161c34f873e6'],
				actionParmMap: ['2cae26b400a30010fa9b161c34f87391', 'e9be26b400a30010fa9b161c34f873bb'],
				newFunInstanceSysId: ['4f5a87af38c21110fa9bee9cfe072d07', '5cc592e338421110fa9bee9cfe072d80']
			},
			{
				functionInstanceSysId: ['6d3be63400a30010fa9b161c34f87355', 'f34b2a3400a30010fa9b161c34f873cf'],
				functionSysId: '382aeaf000a30010fa9b161c34f873de',
				actionItemSysId:'e67966f000a30010fa9b161c34f873a1',
				UIParameterSysId: ['7aca223400a30010fa9b161c34f8733f', '834a6ef000a30010fa9b161c34f873bf'],
				groupedIpSysId: '',
				itemParameter: ['4ee92af000a30010fa9b161c34f8731b', '02b9e6f000a30010fa9b161c34f8735f'],
				actionParmMap: ['03ea663400a30010fa9b161c34f873b6', 'd40ba63400a30010fa9b161c34f873b9'],
				newFunInstanceSysId: ['e1c06ebb45421110fa9b429fae4635f5', 'eeadf6a738c21110fa9bee9cfe072d39']
			},
			{
				functionInstanceSysId: ['1c48f1cbd1021010fa9b75d55ac4f38d'],
				functionSysId: 'bb9bdd83ed421010fa9b614e126fba27',
				actionItemSysId:'764b59c3ed421010fa9b614e126fbaf3',
				UIParameterSysId: ['a3ac3d8fd1021010fa9b75d55ac4f311'],
				groupedIpSysId: '',
				itemParameter: ['78fcfd8fd1021010fa9b75d55ac4f329'],
				actionParmMap: ['d1dc7d8fd1021010fa9b75d55ac4f38d'],
				newFunInstanceSysId: ['64a2396077d21110814d99f69c5a9900']
			},
			{
				functionInstanceSysId: ['914f3103534210103595ddeeff7b1298', 'c66f3103534210103595ddeeff7b1229', 'cbaf7503534210103595ddeeff7b122a'],
				functionSysId: '684ef58f530210103595ddeeff7b124d',
				actionItemSysId:'ef8a394f530210103595ddeeff7b1293',
				UIParameterSysId: [],
				groupedIpSysId: '20ae3dcf530210103595ddeeff7b12f8',
				itemParameter: [],
				actionParmMap: [],
				newFunInstanceSysId: ['95cbacd6dc121110fa9b72952c5c6b77', '529ba4d6dc121110fa9b72952c5c6bc5', '18daec96dc121110fa9b72952c5c6b0c']
			},
			{
				functionInstanceSysId: ['0a807ac9530210103595ddeeff7b12ba', 'fd2076c9530210103595ddeeff7b12a4', '7900b2c9530210103595ddeeff7b1226'],
				functionSysId: 'da0e98db533110103595ddeeff7b125f',
				actionItemSysId:'88ec10db533110103595ddeeff7b1225',
				UIParameterSysId: [],
				groupedIpSysId: '8b1fd01f533110103595ddeeff7b123c',
				itemParameter: [],
				actionParmMap: [],
				newFunInstanceSysId: ['1273d45684121110fa9bfff7741e531a', '677d90de84121110fa9bfff7741e537f', 'bf0e90de84121110fa9bfff7741e5385']
			},
			{
				functionInstanceSysId: ['27a475ac3c330010fa9b586c792bb2f6', '4f9475ac3c330010fa9b586c792bb21d', '67d475ac3c330010fa9b586c792bb2e8', 'c4d4b5ac3c330010fa9b586c792bb298', '2f6c964100a70010fa9b161c34f8733b', '39656dc500270010fa9b161c34f873c5', '564c964100a70010fa9b161c34f8732a', '9a3c924100a70010fa9b161c34f873bf'],
				functionSysId: 'c7e5f48100e30010fa9b161c34f87334',
				actionItemSysId:'43c5bc4100e30010fa9b161c34f873e8',
				UIParameterSysId: ['750084baa5000010fa9b3659b070f06d'],
				groupedIpSysId: 'c9be708500e30010fa9b161c34f873e6',
				itemParameter: [],
				actionParmMap: [],
				newFunInstanceSysId: ['ffa747b901921110fa9b7e90b0a15362', 'd907cb7901921110fa9b7e90b0a153b8', 'd4e24bb101921110fa9b7e90b0a153cc', '21b3b67901521110fa9b7e90b0a15392', 'f88783b901921110fa9b7e90b0a153fa', '1d8f363d01521110fa9b7e90b0a15329', 'dcb607f101921110fa9b7e90b0a15352', '20084bb901921110fa9b7e90b0a1531b']
			}];
		functionDetailsArray.forEach(function(funInstance) {
			// Check if function instance is customised
			if (MobileUpgradeEngine.isCustomised(FUNCTION_INSTANCE_TABLE_MAP.functionTable + funInstance.functionSysId) || MobileUpgradeEngine.isCustomised(FUNCTION_INSTANCE_TABLE_MAP.actionItem + funInstance.actionItemSysId) || MobileUpgradeEngine.isAnyCustomised(FUNCTION_INSTANCE_TABLE_MAP.UIParameter, funInstance.UIParameterSysId) || MobileUpgradeEngine.isCustomised(FUNCTION_INSTANCE_TABLE_MAP.groupedInput + funInstance.groupedIpSysId) || MobileUpgradeEngine.isAnyCustomised(FUNCTION_INSTANCE_TABLE_MAP.itemParameter, funInstance.itemParameter) || MobileUpgradeEngine.isAnyCustomised(FUNCTION_INSTANCE_TABLE_MAP.actionParmMap , funInstance.actionParmMap)) {
				// mark the new function instance inactive
				new global.GlideQuery(FUNCTION_INSTANCE_TABLE)
					.where('sys_id', 'IN', funInstance.newFunInstanceSysId)
					.updateMultiple({active: false});
			} else {
				var funInstanceArray = funInstance.functionInstanceSysId;
				for (var i=0; i< funInstanceArray.length; i++) {
					if (MobileUpgradeEngine.isCustomised(FUNCTION_INSTANCE_TABLE_MAP.functionInstance +funInstanceArray[i])) {
						new global.GlideQuery(FUNCTION_INSTANCE_TABLE)
							.where('sys_id', funInstance.newFunInstanceSysId[i])
							.updateMultiple({active: false});
					} else {
						new global.GlideQuery(FUNCTION_INSTANCE_TABLE)
							.where('sys_id', funInstanceArray[i])
							.updateMultiple({active: false});
					}
				}
			}
		});
	},
	type: 'MobileUpgradeEngine'
};

// if any code modified in isCustomised similar chnages needed in isAnyCustomised
MobileUpgradeEngine.isCustomised = function(fileName) {
	if (fileName) {
		return new global.GlideQuery('sys_update_xml')
			.where('name',fileName)
			.where('sys_created_by', '!=', 'system')
			.selectOne()
			.isPresent();
	}
	return false;
};
// return true if any of the sysIds is customised
MobileUpgradeEngine.isAnyCustomised = function(prefix,sysIdArray) {
	var sysIdArrayWithPrefix = [];
	sysIdArray.forEach(function(sysId) {
		sysIdArrayWithPrefix.push(prefix+sysId);
	});
	return new global.GlideQuery('sys_update_xml')
		.where('name','IN',sysIdArrayWithPrefix)
		.where('sys_created_by', '!=', 'system')
		.selectOne()
		.isPresent();
};