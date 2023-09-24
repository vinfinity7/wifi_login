// const { execSync } = require('child_process');
const { app } = require('electron');
const os = require('os');
const firewall_url = "http://192.168.249.1:1000";
const schedule = require('node-schedule');
const axios = require('axios');
// const util = require('util');
// const network = require('network');

function runScript(arg1, arg2) {
  const rollno = arg1;
  const pass_ik = arg2;


  // let interface;

  // if (os.platform() === 'win32') {
  // Windows  [not handled for ethernet now]
  //   interface = execSync("(ipconfig | Select-String -Pattern '\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b' | ForEach-Object { $_.Matches.Value })[3]").toString().trim();
  // } else if (os.platform() === 'linux') {
  //   // Linux
  //   interface = execSync(" ip route | grep '^default' | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}'", { encoding: 'utf8' }).trim();
  // }
  // else if (os.platform() === 'darwin') {
  //   // macOS
  //   interface = execSync("route -n get default | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}'", { encoding: 'utf8' }).trim();
  // }
  // try {
  //   const getActiveNetworkInterface = async () => {
  //     const getActiveInterfacePromise = util.promisify(network.get_active_interface);
    
  //     try {
  //       const obj = await getActiveInterfacePromise();
  //       console.log(obj);
  //       return obj;
  //     } catch (error) {
  //       console.error('Error:', error);
  //       throw error;
  //     }
  //   };
  // }
  // catch {
  //   console.error("Doesn't support your OS!");
  //   process.exit(1);
  // }

  // function get_login_page() {
  //   let output;
  //   if (os.platform() === 'win32') {
  //     output = execSync(
  //       `powershell.exe -command "Invoke-RestMethod -Uri ${firewall_url}/logout?"`,
  //       { encoding: 'utf8' }
  //     );
  //   } else {

  //     output = execSync(
  //       `curl --silent --interface "${interface}" -k "${firewall_url}/logout?"`,
  //       { encoding: 'utf8' }
  //     );
  //   }

  //   const httpMatch = output.match(/http[^"]*/);
  //   if (httpMatch) {
  //     return httpMatch[0];
  //   } else {
  //     throw new Error('Login page URL not found');
  //   }

  // }

  async function logout() {
    const logoutURL = firewall_url + "/logout?q=name"
    await axios.get(logoutURL)
  }

  async function get_login_page() {
    try {
      let response;
      if (os.platform() === 'win32') {
        response = await axios.get(`${firewall_url}/logout`);

      } else {
        response = await axios.get(`${firewall_url}/logout`, {
          httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Only if you have SSL issues
        });
      }
      const httpMatch = response.data.match(/http[^"]*/);
      if (httpMatch) {
        return httpMatch[0];
      } else {
        throw new Error('Login page URL not found');
      }

    } catch (error) {
      throw new Error(`Error in get_login_page: ${error.message}`);
    }
  }


  // function get_magic(login_page, interfaceName) {
  //   let output;
  //   if (os.platform() === 'win32') {
  //     const command = `powershell.exe -command "Invoke-RestMethod -Uri ${login_page}"`;
  //     output = execSync(command, { encoding: 'utf8' });
  //   } else {

  //     const command = `curl --silent --interface "${interfaceName}" -k "${login_page}"`;
  //     output = execSync(command, { encoding: 'utf8' });
  //   }


  //   const magicMatch = output.match(/"magic" value="([^"]*)"/);
  //   if (magicMatch && magicMatch[1]) {
  //     return magicMatch[1];
  //   } else {
  //     throw new Error('Magic value not found');
  //   }
  // }

  async function get_magic(login_page) {
    try {
      let response;
      if (os.platform() === 'win32') {
        response = await axios.get(login_page);
      } else {
        response = await axios.get(login_page, {
          httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Only if you have SSL issues
        });
      }
      const magicMatch = response.data.match(/"magic" value="([^"]*)"/);
      if (magicMatch && magicMatch[1]) {
        return magicMatch[1];
      } else {
        throw new Error('Magic value not found');
      }

    } catch (error) {
      throw new Error(`Error in get_magic: ${error.message}`);
    }
  }


  // function do_login(magic, username, password, firewall_url, interfaceName) {
  //   let output;
  //   if (os.platform() === 'win32') {

  //     const requestBody = {
  //       username: username,
  //       password: password,
  //       magic: magic,
  //       submit: 'Continue',
  //     };

  //     const requestOptions = {
  //       method: 'POST',
  //       uri: firewall_url,
  //       body: requestBody,
  //       json: true,
  //     };


  //     output = request(requestOptions);
  //   } else {

  //     const command = `curl -k --interface "${interfaceName}" -X POST --silent \
  //         -d "username=${username}" \
  //         -d "password=${password}" \
  //         -d "magic=${magic}" \
  //         -d "submit=Continue" \
  //         "${firewall_url}/"`;
  //     output = execSync(command, { encoding: 'utf8' });
  //   }

  //   const logoutMatch = output.match(/http[^"]*logout[^"]*/);
  //   const keepaliveMatch = output.match(/http[^"]*keepalive[^"]*/);

  //   const result = {
  //     logoutURL: logoutMatch ? logoutMatch[0] : null,
  //     keepaliveURL: keepaliveMatch ? keepaliveMatch[0] : null,
  //   };

  //   return result;
  // }

  async function do_login(magic, username, password, firewall_url) {
    try {
      let response;
      const requestBody = {
        username: username,
        password: password,
        magic: magic,
        submit: 'Continue',
      };
      
      if (os.platform() === 'win32') {
        response = await axios.post(firewall_url, requestBody, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } else {
        response = await axios.post(firewall_url, requestBody, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Only if you have SSL issues
        });
      }
      const logoutMatch = response.data.match(/http[^"]*logout[^"]*/);
      const keepaliveMatch = response.data.match(/http[^"]*keepalive[^"]*/);

      const result = {
        logoutURL: logoutMatch ? logoutMatch[0] : null,
        keepaliveURL: keepaliveMatch ? keepaliveMatch[0] : null,
      };

      return result;

    } catch (error) {
      throw new Error(`Error in do_login: ${error.message}`);
    }
  }

  // function keep_alive(url, interfaceName) {
  //   console.log("Keepalive url is", url);
  //   const delay = 10000;
  //   const attemptKeepAlive = () => {
  //     if (os.platform() === 'win32') {

  //       const requestOptions = {
  //         method: 'GET',
  //         uri: url,
  //       };

  //       request(requestOptions)
  //         .then((response) => {
  //           if (response.includes('leave it open')) {
  //             console.log('Keepalive successful');
  //             setTimeout(attemptKeepAlive, delay);
  //           } else {
  //             console.log('Keepalive unsuccessful; Trying to get login screen');
  //           }
  //         })
  //         .catch((error) => {
  //           console.error('Error during keepalive:', error.message);
  //         });
  //     } else {

  //       const command = `curl -k -silent --interface "${interfaceName}" "${url}"`;
  //       const output = execSync(command, { encoding: 'utf8' });

  //       if (output.includes('leave it open')) {
  //         console.log('Keepalive successful');
  //         setTimeout(attemptKeepAlive, delay);
  //       } else {
  //         console.log('Keepalive unsuccessful; Trying to get login screen');
  //       }
  //     }
  //   };

  //   attemptKeepAlive();
  // }


  async function keep_alive(url) {
    console.log("Keepalive url is", url);
    const delay = 10000;

    const attemptKeepAlive = async () => {
      try {
        let response;
        if (os.platform() === 'win32') {
          response = await axios.get(url);
        }
        else {
          response = await axios.get(url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Only if you have SSL issues
          });
        }

        if (response.data.includes('leave it open')) {
          console.log('Keepalive successful');
          setTimeout(attemptKeepAlive, delay);
        } else {
          console.log('Keepalive unsuccessful; Trying to get login screen');
        }

      } catch (error) {
        console.error('Error during keepalive:', error.message);
      }
    };

    attemptKeepAlive();
  }

  async function main(output) {
    const lines = output.split('\n');
    const logout_url = lines[0];
    const keepalive_url = lines[lines.length - 1];

    console.log(logout_url);
    console.log(keepalive_url);

    await keep_alive(keepalive_url);
  }



  let doAuthentication = async () => {
  //  await logout();
    let login_page = await get_login_page();
    let i_do_the_magic = await get_magic(login_page);
    let login_urls = await do_login(i_do_the_magic, rollno, pass_ik, firewall_url);
    await main(login_urls);
  }

 const minuteRule = new schedule.RecurrenceRule();
  minuteRule.second = 0;

  const job = schedule.scheduleJob(minuteRule, doAuthentication);

  job.on('error', (err) => {
    console.error('Error:', err);
  });

  app.on('before-quit', () => {
    job.cancel();
  });

}


module.exports = runScript;
