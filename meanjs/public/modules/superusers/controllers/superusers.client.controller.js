'use strict';

// Superusers controller
angular.module('superusers').controller('SuperusersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Superusers', '$timeout',
	function($scope, $stateParams, $location, Authentication, Superusers, $timeout) {
		$scope.authentication = Authentication;

		// Create new Superuser
		$scope.create = function() {
			// Create new Superuser object
			var superuser = new Superusers ({
				name: this.name
			});

			// Redirect after save
			superuser.$save(function(response) {
				$location.path('superusers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Superuser
		$scope.remove = function(superuser) {
			if ( superuser ) {
				superuser.$remove();
                //    .$promise.then(
                //
                //    function( value ){ $location.path('superusers'); },
                //    //error
                //    function( error ){ console.log(error);}
                //
                //);

				for (var i in $scope.superusers) {
					if ($scope.superusers [i] === superuser) {
						$scope.superusers.splice(i, 1);
					}
				}
			} else {
				$scope.superuser.$remove(function() {
					$location.path('superusers');
				});
			}
		};

		// Update existing Superuser
		$scope.update = function() {
            var roles = [];

            if ($scope.checkModel.user === true)
                roles.push('user');
            if ($scope.checkModel.admin === true)
                roles.push('admin');
            if ($scope.checkModel.superuser === true)
                roles.push('superuser');

            var superuser = $scope.superuser;

            superuser.roles = roles;

            console.log('update');
			superuser.$update(function() {
				$location.path('superusers/' + superuser._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Superusers
		$scope.find = function() {
			$scope.superusers = Superusers.query();
		};

		// Find existing Superuser
		$scope.findOne = function() {
			$scope.superuser = Superusers.get({
				userId: $stateParams.userId
			});
            $timeout(function () {
                console.log($scope.superuser.roles);
                $scope.checkModel = {
                    user: $scope.superuser.roles.indexOf('user') > -1,
                    admin: $scope.superuser.roles.indexOf('admin') > -1,
                    superuser: $scope.superuser.roles.indexOf('superuser') > -1
                };
            }, 500);

		};
	}
]);
