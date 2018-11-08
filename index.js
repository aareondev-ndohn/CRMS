const askSDK = require('ask-sdk');
const awsSDK = require('aws-sdk');
awsSDK.config.update(
    {
        region: 'us-east-1'
    }
);


const reportTable = '';
const docClient = new awsSDK.DynamoDB.DocumentClient();
const bgImageUrl = '';

const HELP_MESSAGE = 'Um mehr öber die Funktionen dieses Skills zu erfahren sagen Sie: Info zum Mieter-Portal';
const HELP_REPROMPT = 'HelpRepromt';
const STOP_MESSAGE = 'Auf Wiedersehen';
const skillBuilder = askSDK.SkillBuilders.standard();

const deleteIntentInfo = 'Löschen Info';
const saveIntentInfo = 'Schadensmeldung aufnehmen Info';
const getDataIntentInfo = 'Bearbeitungsstatus erfragen Info';


function supportsDisplay(input) {
    var hasDisplay =
        input.requestEnvelope.context &&
        input.requestEnvelope.context.System &&
        input.requestEnvelope.context.System.device &&
        input.requestEnvelope.context.System.device.supportedInterfaces &&
        input.requestEnvelope.context.System.device.supportedInterfaces.Display
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

function idResponseOutput(id) {
    var output = '';

    for (var i = 0; x < 2; i++) {
        output = id.charAt(i) + ' ';
    }

    return output;
}

const SetDataHandler =
{
    canHandle(input) {
        const request = input.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'SaveReport'
    },
    handle(input) {
        const request = input.requestEnvelope.request;
        const intent = request.intent;
        const slots = intent.slots;

        const object = slots.object.value;
        const location = slots.location.value;
        const state = slots.state.value;
        const firstName = slots.firstName.value;
        const lastName = slots.lastName.value;
        const missigLocationMessage = 'Um welchen Ort geht es?';
        const missingObjectMessage = 'Um welchen Gegenstand handelt es sich?';
        const missingStateMessage = 'Wie ist der Zustand des Objekts?';
        const elicitFirstNameMsg = 'Wie lautet Ihr Vorname?';
        const elicitLastNameMsg = 'Wie lautet Ihr Nachname?';

        if (request.intent.confirmationStatus === 'DENIED') {
            console.log('user cancelled "SaveReport"-intent with current slot values')
            return input.responseBuilder
                .speak('Meldung wurde verworfen')
                .withShouldEndSession(undefined)
                .getResponse();
        }
        else {
            if (request.confirmationStatus === 'NONE') {
                //maybe add: if (obj, loc, state, name..... == null)
                if (location == null || location == '?') {
                    console.log('elicit location slot');
                    return input.responseBuilder
                        .speak(missigLocationMessage)
                        .addElicitSlotDirective('location', intent)
                        .getResponse();
                }
                else if (object == null || object == '?') {
                    console.log('elicit object slot');
                    return input.responseBuilder
                        .speak(missingObjectMessage)
                        .addElicitSlotDirective('object', intent)
                        .getResponse();
                }
                else if (state == null || state == '?') {
                    console.log('elicit state slot');
                    return input.responseBuilder
                        .speak(missingStateMessage)
                        .addElicitSlotDirective('state', intent)
                        .getResponse();
                }
                else if (firstName == null || firstName == '?') {
                    console.log('elicit first name');
                    return input.responseBuilder
                        .speak(elicitFirstNameMsg)
                        .addElicitSlotDirective('firstName')
                        .getResponse();
                }
                else if (lastName == null || firstName == '?') {
                    console.log('elicit last name');
                    return input.responseBuilder
                        .speak(elicitLastNameMsg)
                        .getResponse();
                }


                console.log('getting intent confirmation');
                var speechOutput = 'Möchten Sie die Meldung mit den Daten: Ort '
                    + location + ', Objekt ' + object + ', Zustand '
                    + state + ' unter dem Namen ' + firstName + ' '
                    + lastName + ' aufnehmen?';
                return input.responseBuilder
                    .speak(speechOutput)
                    .addConfirmIntentDirective(intent)
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
                            reject(input.responseBuilder
                                .speak('Beim Aufnehmen der Meldung ist ein Fehler aufgetreten')
                                .withShouldEndSession(false)
                                .getResponse());
                        }
                        else {
                            console.log('successfully added item to database', JSON.stringify(data, null, 2));
                            resolve(input.responseBuilder
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

GetDataByIdHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'GetDataById'
    },
    handle(input) {
        const request = input.requestEnvelope.request;
        const slots = request.intent.slots;

        var id = slots.id.value;

        if (id == null) {
            const idMissingOutput = 'Wie lautet die vierstellige ei die?';
            return input.responseBuilder
                .speak(idMissingOutput)
                .repromt(idMissingOutput)
                .addElicitSlotDirective('id', request.intent)
                .getResponse();
        }
        else {
            const idInvalid = 'Ungültige Eingabe, wie lautet die vierstellige ei die?';
            try {
                idNum = parseInt(id, 10);
                if (id.charAt(0) === '0') {
                    idNum = idNum * 10;
                }

                if (idNum < 1000 || id > 9999) {
                    console.log('ID invalid' + id);
                    slots.id.value = null;
                    return input.responseBuilder
                        .speak(idInvalid)
                        .repromt(idMissingOutput)
                        .addElicitSlotDirective('id', request.intent)
                        .getResponse();
                }
            }
            catch (err) {
                console.log('ID invalid' + id + 'parseInt failed')
                slots.id.value = null;
                return input.responseBuilder
                    .speak(idInvalid)
                    .repromt(idMissingOutput)
                    .addElicitSlotDirective('id', request.intent)
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
                        reject(input.responseBuilder
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
                        resolve(input.responseBuilder
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
    canHandle(input) {
        const request = input.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'DeleteReportById';
    },
    handle(input) {
        const request = input.requestEnvelope.request;
        const id = request.intent.slots.id.value;

        if (request.intent.confirmationStatus === 'DENIED') {
            console.log('intent cancelled by user');
            return input.responseBuilder
                .speak('Löschvorgang abgebrochen')
                .getResponse();
        }
        else {
            if (request.intent.confirmationStatus === 'NONE') {
                const invalidIdMsg = 'Ungültige Eingabe. Wie lautet die vierstellige ei. die?'

                if (id == null || id == '?') {
                    console.log('id value invalid --> elicit id slot');
                    return input.responseBuilder
                        .speak(invalidIdMsg)
                        .addElicitSlotDirective('id', request.intent)
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
                            return input.responseBuilder
                                .speak(invalidIdMsg)
                                .addElicitSlotDirective('id', request.intent)
                                .getResponse();
                        }
                    }
                    catch (err) {
                        console.error('ID invalid ' + id + ' parseInt failed');
                        return input.responseBuilder
                            .speak(invalidIdMsg)
                            .addElicitSlotDirective('id', request.intent)
                            .getResponse();
                    }
                    console.log('getting user confirmation');
                    var idOutput = idResponseOutput(id);
                    const intentConfirmationMsg = 'Sind Sie sicher, dass Sie die Meldung mit der ei. Die. '
                        + idOutput + ' löschen möchten?';
                    return input.responseBuilder
                        .speak(intentConfirmationMsg)
                        .addConfirmIntentDirective(request.intent)
                        .getResponse();
                }
            }

            try {
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
                            reject(input.responseBuilder
                                .speak('Beim Löschen der Meldung ist ein Fehler aufgetreten')
                                .withShouldEndSession(false)
                                .getResponse());
                        }
                        else {
                            console.log('successfully deleted ' + id + ' from database', JSON.stringify(data, null, 2));
                            resolve(input.responseBuilder
                                .speak('Die Meldung wurde zum Löschen markiert. Sie werden informiert so bald die Meldung endgültig gelöscht wurde.')
                                .withShouldEndSession(false)
                                .getResponse());
                        }
                    })
                })
            }
            catch (err) {
                console.error('caugth exception ' + err + ' failed to delete or access database');
                return input.responseBuilder
                    .speak('Beim Zugirff auf die Datenbank ist etwas schiefgelaufen')
                    .getResponse();
            }
        }
    }
};

const IntentInfoHandler =
{
    canHandle(input) {
        const request = input.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'IntentInfo'
    },
    handle(input) {
        const request = input.requestEnvelope.request;
        const slots = request.intent.slots;

        if (slot.moreInfo != 'no') {
            if (slots.intent.value == null) {
                console.log('wait for user input regarding intent info')
                return input.responseBuilder
                    .addDelegateDirective(request.intent)
                    .getResponse();
            }
            else {
                var intent = slots.intent.value;

                if (intent === 'löschen') {
                    console.log('user requested info regarding the delete intent');
                    return input.responseBuilder
                        .speak(deleteIntentInfo)
                        .addElicitSlotDirective('moreInfo', request.intent)
                        .getResponse();
                }
                else if (intent === 'Bearbeitungsstatus') {
                    console.log('user requested info regarding the getData Intent');
                    return input.responseBuilder
                        .speak(getDataIntentInfo)
                        .addElicitSlotDirective('moreInfo', request.intent)
                        .getResponse();
                }
                else if (intent === 'aufnehmen') {
                    console.log('user requested info regarding the saveData Intent');
                    return input.responseBuilder
                        .speak(saveIntentInfo)
                        .addElicitSlotDirective('moreInfo', request.intent)
                        .getResponse();
                }
                else {
                    console.log('user stopped info request - no option');
                    return input.responseBuilder
                        .speak('Ok')
                        .withShouldEndSession(flase)
                        .getResponse();
                }
            }
        }
        else 
        {
            console.log('user stopped info request - no more info slot');
            return input.responseBuilder
                .speak('Ok')
                .withShouldEndSession(false)
                .getResponse();
        }
    }
};


const MaintenancemanHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'Maintenanceman');
    },
    handle(input) {

        return input.responseBuilder
            .speak("Ihr Hausmeister heißt Herr Krause und ist Wochentags von 9 bis 17 Uhr unter der Nummer 0 8 1 0 0 4 3 5 5 erreichbar")
            //.withsimpleCard(SKILL_NAME, "Der Hausmeister Heißt Herr Krause und ist Wochentags von 9 bis 17 Uhr unter der Nummer 08100 ereichbar")
            .getResponse();
    },
};

const BinCollectionHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'BinCollection');
    },
    handle(input) {

        return input.responseBuilder
            .speak("Der Müll wird jeden Donnerstag Vormittag abgeholt")
            //.withsimpleCard(SKILL_NAME, "Der Müll wird immer Donnerstags Vormittags abgeholt")
            .getResponse();
    },
};

const OfficalHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'Offical');
    },
    handle(input) {

        return input.responseBuilder
            .speak("Der Name Ihres zuständigen Sachbearbeiters ist Herr Meier")
            //.withsimpleCard(SKILL_NAME, "Ihr zuständiger Sachbearbeiter heißt Herr Meier")
            .getResponse();
    },
};

const ElectricitymeterHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
                && request.intent.name === 'Electricitymeter');
    },
    handle(input) {

        return input.responseBuilder
            .speak("Der Strom wird das nächste Mal am Montag den 17.12.2018 abgelesen")
            //.withsimpleCard(SKILL_NAME, "Der Strom wird in 2018 am Montag den 17.12. abgelesen")
            .getResponse();
    },
};

const HelpHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(input) {
        return input.responseBuilder
            .speak(HELP_MESSAGE)
            .reprompt(HELP_REPROMPT)
            .getResponse();
    },
};

const ExitHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.CancelIntent'
                || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(input) {
        return input.responseBuilder
            .speak(STOP_MESSAGE)
            .withShouldEndSession(true)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(input) {
        console.log(`Session ended with reason: ${input.requestEnvelope.request.reason}`);

        return input.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(input, error) {
        console.log(`Error handled: ${error.message}`);

        return input.responseBuilder
            .speak('Sorry, an error occurred.')
            .reprompt('Sorry, an error occurred.')
            .getResponse();
    },
};

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        SetDataHandler,
        GetDataByIdHandler,
        DeleteDataByIdHandler,
        IntentInfoHandler,
        OfficalHandler,
        ElectricitymeterHandler,
        MaintenancemanHandler,
        BinCollectionHandler,
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
