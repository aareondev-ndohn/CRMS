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
const table = 'CRMS-Datenbank-Test';
const docClient = new awsSDK.DynamoDB.DocumentClient();

// convert callback style functions to promises
/*
const dbScan = promisify(docClient.scan, docClient);
const dbGet = promisify(docClient.get, docClient);
const dbPut = promisify(docClient.put, docClient);
const dbDelete = promisify(docClient.delete, docClient);
*/

const instructions = `Hallo, willkommen in Ihrem CRMS-Portal. 
Wollen sie eine Schadensmeldung aufnehmen oder den Status einer Meldung abfragen?`;


const LaunchRequestHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'Launchrequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(instructions)
            .getResponse();
    }
}

const CreateDamageReport =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' 
        && request.name === 'CreateDamageReport';
    },
    handle(handlerInput) {

        const { userId } = this.event.session.user;
        const { slots } = this.event.request.intent;

        // prompt for slot values and request a confirmation for each

        // firstname
        if (!slots.Vorname.value) {
            const slotToElicit = 'Vorname';
            const speechOutput = 'Wie lautet Ihr Vorname?';
            const repromtSpeech = 'Bitte geben Sie Ihren Vornamen an'
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }
        else if (slots.Vorname.confirmationStatus !== 'CONFIRMED') {
            if (slots.Vorname.confirmationStatus !== 'DENIED') {
                // solt status: unconfirmed
                const slotToConfirm = 'Vorname';
                const speechOutput = 'Ihr Vorname lautet ${slots.Vorname.value}. Ist das richtig';
                const repromtSpeech = speechOutput;
                return handlerInput.responseBuilder.speak(speechOutput).getResponse();
            }

            // slot status: denied -> reprompt for slot data
            const slotToElicit = 'Vorname';
            const speechOutput = 'Wie lautet Ihr Vorname';
            const repromtSpeech = 'Bitte geben Sie Ihren Vornamen an';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }

        // lastname
        if (!slots.Nachname.value) {
            const slotToElicit = 'Nachname';
            const speechOutput = 'Wie lautet Ihr Nachname?';
            const repromtSpeech = 'Bitte geben Sie Ihren Nachnamen an'
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }
        else if (slots.Vorname.confirmationStatus !== 'CONFIRMED') {
            if (slots.Vorname.confirmationStatus !== 'DENIED') {
                // solt status: unconfirmed
                const slotToConfirm = 'Nachname';
                const speechOutput = 'Ihr Nachname lautet ${slots.Nachname.value}. Ist das richtig';
                const repromtSpeech = speechOutput;
                return handlerInput.responseBuilder.speak(speechOutput).getResponse();
            }

            // slot status: denied -> reprompt for slot data
            const slotToElicit = 'Nachname';
            const speechOutput = 'Wie lautet Ihr Nachname';
            const repromtSpeech = 'Bitte geben Sie Ihren Nachnamen an';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }


        // location
        if (!slot.Raum.value) {
            const slotToElicit = 'Raum';
            const speechOutput = 'An welchem Ort liegt der Schaden vor?';
            const repromptSpeech = 'Bitte gebe den Ort an, an dem sich der Schaden befindet';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }
        else if (slots.Raum.confirmationStatus !== 'CONFIRMED') {
            if (slots.Raum.confirmationStatus !== 'DENIED') {
                //slot status: unconfirmed
                const slotToConfirm = 'Raum';
                const speechOutput = `Der Ort des Schadens ist ${slots.Raum.value}. Ist das richtig?`;
                const repromptSpeech = speechOutput;
                return handlerInput.responseBuilder.speak(speechOutput).getResponse();
            }

            //slot status: denied -> reprompt for slot data
            const slotToElicit = 'Raum';
            const speechOutput = 'An welchem Ort ist der Schaden aufgetreten?';
            const repromptSpeech = 'Bitte geben Sie den Ort des Schadens an';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }

        //object
        if (!slot.Objekt.value) {
            const slotToElicit = 'Objekt';
            const speechOutput = 'Welches Objekt ist beschädigt?';
            const repromptSpeech = 'Bitte geben Sie den Gegenstand an, der beschädigt ist.';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }
        else if (slots.Objekt.confirmationStatus !== 'CONFIRMED') {
            if (slots.Objekt.confirmationStatus !== 'DENIED') {
                //slot status: unconfirmed
                const slotToConfirm = 'Objekt';
                const speechOutput = `Das beschädigte Objekt ist ${slots.Objekt.value}. Ist das richtig?`;
                const repromptSpeech = speechOutput;
                return handlerInput.responseBuilder.speak(speechOutput).getResponse();
            }

            //slot status: denied -> reprompt for slot data
            const slotToElicit = 'Objekt';
            const speechOutput = 'Welches Objekt ist beschädigt?';
            const repromptSpeech = 'Bitte geben Sie den beschädigten Gegenstand an!';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }

        //state
        if (!slot.Zustand.value) {
            const slotToElicit = 'Zustand';
            const speechOutput = 'In welchem Zustand befindet sich das Objekt?';
            const repromptSpeech = 'Wie ist der Zustand des Gegenstandes?';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }
        else if (slots.Zustand.confirmationStatus !== 'CONFIRMED') {
            if (slots.Zustand.confirmationStatus !== 'DENIED') {
                //slot status: unconfirmed
                const slotToConfirm = 'Zustand';
                const speechOutput = `Der Zustand des Objekts ist ${slots.Zustand.value}. Ist das richtig?`;
                const repromptSpeech = speechOutput;
                return handlerInput.responseBuilder.speak(speechOutput).getResponse();
            }

            //slot status: denied -> reprompt for slot data
            const slotToElicit = 'Zustand';
            const speechOutput = 'In welchem Zustand befindet sich das Objekt?';
            const repromptSpeech = 'Wie ist der Zustand des Gegenstandes?';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }

        // all slot values received and confirmed, now add the record to DynamoDB

        const lastName = slots.Nachname.value;
        const firstName = slots.Vorname.value;
        const location = slots.Ort.value;
        const object = slots.Objekt.value;
        const state = slots.Zustand.value;

        var dateObj = new Date();
        var day = dateObj.getUTCDate();
        var month = dateObj.getUTCMonth() + 1;
        var hour = dateObj.getHours();
        var minutes = dateObj.getMinutes();
        var seconds = dateObj.getSecondes();
        const reportId = month + "" + hour + "" + day + "" + minutes;
        const reportDate = dateObj;

        const dynamoParams = {
            TableName: crmsTable,
            Item: {
                "ReportID": reportId,
                "Lastname": lastName,
                "Firstname": firstName,
                "Location": location,
                "Object": object,
                "State": state,
                "ReportDate": reportDate,

            }
        };

        console.log('Attempting to add database entry', dynamoParams);

        docClient.put(dynamoParams, function (err, data) {
            if (err) {
                console.error("Failed to add entry", JSON.stringify(err, null, 2));
                return handlerInput.responseBuilder
                    .speak("Schreiben in die Datenbank fehlgeschlagen.")
                    .getResponse();
            }
            else {
                console.log("Entry successfully added to database")
            }

            return handlerInput.responseBuilder
                .speak(`Schadensmeldung Nummer ${reportId} wurde gespeichert`)
                .getResponse();
        });
    }
};

// Returns the status of a damage report

const GetStatusHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' 
        && request.name === 'GetStatusHandler';
    },
    handle(handlerInput) {
        const { userId } = this.event.session.user;
        const { slots } = this.event.request.intent;
        
        let output;
        
        // prompt for slot data if needed
        if (!slot.Vorname.value)
        {
            const slotToElicit = 'Vorname';
            const speechOutput = 'Wie lautet Ihr Vorname?';
            const repromtSpeech = 'Bitte geben Sie Ihren Vornamen an!';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse;
        }
        else if (!slot.Nachname.value)
        {
            const slotToElicit = 'Vorname';
            const speechOutput = 'Wie lautet Ihr Vorname?';
            const repromtSpeech = 'Bitte geben Sie Ihren Nachnamen an!';
            return handlerInput.responseBuilder.speak(speechOutput).getResponse;
        }

        const firstName = slot.Vorname.value;
        const lastName = slot.Nachname.value;

        const dynamoParams = 
        {
            TableName: crmsTable,
            Key:
            {
                "Lastname": lastName,
                "Firstname": firstName,
            }
        }

        console.log('Attempting to read data');

        const reportStatus = docClient.get(dynamoParams, function(err, data)
        {
            if (err)
            {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                var errMessage = 'Lesen des Datenbankeintrags nicht möglich'
                return handlerInput.responseBuilder.speak(errMessage)
            }
            else 
            {
                console.log("Data successfully accessed", JSON.stringify(data, null, 2));
            }
        });

        reportStatusOutput = 'Der Status Ihrer Meldung vom ';//  ??? + reportStatus.date + ' ID: ' + reportStatus.ReportId.....;
        return handlerInput.responseBuilder
        .speak(reportStatusOutput);
    }

}
    ;

/*const writeInDatabaseHandler =
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
            Item: {
                "Name": name,
                "ID": id,
            }
        };

        docClient.put(dynamoParams, function (err, data) {
            if (err) {
                console.error("Fehlgeschlagen", JSON.stringify(err, null, 2));
                return handlerInput.responseBuilder
                    .speak('Fail')
                    .getResponse();

            } else {
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
        writeInDatabaseHandler,
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();




    /**
     *      -   Ansprechen von Slots mit "slot." oder "slots."?
     * 
     *      -   Responses müssen noch auf Rückfragen und ähnliches angepasst werden
     * 
     *      -   Auf welche Art können Daten, die durch "docClient.get()" gelesen werden,
     *          genutzt werden? Zwischenspeichern in Datenstruktur und dann Zugriff via 
     *          "datenstruktur.variable"?
     */