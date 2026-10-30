(function(window) {
    function triggerCallback(e, callback) {
        if (!callback || typeof callback !== 'function') {
            return;
        }
        var files;
        if (e.dataTransfer) {
            files = e.dataTransfer.files;
        } else if (e.target) {
            files = e.target.files;
        }
        callback.call(null, files);
    }

    function makeDroppable(ele, callback) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('id', 'importExcel');
        input.setAttribute('multiple', true);
        input.style.display = 'none';
        input.addEventListener('change', function(e) {
            triggerCallback(e, callback);
        });
        ele.appendChild(input);

        ele.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            ele.classList.add('dragover');
        });

        ele.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            ele.classList.remove('dragover');
        });

        ele.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            ele.classList.remove('dragover');
            triggerCallback(e, callback);
        });
    }
    window.makeDroppable = makeDroppable;
})(this);
(function(window) {
    this.fileReader = null;
    this.sysId = "";
    this.fileName = "";
    this.fileData = null;
    this.insert_table = "sn_hamp_import_template";
    makeDroppable(window.document.querySelector('.import-template'), function(
        file
    ) {
        this.fileReader = file;
        var submitBtn = document.querySelector('#importExcelBtn');
        submitBtn.disabled = false;
        var output = document.querySelector('#templateName');
        output.innerHTML = file[0].name;
    });
})(this);

function browseFile() {
    var name = document.querySelector('#templateName');
    name.innerHTML = '';

    var submitBtn = document.querySelector('#importExcelBtn');
    submitBtn.disabled = true;

    var file = gel('importExcel');
    file.value = null;
    file.click();
}

function downloadTemplate() {
    var pollDialog = new GwtPollDialog(
        'sn_hamp_import_template',
        '',
        24,
        'import_template_view',
        'import_insert_template',
        '',
        'xlsx'
    );
    pollDialog.execute();
    return false;
}

function parseAttachment(fileName, recordSysId) {
    var callScript = new GlideAjax('HAMPImportTemplateAjaxUtil');
    callScript.addParam('sysparm_name', 'parseAttachmentClient');
    callScript.addParam('sysparm_filename', fileName);
    callScript.addParam('sysparm_table_sys_id', recordSysId);
    var resp = callScript.getXML(callbackFn);
}

function callbackFn(response) {

    var result = JSON.parse(response.responseXML.documentElement.getAttribute("answer"));
    if (result.result === "failure") {
        showMsg("warn", result.message);
    } else {
        showMsg("success", result.link);
    }

    var loading = gel("load");
    loading.style.display = "none";
}

function displayTasks() {
    var loading = gel('load');
    loading.style.display = 'block';

    var browse = document.querySelector('#browseFileBtn');
    browse.disabled = true;

    return;
}

function uploadSetup() {

    var submitBtn = document.querySelector('#importExcelBtn');
    submitBtn.disabled = true;

    this.fileData = this.fileReader[0];

    if (this.fileReader != null) {
        this.fileName = this.fileReader[0].name;
    }

    if (fileName === null) {
        showMsg('error', new GwtMessage().getMessage('Please select a template file to upload.'));
        return;
    }

    // Hide all errors
    var section = gel('errorSec');
    section.style.display = 'none';

    var dot = this.fileName.lastIndexOf('.') + 1;
    var suffix = this.fileName.substring(dot);
    suffix = suffix.toLowerCase();

    if (suffix === 'xls' || suffix === 'xlsx') {

        displayTasks();

        var formData = new FormData();
        formData.append('file', this.fileReader[0]);

        createAttachmentRecord();
    } else {
        showMsg(
            'error',
            getMessage(
                'Not a recognized template file format. Only .xlsx files can be uploaded.'
            )
        );
    }
}

function createAttachmentRecord() {
    var callScript = new GlideAjax('HAMPImportTemplateAjaxUtil');
    callScript.addParam('sysparm_name', 'createImpSetRecord');
    callScript.addParam('sysparm_tablename', 'sn_hamp_import_template');
    var scriptResponse = callScript.getXML(createAttachmentCallback);
}

function createAttachmentCallback(response) {
    var impSetSysId = response.responseXML.documentElement.getAttribute("answer");

    if (impSetSysId != "") {
        var uploadAttachResponse = uploadAttach(impSetSysId, window.fileName, window.fileData);
        if (uploadAttachResponse.result === true) {
            parseAttachment(window.fileName, impSetSysId);
        } else {
            showMsg('error', new GwtMessage().getMessage('Unable to process template file. Please try again'));
        }
    } else {
		showMsg('error', new GwtMessage().getMessage('Unable to process request. The specified staging table used is not valid'));
	}
}

function closeMessage(id) {
    var msg = gel(id);
    msg.style.display = 'none';
}

function showMsg(type, msg) {
    var section, message;
    if (type === 'error') {
        section = gel('errorSec');
        message = gel('error_message');
    } else if (type === 'success') {
        section = gel('successSec');
        message = gel('success_message');
    } else if (type === 'warn') {
        section = gel('warnSec');
        message = gel('warn_message');
    }
    message.innerHTML = msg;
    section.style.display = 'block';
    message.focus();
}

function goBack() {
    window.history.back();
}