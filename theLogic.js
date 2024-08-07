const { execSync } = require('child_process');
const os = require('os');
const schedule = require('node-schedule');
const axios = require('axios');
const https = require('https');

let credentials = {
    username: "",
    password: "",
    loginTime: 0
};

async function isIntendedWiFiNetwork() {
    try {
        let response = await axios.get(`${FIREWALL_URL}/login?logiccccc`);
        return response.status >= 200 && response.status < 300;
    } catch (error) {
        console.error('Error checking intended WiFi network:', error.message);
        return false;
    }
}

async function signInIfRequired() {
    let isIntendedNetwork = await isIntendedWiFiNetwork();
    if (isIntendedNetwork) {
        try {
            let response = await axios.get(GENERATE_204_URL);
            if (response.status !== 204) {
                await signIn();
            }
        } catch (error) {
            console.error('Error during sign-in check:', error.message);
            await signIn();
        }
    } else {
        console.log('Not connected to the intended network.');
    }
}

async function signIn() {
    if (credentials.password.length === 0) {
        console.log("Credentials not set");
        return;
    }

    try {
        let loginPage = await getLoginPage();
        let magic = await getMagic(loginPage);
        let loginUrls = await doLogin(magic, credentials.username, credentials.password);
        await keepAlive(loginUrls.keepaliveURL);
        updateLoginTime(Date.now());
    } catch (error) {
        console.error("Error during sign-in:", error.message);
    }
}

async function getLoginPage() {
    try {
        let response = await axios.get(`${FIREWALL_URL}/logout`);
        let httpMatch = response.data.match(/http[^"]*/);
        if (httpMatch) {
            return httpMatch[0];
        } else {
            throw new Error('Login page URL not found');
        }
    } catch (error) {
        throw new Error(`Error in getLoginPage: ${error.message}`);
    }
}

async function getMagic(loginPage) {
    try {
        let response = await axios.get(loginPage);
        let magicMatch = response.data.match(/"magic" value="([^"]*)"/);
        if (magicMatch && magicMatch[1]) {
            return magicMatch[1];
        } else {
            throw new Error('Magic value not found');
        }
    } catch (error) {
        throw new Error(`Error in getMagic: ${error.message}`);
    }
}

async function doLogin(magic, username, password) {
    try {
        let requestBody = `username=${username}&password=${password}&magic=${magic}&submit=Continue`;
        let response = await axios.post(FIREWALL_URL, requestBody, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        let logoutMatch = response.data.match(/http[^"]*logout[^"]*/);
        let keepaliveMatch = response.data.match(/http[^"]*keepalive[^"]*/);
        return {
            logoutURL: logoutMatch ? logoutMatch[0] : null,
            keepaliveURL: keepaliveMatch ? keepaliveMatch[0] : null
        };
    } catch (error) {
        throw new Error(`Error in doLogin: ${error.message}`);
    }
}

async function keepAlive(url) {
    console.log("Keepalive URL is", url);
    const delay = 10000;

    const attemptKeepAlive = async () => {
        try {
            let response = await axios.get(url, {
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            });
            if (response.data.includes('leave it open')) {
                console.log('Keepalive successful');
                setTimeout(attemptKeepAlive, delay);
            } else {
                console.log('Keepalive unsuccessful; Trying to get login screen');
            }
        } catch (error) {
            console.error('Error during keepalive:', error.message);
            setTimeout(attemptKeepAlive, delay);
        }
    };

    attemptKeepAlive();
}

function updateLoginTime(time) {
    credentials.loginTime = time;
    console.log("Login time updated to:", time);
}

async function doAuthentication() {
    await signInIfRequired();
}

function runScript(username, password) {
    credentials.username = username;
    credentials.password = password;

    const minuteRule = new schedule.RecurrenceRule();
    minuteRule.second = 0;
    const job = schedule.scheduleJob(minuteRule, doAuthentication);

    job.on('error', (err) => {
        console.error('Error:', err);
    });
}

module.exports = runScript;
