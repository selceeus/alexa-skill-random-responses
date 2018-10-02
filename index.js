const Alexa = require('alexa-sdk');
const mess = require('./messages');
const func = require('./functions');
const APPID = '(app id)';

//Local testing console command -- use event.json for requests
//testing: lambda-local -l index.js -h handler -e event.json

exports.handler = function ( event, context, callback ) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APPID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

//Feed Endpoint
const url = "(website endpoint)";

const handlers = {
    'LaunchRequest': function () {
        let randomLaunchMessage = mess.launch[ func.randProp( mess.launch ) ];
        this.emit(":ask", randomLaunchMessage, mess.report.helpRepromt );
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', mess.report.helpTell, mess.report.helpRepromt);
    },
    'AMAZON.StopIntent': function () {
        let randomEndMessage = mess.end[ func.randProp( mess.end ) ];
        this.emit(":tell", randomEndMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit('AMAZON.StopIntent');
    },
    'SessionEndedRequest': function () {
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        this.emit('AMAZON.HelpIntent');
    },
    //List Tip Categories
    'ListOptions': function () {

        //Build tip count for each tip 
        //Output information
        
        func.getEndpoint( url, ( response ) => {
            if ( response.length <= 0 ) {
                analytics.track( this.event.session, "TipMissingFeed", tipRequest, mess.report.statusError, ( error, response ) => {
                    this.emit(":ask", mess.report.statusError, mess.report.helpRepromt );
                });
            } else {

                let availTips = ['random'];

                Object.keys( response.acf ).forEach( function( key ) {
                    if ( response.acf[key] != false) {
                        availTips.push( key.split('_')[0]  );
                    }
                }); 
                
                analytics.track( this.event.session, "AvailableTipCategories", area, areaResponse, (error, response) => {
                    this.emit(":ask", areaResponse, areaReprompt);
                });
            }
        });

    },
    //Get the Tip
    'GetTip': function () {

        func.getEndpoint( url, ( response ) => {

            let action      = func.resolveEnt( this.event.request.intent.slots.actionWord );
            let tipRequest  = func.resolveEnt( this.event.request.intent.slots.tipType );

            console.log( tipRequest );

            if ( response.length <= 0 ) {
                this.emit(":ask", mess.report.statusError, mess.report.helpRepromt );
            } else if ( tipRequest === undefined) {
                    this.emit(":ask", mess.report.helpTell, mess.report.helpRepromt );
            } else {

                //Get Available Tip categories that != false in Feed plus random slot

                let availTips = ['random'];

                Object.keys( response.acf ).forEach( function( key ) {
                    if ( response.acf[key] != false) {
                        availTips.push( key.split('_')[0]  );
                    }
                });

                let tipValue = availTips.includes( tipRequest );

                if ( tipValue === true ) {

                    if ( tipRequest === "random" ) {

                        let randomKey       = Math.floor( Math.random() * availTips.length );
                        let randomSlot      = availTips[randomKey].split(' ').join('_');
                        let randArrayIndex  = Math.floor( Math.random() * response.acf[ randomSlot+'_tips'].length );
                        let randSponsorTar  = response.acf[ randomSlot+'_tips'][randArrayIndex][randomSlot+'_tip_sponsor'];
                        let randIntentTar   = response.acf[ randomSlot+'_tips'][randArrayIndex][randomSlot+'_tip'];
                        let audioTarget     = func.buildAudio( randSponsorTar, randIntentTar );

                        // Build Card
                        let cardInfo        = func.cardInfo( tipRequest );
                        let cardErrorVoice  = func.cardErrorVoice( tipRequest );
                        let cardErrorText   = func.cardErrorText( tipRequest );
                            
                            this.emit(":askWithCard", audioTarget, mess.report.afterTipAsk, mess.card.cardTitle, cardInfo, mess.image );
                    } else {

                        let keyFromSlot     = tipRequest.split(' ').join('_');
                        let randArrayIndex  = Math.floor( Math.random() * response.acf[ keyFromSlot+'_tips'].length );
                        let sponsorTarget   = response.acf[ keyFromSlot+'_tips'][randArrayIndex][keyFromSlot+'_tip_sponsor'];
                        let intentTarget    = response.acf[ keyFromSlot+'_tips'][randArrayIndex][keyFromSlot+'_tip'];
                        let audioTarget     = func.buildAudio( sponsorTarget, intentTarget );

                        // Build Card
                        let cardInfo        = func.cardInfo( tipRequest );
                        let cardErrorVoice  = func.cardErrorVoice( tipRequest );
                        let cardErrorText   = func.cardErrorText( tipRequest );

                            this.emit(":askWithCard", audioTarget, mess.report.afterTipAsk, mess.card.cardTitle, cardInfo, mess.image );
                    }                    
                } else {

                        this.emit(":ask", mess.report.helpTell, mess.report.helpRepromt );
                }
            }
        });
    }
};