(function runMailScript(/* GlideRecord */ current, /* TemplatePrinter */ template,
	/* Optional EmailOutbound */ email, /* Optional GlideRecord */ email_action,
	/* Optional GlideRecord */ event) {
	template.print('<a href=' + gs.getProperty('glide.servlet.uri') + '/nav_to.do?uri=ast_contract.do%3Fsys_id='
		+ current.sys_id + '%26sysparm_stack=ast_contract_list.do%3Fsysparm_query=active=true' + '>' + current.number + '</a>');
})(current, template, email, email_action, event);