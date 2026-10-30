var uri = action.getGlideURI();
var path = 'sn_hamp_custom_hw_device_type.do';

uri.set('sys_id', '-1');
action.setRedirectURL(uri.toString(path));
action.setNoPop(true);