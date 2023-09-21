const { execSync } = require('child_process');
const { app } = require('electron');
const os = require('os');
const firewall_url = "http://192.168.249.1:1000";
const request = require('request-promise-native');
const schedule = require('node-schedule');

http://192.168.249.1:1000/logout
function runScript(arg1, arg2) {
  const rollno = arg1;
  const pass_ik = arg2;


  let interface;

  if (os.platform() === 'win32') {
    // Windows
    interface = execSync('ipconfig | findstr /C:"Default Gateway"').toString().split(':')[1].trim();
  } else if (os.platform() === 'linux') {
    // Linux
    interface = execSync("ip route | grep '^default' | grep -oP 'dev \\K[^ ]+'", { encoding: 'utf8' }).trim();
  }
  else if (os.platform() === 'darwin') {
    // macOS
    interface = execSync("route -n get default | grep 'interface:' | awk '{print $2}'", { encoding: 'utf8' }).trim();
  }
  else {
    console.error("Doesn't support your OS!");
    process.exit(1);
  }

  function get_login_page() {
    let output;
    if (os.platform() === 'win32') {
      output = execSync(
        `powershell.exe -command "Invoke-RestMethod -Uri ${firewall_url}/logout?"`,
        { encoding: 'utf8' }
      );
    } else {

      output = execSync(
        `curl --silent --interface "${interface}" -k "${firewall_url}/logout?"`,
        { encoding: 'utf8' }
      );
    }

    const httpMatch = output.match(/http[^"]*/);
    if (httpMatch) {
      return httpMatch[0];
    } else {
      throw new Error('Login page URL not found');
    }

  }

  function get_magic(login_page, interfaceName) {
    let output;
    if (os.platform() === 'win32') {
      const command = `powershell.exe -command "Invoke-RestMethod -Uri ${login_page}"`;
      output = execSync(command, { encoding: 'utf8' });
    } else {

      const command = `curl --silent --interface "${interfaceName}" -k "${login_page}"`;
      output = execSync(command, { encoding: 'utf8' });
    }


    const magicMatch = output.match(/"magic" value="([^"]*)"/);
    if (magicMatch && magicMatch[1]) {
      return magicMatch[1];
    } else {
      throw new Error('Magic value not found');
    }
  }



  function do_login(magic, username, password, firewall_url, interfaceName) {
    let output;
    if (os.platform() === 'win32') {

      const requestBody = {
        username: username,
        password: password,
        magic: magic,
        submit: 'Continue',
      };

      const requestOptions = {
        method: 'POST',
        uri: firewall_url,
        body: requestBody,
        json: true,
      };


      output = request(requestOptions);
    } else {

      const command = `curl -k --interface "${interfaceName}" -X POST --silent \
          -d "username=${username}" \
          -d "password=${password}" \
          -d "magic=${magic}" \
          -d "submit=Continue" \
          "${firewall_url}/"`;
      output = execSync(command, { encoding: 'utf8' });
    }

    const logoutMatch = output.match(/http[^"]*logout[^"]*/);
    const keepaliveMatch = output.match(/http[^"]*keepalive[^"]*/);

    const result = {
      logoutURL: logoutMatch ? logoutMatch[0] : null,
      keepaliveURL: keepaliveMatch ? keepaliveMatch[0] : null,
    };

    return result;
  }
  
  function keep_alive(url, interfaceName) {
    console.log("Keepalive url is", url);
    const delay = 10000;
    const attemptKeepAlive = () => {
      if (os.platform() === 'win32') {

        const requestOptions = {
          method: 'GET',
          uri: url,
        };

        request(requestOptions)
          .then((response) => {
            if (response.includes('leave it open')) {
              console.log('Keepalive successful');
              setTimeout(attemptKeepAlive, delay);
            } else {
              console.log('Keepalive unsuccessful; Trying to get login screen');
            }
          })
          .catch((error) => {
            console.error('Error during keepalive:', error.message);
          });
      } else {

        const command = `curl -k -silent --interface "${interfaceName}" "${url}"`;
        const output = execSync(command, { encoding: 'utf8' });

        if (output.includes('leave it open')) {
          console.log('Keepalive successful');
          setTimeout(attemptKeepAlive, delay);
        } else {
          console.log('Keepalive unsuccessful; Trying to get login screen');
        }
      }
    };

    attemptKeepAlive();
  }



  function main(output) {
    const lines = output.split('\n');
    const logout_url = lines[0];
    const keepalive_url = lines[lines.length - 1];

    console.log(logout_url);
    console.log(keepalive_url);

    keep_alive(keepalive_url);
  }



  let doAuthentication = () => {
    let login_page = get_login_page();
    let i_do_the_magic = get_magic(login_page, interface);
    let login_urls = do_login(i_do_the_magic, rollno, pass_ik, firewall_url, interface);
    main(login_urls);
  }


//scheduler

const minuteRule = new schedule.RecurrenceRule();
minuteRule.second = 0; // Run at the beginning of each minute

// Schedule the task to run every minute
const job = schedule.scheduleJob(minuteRule, doAuthentication);

job.on('error', (err) => {
  console.error('Error:', err);
});

// To cancel the job (e.g., when your application exits)
// job.cancel();
app.on('before-quit', () => {
  // Cancel the scheduled job when the application is exiting
  job.cancel();
});

}


module.exports = runScript;