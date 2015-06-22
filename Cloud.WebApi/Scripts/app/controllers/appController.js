﻿window.cloud = window.cloud || {};

cloud.controllers = cloud.controllers || {};

cloud.controllers.appController = cloud.controllers.appController ||
	function($scope, $window, httpService, alertService,
		loaderService, constants, userTokenService, fileUploader, $modal) {
		var self = this;

		self.initUploader = function() {
			$scope.uploader = new fileUploader();
			$scope.uploader.removeAfterUpload = true;
			$scope.uploader.url = '';
			$scope.uploader.headers = {};
			$scope.uploader.headers[constants.httpHeader.name.authorization] =
				userTokenService.getAuthorizationToken();

			$scope.uploader.onCompleteItem =
				function(uploadedItem, response, status) {
					$scope.uploader.clearQueue();

					if (status === 200) {
						$scope.files.push(response);

						alertService.show(constants.alert.type.success,
							constants.message.successUploadFile);
					} else {
						alertService.show(constants.alert.type.danger,
							constants.message.failUploadFile);
					}
				};
		};
		self.getRootFolderData = function() {
			httpService.makeRequest(
				constants.httpMethod.get,
				constants.urls.cloud.folders.rootFolderData,
				null, null, success, error);

			function success(data) {
				$scope.folders = [];
				$scope.files = [];
				$scope.cloudFolders = [];

				for (var i = 0; i < data.length; i++) {
					for (var j = 0; j < data[i].folders.length; j++) {
						$scope.folders.push(data[i].folders[j]);
					}
					for (var k = 0; k < data[i].files.length; k++) {
						$scope.files.push(data[i].files[k]);
					}
					if (data[i].folder.storageId === constants.storages.cloudId) {
						data[i].folder.name = constants.rootCloudFolderName;
						$scope.cloudFolders.push(data[i].folder);
						$scope.uploader.url = constants.urls.cloud.files.constructUpload(
							$scope.cloudFolders[0].id, constants.storages.cloudId);
					}
				}

				self.addRootFolder();
			};

			function error() {
				alertService.show(constants.alert.type.danger,
					constants.message.failGetRootFolderData);
			};
		};
		self.clearAppData = function() {
			$scope.files = [];
			$scope.folders = [];
			$scope.uploader = null;
			$scope.userName = null;
			self.driveFolder = null;
			self.dropboxFolder = null;
			$scope.cloudFolders = [];
			$scope.userInfo = {
				name: ''
			};
			$scope.storages = {
				connected: [],
				available: []
			};
		};
		self.getUserInfo = function() {
			httpService.makeRequest(
				constants.httpMethod.get,
				constants.urls.cloud.userInfo,
				null,
				null,
				success, error);

			function success(data) {
				$scope.userInfo = {
					name: data.email
				}
			};

			function error() {
				alertService.show(constants.alert.type.danger,
					constants.message.failLoadUserInfo);
			};
		};
		self.getUserStorages = function() {
			httpService.makeRequest(
				constants.httpMethod.get,
				constants.urls.cloud.storages,
				null, null, success, null);

			function success(data) {
				$scope.storages.connected = data.connected;
				$scope.storages.available = data.available;
			};
		};
		self.addRootFolder = function() {
			if ($scope.cloudFolders.length <= 0) {
				$scope.cloudFolders = [];
				$scope.cloudFolders.push({name: constants.rootCloudFolderName});
			}
		};
		self.driveFolder = null;
		self.dropboxFolder = null;
		$scope.userInfo = {
			name: ''
		};

		$scope.storages = {
			connected: [],
			available: []
		};
		$scope.cloudFolders = [];
		$scope.alerts = alertService.alerts;
		$scope.isLoader = loaderService.isLoader();

		// todo: should make as private 
		$scope.initialize = function() {
			self.clearAppData();
			if (userTokenService.isTokenExist()) {
				self.getUserInfo();
				self.getUserStorages();
				self.getRootFolderData();
				self.initUploader();
				$scope.isLoginView = false;
			} else {
				$scope.isLoginView = true;
			}
		};

		$scope.logout = function() {
			function success() {
				userTokenService.removeToken();
				self.clearAppData();
				$scope.isLoginView = true;
			};

			function error() {
				alertService.show(constants.alert.type.danger,
					constants.message.failLogout);
			};

			httpService.makeRequest(
				constants.httpMethod.post,
				constants.urls.cloud.logout,
				null,
				null,
				success, error);
		};

		// Files
		$scope.download = function(file) {
			switch (file.storageId) {
			case constants.storages.googleDriveId: // Drive
				if (file.downloadUrl) {
					$window.open(file.downloadUrl, '_blank');
				} else {
					alertService.show(constants.alert.type.info,
						constants.message.infoDriveFileDownloadingNotAllowed);
				}
				break;
			case constants.storages.cloudId: // Cloud
				var url = constants.urls.cloud.files.constructDownloadLink(file.id);

				function error() {
					alertService.show(constants.alert.type.danger,
						constants.message.failRequestDownloadLink);
				};

				httpService.makeRequest(
					constants.httpMethod.get, url, null, null, success, error);

				break;
			case constants.storages.dropboxId: // Dropbox
				httpService.makeRequest(
					constants.httpMethod.get,
					constants.urls.dropbox.constructDownload(file.id),
					null, null, success);
				break;
			default:
				alertService.show(constants.alert.type.danger,
					constants.message.failCloudNotFound);
				break;
			}

			function success(data) {
				$window.open(data, '_self');
			};
		};

		$scope.deleteFile = function(file, $index) {
			var deleteEntity = {
				type: constants.cloudEntities.file,
				data: file
			};

			var modalInstance = $modal.open({
				animation: $scope.animationsEnabled,
				templateUrl: 'deleteConfirmModal.html',
				controller: cloud.controllers.deleteConfirmModalController,
				resolve: {
					deleteEntity: function() {
						return deleteEntity;
					}
				}
			});

			modalInstance.result.then(function(options) {
				if (options.isSuccess) {
					$scope.files.splice($index, 1);
					alertService.show(constants.alert.type.success,
						constants.message.successDelete);
				} else {
					alertService.show(constants.alert.type.danger,
						constants.message.failDelete);
				}
			});
		};

		$scope.animationsEnabled = true;

		$scope.renameFile = function(file, $index) {
			var renameEntity = {
				type: constants.cloudEntities.file,
				data: file
			};

			var modalInstance = $modal.open({
				animation: $scope.animationsEnabled,
				templateUrl: 'renameModal.html',
				controller: cloud.controllers.renameModalController,
				resolve: {
					renameEntity: function() {
						return renameEntity;
					}
				}
			});

			modalInstance.result.then(function(options) {
				if (options.isSuccess) {
					if (file.storageId == constants.storages.dropboxId) {
						$scope.files[$index].id = options.newName;
						$scope.files[$index].name =
							options.newName.substring(options.newName.lastIndexOf('|') + 1);
					} else {
						$scope.files[$index].name = options.newName;
					}

					alertService.show(constants.alert.type.success,
						constants.message.successRename);
				} else {
					alertService.show(constants.alert.type.danger,
						constants.message.failRename);
				}
			});
		};

		$scope.renameFolder = function(folder, $index) {
			var renameEntity = {
				type: constants.cloudEntities.folder,
				data: folder
			};
			var modalInstance = $modal.open({
				animation: $scope.animationsEnabled,
				templateUrl: 'renameModal.html',
				controller: cloud.controllers.renameModalController,
				resolve: {
					renameEntity: function() {
						return renameEntity;
					}
				}
			});

			modalInstance.result.then(function(options) {
				if (options.isSuccess) {
					if (options.isSuccess) {
						if (folder.storageId == constants.storages.dropboxId) {
							$scope.folders[$index].id = options.newName;
							$scope.folders[$index].name =
								options.newName.substring(options.newName.lastIndexOf('|') + 1);
						} else {
							$scope.folders[$index].name = options.newName;
						}

						alertService.show(constants.alert.type.success,
							constants.message.successRename);
					} else {
						alertService.show(constants.alert.type.danger,
							constants.message.failRename);
					}
				}
			});
		};

		// Folders
		$scope.createFolder = function() {
			var currentFolder = $scope.cloudFolders[$scope.cloudFolders.length - 1];
			if (currentFolder && currentFolder.id) {
				var modalInstance = $modal.open({
					animation: $scope.animationsEnabled,
					templateUrl: 'createFolderModal.html',
					controller: cloud.controllers.createFolderModalController,
					resolve: {
						folderId: function() {
							return currentFolder.id;
						}
					}
				});

				modalInstance.result.then(function(options) {
					if (options.isSuccess) {
						$scope.folders.push(options.data);
						alertService.show(constants.alert.type.success,
							constants.message.successfolderCreate);
					} else {
						alertService.show(constants.alert.type.danger,
							constants.message.failCreatFolder);
					}
				});
			} else {
				alertService.show(constants.alert.type.warning,
					constants.message.warningNotInCloudFolder);
			}
		};

		$scope.deleteFolder = function(folder, $index) {
			var deleteEntity = {
				type: constants.cloudEntities.folder,
				data: folder
			};

			var modalInstance = $modal.open({
				animation: $scope.animationsEnabled,
				templateUrl: 'deleteConfirmModal.html',
				controller: cloud.controllers.deleteConfirmModalController,
				resolve: {
					deleteEntity: function() {
						return deleteEntity;
					}
				}
			});

			modalInstance.result.then(function(options) {
				if (options.isSuccess) {
					$scope.folders.splice($index, 1);
					alertService.show(constants.alert.type.success,
						constants.message.successDelete);
				} else {
					alertService.show(constants.alert.type.danger,
						constants.message.failDelete);
				}
			});
		};

		$scope.openFolder = function(folder) {
			function success(data) {
				$scope.folders = [];
				$scope.files = [];
				if (!data.folder.name) {
					data.folder.name = folder.name;
				}
				$scope.cloudFolders.push(data.folder);
				$scope.uploader.url =
					constants.urls.cloud.files.constructUpload(
						data.folder.id, constants.storages.cloudId);

				$scope.folders = data.folders;
				$scope.files = data.files;

			};

			function error() {
				alertService.show(constants.alert.type.danger,
					constants.message.failOpenFolder);
			};

			var url = constants.urls.cloud.folders.constructFolderData(
				folder.id, folder.storageId);

			httpService.makeRequest(
				constants.httpMethod.get, url, null, null, success, error);
		};

		$scope.openFolderFromHeader = function(folder, $index) {
			if (folder.name === constants.rootCloudFolderName) {
				self.getRootFolderData();
			} else {
				$scope.cloudFolders.length = $index;
				$scope.openFolder(folder);
			}
		};

		// Storage
		$scope.authorizeStorage = function(storageId) {
			switch (storageId) {
			case constants.storages.cloudId: // cloud
				httpService.makeRequest(
					constants.httpMethod.post,
					constants.urls.cloud.authorize, null, null, success);
				break;
			case constants.storages.googleDriveId: // google drive
				httpService.makeRequest(constants.httpMethod.get,
					constants.urls.drive.authorize, null, null, success);
				break;
			case constants.storages.dropboxId: // dropbox
				httpService.makeRequest(constants.httpMethod.get,
					constants.urls.dropbox.authorize, null, null, success, dropboxError);

				function dropboxError(data) {
					if (data.message === 'Dropbox account unauthorised') {
						$window.location.href = data.innerServerError.message;
					}
				};

				break;
			default:
				break;
			}

			function success() {
				$scope.initialize();
			};
		};

		$scope.disconnect = function(storageId) {
			httpService.makeRequest(
				constants.httpMethod.post,
				constants.urls.common.constructDisconnect(storageId), null, null, success);

			function success() {
				$scope.initialize();
			}
		};

		$scope.manageStorages = function() {
			var modalInstance = $modal.open({
				animation: $scope.animationsEnabled,
				templateUrl: 'storagesModal.html',
				controller: cloud.controllers.storagesModalController,
				resolve: {
					storages: function() {
						return $scope.storages;
					}
				}
			});

			modalInstance.result.then(function(options) {
				if (options.data.authorize) {
					$scope.authorizeStorage(options.data.storageId);
				}
				if (options.data.disconnect) {
					$scope.disconnect(options.data.storageId);
				}
			});
		};

		$scope.closeAlert = function($index) {
			alertService.alerts.splice($index);
		};

		// Helpers
		$scope.getFileNameWithoutExtention = function(fileName) {
			var lastIndexOfDot = fileName.lastIndexOf('.');
			if (lastIndexOfDot >= 0) {
				return fileName.substr(0, lastIndexOfDot);
			} else {
				return fileName;
			}
		};

		$scope.getStorageImageClass = function(storageId) {
			return 'logo-' + storageId;
		};

		$scope.getStorageLargeImageClass = function(storageId) {
			return 'logo-lg-' + storageId;
		};

		$scope.initialize();
	};