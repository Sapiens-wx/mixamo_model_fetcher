# Mixamo Model Fetcher

fetches all the character models in mixamo.com

## Install Instructions

1. Install npm and nodejs
2. in the project directory, run `npm install`
3. Configure `.env` file based on [the instructions](#env-file-configuration)

## Use Instructions

```
Usage: node app.mjs [options] <type>

Arguments:
  type                   character or animation

Options:
  -o, --out <directory>  output directory (default: "./results")
  -d, --dry-run          do I actually download the files? (default: false)
  --start <start index>  determines the start index of the data to be downloaded (default: "0")
  --count <count>        determines the count of the data to be downloaded (default: "-1")
  -h, --help             display help for command
```

**Examples**

- `node app.mjs character`: downloads all the characters
- `node app.mjs animation`: downloads all the animations
- `node app.mjs animation -o ./Models`: downloads all the animations and store them in ./Models
- `node app.mjs animation --start 100`: downloads the animations starting from index 100
- `node app.mjs animation --count 200`: downloads at most 200 animations

**All the flags can be used in combination with each other**

## .env File Configuration

```.env
AUTHKEY="<the authentication key>"
```

**How to get the `AUTHEKEY`**

1. Goto [mixamo.com](https://www.mixamo.com/#/)
2. login
3. open the console
4. type `localStorage.access_token`, hit enter
5. copy the output string without the quotes
6. format the AUTHKEY exactly as `Bearer <localStorage.access_token>`. **Note that there is a whitespace between `Bearer` and `<access_token>`** e.g., `AUTHKEY="Bearer abcde"`