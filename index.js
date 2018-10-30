const askSDK = require('ask-sdk');
/*
const askSDKCore = require('ask-sdk-core');
const askSDKDynamodbAdap = require('ask-sdk-dynamodb-persistence-adapter');
const askSDKModel = require('ask-sdk-model');
const askSDKS3Adap = require('ask-sdk-s3-persistence-adapter');
const askSDKV1Adap = require('ask-sdk-v1adapter');
*/
const awsSDK = require('aws-sdk');
const util = require('util');
//const promisify = util.promisify;
awsSDK.config.update({
    region: "us-east-1" // or whatever region your lambda and dynamo is
});


const appId = 'amzn1.ask.skill.77faba7d-b52b-4722-b441-82011b4c9151';
const table = 'DynamoDB-Test';
const docClient = new awsSDK.DynamoDB.DocumentClient();

// convert callback style functions to promises
/*
const dbScan = promisify(docClient.scan, docClient);
const dbGet = promisify(docClient.get, docClient);
const dbPut = promisify(docClient.put, docClient);
const dbDelete = promisify(docClient.delete, docClient);
*/

const instructions = `Skill beginnt`;


//const LaunchRequest = 
const GetDataHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest' && request.intent.name === 'Speichern');
    },
    handle(handlerInput) {
        const name = "Tom";

        var dateObj = new Date();
        var day = dateObj.getUTCDate();
        var month = dateObj.getUTCMonth() + 1;
        var hour = dateObj.getHours();
        var minutes = dateObj.getMinutes();
        //var seconds = dateObj.getSeconds();
        const id = "12"; //month + "" + hour + "" + day + "" + minutes;
        //id = id.toString();

        const dynamoParams = {
            TableName: table,
            Key: {
                "Name": name,
                "ID": id,
            }
        };

        var dataTom = docClient.get(dynamoParams, function (err, data) {
            if (err) {
                console.error("failed", JSON.stringify(err, null, 2));
            } else {
                console.log("Successfully read data", JSON.stringify(data, null, 2));
                console.log("data.Item.Name: " + data.Item.Name);
                return data.Item.Name;
            }
        });

        var toType = function (obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
        }

        console.log(toType(dataTom));
        console.log(dataTom);

        return handlerInput.responseBuilder
            .speak('Worked: ' + dataTom.Item.Name)
            .getResponse();
    }

    /*
    docClient.get(dynamoParams, function (err, data) {
            if (err) {
                console.error("Fehlgeschlagen", JSON.stringify(err, null, 2));
                return handlerInput.responseBuilder
                    .speak('Fail')
                    .getResponse();

            } else {
                console.log("Successfully read data", JSON.stringify(data, null, 2));
                console.log("This is name: " + data.Item.Name);
                dataTom = data.Item.Name;
                console.log("this is dataTom: " + dataTom);
                //return data;

                var toType = function (obj) {
                    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
                }

                console.log(toType(dataTom));
            }
        });

        console.log("T");

        var toType = function (obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
        }

        console.log(toType(dataTom));

        var responseVar = "worked" + JSON.stringify(dataTom, null, 2);
        return handlerInput.responseBuilder
            .speak(responseVar)
            .getResponse();



    }*/
};

/*const writeInDatabaseHandler = 
{
    canHandle(handlerInput)
    {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'Speichern';
    },
    handle(handlerInput)
    {
        const name = "Tom";

        const dynamoParams = {
        TableName: table,
        Item: {
            "Name": name,
        }
    };

        docClient.put(dynamoParams, function(err, data)
        {
            if(err)
            {
                console.error("Fehlgeschlagen", JSON.stringify(err, null, 2));
                return handlerInput.responseBuilder
                .speak('Fail')
                .getResponse();

            }else
            {
                console.log("Added Item", JSON.stringify(data, null, 2));
            }
        });
        return handlerInput.responseBuilder
        .speak('Wurde gespeichert')
        .getResponse();
    }
};*/

const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(HELP_MESSAGE)
            .reprompt(HELP_REPROMPT)
            .getResponse();
    },
};

const ExitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.CancelIntent'
                || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(STOP_MESSAGE)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, an error occurred.')
            .reprompt('Sorry, an error occurred.')
            .getResponse();
    },
};

const SKILL_NAME = 'Datenbank';
const HELP_MESSAGE = 'HelpMessage';
const HELP_REPROMPT = 'HelpRepromt';
const STOP_MESSAGE = 'StopMessage';
const skillBuilder = askSDK.SkillBuilders.standard();

exports.handler = skillBuilder
    .addRequestHandlers(
        GetDataHandler,
        //writeInDatabaseHandler
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();



/**
 *        getItem has a parameter "data" which is a data structure containing all information of the response
 *        + returning "data" should write this structure in whatever var you parse it to
 */
