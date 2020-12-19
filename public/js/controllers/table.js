
/**
 * The table controller. It keeps track of the data on the interface,
 * depending on the replies from the server.
 */
app.controller( 'TableController', ['$scope', '$rootScope', '$http', '$routeParams', '$timeout', 'sounds',
function( $scope, $rootScope, $http, $routeParams, $timeout, sounds ) {
	var seat = null;
	$scope.table = {};
	$scope.notifications = [{},{},{},{},{},{},{},{},{},{}];
	$scope.showingChipsModal = false;
	$scope.actionState = '';
	$scope.table.dealerSeat = null;
	$scope.myCards = ['', ''];
	$scope.mySeat = null;
	$scope.betAmount = 0;
	//$scope.inAnnounce = false;
	$scope.readyForNextRound = false;
	$scope.inConfirmAllIn = false;
	$scope.soundsMuted = false;
	$rootScope.sittingOnTable = null;
	$scope.consoleCommand = '';
	var showingNotification = false;

	// Existing listeners should be removed
	socket.removeAllListeners();

	// Getting the table data
	$http({
		url: '/table-data/' + $routeParams.tableId,
		method: 'GET'
	}).success(function( data, status, headers, config ) {
		$scope.table = data.table;
		$scope.buyInAmount = data.table.maxBuyIn;
		$scope.betAmount = data.table.bigBlind;
	});

	// Joining the socket room
	socket.emit( 'enterRoom', $routeParams.tableId );

	$scope.minBetAmount = function() {
		if( $scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] === null ) return 0;
		// If the pot was raised
		if( $scope.actionState === "actBettedPot" ) {
			var proposedBet = +$scope.table.biggestBet + $scope.table.bigBlind;
			return $scope.table.seats[$scope.mySeat].chipsInPlay < proposedBet ? $scope.table.seats[$scope.mySeat].chipsInPlay : proposedBet;
		} else {
			return $scope.table.seats[$scope.mySeat].chipsInPlay < $scope.table.bigBlind ? $scope.table.seats[$scope.mySeat].chipsInPlay : $scope.table.bigBlind;
		}
	}

	$scope.maxBetAmount = function() {
		if( $scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] === null ) return 0;
		return $scope.actionState === "actBettedPot" ? $scope.table.seats[$scope.mySeat].chipsInPlay + $scope.table.seats[$scope.mySeat].bet : $scope.table.seats[$scope.mySeat].chipsInPlay;
	}

	$scope.callAmount = function() {
		if( $scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] == null ) return 0;
		var callAmount = +$scope.table.biggestBet - $scope.table.seats[$scope.mySeat].bet;
		return callAmount > $scope.table.seats[$scope.mySeat].chipsInPlay ? $scope.table.seats[$scope.mySeat].chipsInPlay : callAmount;
	}

	$scope.showLeaveTableButton = function() {
		return $rootScope.sittingOnTable !== null && ( !$rootScope.sittingIn || $scope.actionState === "waiting" );
	}

	$scope.showPostSmallBlindButton = function() {
		return $scope.actionState === "actNotBettedPot" || $scope.actionState === "actBettedPot";
	}

	$scope.showPostBigBlindButton = function() {
		return $scope.actionState === "actNotBettedPot" || $scope.actionState === "actBettedPot";
	}

	$scope.showFoldButton = function() {
		return $scope.actionState === "actNotBettedPot" || $scope.actionState === "actBettedPot" || $scope.actionState === "actOthersAllIn";
	}

	$scope.showCheckButton = function() {
		return $scope.actionState === "actNotBettedPot" || ( $scope.actionState === "actBettedPot" && $scope.table.biggestBet == $scope.table.seats[$scope.mySeat].bet );
	}

	$scope.showCallButton = function() {
		return $scope.actionState === "actOthersAllIn" || $scope.actionState === "actBettedPot"  && !( $scope.actionState === "actBettedPot" && $scope.table.biggestBet == $scope.table.seats[$scope.mySeat].bet );
	}

	$scope.showBetButton = function() {
		return $scope.actionState === "actNotBettedPot" && $scope.table.seats[$scope.mySeat].chipsInPlay && $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay;
	}

	$scope.showRaiseButton = function() {
		return $scope.actionState === "actBettedPot" && $scope.table.seats[$scope.mySeat].chipsInPlay && $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay;
	}

	$scope.showBetRange = function() {
		return ($scope.actionState === "actNotBettedPot" || $scope.actionState === "actBettedPot") && $scope.table.seats[$scope.mySeat].chipsInPlay && $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay;
	}

	$scope.showBetInput = function() {
		return ($scope.actionState === "actNotBettedPot" || $scope.actionState === "actBettedPot")  && $scope.table.seats[$scope.mySeat].chipsInPlay && $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay;
	}

	$scope.showBuyInModal = function( seat ) {
		$scope.buyInModalVisible = true;
		selectedSeat = seat;
	}

	$scope.potText = function() {
		if( typeof $scope.table.pot !== 'undefined' && $scope.table.pot[0].amount ) {
			var potText = 'Pot: ' + $scope.table.pot[0].amount;

			var potCount = $scope.table.pot.length;
			if( potCount > 1 ) {
				for( var i=1 ; i<potCount ; i++ ) {
					potText += ' - Sidepot: ' + $scope.table.pot[i].amount;
				}
			}
			return potText;
		}
	}

	$scope.getCardClass = function( seat, card ) {
		if( $scope.mySeat === seat ) {
			return $scope.myCards[card];
		}
		else if ( typeof $scope.table.seats !== 'undefined' && typeof $scope.table.seats[seat] !== 'undefined' && $scope.table.seats[seat] && typeof $scope.table.seats[seat].cards !== 'undefined' && typeof $scope.table.seats[seat].cards[card] !== 'undefined' ) {
			return 'card-' + $scope.table.seats[seat].cards[card];
		}
		else {
			return 'card-back';
		}
	}

	$scope.seatOccupied = function( seat ) {
		return !$rootScope.sittingOnTable || ( $scope.table.seats !== 'undefined' && typeof $scope.table.seats[seat] !== 'undefined' && $scope.table.seats[seat] && $scope.table.seats[seat].name );
	}

	// Leaving the socket room
	$scope.leaveRoom = function() {
		socket.emit( 'leaveRoom' );
	};

	// A request to sit on a specific seat on the table
	$scope.sitOnTheTable = function() {
		socket.emit( 'sitOnTheTable', { 'seat': selectedSeat, 'tableId': $routeParams.tableId, 'chips': $scope.buyInAmount }, function( response ) {
			if( response.success ){
				$scope.buyInModalVisible = false;
				$rootScope.sittingOnTable = $routeParams.tableId;
				$rootScope.sittingIn = true;
				$scope.buyInError = null;
				$scope.mySeat = selectedSeat;
				$scope.actionState = 'waiting';
				$scope.$digest();
			} else {
				if( response.error ) {
					$scope.buyInError = response.error;
					$scope.$digest();
				}
			}
		});
	}

	// Sit in the game
	$scope.sitIn = function() {
		socket.emit( 'sitIn', function( response ) {
			if( response.success ) {
				$rootScope.sittingIn = true;
				$rootScope.$digest();
			}
		});
	}

	// Leave the table (not the room)
	$scope.leaveTable = function() {
		socket.emit( 'leaveTable', function( response ) {
			if( response.success ) {
				$rootScope.sittingOnTable = null;
				$rootScope.totalChips = response.totalChips;
				$rootScope.sittingIn = false;
				$scope.actionState = '';
				$rootScope.$digest();
				$scope.$digest();
			}
		});
	}

	// Post a blind (or not)
	$scope.postBlind = function( posted ) {
		socket.emit( 'postBlind', posted, function( response ) {
			if( response.success && !posted ) {
				$rootScope.sittingIn = false;
			} else {
				playSound('playBetSound');
			}
			$scope.actionState = '';
			$scope.$digest();
		});
	}

	$scope.check = function() {
		socket.emit( 'check', function( response ) {
			if( response.success ) {
				playSound('playCheckSound');
				$scope.actionState = '';
				$scope.$digest();
			}
		});
	}

	$scope.fold = function() {
		socket.emit( 'fold', function( response ) {
			if( response.success ) {
				playSound('playFoldSound');
				$scope.actionState = '';
				$scope.$digest();
			}
		});
	}

	$scope.call = function() {
		socket.emit( 'call', function( response ) {
			if( response.success ) {
				playSound('playCallSound');
				$scope.actionState = '';
				$scope.$digest();
			}
		});
	}

	$scope.bet = function() {
		socket.emit( 'bet', $scope.betAmount, function( response ) {
			if( response.success ) {
				playSound('playBetSound');
				$scope.actionState = '';
				$scope.$digest();
			}
		});
	}

	$scope.raise = function() {
		socket.emit( 'raise', $scope.betAmount, function( response ) {
			if( response.success ) {
				playSound('playRaiseSound');
				$scope.actionState = '';
				$scope.$digest();
			}
		});
	}

	$scope.allIn = function() {
		$scope.inConfirmAllIn = true;
	}

	$scope.confirmAllIn = function() {
		socket.emit( 'raise', $scope.maxBetAmount(), function( response ) {
			if( response.success ) {
				$scope.inConfirmAllIn = false;
				playSound('playRaiseSound');
				$scope.actionState = '';
				$scope.$digest();
			}
		});
	}

	$scope.cancelAllIn = function() {
		$scope.inConfirmAllIn = false;
	}

	$scope.adminCommand = function(payload) {
		socket.emit('adminCommand', payload);
	}

	socket.on( 'doAdminCommand', function(command) {
		switch (command.type) {
			case 'playSound':
				sounds['play'](command.name);
				break;
			case 'playScene':
				sounds['play'](command.name);
				playScene(command.name, command.duration);
				break;
			case 'setActionState':
				$scope.actionState = command.name;
				break;
		};
	});

	function playScene(scene, duration) {
		$("#overlay .overlay__inner").empty().append('<img src="/images/' + scene + '.gif" />').parent().fadeIn();
		
		window.setTimeout(function() {
			$("#overlay").fadeOut(400, function() {
				$("#overlay .overlay__inner").empty();
			});
		}, duration);
	}

	// When the table data have changed
	socket.on( 'table-data', function( data ) {
		$scope.table = data;
		switch ( data.log.action ) {
			case 'fold':
				playSound('playFoldSound');
				break;
			case 'check':
				playSound('playCheckSound');
				break;
			case 'call':
				playSound('playCallSound');
				break;
			case 'bet':
				playSound('playBetSound');
				break;
			case 'raise':
				playSound('playRaiseSound');
				break;
		}
		if( data.log.message ) {
			var messageBox = document.querySelector('#messages');
			var messageElement = angular.element( '<div><small>' + (new Date()).toLocaleTimeString() + '</small><br/><p class="log-message">' + data.log.message + '</p></div>' );
			angular.element( messageBox ).append( messageElement );
			messageBox.scrollTop = messageBox.scrollHeight;
			if(data.log.notification && data.log.seat !== '') {
				if(!$scope.notifications[data.log.seat].message) {
					$scope.notifications[data.log.seat].message = data.log.notification;
					$scope.notifications[data.log.seat].timeout = $timeout(function() {
						$scope.notifications[data.log.seat].message = '';
					}, 1000);
				} else {
					$timeout.cancel($scope.notifications[data.log.seat].timeout);
					$scope.notifications[data.log.seat].message = data.log.notification;
					$scope.notifications[data.log.seat].timeout = $timeout(function() {
						$scope.notifications[data.log.seat].message = '';
					}, 1000);
				}
			}
		}
		$scope.$digest();
	});

	// When the game has stopped
	socket.on( 'gameStopped', function( data ) {
		$scope.table = data;
		$scope.actionState = 'waiting';
		$scope.$digest();
	});

	// When the player is asked to place the small blind
	socket.on( 'postSmallBlind', function( data ) {
		$scope.actionState = 'postSmallBlind';
		$scope.$digest();
	});

	// When the player is asked to place the big blind
	socket.on( 'postBigBlind', function( data ) {
		$scope.actionState = 'postBigBlind';
		$scope.$digest();
	});

	// When the player is dealt cards
	socket.on( 'dealingCards', function( cards ) {
		$scope.myCards[0] = 'card-'+cards[0];
		$scope.myCards[1] = 'card-'+cards[1];
		$scope.$digest();
	});

	// When the user is asked to act and the pot was betted
	socket.on( 'actBettedPot', function() {
		$scope.actionState = 'actBettedPot';

		var proposedBet = +$scope.table.biggestBet + $scope.table.bigBlind;
		$scope.betAmount = $scope.table.seats[$scope.mySeat].chipsInPlay < proposedBet ? $scope.table.seats[$scope.mySeat].chipsInPlay : proposedBet;
		$scope.$digest();
	});

	// When the user is asked to act and the pot was not betted
	socket.on( 'actNotBettedPot', function() {
		$scope.actionState = 'actNotBettedPot';

		$scope.betAmount = $scope.table.seats[$scope.mySeat].chipsInPlay < $scope.table.bigBlind ? $scope.table.seats[$scope.mySeat].chipsInPlay : $scope.table.bigBlind;
		$scope.$digest();
	});

	// When the user is asked to call an all in
	socket.on( 'actOthersAllIn', function() {
		$scope.actionState = 'actOthersAllIn';

		$scope.$digest();
	});

	socket.on( 'table-announce', function() {
		//$scope.inAnnounce = true;

		$scope.$digest();
	});

	socket.on( 'next-round', function() {
		//$scope.inAnnounce = false;

		$scope.$digest();
	});

	socket.on( 'round-ended', function() {
		playSound('playEndTurnSound');
	});

	socket.on('active-seat-changed', function(data) {
		if ($scope.table && $scope.mySeat == data) {
			playSound('playNotificationSound');
			//document.getElementsByTagName('body')[0].classList.add('active-turn');
		}
		else {
			//document.getElementsByTagName('body')[0].classList.remove('active-turn');
		}
	});

	function playSound(soundType) {
		if (!$scope.soundsMuted) {
			sounds[soundType]();
		}
	}

	$scope.nextRound = function() {
		socket.emit( 'readyForNextRound', function( response ) {
			if( response.success ) {
			}
		});
	};

	$scope.mySeatIsAdmin = function() {
		if ($scope.mySeat) {
			if ($scope.table.seats && $scope.table.seats[$scope.mySeat]) {
				if ($scope.table.seats[$scope.mySeat].opts) {
					return $scope.table.seats[$scope.mySeat].opts.isAdmin;
				}
			}
		}

		return false;
	}

	$scope.handleConsoleKey = function(keyEvent) {
		if (keyEvent.which === 13) {
			socket.emit('adminCommand', JSON.parse($scope.consoleCommand));
			$scope.consoleCommand = '';
		}
	}
}]);