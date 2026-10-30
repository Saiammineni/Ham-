var uri = action.getGlideURI();
var path = 'sn_hamp_custom_hw_product.do';

uri.set('sys_id', '-1');
action.setRedirectURL(uri.toString(path));
action.setNoPop(true);