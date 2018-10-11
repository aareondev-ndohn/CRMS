const askSDK = require('ask-sdk');
const askSDKCore = require('ask-sdk-core');
const askSDKDynamodbAdap = require('ask-sdk-dynamodb-persistence-adapter');
const askSDKModel = require('ask-sdk-model');
const askSDKS3Adap = require('ask-sdk-s3-persistence-adapter');
const askSDKV1Adap = require('ask-sdk-v1adapter');
const awsSDK = require('aws-sdk');
const util = require('util');
const promisify = util.promisify;

/*
awsSDK.config.update({
  region: "us-east-1" // or whatever region your lambda and dynamo is
  });
*/

const appId = 'amzn1.ask.skill.321b1888-e044-405d-9848-64ebc116c15e';
const recipesTable = '';
const docClient = new awsSDK.DynamoDB.DocumentClient(); // evtl.: AWS.DynamoDB.DocumentClient();

// convert callback style functions to promises
const dbScan = promisify(docClient.scan, docClient);
const dbGet = promisify(docClient.get, docClient);
const dbPut = promisify(docClient.put, docClient);
const dbDelete = promisify(docClient.delete, docClient);

const instructions = `Hallo, willkommen in Ihrem CRMS-Portal. 
                      Wollen sie eine Schadensmeldung aufnehmen oder den Status einer Meldung abfragen?`;

const handlers = 
{

    ///Triggered when the user says "Alexa, open Recipe Organizer.
    'LaunchRequest'()
    {
        this.emit(':ask', instructions);
    },
    /**Adds a damage report to the database
     * Slots: Vorname, Nachname, Raum, Objekt, Zustand
     */
    'OpenDamageReport'()
    {
        const { userId } = this.event.session.user;
        const { slots } = this.event.request.intent;
        
        // prompt for slot values an request a confirmation for each

        //Vorname
        if(!slot.Vorname.value)
        {
            const slotToElicit = 'Vorname';
            const speechOutput = 'Wie ist dein Vorname?';
            const repromptSpeech = 'Bitte gebe deinen Vornamen an!';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }
        else if (slots.Vorname.confirmationStatus !== 'CONFIRMED')
        {
            if(slots.Vorname.confirmationStatus !== 'DENIED')
            {
                //slot status: unconfirmed
                const slotToConfirm = 'Vorname';
                const speechOutput = `Dein Vorname lautet ${slots.Vorname.value}. Ist das richtig?`;
                const repromptSpeech = speechOutput;
                return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
            }

            //slot status: denied -> reprompt for slot data
            const slotToElicit = 'Vorname';
            const speechOutput = 'Wie ist dein Vorname?';
            const repromptSpeech = 'Bitte gebe deinen Vornamen an';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }

        //Nachname
        if(!slot.Nachname.value)
        {
            const slotToElicit = 'Nachname';
            const speechOutput = 'Wie ist dein Nachname?';
            const repromptSpeech = 'Bitte gebe deinen Nachnamen an!';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }
        else if (slots.Nachname.confirmationStatus !== 'CONFIRMED')
        {
            if(slots.Nachname.confirmationStatus !== 'DENIED')
            {
                //slot status: unconfirmed
                const slotToConfirm = 'Nachname';
                const speechOutput = `Dein Nachname lautet ${slots.Vorname.value}. Ist das richtig?`;
                const repromptSpeech = speechOutput;
                return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
            }

            //slot status: denied -> reprompt for slot data
            const slotToElicit = 'Nachname';
            const speechOutput = 'Wie ist dein Nachname?';
            const repromptSpeech = 'Bitte gebe deinen Nachnamen an';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }

        //Raum
        if(!slot.Vorname.value)
        {
            const slotToElicit = 'Raum';
            const speechOutput = 'In welchem Ort liegt der Schaden vor?';
            const repromptSpeech = 'Bitte gebe den Ort an, in dem sich der Schaden befindet';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }
        else if (slots.Raum.confirmationStatus !== 'CONFIRMED')
        {
            if(slots.Raum.confirmationStatus !== 'DENIED')
            {
                //slot status: unconfirmed
                const slotToConfirm = 'Raum';
                const speechOutput = `Der Ort des Schadens ist ${slots.Raum.value}. Ist das richtig?`;
                const repromptSpeech = speechOutput;
                return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
            }

            //slot status: denied -> reprompt for slot data
            const slotToElicit = 'Raum';
            const speechOutput = 'An welchem Ort ist der Schaden aufgetreten?';
            const repromptSpeech = 'Bitte gebe den Ort des Schadens an';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }

    
        //Objekt
        if(!slot.Objekt.value)
        {
            const slotToElicit = 'Objekt';
            const speechOutput = 'Welches Objekt ist beschädigt?';
            const repromptSpeech = 'Bitte gebe den Gegenstand an, der beschädigt ist.';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }
        else if (slots.Objekt.confirmationStatus !== 'CONFIRMED')
        {
            if(slots.Objekt.confirmationStatus !== 'DENIED')
            {
                //slot status: unconfirmed
                const slotToConfirm = 'Objekt';
                const speechOutput = `Das beschädigte Objekt ist ${slots.Objekt.value}. Ist das richtig?`;
                const repromptSpeech = speechOutput;
                return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
            }

            //slot status: denied -> reprompt for slot data
            const slotToElicit = 'Objekt';
            const speechOutput = 'Welches Objekt ist beschädigt?';
            const repromptSpeech = 'Bitte gebe den beschädigten Gegenstand an!';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }
        
        //Zustand
        if(!slot.Zustand.value)
        {
            const slotToElicit = 'Zustand';
            const speechOutput = 'In welchem Zustand befindet sich das Objekt?';
            const repromptSpeech = 'Wie ist der Zustand des Gegenstandes?';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }
        else if (slots.Zustand.confirmationStatus !== 'CONFIRMED')
        {
            if(slots.Zustand.confirmationStatus !== 'DENIED')
            {
                //slot status: unconfirmed
                const slotToConfirm = 'Zustand';
                const speechOutput = `Der Zustand des Objekts ist ${slots.Zustand.value}. Ist das richtig?`;
                const repromptSpeech = speechOutput;
                return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
            }

            //slot status: denied -> reprompt for slot data
            const slotToElicit = 'Zustand';
            const speechOutput = 'In welchem Zustand befindet sich das Objekt?';
            const repromptSpeech = 'Wie ist der Zustand des Gegenstandes?';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }
    
        // all slot values received and confirmed, now add the record to DynamoDB

/**     const name = slots.RecipeName.value;
        const location = slots.RecipeLocation.value;
        const isQuick = slots.LongOrQuick.value.toLowerCase() === 'quick';
        const dynamoParams = {
        TableName: recipesTable,
        Item: {
            Name: name,
            UserId: userId,
            Location: location,
            IsQuick: isQuick
        }
        };

        const checkIfRecipeExistsParams = {
        TableName: recipesTable,
        Key: {
            Name: name,
            UserId: userId
        }
        };




        
        console.log('Attempting to add report', dynamoParams);

        // query DynamoDB to see if the item exists first
        dbGet(checkIfRecipeExistsParams)
        .then(data => {
            console.log('Get item succeeded', data);

            const recipe = data.Item;

            if (recipe) {
            const errorMsg = `Recipe ${name} already exists!`;
            this.emit(':tell', errorMsg);
            throw new Error(errorMsg);
            }
            else {
            // no match, add the recipe
            return dbPut(dynamoParams);
            }
        })
        .then(data => {
            console.log('Add item succeeded', data);

            this.emit(':tell', `Recipe ${name} added!`);
        })
        .catch(err => {
            console.error(err);
        });
*/
          
    },

    /** Outputs the status of the requested damage report 
     * Slots: 
    */
    'GetStatus'()
    {
        const { userId } = this.event.session.user;
        const { slots } = this.event.request.intent;
        let output;

        //prompt for slot data if needed
        if(!slots.Vorname.value){
            const slotToElicit = 'Vorname';
            const speechOutput = 'Wie lautet dein Vorname?';
            const repromptSpeech = 'Bitte gebe deinen Vornamen an!';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech)
        }
        else if(!slots.Nachname.value){
            const slotToElicit = 'Nachname';
            const speechOutput = 'Wie lautet dein Nachname?';
            const repromptSpeech = 'Bitte gebe deinen Nachnamen an!';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech)
        }

        const vorname = slots.Vorname.value;
        const dynamoParams = {
TODO:
            TableName: XXX,
            Key: 
            {
                Name: XXX,
                UserId: XXX
            }
        };
TODO:
        console.log('Attempting to read data');

        // query DynamoDB
        dbGet(dynamoParams)
        .then(data => {
        console.log('Get item succeeded', data);

        const recipe = data.Item;

        if (recipe) 
        {
            this.emit(':tell', `Recipe ${recipeName} is located in ${recipe.Location} and it
                        is a ${recipe.IsQuick ? 'Quick' : 'Long'} recipe to make.`);
        }
        else 
        {
            this.emit(':tell', `Recipe ${recipeName} not found!`);
        }
        })
        .catch(err => console.error(err));


    },

    'Unhandled'()
    {
        console.error('problem', this.event);
        this.emit('ask:','An unhandled problem occurred!');
    },

    'AMAZON.HelpIntent'(){
        const speechOutput = instructions;
        const reprompt = instructions;
        this.emit(':ask', speechOutput, reprompt);
    },

    'AMAZON.CancelIntent'(){
        this.emit(':tell', 'Auf Wiedersehen!');
    },

    'AMAZON.StopIntent'() {
        this.emit(':tell', 'Auf Wiedersehen!');
    }
};

exports.handler = function handler(event, context){
    const ask = askSDK.handler(event, context);
    ask.APP_ID = appId;
    ask.registerHandlers(handlers);
    ask.execute();
}; 

//TEST
