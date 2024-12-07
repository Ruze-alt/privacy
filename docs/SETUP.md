# Setup Guide

1. Clone or download the repository to your local machine.

2. Set Up a Local HTTPS Server
    * Why HTTPS? CODAP requires plugins to be served over HTTPS for security reasons.
    * You can use any tool you like to set up a local HTTPS server. Though here's one I recommend:
        * https://www.youtube.com/watch?v=v4jgr0ppw8Q
        * https://gist.github.com/prof3ssorSt3v3/edb2632a362b3731274cfab84e9973f9

3. Run the Server
    * Start your local server and note the URL provided (e.g., https://127.0.0.1:8000).

4. Open the Plugin in CODAP
    ```text
    https://codap.concord.org/app/static/dg/en/cert/index.html?di=https://{ServerURL}/PrivacyRules/privacy.html
    ```
    * Replace {ServerURL} with your local server URL.
    * Example: If you're running on localhost (127.0.0.1) with port 8000, use this URL:
    ```text
    https://codap.concord.org/app/static/dg/en/cert/index.html?di=https://127.0.0.1:8000/PrivacyRules/privacy.html
    ```
