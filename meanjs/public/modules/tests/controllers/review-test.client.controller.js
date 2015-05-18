'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('ReviewTestController', ['$scope', '$http', 'Tests', 'Sparks', 'Notification',
  function($scope, $http, Tests, Sparks, Notification) {

    $scope.setup = function() {
      $http.get('/tests/review').
      success(function(data, status, headers, config) {
        $scope.tests = data;
      }).
      error(function(err, status, headers, config) {
        Notification.error(err.message);
      });
    };

    $scope.loadGraph = function(testID) {
      var t = _.findWhere($scope.tests, {
        _id: testID
      });
      $scope.data = t._assay.standardCurve;
    };

    function updateChart(test_str) {
      var data = test_str.split('\n');
      var c, i, index = 2,
        pos;

      // skip to sensor data
      do {
        pos = data[index].indexOf(',');
        if (pos === -1) {
          c = data[index];
        } else {
          c = data[index].substring(0, pos);
        }
        index += 1;
      } while (index <= data.length && c !== '99');

      for (i = index; i < data.length; i += 2) {
        console.log(data[i], data[i + 1]);
      }

      console.log(data);
    }

    $scope.loadRawData = function(cartridgeID) {
      $http.post('/sparks/record_by_cartridge_id', {
        cartridgeID: cartridgeID
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.tests.forEach(function(e) {
          if (e._cartridge._id === cartridgeID) {
            e._cartridge.rawData = JSON.parse(data);
          }
        });
      }).
      error(function(err, status, headers, config) {
        Notification.error(err.message);
      });
      Notification.info('Loading data from device');
    };

    $scope.options = {
      axes: {
        x: {
          key: 'x',
          labelFunction: function(value) {
            return value;
          },
          type: 'linear',
          ticks: 5
        },
        y: {
          type: 'linear',
          ticks: 5
        }
      },
      series: [{
        y: 'y',
        color: 'steelblue',
        thickness: '4px',
        type: 'line',
        label: 'Standard Curve'
      }, ],
      lineMode: 'linear',
      tension: 0.7,
      tooltip: {
        mode: 'scrubber',
        formatter: function(x, y, series) {
          return ('(' + x + ',' + y + ')');
        }
      },
      drawLegend: true,
      drawDots: true,
      columnsHGap: 5
    };

    $scope.selectedTest = -1;
    $scope.clickTest = function(indx) {
      $scope.selectedTest = indx;
    };
  }
]);
