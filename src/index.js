const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const fs = require('fs');
const readline = require('readline');

const { Observable, Subject, ReplaySubject, Subscriber, from, of, range } = require('rxjs');
const { map, filter, switchMap } = require('rxjs/operators');
const EventEmitter = require('events').EventEmitter;
const {google} = require('googleapis');

// If modifying these scopes, delete credentials.json.
const client_secret = {
    "client_id":"873814976098-98ghlbcm0ods65g3g9mdk206tj9q7tmr.apps.googleusercontent.com",
    "project_id":"utility-trees-206617",
    "auth_uri":"https://accounts.google.com/o/oauth2/auth",
    "token_uri":"https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
    "client_secret":"5ZZLLVKZLjAxZGT15UY9XCgM",
    "redirect_uris":["https://api.xn----8sbbjja5bllzqb9i.xn--p1ai:4443/oauthcallback"]
};

const SCOPES = ['https://mail.google.com/'];
const TOKEN_PATH = 'src/credentials.json';

const app = express();
const router = express.Router();
const server = https.createServer({
    key: fs.readFileSync('/root/landing-bot/cert/privkey.key'),
    cert: fs.readFileSync('/root/landing-bot/cert/cert.crt'),
    ca: fs.readFileSync('/root/landing-bot/cert/chain.crt')
}, app);

class AuthCallback extends EventEmitter {
    constructor(code = '') {
        super();

        this.code = code;
        this.eventNames = ['code'];
    }

    setCode(code) {
        this.code = code;
        this.emit(this.eventNames[0], this.code);
    }
}

const authCallback = new AuthCallback();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

router.get('/oauthcallback', (req, res) => {
    authCallback.setCode(req.query.code);
});

app.use(router);

server.listen(4443, () => {

    // Load client secrets from a local file.
    fs.readFile('src/configuration/client_secret.json', (err, secret) => {
        if(err) {
            return err;
        }

        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(secret), update);
    });

    

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
        const {client_secret, client_id, redirect_uris} = credentials;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if(err) {
                return getNewToken(oAuth2Client, callback);
            }

            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    function getNewToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            include_granted_scopes: true,
            prompt: 'consent'
        });

        console.log('Authorize this app by visiting this url:', authUrl);

        authCallback.on('code', (code) => {
            oAuth2Client.getToken(code, (err, token) => {
                if(err) {
                    return callback(err);
                }

                oAuth2Client.setCredentials(token);

                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) {
                        return console.error(err);
                    }

                    console.log('Token stored to', TOKEN_PATH);
                });

                callback(oAuth2Client);
            });
        })
    }

    /**
     * Update gmail data.
     *
     * @param {google.auth.OAuth2} oAuth2Client An authorized OAuth2 client.
     */

    async function update(oAuth2Client) {
        const gmail = google.gmail({
            version: 'v1',
            auth: oAuth2Client
        });

        const profile = await gmail.users.getProfile({
            userId: 'me'
        });

        const messages = await gmail.users.messages.list({
            userId: 'me'
        });

        console.log({
            profile: profile.data,
            messages: messages.data
        });
    }
});

/**
 * Subscribe to user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

/* async function subscribe(auth) {
    await google.options({ auth: auth });

    const gmail = await google.gmail({
        version: 'v1',
        auth: auth
    });

    let refreshToken = await auth.refreshTokenNoCache(auth.credentials.refresh_token);
    let metaData = await auth.refreshAccessToken();
    console.log(refreshToken);
    console.log(metadata);

    const watch1 = await gmail.users.watch({
        auth: google.auth.User,
        userId: 'me',
        requestBody: {
            labelIds: ['INBOX'],
            topicName: 'projects/utility-trees-206617/topics/q123'
        }
    });
    
    console.log(gmail);
    console.log(watch1);


    let watch = await gmail.users.watch({
        auth: auth,
        userId: 'me',
        requestBody: {
            labelIds: ['INBOX'],
            topicName: 'projects/utility-trees-206617/topics/q123'
        }
    });

    console.log(watch);

    try {
        
        
        
        let user = await gmail.users.getProfile({ 
            userId: 'me'
        });

        if(user.status != 200) {
            return 'Error: ' + user.statusText;
        }

        console.log(user.data);

        let subscribtion = await gmail.users.watch({ userId: 'me', requestBody: {
            labelIds: ['INBOX'],
            topicName: 'projects/utility-trees-206617/topics/q123'
        }});

        console.log(subscribtion.data);
    } catch(err) {
        console.log(err);
    }
} */
