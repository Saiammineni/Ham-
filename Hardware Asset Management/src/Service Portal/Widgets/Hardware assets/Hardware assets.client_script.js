api.controller = function($uibModal, i18n, $timeout, $scope, spUtil, snAnalytics) {
    var c = this;
    c.RECEIVE_TEMPLATE = "receive-template";
    c.redirectAttestionPage = function(url) {
        location.href = url;
    };
    c.redirectIncidentPage = function(url) {
        location.href = url;
    };
    c.createAppseeEvent = function() {
        var payload = {};
        payload.name = "Click on asset receive action";
        payload.data = {};
        snAnalytics.addEvent(payload);
    };
    c.openReceivePopup = function(asset) {
        c.modalInstance = $uibModal.open({
            scope: $scope,
            templateUrl: c.RECEIVE_TEMPLATE,
            controller: function($scope, $uibModalInstance, $timeout) {
                // Using $timeout to ensure the DOM has been rendered
                $timeout(function() {
                    var modalDialog = document.querySelector('.modal-dialog');
                    if (modalDialog) {
                        modalDialog.style.display = 'flex';
                        modalDialog.style.alignItems = 'center';
                        modalDialog.style.justifyContent = 'center';
                        modalDialog.style.height = '100%';
                        modalDialog.style.maxWidth = '383px';
                    }
                    var modalContent = document.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.style.width = '100%';
                        modalContent.style.maxHeight = "calc(100vh - 40px)";
                        modalContent.style.overflowY = "auto";
                    }
                }, 0);
                // Receiving asset popup details
                $scope.asset = asset;
                c.data.fieldErrorMessage = "";
                c.data.errorField = "";

                if (asset.type == c.data.hardwareType) {
                    c.data.assetTag = asset.assetTag;
                    c.data.serialNumber = asset.serialNumber;
                } else {
                    c.data.quantity = asset.quantity;
                }
                $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                };
                $scope.raiseIssue = function() {
                    c.redirectIncidentPage(asset.incidenturl);
                };
                $scope.submit = function() {
                    c.data.type = asset.type;
                    c.data.sysId = asset.id;
                    c.data.isAssetTagUpdated = false;
                    c.data.isSerialNumberUpdated = false;
                    if (c.data.type == c.data.hardwareType) {
                        if (c.data.assetTag && c.data.assetTag != asset.assetTag) {
                            c.data.isAssetTagUpdated = true;
                        }
                        if (c.data.serialNumber && c.data.serialNumber != asset.serialNumber) {
                            c.data.isSerialNumberUpdated = true;
                        }
                    }
                    c.data.action = "updateAsset";
                    c.server.update().then(function(response) {
                        if (response.isAssetValid.isValid) {
                            c.createAppseeEvent();
                            if (asset.type == c.data.hardwareType) {
                                asset.receive = false;
                                asset.name = response.isAssetValid.assetDetails.name;
                                asset.status = response.isAssetValid.assetDetails.status;
                                asset.statusCSSClass = "";
                            } else {
                                // For consumables, fetch the assets again since various scenarios like splits or merges may occur. Updating a single asset won't be sufficient.
                                c.data.action = "fetchAssets";
                                c.server.update().then(function(_) {});
                            }
                            $uibModalInstance.close();
                            spUtil.addInfoMessage('<span><i class="fa fa-info-circle" style="margin-right: 20px;"></i>' + ' ' + response.isAssetValid.successMessage + '</span>');
                        } else {
                            c.data.fieldErrorMessage = response.isAssetValid.error.message;
                            c.data.errorField = response.isAssetValid.error.field;
                        }
                    });
                };
            }
        });
    };

    var dataExists = c.data.assets && c.data.assets.length > 0;
    if (dataExists) {
        c.currentPage = 1;
        c.noOfItems = c.data.assets.length;
        c.allitems = c.data.assets.slice(0);
        if (c.data.pageId == 'my_assets') {
            c.rows = 6;
        } else {
            c.rows = 1;
        }
    }


    $timeout(function() {
        if (dataExists) {
            c.updatePagination();
        }
    }, 0);

    angular.element(window).bind('resize', function() {
        if (dataExists) {
            $timeout(c.updatePagination, 100);
        }
    });

    c.updatePagination = function() {
        var gridContainer = document.getElementsByClassName('tile-container')[0];
        c.width = gridContainer.offsetWidth;
        var tileelements = document.getElementsByClassName('tile');
        c.tilewidth = tileelements[0].offsetWidth;
        c.itemsPerRow = Math.floor(c.width / c.tilewidth);
        c.itemsPerPage = Math.floor(c.width / c.tilewidth) * c.rows;
        c.totalPages = Math.ceil(c.allitems.length / c.itemsPerPage);
        c.paginationDisplayed = true;
        if (c.totalPages <= 1) {
            c.paginationDisplayed = false;
            c.data.assets = c.allitems.slice(0, c.noOfItems);
            return;
        }
        if (c.currentPage > c.totalPages) {
            c.currentPage = c.totalPages;
        }
        c.updateVisibleItems();
    };

    c.updateVisibleItems = function() {
        var startIndex = (c.currentPage - 1) * c.itemsPerPage;
        c.data.assets = c.allitems.slice(startIndex, startIndex + c.itemsPerPage);
        c.firstItemNumber = (c.currentPage - 1) * c.itemsPerPage + 1;
        c.lastItemNumber = (c.noOfItems > (c.currentPage * c.itemsPerPage)) ? (c.currentPage * c.itemsPerPage) : c.noOfItems;
        c.paginationlabelTranslation = i18n.format(c.data.paginationLabel, String(c.firstItemNumber), String(c.lastItemNumber), String(c.noOfItems));
    };

    c.nextPage = function() {
        if (c.currentPage < c.totalPages) {
            c.currentPage++;
            c.updateVisibleItems();
        }
    };

    c.prevPage = function() {
        if (c.currentPage > 1) {
            c.currentPage--;
            c.updateVisibleItems();
        }
    };

    window.addEventListener('beforeunload', function() {
        sessionStorage.setItem('sp-navigated-from-assets-page', 'true'); // Mark as navigated
    });

};