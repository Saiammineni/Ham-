function onSubmit() {
	var flashColor = '#FFFACD';
	if(NOW.isUsingPolaris) {
        flashColor = "RGB(var(--now-alert--warning--background-color,var(--now-color_alert--warning-0,244,240,191)))";
    }
	var msg;
	if (g_form.getValue('task_name') === 'reclaim' && g_form.getValue('state') === '3') {
		if (g_form.getValue('loaner_order.asset_returned') === 'N') {
			var assetReturnedVal = g_form.getLabelOf('loaner_order.asset_returned');
			g_form.hideFieldMsg('loaner_order.asset_returned');
			if (typeof (g_aw) !== 'undefined') {
				getMessage('To complete the task, update {0} value to Yes', assetReturnedVal, function(message) {
					g_form.showFieldMsg('loaner_order.asset_returned', message, 'error');
				});
			} else {
				msg = formatMessage(getMessage('To complete the task, update {0} value to Yes'),
					g_form.getLabelOf('loaner_order.asset_returned'));
				g_form.showFieldMsg('loaner_order.asset_returned', msg, 'error');
				g_form.flash('loaner_order.asset_returned', flashColor, 0);
			}
			return false;
		}

		if (g_form.getValue('loaner_order.is_asset_functional') === '') {
			var assetFunctionalVal = g_form.getLabelOf('loaner_order.is_asset_functional');
			g_form.hideFieldMsg('loaner_order.is_asset_functional');
			if (typeof (g_aw) !== 'undefined') {
				getMessage('To complete the task, update {0} value to either Yes or No', assetFunctionalVal, function(message) {
					g_form.showFieldMsg('loaner_order.is_asset_functional', message, 'error');
				});
			} else {
				msg = formatMessage(getMessage('To complete the task, update {0} value to either Yes or No'),
					g_form.getLabelOf('loaner_order.is_asset_functional'));
				g_form.showFieldMsg('loaner_order.is_asset_functional', msg, 'error');
				g_form.flash('loaner_order.is_asset_functional', flashColor, 0);
			}
			return false;
		}
	}
	return true;
}
onSubmit();