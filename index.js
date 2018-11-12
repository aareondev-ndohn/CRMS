const askSDK = require('ask-sdk');
const awsSDK = require('aws-sdk');
awsSDK.config.update(
    {
        region: 'us-east-1'
    }
);

const reportTable = 'schadensmeldungVorstellung';
const docClient = new awsSDK.DynamoDB.DocumentClient();
const backgroundImageUrl = 'https://s3.amazonaws.com/alexabackround/Aareon_Hauptsitz.jpg';


const welcomeMessagelong = 'Willkommen in Ihrem Mieter-Portal, Sie können eine Schadensmeldung aufnehmen oder sich nach dem Status erkundigen'
const welcomeMessage = 'Willkommen in Ihrem Mieter-Portal';

const instruct = 'no intructions yet';

const LaunchRequestHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {

        const title = 'Mieter-Portal';
        const text1 = 'Willkommen in Ihrem Mieter-Portal';
        const text2 = 'ich bin text2 fett pronomenbaby';
        const text3 = 'Tipp: "Schadensmeldung aufnehmen..."';

/*
        if (supportsDisplay(handlerInput)) {
            const displayType = 'BodyTemplate7';
            const imageUrl = backgroundImageUrl;
            response = getDisplay(handlerInput.responseBuilder,
                imageUrl,
                displayType,
                title,
                text1,
                text2,
                text3)
        }
        else {
            response = handlerInput.responseBuilder;
        }
*/
        response = handlerInput.responseBuilder;
        return response
            .speak(welcomeMessage)
            .addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: require('./homepage.json'),
                    datasources: {
                    "bodyTemplate6Data": {
                        "type": "object",
                        "properties":{
                            "backroundUrl": "https://s3.amazonaws.com/alexabackround/Aareon_Hauptsitz2.jpg", 
                            "headerText": "Mieter Portal",
                            "primaryText": "Willkommen in ihrem Mieter Portal",
                            "secondaryText": "Sie können eine Schadensmeldung aufgeben oder den status einer Meldung abfragen",
                            "logoUrl": "https://s3.amazonaws.com/alexabackround/Alexa_aareon_logo_icon_.png",
                            "hintText": " im Bad tropft der Wasserhan\""
                    },
                "transformers": [
                    {
                        "inputPath": "hintText",
                        "transformer": "textToHint"
                    }
                ]
                 
                    }
                    }
                })
            .withShouldEndSession(false)
            .getResponse();

        /*return handlerInput.responseBuilder
        .speak(welcomeMessage)
        .withShouldEndSession(false)
        .getResponse();*/
    }
};

const SaveDataToDatabaseHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'SaveReport';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const slots = request.intent.slots;

        var object = slots.object.value;
        var location = slots.location.value;
        var state = slots.statevalue;

        if (request.intent.confirmationStatus === 'DENIED') {
            console.log('user canceled request with current slot values' + object + ' ' + location + ' ' + state);
            return handlerInput.responseBuilder
                .speak('Vorgang abgebrochen')
                .withShouldEndSession(false)
                .getResponse();
        }
        else {
            if (request.intent.confirmationStatus === 'NONE') {
                if (object == null || location == null || state == null) {
                    console.log('send request to fill slots to user')
                    return handlerInput.responseBuilder
                        .addDelegateDirective(request.intent)
                        .getResponse();
                }
                console.log('getting user confirmation')
                return handlerInput.responseBuilder
                    .addDelegateDirective(request.intent)
                    .getResponse();
            }

            var dateObj = new Date();
            var year = dateObj.getFullYear();
            var month = dateObj.getMonth();
            var day = dateObj.getUTCDate();
            var hours = dateObj.getHours();
            var minutes = dateObj.getMinutes();
            var seconds = dateObj.getSeconds();

            if (parseInt(minutes, 10) < 10) {
                mintues = '0' + minutes;
            }
            else {
                if (parseInt(hours, 10) < 10) {
                    hours = '0' + hours;
                }


                var id = minutes + '' + hours;   //year + '' + month + '' + day + '' + hours + '' + minutes + '' + seconds; 
                var reportDate = day + '.' + month + '.' + year;

                var params =
                {
                    TableName: reportTable,
                    Item:
                    {
                        'id': id,
                        'date': reportDate,
                        'location': location,
                        'object': object,
                        'state': state,
                        'sop': 'Meldung aufgenommen' //sop = state of progress
                    }
                };

                return new Promise((resolve, reject) => {
                    docClient.put(params, function (err, data) {
                        if (err) {
                            console.error('failed to add item to database', JSON.stringify(err, null, 2));
                            reject(handlerInput.responseBuilder
                                .speak('Beim Aufnehmen der Meldung ist ein Fehler aufgetreten')
                                .withShouldEndSession(false)
                                .getResponse());
                        }
                        else {
                            console.log('successfully added item to database', JSON.stringify(data, null, 2));
                            resolve(handlerInput.responseBuilder
                                .speak('Die Meldung wurde mit der ID ' + id + ' aufgenommen')
                                .withShouldEndSession(false)
                                .getResponse());
                        }
                    })
                })
            }
        }
    }
};

const GetDataByIdHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'GetDataById'
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const slots = request.intent.slots;

        var id = slots.id.value;

        if (id == null) {
            return handlerInput.responseBuilder
                .addDelegateDirective(request.intent)
                .getResponse();
        }
        else {
            try {
                idNum = parseInt(id, 10);
                if (id.charAt(0) === '0') {
                    idNum = idNum * 10;
                }

                if (idNum < 1000 || id > 9999) {
                    console.log('ID invalid' + id);
                    slots.id.value = null;
                    return handlerInput.responseBuilder
                        .addDelegateDirective(request.intent)
                        .getResponse();
                }
            }
            catch (err) {
                console.log('ID invalid' + id + 'parseInt failed')
                slots.id.value = null;
                return handlerInput.responseBuilder
                    .addDelegateDirective(request.intent)
                    .getResponse();
            }

            var params =
            {
                TableName: reportTable,
                Key:
                {
                    'id': id,
                },
            };

            return new Promise((resolve, reject) => {
                docClient.get(params, function (err, data) {
                    if (err) {
                        console.log('failed to read data' + JSON.stringify(err, null, 2));
                        reject(handlerInput.responseBuilder
                            .speak('Datenbanzugriff fehlgeschlagen')
                            .withShouldEndSession(false)
                            .getResponse());
                    }
                    else {
                        console.log('successfully read data: ' + JSON.stringify(data, null, 2))
                        const item = data.Item;
                        var object = item.object;
                        var location = item.location;
                        var sop = item.sop;
                        var date = item.date;
                        var speechOutput = 'Ihre Schadensmeldung vom ' + date + ' mit der Id '
                            + id + ' bezüglich des Ortes ' + location + ' und dem Gegenstand '
                            + object + ', hat den Bearbeitungsstatus ' + sop + '.';
                        resolve(handlerInput.responseBuilder
                            .speak(speechOutput)
                            .withShouldEndSession(false)
                            .getResponse());
                    }
                })
            });
        }
    },
};

const DeleteDataByIdHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'DeleteReportById';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const slots = request.intent.slots;

        const id = slots.id.value;


        if (request.intent.confirmationStatus === 'DENIED') {
            console.log('Request cancelled by User');
            return handlerInput.responseBuilder
                .speak('Löschvorgang abgebrochen')
                .getResponse();
        }
        else {
            if (request.intent.confirmationStatus === 'NONE') {
                if (id == null) {
                    console.log('send request to user --> value for id-slot');
                    return handlerInput.responseBuilder
                        .addDelegateDirective(request.intent)
                        .getResponse();
                }
                else {
                    try {
                        idNum = parseInt(id, 10);
                        if (id.charAt(0) === '0') {
                            idNum = idNum * 10;
                        }

                        if (idNum < 1000 || id > 9999) {
                            console.log('ID invalid' + id);
                            slots.id.value = null;
                            return handlerInput.responseBuilder
                                .addDelegateDirective(request.intent)
                                .getResponse();
                        }
                    }
                    catch (err) {
                        console.log('ID invalid' + id + 'parseInt failed')
                        slots.id.value = null;
                        return handlerInput.responseBuilder
                            .addDelegateDirective(request.intent)
                            .getResponse();
                    }
                    console.log('getting user confirmation');
                    return handlerInput.responseBuilder
                        .addDelegateDirective(request.intent)
                        .getResponse();
                }

            }


            var params =
            {
                TableName: reportTable,
                Key:
                {
                    'id': id
                }
            }

            return new Promise((resolve, reject) => {
                docClient.delete(params, function (err, data) {
                    if (err) {
                        console.log("failed to delete item from database", JSON.stringify(err, null, 2));
                        reject(handlerInput.responseBuilder
                            .speak('Beim Löschen der Meldung ist ein Fehler aufgetreten')
                            .withShouldEndSession(false)
                            .getResponse());
                    }
                    else {
                        console.log('successfully deleted ' + id + ' from database', JSON.stringify(data, null, 2));
                        resolve(handlerInput.responseBuilder
                            .speak('Die Meldung wurde zum Löschen markiert. Sie werden informiert so bald die Meldung endgültig gelöscht wurde.')
                            .withShouldEndSession(false)
                            .getResponse());
                    }
                })
            })
        }
    }
};

const IntentInfoHandler =
{
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'IntentInfo'
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const slots = request.intent.slots;

        if (slots.intent.value == null) {
            console.log('wait for user input regarding intent info')
            return handlerInput.responseBuilder
                .addDelegateDirective(request.intent)
                .getResponse();
        }
        else {
            var intent = slots.intent.value;

            if (intent === 'löschen') {
                console.log('user requested info regarding the delete intent');
                return handlerInput.responseBuilder
                    .speak(deleteIntentInfo)
                    .withShouldEndSession(false)
                    .getResponse();
            }
            else if (intent === 'Bearbeitungsstatus') {
                console.log('user requested info regarding the getData Intent');
                return handlerInput.responseBuilder
                    .speak(getDataIntentInfo)
                    .withShouldEndSession(false)
                    .getResponse();
            }
            else if (intent === 'aufnehmen') {
                console.log('user requested info regarding the saveData Intent');
                return handlerInput.responseBuilder
                    .speak(saveIntentInfo)
                    .withShouldEndSession(false)
                    .getResponse();
            }
        }
    }
};

const maintenanceman = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'maintenanceman');
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak("Ihr Hausmeister heißt Herr Krause und ist Wochentags von 9 bis 17 Uhr unter der Nummer 0 8 1 0 0 4 3 5 5 erreichbar")
            //.withsimpleCard(SKILL_NAME, "Der Hausmeister Heißt Herr Krause und ist Wochentags von 9 bis 17 Uhr unter der Nummer 08100 ereichbar")
            .getResponse();
    },
};

const bincollection = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'bincollection');
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak("Der Müll wird jeden Donnerstag Vormittag abgeholt")
            //.withsimpleCard(SKILL_NAME, "Der Müll wird immer Donnerstags Vormittags abgeholt")
            .getResponse();
    },
};

const offical = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'offical');
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak("Der Name Ihres zuständigen Sachbearbeiters ist Herr Meier")
            //.withsimpleCard(SKILL_NAME, "Ihr zuständiger Sachbearbeiter heißt Herr Meier")
            .getResponse();
    },
};

const electricitymeter = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'electricitymeter');
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak("Der Strom wird das nächste Mal am Montag den 17.12.2018 abgelesen")
            //.withsimpleCard(SKILL_NAME, "Der Strom wird in 2018 am Montag den 17.12. abgelesen")
            .getResponse();
    },
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
            .withShouldEndSession(true)
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

const HELP_MESSAGE = 'Um mehr öber die Funktionen dieses Skills zu erfahren sagen Sie: Info zum Mieter-Portal';
const HELP_REPROMPT = 'HelpRepromt';
const STOP_MESSAGE = 'Auf Wiedersehen';
const skillBuilder = askSDK.SkillBuilders.standard();

const deleteIntentInfo = 'Löschen Info';
const saveIntentInfo = 'Schadensmeldung aufnehmen Info';
const getDataIntentInfo = 'Bearbeitungsstatus erfragen Info';


function supportsDisplay(handlerInput) {
    var hasDisplay =
        handlerInput.requestEnvelope.context &&
        handlerInput.requestEnvelope.context.System &&
        handlerInput.requestEnvelope.context.System.device &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
    return hasDisplay;
}

function getDisplay(response, /*attributes,*/ imageUrl, displayType, title, text1, text2, text3) {
    const image = new askSDK.ImageHelper().addImageInstance(imageUrl).getImage();

    const textContent = new askSDK.RichTextContentHelper()
        .withPrimaryText(text1)
        .withSecondaryText(text2)
        .withTertiaryText(text3)
        .getTextContent();

    if (displayType == 'BodyTemplate7') {
        //use Background image
        response.addRenderTemplateDirective({
            type: displayType,
            backButton: 'visible',
            backgroundImage: image,
            title: title,
            textContent: textContent,
        });
    }
    else {
        response.addRenderTemplateDirective({
            //use 340x340 image on the right with text on the left
            backButton: 'visible',
            image: image,
            title: title,
            textContent: textContent,
        });
    }
    console.log('textContent is: ', JSON.stringify(textContent, null, 2));
    return response;
}

function idResponseOutput(id)
{
    var output = '';

    for (var i = 0; x < 2; i++)
    {
        output = id.charAt(i) + ' ';
    }

    return output;
}


exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        SaveDataToDatabaseHandler,
        GetDataByIdHandler,
        DeleteDataByIdHandler,
        IntentInfoHandler,
        offical,
        electricitymeter,
        maintenanceman,
        bincollection,
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
