# git-hook-deploy
A continuous-integration tool for automating tasks (site update, etc.) based on webhook calls.
The tool should work with GitHub and GitLab repository webhook calls.

## usage
* run `yarn install`
* copy `env.js.example` to `env.js` and configure
* start the application, it should list all webhook endpoints
* add the webhook endpoints to GitHub or any other Git hosting site

## configuration
```javascript
module.exports = [
  {
    name: 'test',
    path: '/home/server/test/',
    actions: [
      {
        key: 'ref',
        value: 'refs/heads/master',
        commands: ['git pull origin master', 'yarn install', 'npm run restart']
      }
    ]
  }
]
```

The tool can be configured for multiple sites, where each `actions` refers to a key `git-hook-deploy`
will look for in the webhook POST data and compare it with the `value`. If the value matches up, it will
run all the `commands` in a synchronous fashion.

## example setup
This example will make use of the powerful [pm2](https://github.com/Unitech/pm2) tool for Node server management.
Let's assume that `git-hook-deploy` and the target site are cloned in a server user's directory:
```
test  git-hook-deploy
```
Next, create a configuration such as this:
```javascript
module.exports = [
  {
    name: 'client',
    path: '/home/server/client/',
    actions: [
      {
        key: 'ref',
        value: 'refs/heads/master',
        commands: ['git pull origin master', 'yarn install', 'npm run build', 'pm2 restart index.js --name="client"']
      }
    ]
  }
]
```
You should then configure `pm2` to handle your processes. For example in the `git-hook-deploy` directory:
```
pm2 start index.js --name="deploy"
```
By default, the tool will run on port `9000`. On start, you should receive a message like this:
```
[ADD] client [ENDPOINT] /deploy/some_random_hash
```
To view this message, you may have to issue the command `pm2 logs deploy` for example.
Next, you want to enter the repository settings you wish to add this webhook to.
Under GitHub, when adding a webhook payload, make sure to use content type `application/json`.
An example payload URL is: `http://test.com.my:9000/deploy/some_random_hash`

## notes
* processes that depend on each other should use `&&` instead of just being a next value in the `commands` array
* the GitHub [webhooks guide](https://developer.github.com/webhooks/) is misleading and may lead you to think that there is a `action` key;- there is none. GitLab however is more honest and will not mislead you into testing up to 3 a.m.
* always use a reverse proxy and have a fallback reverse proxy if an update fails
