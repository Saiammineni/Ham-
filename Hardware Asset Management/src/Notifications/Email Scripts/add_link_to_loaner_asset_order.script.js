(function runMailScript( /* GlideRecord */ current, /* TemplatePrinter */ template,
    /* Optional EmailOutbound */
    email, /* Optional GlideRecord */ email_action,
    /* Optional GlideRecord */
    event) {
    template.print("<a href='/sn_hamp_loaner_asset_order.do?sys_id=" + current.sys_id + "&sysparm_view=loaner_request'>" + current.getDisplayValue() + "</a>");

})(current, template, email, email_action, event);