# Mixamo Model Fetcher

fetches all the character models in mixamo.com

## Instructions

1. Install npm and nodejs
2. `node app.mjs` in the command line<br>
3. Configure `.env` file based on [the instructions](#env-file-configuration)

## .env File Configuration

#### Default Settings
```.env
AUTHKEY="<the authentication key from the website>"
DRYRUN=false
```
copy the above directly for default values. (except that you have to have your own `AUTHKEY`)

__AUTHKEY__ format: the string starting with `Bearer`

#### Parameters
```.env
AUTHKEY="<the authentication key from the website>"
DRYRUN=<true for seeing the logs but not downloading anything. false for downloading the models>
```

## Usage

`node app.mjs <directory name>`

[directory name] is an optional argument to dedicate the directory to download the models.