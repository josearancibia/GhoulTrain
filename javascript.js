$(document).ready(function(){
  

  // Init Firebase
  var config = {
    apiKey: "AIzaSyD0Gnzq25Mnq_hxeQAFlZCNDbfqzYLKFG8",
    authDomain: "train-schedule-e045b.firebaseapp.com",
    databaseURL: "https://train-schedule-e045b.firebaseio.com",
    projectId: "train-schedule-e045b",
    storageBucket: "train-schedule-e045b.appspot.com",
    messagingSenderId: "172500458625"
  };
  firebase.initializeApp(config);

  function ghostTrain() {

    // Declare variables
    var database = firebase.database();
    var editTrainKey = '';
    var fbTime = moment();
    var newTime;

    $('.submit').on('click', function(e) {

      e.preventDefault();
      // Grab input values
      var trainName = $('#trainName').val().trim();
      var trainDestination = $('#trainDestination').val().trim();
      // Convert to Unix
      var trainTime = moment($('#firstTrain').val().trim(),"HH:mm").format("X");
      var trainFreq = $('#trainFrequency').val().trim();

      if (trainName != '' && trainDestination != '' && trainTime != '' && trainFreq != '') {
        // Clear form data
        $('#trainName').val('');
        $('#trainDestination').val('');
        $('#firstTrain').val('');
        $('#trainFrequency').val('');
        $('#trainKey').val('');

        fbTime = moment().format('X');
        // Push to firebase
        if (editTrainKey == ''){ 
          database.ref().child('trains').push({
            trainName: trainName,
            trainDestination: trainDestination,
            trainTime: trainTime,
            trainFreq: trainFreq,
            currentTime: fbTime,
          })
        } else if (editTrainKey != '') {
          database.ref('trains/' + editTrainKey).update({
            trainName: trainName,
            trainDestination: trainDestination,
            trainTime: trainTime,
            trainFreq: trainFreq,
            currentTime: fbTime,
          })
          editTrainKey = '';
        }
        $('.help-block').removeClass('bg-danger');
      } else {
        $('.help-block').addClass('bg-danger');
      }

    });

    // Update minutes away by triggering change in firebase children
    function timeUpdater() {
      database.ref().child('trains').once('value', function(snapshot){
        snapshot.forEach(function(childSnapshot){
          fbTime = moment().format('X');
          database.ref('trains/' + childSnapshot.key).update({
          currentTime: fbTime,
          })
        })    
      });
    };

    setInterval(timeUpdater, 10000);


    // Reference Firebase when page loads and train added
    database.ref().child('trains').on('value', function(snapshot){
      $('tbody').empty();
      
      snapshot.forEach(function(childSnapshot){
        var trainClass = childSnapshot.key;
        var trainId = childSnapshot.val();
        var firstTimeConverted = moment.unix(trainId.trainTime);
        var timeDiff = moment().diff(moment(firstTimeConverted, 'HH:mm'), 'minutes');
        var timeDiffCalc = timeDiff % parseInt(trainId.trainFreq);
        var timeDiffTotal = parseInt(trainId.trainFreq) - timeDiffCalc;

        if(timeDiff >= 0) {
          newTime = null;
          newTime = moment().add(timeDiffTotal, 'minutes').format('hh:mm A');

        } else {
          newTime = null;
          newTime = firstTimeConverted.format('hh:mm A');
          timeDiffTotal = Math.abs(timeDiff - 1);
        }

        $('tbody').append("<tr class=" + trainClass + "><td>" + trainId.trainName + "</td><td>" +
          trainId.trainDestination + "</td><td>" + 
          trainId.trainFreq + "</td><td>" +
          newTime + "</td><td>" +
          timeDiffTotal + "</td><td><button class='edit btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-pencil'></i></button> <button class='delete btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-remove'></i></button></td></tr>");

    });
    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });

     // Reference Firebase when children are updated
    database.ref().child('trains').on('child_changed', function(childSnapshot){
      
      var trainClass = childSnapshot.key;
      var trainId = childSnapshot.val();
      var firstTimeConverted = moment.unix(trainId.trainTime);
      var timeDiff = moment().diff(moment(firstTimeConverted, 'HH:mm'), 'minutes');
      var timeDiffCalc = timeDiff % parseInt(trainId.trainFreq);
      var timeDiffTotal = parseInt(trainId.trainFreq) - timeDiffCalc;

      if(timeDiff > 0) {
        newTime = moment().add(timeDiffTotal, 'minutes').format('hh:mm A');
      } else {
        newTime = firstTimeConverted.format('hh:mm A');
        timeDiffTotal = Math.abs(timeDiff - 1);
      } 

      $('.'+trainClass).html("<td>" + trainId.trainName + "</td><td>" +
        trainId.trainDestination + "</td><td>" + 
        trainId.trainFreq + "</td><td>" +
        newTime + "</td><td>" +
        timeDiffTotal + "</td><td><button class='edit btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-pencil'></i></button><button class='delete btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-remove'></i></button></td>");

    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });


    $(document).on('click','.delete', function(){
      var trainKey = $(this).attr('data-train');
      database.ref("trains/" + trainKey).remove();
      $('.'+ trainKey).remove();
    });

    $(document).on('click','.edit', function(){
      editTrainKey = $(this).attr('data-train');
      database.ref("trains/" + editTrainKey).once('value').then(function(childSnapshot) {
        $('#trainName').val(childSnapshot.val().trainName);
        $('#trainDestination').val(childSnapshot.val().trainDestination);
        $('#firstTrain').val(moment.unix(childSnapshot.val().trainTime).format('HH:mm'));
        $('#trainFrequency').val(childSnapshot.val().trainFreq);
        $('#trainKey').val(childSnapshot.key);

      });
      
    });

  };

});