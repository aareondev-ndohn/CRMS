const askSDK = require('ask-sdk');

const awsSDK = require('aws-sdk');
const util = require('util');
awsSDK.config.update({
    region: "us-east-1" // or whatever region your lambda and dynamo is
});


const appId = 'amzn1.ask.skill.77faba7d-b52b-4722-b441-82011b4c9151';
const table = 'database-test';
const docClient = new awsSDK.DynamoDB.DocumentClient();

const instructions = `Skill beginnt`;

var dataTest;


const LaunchRequestHandler = 
{
    canHandle(handlerInput)
    {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },
    handle(handlerInput)
    {

        return handlerInput.responseBuilder
        .speak("Welcome")
        .getResponse();   
    }

}

const GetDataHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'Auslesen';
    },
    handle(handlerInput) {

        const request = handlerInput.requestEnvelope.request;
        const slots = request.intent.slots;

        var lastName = slots.lastName.value;
        var firstName = slots.firstName.value;

        var params = 
        {
            TableName: table,
            Key:
            {
                'lastname': lastName,
                'firstName': firstName,
            }
        };

        return new Promise((resolve, reject) => 
        {
            docClient.get(params, function(err,data)
            {
                if(err)
                {
                    console.log('failed to read data' + JSON.stringify(err,null,2));
                    reject(err);
                }
                else
                {
                    console.log('successfully read data: ' + JSON.stringify(data,null,2))
                    var lastname = data.Item.lastname;
                    var firstName = data.Item.firstName;
                    var age = data.Item.age;
                    resolve(handlerInput.responseBuilder
                        .speak("The name is " + firstName + ' ' + lastname +' and he is ' + age)
                        .getResponse());
                }
            })
        });
    },
};    
        

const writeInDatabaseHandler = 
{
    canHandle(handlerInput)
    {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'Speichern';
    },
    handle(handlerInput)
    {
        const request = handlerInput.requestEnvelope.request;
        const slots = request.intent.slots;

        const lastName = slots.lastName.value;
        var firstName = slots.firstName.value;
        var ageInt = slots.age.value;
        var age = parseInt(ageInt,10);

        if (request.intent.confirmationStatus === 'NONE')
        {
            return handlerInput.responseBuilder
            .addConfirmIntentDirective(currentIntent)
            .getResponse();
        }

        


        var dateObj = new Date();
        var day = dateObj.getUTCDate();
        var hour = dateObj.getHours();
        var minutes = dateObj.getMinutes();
        var seconds = dateObj.getSeconds();
        const reportId = seconds + "" + hour + "" + day + "" + minutes;
        const reportDate = dateObj;


        const dynamoParams = {
        TableName: table,
        Item: {
            "lastname": lastName,
            "firstName": firstName,
            "age": age,
            'id': reportId,
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
};

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
        LaunchRequestHandler,
        GetDataHandler,
        writeInDatabaseHandler,
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();

