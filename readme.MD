# Mixamo Model Fetcher

fetches all the character models in mixamo.com

**Table of Contents**

[Installation](#install-instructions)<br>
[Documentation](#use-instructions)<br>
[Common Usage](#common-usage)

## Install Instructions

1. Install npm and nodejs
2. in the project directory, run `npm install`
3. Configure `.env` file based on [the instructions](#env-file-configuration)

## .env File Configuration

```.env
AUTHKEY="<the authentication key>"
```

**How to get the `AUTHKEY`**

1. Goto [mixamo.com](https://www.mixamo.com/#/)
2. login
3. open the console
4. type `localStorage.access_token`, hit enter
5. copy the output string without the quotes
6. format the AUTHKEY exactly as `Bearer <localStorage.access_token>`. **Note that there is a whitespace between `Bearer` and `<access_token>`** e.g., `AUTHKEY="Bearer abcde"`

## Use Instructions

```
Usage: app [options] <type> [misc...]

Arguments:
  type                       - character
                             - animation
                             - search [characters...] returns the id of the given character name
  misc                       for search, it's the file names

Options:
  -o, --out <directory>      output directory (default: "./results")
  -d, --dry-run              do I actually download the files? (default: false)
  -c, --characters <ids...>  SEARCH: the ids of the character to download (default: [])
  --start <start index>      determines the start index of the data to be downloaded (default: "0")
  --count <count>            determines the count of the data to be downloaded (default: "-1")
  -h, --help                 display help for command
```

**Examples**

- `node src/app.mjs character`: downloads all the characters
- `node src/app.mjs animation`: downloads all the animations
- `node src/app.mjs animation -o ./Models`: downloads all the animations and store them in ./Models
- `node src/app.mjs animation --start 100`: downloads the animations starting from index 100
- `node src/app.mjs animation --count 200`: downloads at most 200 animations

**All the flags can be used in combination with each other**

## Common Usage
- download all character models<br>
  `node src/app.mjs character`
- download all animation with default model<br>
  `node src/app.mjs animation`
- download all animation of several models from mixamo<br>
  `node src/app.mjs animation -c abcdefg-123-character-id abc-123-another-chracter-id`
- download all animation of all characters that matches specified names<br>
  `node src/app.mjs animation -c $(node src/app.mjs search a-char-name another-char-name so-on)`

## References

- [https://github.com/gnuton/mixamo_anims_downloader](https://github.com/gnuton/mixamo_anims_downloader) the getGmsHash function is implemented based on this github repo
