# Template Electron Angular App

This repository provides a template for building Electron applications using Angular.

## Getting Started

1. **Clone the repository:**
    ```bash
    git clone https://github.com/Kathurjan/template-electron.git
    cd template-electron
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Run the Angular development server:**
    ```bash
    npm start
    ```
    This will launch the Angular application in your browser.


4. **Run Electron (in a separate terminal):**  
    a. Run with login window:
    ```bash
    npm run electron
    ```
    This will build the Angular app and open the Electron application.

    b. Run in lite mode (no login window):
    ```bash
    npm run electron:lite
    ```
    This will build the Angular app and open the Electron application in lite mode.

 
5. **Build the application for distribution:**  
    a. Standard build:
    ```bash
    npm run dist
    ```
    This will build the Angular app and create distributable packages in the `release` directory.

    b. Lite mode build:
    ```bash
    npm run dist:lite
    ```
    This will build the Angular app and create lite mode version of distributable packages in the `release-lite` directory.




## Auto-Update Configuration

This template is configured for auto-updates using `electron-updater` and a generic provider.

**How it Works:**

1.  **Publishing Updates:**
    * When you run `npm run dist`, `electron-builder` creates your application's distributable (`.exe` for Windows, `.dmg` for MacOS) and generates `latest.yml` or `latest-mac.yml` and blockmap files in the `release` directory.
    * These files are then uploaded to the specified `url` in the `publish` section of your `package.json` (currently `https://github.com/Neshi24/template-electron`).
    * The `latest.yml` or `latest-mac.yml` file contains metadata about the latest release, and the blockmap files help with efficient delta updates.

2.  **Client-Side Update Check:**
    * The application, upon launch, checks for updates by fetching the `latest.yml` or `latest-mac.yml` file from the specified URL.
    * If a new version is available, it downloads the update and prompts the user to install it.

**Setting Up Auto-Updates for Your Own Project:**

1.  **Choose a Hosting Provider:**
    * You need a web server or hosting service to host your update files (`.exe`, `latest.yml`, blockmaps or `.dmg`, `latest-mac.yml`, blockmaps). You can use services like GitHub Releases, AWS S3, or any web server.

2.  **Update `package.json`:**
    * Modify the `publish` section in your `package.json` to point to your hosting URL.
        ```json
        "publish": [
            { 
              "provider": "github",   <--- change this to what you are hosting your files on.
              "owner": "your username",
              "repo": "your repository name"
            }
          ]
        ```

3.  **Upload Update Files:**
    * After building your application, upload the generated `.exe`, `latest.yml`, and blockmap or `.dmg`, `latest-mac.yml`, blockmaps files to your hosting location.
    * For GitHub, create a new release for you repository and upload files there.

            
