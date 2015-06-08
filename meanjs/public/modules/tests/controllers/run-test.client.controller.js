'use strict';

var _ = window._;
var $ = window.$;

// Tests controller
angular.module('tests').controller('RunTestController', ['$scope', '$http', '$location', '$modal', '$window','Authentication', 'Tests', 'Prescriptions', 'Devices', 'Cartridges', 'Sparks', 'Notification',
  function($scope, $http, $location, $modal, $window, Authentication, Tests, Prescriptions, Devices, Cartridges, Sparks, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
      $location.path('/signin');
    }

    function loadAssays(prescription) {
      var tests = _.pluck(prescription._tests, '_assay');
      $scope.pendingAssays = [];
      $scope.completedAssays = [];
      prescription._assays.forEach(function(a) {
        var indx = tests.indexOf(a._id);
        if (indx === -1) {
          $scope.pendingAssays.push(a);
        } else {
          $scope.completedAssays.push(a);
        }
      });
    }

    $scope.refresh = function() {
      console.log('Refreshing device list');
      $http.get('/sparks/refresh').
      success(function(data, status, headers, config) {
        Notification.success('Spark list refreshed');
        $scope.setupRun();
      }).
      error(function(err, status, headers, config) {
        console.log(err, status, headers(), config);
        Notification.error(err.message);
      });
    };

    $scope.setupRun = function() {
      $scope.testUnderway = false;
      $scope.activePrescription = -1;
      $scope.activeAssay = -1;
      $scope.deviceInitialized = true;
      $scope.activeDevice = -1;
      $scope.activeCartridge = -1;
      $scope.selectedCartridge = '';
      $scope.showCartridges = false;
      $http.get('/prescriptions/unfilled').
        success(function(data, status, headers, config) {
          $scope.prescriptions = data;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
      $http.get('/devices/available').
        success(function(data, status, headers, config) {
          $scope.devices = data;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
    };

    var currentPrescription = -1;
    $scope.clickPrescription = function(indx) {
      if (currentPrescription !== indx) {
        $scope.activeAssay = -1;
        $scope.activePrescription = -1;
        loadAssays($scope.prescriptions[indx]);
      }
      currentPrescription = indx;
    };

    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;

		$scope.loadCartridges = function(forceLoad) {
      if (forceLoad || $scope.showCartridges) {
	      $http.post('/cartridges/unused', {
					page: $scope.currentPage,
					pageSize: $scope.itemsPerPage,
          assayID: $scope.pendingAssays[$scope.activeAssay]._id,
          cartridgeID: $scope.selectedCartridge._id
				}).
				success(function(data, status, headers, config) {
          console.log(data);
          if (data.currentPage === -1) {
            Notification.error($scope.selectedCartridge._id + ' is not a cartridge for ' + $scope.pendingAssays[$scope.activeAssay].name);
            $scope.selectedCartridge._id = '';
            $scope.showCartridges = false;
            $scope.activeCartridge = -1;
          }
          else {
            $scope.cartridges = data.cartridges;
  					$scope.totalItems = data.number_of_items;
            $scope.currentPage = data.currentPage;
            $scope.activeCartridge = data.activeCartridge;
          }
			  }).
			  error(function(err, status, headers, config) {
					console.log(err);
					Notification.error(err.message);
			  });
      }
		};

    $scope.pageChanged = function() {
			console.log($scope.currentPage);
			$scope.loadCartridges();
		};

    $scope.clickAssay = function(indx) {
      $scope.activePrescription = currentPrescription;
      $scope.activeAssay = indx;
      $scope.activeCartridge = -1;
      $scope.selectedCartridge = {_id: ''};
      $scope.currentPage = 1;
      $scope.loadCartridges(true);
    };
    $scope.clickDevice = function(indx) {
      $scope.activeDevice = indx;
    };
    $scope.clickCartridge = function(indx) {
      $scope.activeCartridge = indx;
      $scope.selectedCartridge = $scope.cartridges[indx];
  };

    $scope.clickShowCartridges = function() {
      $scope.showCartridges = !$scope.showCartridges;
      if ($scope.showCartridges) {
        $scope.loadCartridges();
      }
    };

    $scope.initializeDevice = function() {
      if ($scope.activeDevice < 0) {
        Notification.error('Please select a device to initialize');
        return;
      }
      if (!$scope.devices[$scope.activeDevice]) {
        Notification.error('Unknown device');
        return;
      }
      $scope.testUnderway = false;
      $http.post('/devices/initialize', {
        device: $scope.devices[$scope.activeDevice]
      }).
      success(function(data, status, headers, config) {
        $scope.deviceInitialized = true;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        $scope.deviceInitialized = false;
        Notification.error(err.message);
      });

      Notification.success('Initialization started');
    };

    $scope.beginTest = function() {
      if ($scope.activePrescription < 0 || $scope.activeAssay < 0) {
        Notification.error('Please select an assay for testing');
        return;
      }
      if ($scope.activeDevice < 0) {
        Notification.error('Please select a device for testing');
        return;
      }
      if ($scope.selectedCartridge._id === '') {
        Notification.error('Please select a cartridge for testing');
        return;
      }
      if (!$scope.pendingAssays[$scope.activeAssay]) {
        Notification.error('Unknown assay');
        return;
      }
      if (!$scope.devices[$scope.activeDevice]) {
        Notification.error('Unknown device');
        return;
      }

      var assay = $scope.pendingAssays[$scope.activeAssay];
      var cartridge = $scope.selectedCartridge;
      var device = $scope.devices[$scope.activeDevice];
      var prescription = $scope.prescriptions[$scope.activePrescription];
      $http.post('/tests/begin', {
        assayID: assay._id,
        assayName: assay.name,
        assayBCODE: assay.BCODE,
        analysis: assay.analysis,
        standardCurve: assay.standardCurve,
        cartridgeID: cartridge._id,
        deviceID: device._id,
        deviceName: device.name,
        prescriptionID: prescription._id
      }).
      success(function(data, status, headers, config) {
        Notification.success('Test underway');
        $scope.testUnderway = true;
        $scope.currentPage = 1;
        $scope.selectedCartridge = {_id: ''};
        $scope.loadCartridges();
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.userMediaExists = !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia || navigator.msGetUserMedia);
    console.log('UserMedia exists?', $scope.userMediaExists);

    $scope.setupModal = function() {
      return;
    };

    $window.bridgeitCallback = function(event) {
      console.log('bridgeit scan', event.value);
      $scope.selectedCartridge = {_id: event.value};
      $scope.loadCartridges(true);
    };

    $scope.scanCartridge = function() {
      if ($scope.userMediaExists) {
        var modalInstance = $modal.open({
          templateUrl: 'modules/tests/views/scan-cartridge-modal.view.html',
          controller: 'ScanCartridgeModalInstanceController',
          size: 'md',
          scope: $scope,
          resolve: {
            userMediaExists: function() {
              return $scope.userMediaExists;
            }
          }
        });

        modalInstance.result.then(function(result) {
          console.log(result);
          $scope.selectedCartridge = {_id: result};
          $scope.loadCartridges(true);
        }, function() {
          console.log('Modal dismissed at: ' + new Date());
        });
      }
      else {
        bridgeit.scan('scanDiv', 'bridgeitCallback');   // jshint ignore:line
      }
    };

  }
]);

angular.module('tests').controller('ScanCartridgeModalInstanceController', ['$scope', '$modalInstance', '$interval', 'userMediaExists',
  function($scope, $modalInstance, $interval, userMediaExists) {
    var qrScan;

    $scope.scansRemaining = -1;

    var scan = function() {
      if(userMediaExists) {
        document.getElementById('qr-canvas').getContext('2d').drawImage(document.getElementById('scanVideo'), 0, 0, 320, 240);
        try {
          qrcode.decode();  // jshint ignore:line
        }
        catch (e){
          console.log('No QR code found');
        }
      }
      $scope.scansRemaining -= 1;
    };

    qrcode.callback = function(data) {  // jshint ignore:line
      if (qrScan) {
        $interval.cancel(qrScan);
      }
      $modalInstance.close(data);
    };

    $scope.startScan = function() {
      if (userMediaExists) {
        $scope.videoObj = {
          video: true
        };
        var errBack = function(error) {
          console.log('Video capture error: ', error);
        };

        // Put video listeners into place
        if (navigator.getUserMedia) { // Standard
          navigator.getUserMedia($scope.videoObj, function(stream) {
            console.log('Video source loaded');
            var v = document.getElementById('scanVideo');
            v.src = stream;
            v.play();
            $scope.scansRemaining = 20;
            qrScan = $interval(scan, 500, $scope.scansRemaining);
          }, errBack);
        } else {
          navigator.webkitGetUserMedia($scope.videoObj, function(stream) {
            console.log('Video source loaded');
            var v = document.getElementById('scanVideo');
            v.src = window.URL.createObjectURL(stream);
            v.play();
            $scope.scansRemaining = 20;
            qrScan = $interval(scan, 500, $scope.scansRemaining);
          }, errBack);
        }
      }
    };

    $scope.startScan();

    $scope.photoLoaded = false;
    $scope.newPhoto = function() {
      document.getElementById('qr-canvas').getContext('2d').drawImage($scope.qrPhoto, 0, 0, 320, 240);
      $scope.photoLoaded = true;
    };

    $scope.ok = function() {
      if (qrScan) {
        $interval.cancel(qrScan);
      }
      $modalInstance.close('result');
    };

    $scope.cancel = function() {
      if (qrScan) {
        $interval.cancel(qrScan);
      }
      $modalInstance.dismiss('cancel');
    };
  }
]);
