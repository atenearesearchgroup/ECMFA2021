'use strict';


var util = require('util')
var UBoolean = require('../../Uncertainty/JavaScript/UBoolean');
var UReal = require('../../Uncertainty/JavaScript/UReal');

const fs = require('fs');

const { Console } = require('console');

var userTemperatures = new Map();

var checkingInterval = process.env.CHECKING_INTERVAL || 1*20*1000 //amount of time between each log dump for testing purposes
var refreshInterval = process.env.REFRESH_INTERVAL || 1*60*1000   //amount of time between each hearbeat  

var temperatureChangeRate = process.env.TEMP_CHANGE_RATE || 0.5 //amount of degrees to change each tick
var temperatureChangeInterval = process.env.TEMP_CHANGE_INTERVAL || 5*1000 //time between ticks of temperature change

var idealTemperature = 24;

var defaultTemp = idealTemperature;
var currentTemperature = 15;
var temperatureGoal = new UReal(defaultTemp, 1.0);
var happyUsers = 0;
var comfortRange = 2; //amount of degrees of difference a user is happy with

temperatureGoal.setX(defaultTemp);


//writer to csv

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

var currentDate =  new Date().toISOString().
    replace(/T/, ' ').      // replace T with a space
    replace(/\..+/, '');     // delete the dot and everything after;
var folder = currentDate.split(' ')[0];   
var filename = currentDate.split(' ')[1];

var filepath = './logs/' + folder;

fs.mkdir(filepath, { recursive: true }, (err) => {
    if (err) throw err;
  });
  filepath = filepath + "/" + filename +".csv";
  filepath = filepath.replace(/:/, '-');
  filepath = filepath.replace(/:/, '-');
const csvWriter = createCsvWriter({
    path: filepath,
    header: [
        {id: 'timestamp', title: 'timestamp'},
        {id: 'userName', title: 'userName'},
        {id: 'requestedTemp', title: 'requestedTemp'},
        {id: 'objectiveTemp', title: 'objectiveTemp'},
        {id: 'numUsers', title: 'numUsers'},
        {id: 'numHappyUsers', title: 'numHappyUsers'},
        {id: 'distance', title: 'distanceToBeacon'},
        {id: 'inside', title: 'inside'},
        //for debugging purposes
        {id: 'lastNumberOfBeeps', title: 'lastNumberOfBeeps'}, //number of beeps used in the last temperature calculation
        {id: 'lastCalculatedWeight', title: 'lastCalculatedWeight'},//weight that the user got in the last temperature calculation
    ]
});

//debugging trace variable
var temperatureTrace = {
    table: []
};



function checkUserActivity(){
    
    if(userTemperatures.size == 0){
        console.log("No users are connected");
    }else{
        console.log("Current connected users: ");
        for(var entry of userTemperatures.entries()){
            var userName = entry[0];
            var value = entry[1];
            var uTemperature = value.uTemperature;
            var seenCounter = value.seenCounter;
            console.log("User: " + userName + ", temperature: " + uTemperature.toString() + ", seen counter: " + seenCounter)
        }
    }

    console.log("Current temperature goal: " + temperatureGoal.toString());
    console.log("Number of happy users:  " + happyUsers);
    //console.log("Current ambient temperature: " + currentTemperature);

    
}

function refreshUserList(){
    for(var entry of userTemperatures.entries()){
        var userName = entry[0];
        var value = entry[1];
        var uTemperature = value.uTemperature;
        var seenCounter = value.seenCounter;
        var distanceToBeacon = value.distanceToBeacon;
        var inside = value.inside;
        seenCounter--;
        if(seenCounter < 1){
            //remove user from list
            userTemperatures.delete(userName);
            console.log("Removed user " + userName + " from entries");
            setTemperature();
        }else{
            //decrement seenCounter
            userTemperatures.set(userName, {uTemperature, seenCounter})
            userTemperatures.set(userName, {uTemperature, seenCounter, distanceToBeacon, inside});
        }
    }

    
}

function setTemperature(){
    
    if(userTemperatures.size == 0){
        //no users connected, set default temperature (or turn off)
        console.log("No users connected. Setting temperature to default: " + defaultTemp)
        temperatureGoal.setX(defaultTemp);
        temperatureGoal.setU(1.0);
    }else{

        var uCalculatedTemperature = new UReal(0.0, 0.0);
        var sumOfWeights = 0.0;
        var temperatureEntry = {
            table:[]
        }


        for(var entry of userTemperatures.entries()){

            //in case there is only one measure, add a measure of ideal temperature as reference
           /* if(userTemperatures.size < 2){
                sumOfWeights = sumOfWeights + 1
                uCalculatedTemperature = uCalculatedTemperature.add(new UReal(idealTemperature, 0))

            }*/
            var userName = entry[0];
            var userData = entry[1];
            
            var weight = ProbabilityDistribution(userData.distanceToBeacon, 0);
            if(!userData.inside){
                 weight = weight * 0.3;
            }
            switch (userData.seenCounter){
                case 2:
                    weight = weight*0.7;
                break;

                case 1:
                    weight = weight*0.3;
                break;

            }
            var uTemperature = new UReal(userData.uTemperature.getX(), userData.uTemperature.getU());
            uTemperature.setX(uTemperature.getX() * weight);
            //calculate the weight of this measure, copy the uReal of the current measure, multiply by its weight and add it to the total sum
            uCalculatedTemperature = uCalculatedTemperature.add(uTemperature);
            
            
            sumOfWeights = sumOfWeights + weight; //weighted average
            
            //New trace for debugging purposes, adding all info about every user for each time we calculate a new temp
            var userEntry = {userName: userName, requestedTemperature: userData.uTemperature,
                 numberOfBeeps: userData.seenCounter, distance: userData.distanceToBeacon, inside: userData.inside, calculatedWeight: weight}

            temperatureEntry.table.push(userEntry);

            //debugging purposes (remove when done with the trace)
            addUserToMap(userName, userData.uTemperature, userData.seenCounter,
                userData.distanceToBeacon, userData.inside, userData.seenCounter, weight);
        }
       


        //temperature calculation
        uCalculatedTemperature.setX(uCalculatedTemperature.getX() / sumOfWeights)
        uCalculatedTemperature.setU(+uCalculatedTemperature.getU().toFixed(2)); //round to 2 decimals
        
        uCalculatedTemperature.setX(+uCalculatedTemperature.getX().toFixed(2))
        
        temperatureGoal = uCalculatedTemperature;
        console.log("Setting temperature goal to: " + temperatureGoal.toReal() + " with uncertainty " + temperatureGoal.getU());
        console.log("Current ambient temperature is: " + currentTemperature)
        
        console.log("The number of happy users is: " + happyUsers);

        //extended trace
        temperatureEntry.table.push({objectiveTemperature: temperatureGoal.toReal()});
        temperatureTrace.table.push(temperatureEntry)

        var json = JSON.stringify(temperatureTrace)
        fs.writeFile(filepath +'-extendedTrace.json', json, 'utf8', function(res, err){
            if (err){
                console.log(err)
            }
        });

    }
    //log to csv
    calculateHappyUsers();
    
}

function addUserToMap(userName, uTemperature, seenCounter, distanceToBeacon, inside, lastNumberOfBeeps, lastCalculatedWeight){
    userTemperatures.set(userName, {uTemperature, seenCounter, distanceToBeacon, inside, lastNumberOfBeeps, lastCalculatedWeight});
}



function changeTemperatureOverTime(){//function to simulate the AC taking time to change temperature (not in use now)
    if(Math.abs(currentTemperature - temperatureGoal.getX()) < temperatureChangeRate){
        //if the change rate is higher than the different to the goal, just set current temp to the goal
        currentTemperature = temperatureGoal.getX();
        console.log("Goal reached. Ambient temperature: " + currentTemperature + ". Goal temperature: " + temperatureGoal.getX())
    }else if(currentTemperature < temperatureGoal.getX()){
        //increase temperature if we haven't reached the goal yet
        currentTemperature += temperatureChangeRate;
        console.log("Increased temperature by " + temperatureChangeRate + ". Current ambient temperature: " + currentTemperature);
    }else if (currentTemperature > temperatureGoal.getX()){
        //decrease temperature if we haven't reached the goal yet
        currentTemperature -= temperatureChangeRate;
        console.log("Decreased temperature by " + temperatureChangeRate + ". Current ambient temperature: " + currentTemperature);
    }else{
        console.log("Temperature is ideal.");
    }
    
}

//function to calculate the weigth with distance
function ProbabilityDistribution(value, objectiveValue){
    var confidence = 1.0;
    var p = 0.125 //1/8
    var difference = Math.abs(value - objectiveValue);


    /**
     * inverse distance weighting
     * 
          confidence = ________1________
                        distance ^ 1/8
            
    */

    if(difference <1){
        confidence = 1
    }else{
                    
    confidence = 1/(Math.pow(difference,p));
    
    }
    return +confidence.toFixed(2)
}


function calculateHappyUsers(){
    happyUsers = 0; //reset counter
    if(userTemperatures.size != 0){

        for(var entry of userTemperatures.entries()){
            var user = entry[1];
            var userTemp = (user.uTemperature.getX());
            if(Math.abs(temperatureGoal.getX() - userTemp) <= comfortRange){
                //if the temperature is within 2 degrees of the user preferred temperature, the user is happy
                happyUsers++;
            }
        }
    }
    
}


//writes log data to a csv file
async function writeToCSV(userName){  
   
    var currentDate =  new Date().toISOString().
    replace(/T/, ' ').      // replace T with a space
    replace(/\..+/, '');     // delete the dot and everything after;
    var date = currentDate.split(' ')[0];   
    var time = currentDate.split(' ')[1];

    var user = userTemperatures.get(userName)

    //TODO: calculate the happy users and add correct value
    var data = [{timestamp: time,
        userName: userName,
        requestedTemp: user.uTemperature.getX(), 
        objectiveTemp:temperatureGoal.getX(), 
        numUsers:userTemperatures.size, 
        numHappyUsers: happyUsers,
        distance: user.distanceToBeacon,
        inside: user.inside,
        lastNumberOfBeeps: user.lastNumberOfBeeps,
        lastCalculatedWeight: user.lastCalculatedWeight
        }];
    //csvWriter.writeRecords(data).then(()=> console.log("CSV written successfully"));
    await csvWriter.writeRecords(data).then(()=> console.log("CSV written successfully"));

}



//execute these functions periodically
setInterval(checkUserActivity, checkingInterval); 
setInterval(refreshUserList, refreshInterval);
//setInterval(changeTemperatureOverTime, temperatureChangeInterval); //to simulate the ac changing the temperature over time
//setInterval(writeToCSV, 5000 );//log output


exports.sendTemperature = function(req, res){
    var userName = req.body.userName;
    var temperature = parseFloat(req.body.temperature);
    var uTemperature = new UReal(temperature, 0.5);
    var distanceToBeacon = parseFloat(req.body.distance).toFixed(2);
    var seenCounter = 3;
    var response;

    if(userTemperatures.get(userName) == undefined){
        //user does not exist, create new user
        var inside = false;
        if(distanceToBeacon < 5 && distanceToBeacon >0){//TODO: adjust this parameter with the testing
            inside = true;
        }
        userTemperatures.set(userName, {uTemperature, seenCounter, distanceToBeacon, inside});
        console.log("Added user: " + userName + " with temperature: "+ uTemperature.toString() +". Distance to beacon: " + distanceToBeacon); 
        response = "Added new user";
        setTemperature();
    }else{
        //user exists, update its seenCounter
            var inside = userTemperatures.get(userName).inside;

            if(!inside && (distanceToBeacon <5 && distanceToBeacon >0)){
                inside=true;//if it wasn't inside before, change it to true in case it's close enough
            }
        if(userTemperatures.get(userName).uTemperature == uTemperature){
            //temperature didn't change
            var inside = user
            userTemperatures.set(userName, {uTemperature, seenCounter, distanceToBeacon, inside})
            console.log("Refreshed user " + userName + " counter. New distance: " + distanceToBeacon);
            response = "Refreshed user"
        }else{
            //if temperature changed, update current temperature
            userTemperatures.set(userName, {uTemperature, seenCounter, distanceToBeacon, inside})
            console.log("Refreshed user " + userName + " counter. New distance: " + distanceToBeacon);
            response = "Refreshed user"
            setTemperature();
        }

    }
    writeToCSV(userName);
    res.send(response);
    
    
}

exports.get_script = function (req, res) {
  console.log("get AC script");
    var fs = require('fs');
    fs.readFile('Script/ACScript.bsh', 'UTF-8', function (err, data) {
        if (err) res.send(err);
        // console.log(data);
        var script = data;
        console.log("AC script sent");
        res.send(script);
      });
}


