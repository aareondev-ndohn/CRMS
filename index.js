const askSDK = require('ask-sdk');
const awsSDK = require('aws-sdk');
awsSDK.config.update(
    {
        region: 'us-east-1'
    }
);


const reportTable = 'AareonForumv2';
const docClient = new awsSDK.DynamoDB.DocumentClient();

const SKILL_NAME = 'Mieter-Portal';
const HELP_REPROMPT = 'Für Hilfe, sage: Info zum Mieter-Portal';
const HELP_MESSAGE = 'Um mehr über die Funktionen dieses Skills zu erfahren, sage: Info zum Mieter-Portal';
const STOP_MESSAGE = 'Auf Wiedersehen';
const skillBuilder = askSDK.SkillBuilders.standard();

const deleteIntentInfo = 'Löschen Info';
const saveIntentInfo = 'Schadensmeldung aufnehmen Info';
const getDataIntentInfo = 'Bearbeitungsstatus erfragen Info';

const welcomeMessage = 'Willkommen im Mieterportal deiner Wohnbau';

const WhatDoYouDoMessage = "Ich kann eine Schadensmeldung aufgebenmen, den Status einer Meldung abfragen, nach wichtigen Informationen deines Vermieters fragen, wer dein Sachbearbeiter, dein Hausmeister ist, wann der Strom abgelesen oder der Müll abgeholt wird und eine Mietbescheinigung anfordern";


function createDisplayJSON(header, secondaryText, hintTextVar, isLaunchrequest,longText) {

    if (isLaunchrequest) {
        jsonFile = './homepage.json';
    }
    else {
        if (longText) {
            jsonFile = './longText.json';
        }
        else {
            jsonFile = './regularPage.json';
        }
    }
    var out = {
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
        document: require(jsonFile),
        datasources: {
            "bodyTemplate6Data": {
                "type": "object",
                "properties": {
                    "backroundUrl": "https://s3.amazonaws.com/alexabackround/Aareon_Hintergrund_neu.jpg",
                    "headerText": "Mieter-Portal | <b>" + header + "</b>",
                    "primaryText": "",
                    "secondaryText": secondaryText,
                    "logoUrl": "",
                    "hintText": hintTextVar,
                },
            }
        }
    }
    return out;
}


function idResponseOutput(id) {
    var output = '';

    for (var i = 0; i < 3; i++) {
        output = output + id.charAt(i) + ' ';
    }
    output = output + id.charAt(3);
    return output;
}

function createId(dateObj) {
    var year = dateObj.getFullYear();
    var month = dateObj.getMonth();
    var day = dateObj.getUTCDate();
    var hours = dateObj.getHours();
    var minutes = dateObj.getMinutes();
    var seconds = dateObj.getSeconds();
    hours = parseInt(hours, 10) + 1;
    hours = hours + '';

    if (parseInt(minutes, 10) < 10) {
        minutes = '0' + minutes;
    }

    if (parseInt(hours, 10) < 10) {
        hours = '0' + hours;
    }

    var createdId = hours + '' + minutes;

    console.log('created id : ' + createdId);
    return createdId;
}

const LaunchRequestHandler =
{
    canHandle(input) {
        const request = input.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },
    handle(input) {
        console.log('started skill successfully');
        const header = 'Willkommen';
        const hintText = "Versuche: \'Alexa, was kannst du alles?\'<br/>oder 'Schadensmeldung aufnehmen!\'";
        var response = input.responseBuilder
            .speak(welcomeMessage)
            .withShouldEndSession(false)
            .addDirective(createDisplayJSON(header, '', hintText, true,false))
            .getResponse();
        console.log(JSON.stringify(response, null, 2));
        return response;
    }
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

        const object = slots.object;
        const location = slots.location;
        const state = slots.state;
        const missigLocationMessage = 'Um welchen Ort geht es?';
        const missingObjectMessage = 'Um welchen Gegenstand handelt es sich?';
        const missingStateMessage = 'Wie ist der Zustand des Objekts?';
        const noMatch = 'ER_SUCCESS_NO_MATCH';
        const header = 'Schadensmeldung'

        //if intent confirmation = denied, intent will end
        if (request.intent.confirmationStatus === 'DENIED') {
            console.log('user cancelled "SaveReport"-intent with current slot values')
            return input.responseBuilder
                .speak('Meldung wurde verworfen')
                .withShouldEndSession(undefined)
                .getResponse();
        }
        else {
            // if intent starts, first request will not be confirmed
            if (request.intent.confirmationStatus === 'NONE') {
                //maybe add: if (obj, loc, state, name..... == null)
                //checking if value property of slot exist (only exist if filled), should it exist check if valid
                //+ if not elicit slot
                if (!location.hasOwnProperty('value') || location.resolutions.resolutionsPerAuthority[0].status.code === noMatch) {
                    console.log('elicit location slot');
                    return input.responseBuilder
                        .speak(missigLocationMessage)
                        .addElicitSlotDirective('location', intent)
                        .getResponse();
                }
                else if (!object.hasOwnProperty('value') || object.resolutions.resolutionsPerAuthority[0].status.code === noMatch) {
                    console.log('elicit object slot');
                    return input.responseBuilder
                        .speak(missingObjectMessage)
                        .addElicitSlotDirective('object', intent)
                        .getResponse();
                }
                else if (!state.hasOwnProperty('value') || state.resolutions.resolutionsPerAuthority[0].status.code === noMatch) {
                    console.log('elicit state slot');
                    return input.responseBuilder
                        .speak(missingStateMessage)
                        .addElicitSlotDirective('state', intent)
                        .getResponse();
                }

                // intent confirmation requested, so next input-object's slot values aren't checked
                console.log('getting intent confirmation');
                var speechOutput = 'Möchtest du die Meldung mit den Daten: Ort '
                    + location.value + ', Objekt ' + object.value + ', Zustand '
                    + state.value + 'aufgeben?'
                return input.responseBuilder
                    .speak(speechOutput)
                    .addConfirmIntentDirective(intent)
                    .getResponse();

            }
            else {
                //try&catch to make sure all errors while trying to save data to database are caught
                try {
                    const locationId = location.resolutions.resolutionsPerAuthority[0].values[0].id;
                    const objectId = object.resolutions.resolutionsPerAuthority[0].values[0].id;
                    const stateId = state.resolutions.resolutionsPerAuthority[0].values[0].id;

                    var dateObj = new Date();
                    var year = dateObj.getFullYear();
                    var month = dateObj.getMonth();
                    var day = dateObj.getUTCDate();
                    var hours = dateObj.getHours();
                    var minutes = dateObj.getMinutes();
                    var seconds = dateObj.getSeconds();

                    var id = createId(dateObj);
                    month = parseInt(month, 10) + 1;

                    //creating id and report date, still needs to be checked for daylight savings
                    //var id = hours + '' + minutes;   //year + '' + month + '' + day + '' + hours + '' + minutes + '' + seconds; 
                    var reportDate = day + '.' + month + '.' + year;

                    //params for database call, currently only supporting last name
                    var params =
                    {
                        TableName: reportTable,
                        Item:
                        {
                            'id': id,
                            'date': reportDate,
                            'location': location.value,
                            'object': object.value,
                            'state': state.value,
                            'sop': 'Meldung aufgenommen' //sop = state of progress
                        }
                    };

                    //promise for database.put methode
                    return new Promise((resolve, reject) => {
                        docClient.put(params, function (err, data) {
                            if (err) {
                                console.error('failed to add item to database', JSON.stringify(err, null, 2));

                                const secondaryText = 'Es ist ein Fehler aufgetreten';

                                reject(input.responseBuilder
                                    .speak('Beim Aufnehmen der Meldung ist ein Fehler aufgetreten')
                                    .withShouldEndSession(undefined)
                                    .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                                    .getResponse());
                            }
                            else {
                                console.log('successfully added item to database', JSON.stringify(data, null, 2));

                                const secondaryText = 'Deine Meldung hat die Vorgangnummer: <b>' + id + '</b>';

                                resolve(input.responseBuilder
                                    .speak('Deine Meldung hat die Vorgangsnummer: ' + idResponseOutput(id))
                                    .withShouldEndSession(undefined)
                                    .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                                    .getResponse());
                            }
                        })
                    })
                }

                //catches any error the .put methode doesn't
                catch (err) {
                    console.log('caught exeption: failed to add item to database - ' + err);

                    const secondaryText = 'Es ist ein Fehler aufgetreten';

                    return input.responseBuilder
                        .speak('Beim Aufnehmen der Meldung ist ein Fehler aufgetreten caught')
                        .withShouldEndSession(undefined)
                        .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                        .getResponse();
                }
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
        console.log('started "GetDataById" intent');
        const request = input.requestEnvelope.request;
        const slots = request.intent.slots;
        const id = slots.id;
        const noMatch = 'ER_SUCCESS_NO_MATCH';
        const header = 'Bearbeitungsstatus';
        const hintTextVar = '';


        if (!id.hasOwnProperty('value')) {
            console.log('elicit id value');
            const idMissingOutput = 'Wie lautet die vierstellige Vorgangsnummer?';
            return input.responseBuilder
                .speak(idMissingOutput)
                .addElicitSlotDirective('id', request.intent)
                .getResponse();
        }
        else {
            const idInvalid = 'Ungültige Eingabe, wie lautet die vierstellige Vorgangsnummer?';
            var regEx = /^\d{4}$/;
            if (!id.value.match(regEx)) {
                console.log('id vaule does not match /^\d{4}$/ --> ' + id.value);
                return input.responseBuilder
                    .speak(idInvalid)
                    .addElicitSlotDirective('id', request.intent)
                    .getResponse();
            }
            else {

                try {
                    const idValue = id.value + '';
                    console.log('type of id.value = ' + idValue + ': ' + typeof (idValue));

                    var params =
                    {
                        TableName: reportTable,
                        Key:
                        {
                            'id': idValue,
                        },
                    };

                    return new Promise((resolve, reject) => {
                        docClient.get(params, function (err, data) {
                            if (err) {
                                console.error('failed to read data' + JSON.stringify(err, null, 2));

                                const secondaryText = 'Es ist ein Fehler aufgetreten'

                                reject(input.responseBuilder
                                    .speak('Datenbanzugriff fehlgeschlagen')
                                    .withShouldEndSession(undefined)
                                    .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                                    .getResponse());
                            }
                            else {
                                console.log('successfully read data: ' + JSON.stringify(data, null, 2));
                                if (!data.hasOwnProperty('Item')) {
                                    console.error('id not contained in database => object empty');

                                    const secondaryText = 'Keine Meldung ' + id.value + ' vorhanden';

                                    resolve(input.responseBuilder
                                        .speak('Keine Meldung unter der angegebenen Vorgangsnummer vorhanden.')
                                        .withShouldEndSession()
                                        .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                                        .getResponse());
                                }
                                else {
                                    const item = data.Item;
                                    var object = item.object;
                                    var location = item.location;
                                    var sop = item.sop;
                                    var date = item.date;
                                    var state = item.state;
                                    var speechOutput = 'Deine Schadensmeldung vom ' + date + ' mit der Vorgangsnummer '
                                        + idResponseOutput(id.value) + ' bezüglich des Ortes ' + location + ' und dem Gegenstand '
                                        + object + ', hat den Bearbeitungsstatus ' + sop + '.';

                                    const secondaryText = 'Meldung: ' + id.value + '<br/>Ort: ' + location + '<br/>Objekt: '
                                        + object + '<br/>Zustand: ' + state + '<br/>Bearbeitungsstatus: ' + sop;
                                    resolve(input.responseBuilder
                                        .speak(speechOutput)
                                        .withShouldEndSession(undefined)
                                        .addDirective(createDisplayJSON(header, secondaryText, '', false,true))
                                        .getResponse());
                                }
                            }
                        })
                    });
                }
                catch (err) {
                    console.log('caught exeption: failed to read data' + err + ' speech output crashed. id value: ' + JSON.stringify(id.value))

                    const secondaryText = 'Es it ein Fehler aufgetreten';

                    return input.responseBuilder
                        .speak('Datenbankzugriff fehlgeschlagen. Deine Meldung konnte nicht aufgerufen werden')
                        .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                        .getResponse();
                }
            }
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
        const slots = request.intent.slots;
        const id = slots.id;
        const header = 'Meldung entfernen';
        const hintTextVar = '';

        if (request.intent.confirmationStatus === 'DENIED') {
            console.log('intent cancelled by user');
            return input.responseBuilder
                .speak('Löschvorgang abgebrochen')
                .getResponse();
        }

        else if (request.intent.confirmationStatus === 'NONE') {
            const missingIdMsg = 'Wie lautet die vierstellige Vorgangsnummer?';

            if (!id.hasOwnProperty('value')) {
                console.log('id value invalid --> elicit id slot');
                return input.responseBuilder
                    .speak(missingIdMsg)
                    .addElicitSlotDirective('id', request.intent)
                    .getResponse();
            }
            else {
                var regEx = /^\d{4}$/;
                const idInvalid = 'Ungültige Eingabe. Wie lautet die vierstellige Vorgangsnummer?';
                if (!id.value.match(regEx)) {
                    console.log('id vaule does not match regEx --> id: ' + id.value);
                    return input.responseBuilder
                        .speak(idInvalid)
                        .addElicitSlotDirective('id', request.intent)
                        .getResponse();
                }
                else {
                    console.log('getting user confirmation');
                    var idOutput = idResponseOutput(id.value);
                    const intentConfirmationMsg = 'Bist du sicher, dass du die Meldung mit der Vorgangsnummer '
                        + idOutput + ' löschen möchtest?';
                    return input.responseBuilder
                        .speak(intentConfirmationMsg)
                        .addConfirmIntentDirective(request.intent)
                        .getResponse();
                }
            }
        }
        else {
            try {
                var params =
                {
                    TableName: reportTable,
                    Key:
                    {
                        'id': id.value,
                    }
                }
                return new Promise((resolve, reject) => {
                    docClient.get(params, function (err, data) {
                        if (err) {
                            console.error('failed to read data' + JSON.stringify(err, null, 2));

                            const secondaryText = 'Es ist ein Fehler aufgetreten';

                            reject(input.responseBuilder
                                .speak('Datenbanzugriff fehlgeschlagen')
                                .withShouldEndSession(undefined)
                                .addDirective(createDisplayJSON(header, secondaryText, hintTextVar))
                                .getResponse());
                        }
                        else {
                            console.log('successfully read data: ' + JSON.stringify(data, null, 2));

                            const secondaryText = 'Keine Meldung vorhanden';

                            if (!data.hasOwnProperty('Item')) {
                                console.error('id not contained in database => object empty');
                                resolve(input.responseBuilder
                                    .speak('Es ist keine Meldung unter der angegebenen Vorgangsnummer vorhanden.')
                                    .withShouldEndSession()
                                    .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                                    .getResponse());
                            }
                            else {
                                docClient.delete(params, function (err, data) {
                                    if (err) {
                                        console.log("failed to delete item from database", JSON.stringify(err, null, 2));

                                        const secondaryText = 'Es ist ein Fehler aufgetreten';

                                        reject(input.responseBuilder
                                            .speak('Beim Löschen der Meldung ist ein Fehler aufgetreten')
                                            .withShouldEndSession(undefined)
                                            .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                                            .getResponse());
                                    }
                                    else {
                                        console.log('successfully deleted ' + id + ' from database', JSON.stringify(data, null, 2));

                                        const secondaryText = 'Die Meldung ' + id.value + ' wurde zum Löschen markiert';

                                        resolve(input.responseBuilder
                                            .speak('Die Meldung wurde zum Löschen markiert. Du wirst informiert, so bald die Meldung endgültig gelöscht wurde.')
                                            .withShouldEndSession(undefined)
                                            .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                                            .getResponse());
                                    }
                                })
                            }
                        }
                    })
                })
            }
            catch (err) {
                console.error('caugth exception ' + err + ' failed to delete or access database');

                const secondaryText = 'Es ist ein Fehler aufgetreten';

                return input.responseBuilder
                    .speak('Beim Zugriff auf die Datenbank ist etwas schiefgelaufen')
                    .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
                    .getResponse();
            }
        }
    }
};

/*const IntentInfoHandler =
{
    canHandle(input) {
        const request = input.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'IntentInfo'
    },
    handle(input) {
        const request = input.requestEnvelope.request;
        const slots = request.intent.slots;

        if (!slots.moreInfo.hasOwnProperty('value') || (slots.moreInfo.value != 'no')) {
            if (slots.intent.value == null) {
                console.log('wait for user input regarding intent info')
                return input.responseBuilder
                    .speak('Zum welcher Funktion möchtest du mehr erfahren?')
                    .addElicitSlotDirective('moreInfo', request.intent)
                    .getResponse();
            }
            else {
                var intent = slots.intent.value;

                if (intent === 'löschen') {
                    console.log('user requested info regarding the delete intent');
                    request.intent.slots.intent.value = null;
                    return input.responseBuilder
                        .speak(deleteIntentInfo)
                        .addElicitSlotDirective('moreInfo', request.intent)
                        .getResponse();
                }
                else if (intent === 'Bearbeitungsstatus') {
                    console.log('user requested info regarding the getData Intent');
                    request.intent.slots.intent.value = null;
                    return input.responseBuilder
                        .speak(getDataIntentInfo)
                        .addElicitSlotDirective('moreInfo', request.intent)
                        .getResponse();
                }
                else if (intent === 'aufnehmen') {
                    console.log('user requested info regarding the saveData Intent');
                    request.intent.slots.intent.value = null;
                    return input.responseBuilder
                        .speak(saveIntentInfo)
                        .addElicitSlotDirective('moreInfo', request.intent)
                        .getResponse();
                }
                else {
                    console.log('user stopped info request - no option');
                    return input.responseBuilder
                        .speak('Ok')
                        .withShouldEndSession(false)
                        .getResponse();
                }
            }
        }
        else {
            console.log('user stopped info request - no more info slot');
            return input.responseBuilder
                .speak('Ok')
                .withShouldEndSession(false)
                .getResponse();
        }
    }
};*/


const MaintenancemanHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'Maintenanceman';
    },
    handle(input) {
        const header = 'Hausmeister';
        const secondaryText = 'Herr Krause, Tel. 081004355<br/>Mon.-Fr. 9-17 Uhr';

        return input.responseBuilder
            .speak("Dein Hausmeister heißt Herr Krause und ist wochentags von 9 bis 17 Uhr unter der Nummer 0, 8, 1, 0, 0, 4, 3, 5, 5, erreichbar")
            //.withsimpleCard(SKILL_NAME, "Der Hausmeister Heißt Herr Krause und ist Wochentags von 9 bis 17 Uhr unter der Nummer 08100 ereichbar")
            .withShouldEndSession(undefined)
            .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
            .getResponse();
    },
};

const BinCollectionHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'BinCollection';
    },
    handle(input) {
        const header = 'Müllabholung';
        const secondaryText = 'Der Müll wird jeden Donnerstag Vormittag abgeholt'

        return input.responseBuilder
            .speak("Der Müll wird jeden Donnerstag Vormittag abgeholt")
            //.withsimpleCard(SKILL_NAME, "Der Müll wird immer Donnerstags Vormittags abgeholt")
            .withShouldEndSession(undefined)
            .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
            .getResponse();
    },
};

const OfficalHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'Offical';
    },
    handle(input) {
        const header = 'Sachbeareiter';
        const secondaryText = 'Herr Meier, Tel. 081004350';

        return input.responseBuilder
            .speak(`Der Name deines zuständigen Sachbearbeiters ist Herr Meier, er ist unter der Nummer 0, 8, 1, 0, 0, 4, 3, 6, 0, erreichbar`)
            //.withsimpleCard(SKILL_NAME, "Ihr zuständiger Sachbearbeiter heißt Herr Meier")
            .withShouldEndSession(undefined)
            .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
            .getResponse();
    },
};

const ElectricitymeterHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'Electricitymeter';
    },
    handle(input) {
        const header = 'Strom ablesen';
        const secondaryText = 'Der Strom wird am 17.12.2018 abgelesen';

        return input.responseBuilder
            .speak("Der Strom wird das nächste Mal am Montag den 17.12.2018 abgelesen")
            //.withsimpleCard(SKILL_NAME, "Der Strom wird in 2018 am Montag den 17.12. abgelesen")
            .withShouldEndSession(undefined)
            .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
            .getResponse();
    },
};

const NewInformationHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'NewInformation';
    },
    handle(handlerInput) {
        const header = 'Neue Informationen';
        const secondaryText = '03.12.2018, 10-13 Uhr, Wartungsarbeiten am Aufzug';

        return handlerInput.responseBuilder
            .speak("Es liegt aktuell eine neue Information vor: nächste Woche Montag, den 03.12.2018, ist der Aufzug von 10 bis 13 Uhr wegen Wartungsarbeiten außer Betrieb")
            .withSimpleCard("Mieter Portal", "Nächste Woche Montag, den 03.12.2018 ist der Aufzug von 10 bis 13 Uhr wegen Wartungsarbeiten außer Betrieb")
            .withShouldEndSession(undefined)
            .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
            .getResponse();
    },
};

const TenancyAgreementHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'TenancyAgreement';
    },
    handle(input) {
        const header = 'Mietbescheinigung';
        const secondaryText = 'Mietbescheinigung ist in wenigen Minuten in der Postbox im Mieter-Portal verfügbar';

        return input.responseBuilder
            .speak("Deine Mietbescheinigung wird erstellt und ist in wenigen Minuten in der Post Box im Wohnbau Mieter Portal verfügbar")
            .addDirective(createDisplayJSON(header, secondaryText, '', false,false))
            .getResponse();
    },
};

const WhatDoYouDoHandler = {
    canHandle(input) {
        const request = input.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'WhatDoYouDo';
    },
    handle(input) {
        const header = 'Funktionen';
        const secondaryText = 'Schadensmeldung aufnehmen, Status abfragen, '
            + 'Sachbearbeiter/Hausmeister erfragen, Ablesetermin des Stroms erfragen, '
            + 'Neue Informationen des Vermieters, Mülllehrungsdatum, Mietbescheinigung anfordern';

        return input.responseBuilder
            .speak(WhatDoYouDoMessage)
            .addDirective(createDisplayJSON(header, secondaryText, '', false,true))
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
        //IntentInfoHandler,
        OfficalHandler,
        ElectricitymeterHandler,
        MaintenancemanHandler,
        BinCollectionHandler,
        NewInformationHandler,
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler,
        TenancyAgreementHandler,
        WhatDoYouDoHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
