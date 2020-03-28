app.controller('LobbyController', ['$scope', '$rootScope', '$http', function( $scope, $rootScope, $http ) {
	$scope.lobbyTables = [];
	$scope.newScreenName = '';

	if (window.localStorage) {
		if (window.localStorage.getItem('pokerName')) {
			$scope.newScreenName = window.localStorage.getItem('pokerName');
		}
	}

	$http({
		url: '/lobby-data',
		method: 'GET'
	}).success(function ( data, status, headers, config ) {
		for( tableId in data ) {
			$scope.lobbyTables[tableId] = data[tableId];
		}
	});

	$scope.register = function() {
		// If there is some trimmed value for a new screen name
		if( $scope.newScreenName ) {
			socket.emit( 'register', $scope.newScreenName, function( response ){
				if( response.success ){
					if (window.localStorage) {
						window.localStorage.setItem('pokerName', response.screenName);
					}

					$rootScope.screenName = response.screenName;
					$rootScope.totalChips = response.totalChips;
					$scope.registerError = '';
					$rootScope.$digest();
				}
				else if( response.message ) {
					$scope.registerError = response.message;
				}
				$scope.$digest();
			});
		}
	}
}]);