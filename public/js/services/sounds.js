/**
 * Returns functions that play the sounds of the application
 * @return object
 */
app.factory('sounds', [function() {
	var foldSound = document.getElementById("fold-sound"),
		checkSound = document.getElementById("check-sound"),
		callSound = document.getElementById("call-sound"),
		betSound = document.getElementById("bet-sound"),
		endTurnSound = document.getElementById("end-turn-sound"),
		notificationSound = document.getElementById("notification-sound"),
		raiseSound = document.getElementById("raise-sound"),
		iedereenboptSound = document.getElementById("iedereenbopt-sound"),
		ladadaSound = document.getElementById("ladada-sound")
		;

    return {
    	playFoldSound: function() {
    		foldSound.play();
    	},
    	playCheckSound: function() {
    		checkSound.play();
    	},
    	playCallSound: function() {
    		callSound.play();
    	},
    	playBetSound: function() {
    		betSound.play();
    	},
    	playRaiseSound: function() {
    		raiseSound.play();
		},
		playEndTurnSound: function() {
			endTurnSound.play();
		},
		playNotificationSound: function() {
			notificationSound.play();
		},
		play: function(name) {
			let toPlay = document.getElementById(name + "-sound");

			if (toPlay) {
				toPlay.play();
			}
		}
    };
}]);