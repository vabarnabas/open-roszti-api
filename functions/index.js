const functions = require("firebase-functions");
const express = require('express');
var cors = require('cors')
const { google } = require('googleapis')
const app = express();

app.use(cors())

app.get('/users/:code', async (req, res) => {
    const { code } = req.params;

    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({version: 'v4', auth: client});
    const spreadsheetId = '1YtZ4Fin2Ew7oR0INP4Ol8sdvolr565s8uqQdN_yd5eQ';

    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'RÖszTI Kódok'
    })

    const resArray = getRows.data.values
    const pos = resArray.map((e) => {return e[1]}).indexOf(code.toUpperCase());
    const user = resArray[pos];

    const object = {
        name: user[0],
        code: user[1],
        email: user[2]
    }

    res.send(object);
});

app.get('/users/data/:code', async (req, res) => {
    const { code } = req.params;
    const range = req.query.range;

    if (!range) {
        res.status(400).send({message: "Missing argument from request query!"});
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({version: 'v4', auth: client});
    const spreadsheetId = '1YtZ4Fin2Ew7oR0INP4Ol8sdvolr565s8uqQdN_yd5eQ';

    const getCodeRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'RÖszTI Kódok'
    })

    const codeArray = getCodeRows.data.values
    const pos = codeArray.map((e) => {return e[1]}).indexOf(code.toUpperCase());
    if (pos === -1) {
        res.status(404).send({message: "No user was found with this code!"});
    }
    const user = codeArray[pos];
    const name = user[0];

    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: range,
    })

    const reqArray = getRows.data.values

    let resArray = [];

    for (let i = 1; i < reqArray.length; i++) {
        const current = reqArray[i];
        if (current?.[1] !== undefined) {
            const nameArray = current[1].split('; ');
            const pointArray = current[2].split('; ');
            if(nameArray.indexOf(name) !== -1) {
                resArray.push({
                    event: current[0],
                    point: pointArray[nameArray.indexOf(name)]
                })
            }
        }
    }

    res.send(resArray);
});

app.post('/users/add', async (req, res) => {
    const name = req.query.name;
    const mail = req.query.mail;

    if (!name  || !mail) {
        res.status(400).send({message: "Missing argument from request query!"});
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({version: 'v4', auth: client});
    const spreadsheetId = '1YtZ4Fin2Ew7oR0INP4Ol8sdvolr565s8uqQdN_yd5eQ';

    const getCodeRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'RÖszTI Kódok!B:B'
    })

    const codeArray = getCodeRows.data.values

    const createCode = () => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < 4; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
            // console.log('a' + characters.charAt(Math.floor(Math.random() * charactersLength)))
        }
        result += Math.floor(Math.random() * (99 - 10) + 10);

        return result
    }

    let code = createCode();

    while (codeArray.indexOf(code) !== -1) {
        code = createCode()
    }

    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'RÖszTI Kódok',
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [
                [name, code, mail]
            ]
        }
    })
    res.send({
        message: `${name} was created with the address ${mail} and code ${code}`
    })
})

app.listen(1337, (req, res) => console.log('running'))

exports.app = functions.https.onRequest(app);

