function onLoad() {
   //Following fiels are set as read-only
   g_form.setReadOnly('number', true);
   g_form.setReadOnly('approval', true);
   g_form.setReadOnly('state', true);
   if((g_form.getValue('stage') == 'pending_receive' || g_form.getValue('stage') == 'pending_evaluation' || g_form.getValue('stage') == 'closed_complete') && (g_form.getValue('refreshed_asset') == '')) {
		g_form.setReadOnly('refreshed_asset', false);
   }
   else {
		g_form.setReadOnly('refreshed_asset', true);
   }

}