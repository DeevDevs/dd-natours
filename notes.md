to start working on node, I have to open the terminal, type node, hit enter
to leave the code area, type .exit

package.json contains some summary about our project to let npm know what we dependencies we have, what the entry point is, etc. With the help of package.json we can easily reinstall some dependencies. Also, npm has LOADS AND LOADS of packages that are used not only in js, but also in other languages.

When we installed node.js, we also installed npm and our VScode has access to it in the Terminal.

If we want to install a dependency, just type 'npm install nameofthepackage'
if we want to install a devdependency, we type 'npm install nameofpackage --save-dev'
If we want to install a dependency not only to the current project, but to all the projects, we can type 'npm install namoeofpackage --global'

to allow nodemon work, I had to go to PowerShell and change the ExecutionPolicy
when I typed
'Get-ExecutionPolicy' it was 'Restricted'
then I set it through
'Set-ExecutionPolicy RemoteSigned -Scope CurrentUser'
to RemoteSigned ...
I can set it back to Restricted any time in the future.

If we do not install a dependency globally, we cannot use it through the Terminal. However, we can create a script and then run the script (as it was with build)

To check if any of dependencies or devdependencies have updated versions, we can type 'npm outdated'
To install some previous version of a package, I can type 'npm i slugify@1.0.0' for example
if I have '^1.0.0' version (look at the symbol in front), it means I am accepting bug and feature updates. But I do not accept version updates.
If I have '~1.0.0' version (look at the symbol in front), I only accept bug updates.

If I have "{starsign}1.0.0", I accept any updates (but then my code is too much vulnerable)

package-lock.json file contains information about our dependencies and devdependencies and their dependencies as well

IN PRETTIER
{
"singleQuote": true,
"printWidth": 120 ---------- THIS THING MAKES MY MAXIMUM LINE LENGTH HIGHER YAAAY!
}

////////////////////////////////////////////////////////////////

There are readable streams, writible streams, duplex streams and transform streams.

READABLE STREAMS - streams from which we can get data
data - is an event when there is some data to consume
end - is an event when there is nothing left to consume
functions: pipe(), read()

WRITABLE STREAMS - streams where we can write data
drain -
finish
functions: write(), write, end()

//////////////////////////// MODULE SYSTEM
There are three type of modules
Core (node.js) modules
Developer (my) modules
3rd party (npm) modules
And node.js goes from top to bottom try to find the module and identify its origin

require() function returns exports of the required module
module.exports is the returned object

//////////////////////////////////////////
Asynchronous function returns a promise

/////////////////////////////////////////
Installations for node.js work

Installing "Nodemon" - for fast server restart (NPM)
Installing "Postman" - an app from that allows to try and test different types of requests (Postman API platform)
Installing "superagent" - for more comfortable http requests (NPM)
Installing "express" - a framework that adds a bunch of methods to the app (NPM)... I also had to require it and then run on the map variable

/////// ENVIRONMENT VARIABLES
I created a config.env file and there I assigned some environment variables... However, to make node.js see this file and use it, I have to install DOTENV... So, I install 'npm i dotenv'

/////// ES Lint and other Dependencies
then I install smth from npm
npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev
eslint-config-prettier makes prettier format the code
eslint-plugin-prettier makes eslint highlight possible mistakes and errors

// MONGO DB HELL

1. I installed mongoDB Compass to my PC and then I created an account in mongoDB Atlas...
2. I created a database in Compass and then created a Collection named 'tours'...
   2.5. I created a new project in Atlas and gave it a name...
3. I created a Cluster and it received its username and password...
4. I somehow connected Compass with Cluster and gave my computer access to my cloud...
   4.5 I went to cluster accessibility and made API whitelist to have access to it everywhere...
5. The file that I created in the Compass appeared in the Atlas and the connection was installed...
6. I used embedded Mongosh to check the accessibility to the library

7. I connect my cluster and database to the code and node.js by going to config.env and saving the database URL that I copy from the Atlas. I add the name of the database which is in collections ('natours')
8. install mongoose version 5 'npm i mongoose@5' ... it helps me to connect to my database using certain methods
9. I run mongoose.connect(appConnectionURL, {options}).then(resolve promise)

// THIS IS HOW I CAN RUN CERTAIN FILES THROUGH NODE JS in command line --> node dev-data/data/importDevData.js

// FILTERING IN ACTION

this is how the url string would look like, if I search for the duration greate or equal 5
127.0.0.1:8000/api/v1/tours?duration[gte]=5&difficulty=easy&sort=1&limit=10
and this is what the query would look like for MongoDB
`{difficulty: 'easy', duration: { $gte: 5} }`
while this is what the query would look like from the request
`{difficulty: 'easy', duration: { gte: '5'} }`

other operators would be --> gte, gt, lte, lt

resolution
first argument is a RegExp, where | = OR, \b = exact instances, g = all the instances... second argument is the callback function that is run for every match, and I ask every match to have dollar sign + match
queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

// SORTING
sorting in the ascending order
127.0.0.1:8000/api/v1/tours?sort=price
sorting in descending order
127.0.0.1:8000/api/v1/tours?sort=-price
or we can sort according to two parameters
127.0.0.1:8000/api/v1/tours?sort=price,ratingsAverage

// FIELD LIMITING
127.0.0.1:8000/api/v1/tours?fields=name,duration,difficulty,price
used method is
query.query.select('string with chosen fields') <-- this way we INCLUDE the fields chosen by the client
however, if I want to EXCLUDE, we add MINUS to the fields... means we EXCLUDE them

// PAGINATION
127.0.0.1:8000/api/v1/tours?page=2&limit=10
query = query.skip(calculatedNumberOfSkippedDocuments).limit(limitValue);

// AGGREGATION PIPELINE - when I insert names of tour document keys, I have to add dollar sign inside the string (check averages)
const stats = Tour.aggregate([
{ $match: { ratingsAverage: { $gte: 4.5 } } },
{ $group: {
_id: null,
avgRating: { $avg: '$ratingsAverage' },
avgPrice: { $avg: '$price' }
}
}]);

// VALIDATORS
I can use validators (from github) to validate strings. I need to plugin this validator to my code

USING PLUGINS FORM GITHUB

1. npm i validator
2. require it in the module

// DEBUGGING

I installed npm i ndb --global, and added a new script to package.json
If you provide four arguments to the middleware function, express automatically identifies it as an error handling function
If you pass an argument to the next function, express identifies it as an error. Then, it will skip all the other middlewares until it find the error handling middleware function.

// AUTHENTICATION, AUTHORIZATION, SECURITY
//create another model for users
//to apply password encryption, I install Bcrypt (npm i bcryptjs)
//to apply JWT, I also install
JWT library (npm i jsonwebtoken)

// ADVANCED POSTMAN
I created environments in postman and added URL variables
Then, through the test tab I added an environment variable called jwt for future use
Then I go to the protecter route and open the authorization tab

// SENDING EMAILS USING NODE
I install nodemailer (npm i nodemailer)
When I create a transporter, I go to config.env and save chosen gmail and password for the emails to be sent through it
In case of mailtrap, I saved username and password, as well as host because it is not a predefined transport, and the port

// LIMITING NUMBER OF REQUESTS
to do that we install npm i express-rate-limit

// SECURITY HTTP HEADERS
to do that I install npm i helmet ... it is a standard practice for express

// DTA SANITIZATION
i install npm i express-mongo-sanitize and npm i xss-clean

// PARAMETER POLLUTION
our api can accept only one instance of a parameter for filtering (e.g. only one 'sort' parameter, or only one 'pagination' parameter)... in case there are multiple instances, an error occurs... so we downloadl a parameter pollution package (npm i hpp) which will take care of it

// NESTED ROUTES
when we want to get review on a certain tours
e.g tours/38472'TOURID'94387/reviews
or a certain review on a certain tour
e.g tours/38472'TOURID'94387/reviews/0139g0249'REVIEWID'w23rgg23

// MAPBOX
to make my mapbox work, I went to the mapbox website and signed up. Then I added two lines of code through CDN
to the head that I then append froum the tour,pug file to the base.pug. Then I created a js file with the code provided by the mapbox.

// AXIOS HTTP REQUESTS
to make http requests, i use AXIOS. From the website 'axios cdn smth' I took the link
https://cdnjs.cloudflare.com/ajax/libs/axios/0.27.2/axios.min.js
and added it as another defer script.

COMBINING JS DOCUMENTS
when I started combining my JS documents, I installed (npm i parcel-bundler --save-dev) and added a couple of scripts to the package-json

Next, I installed axios (npm i axios) and added it, where necessary.
Then, I install polyfiller (npm i @babel/polyfill) and added it to my main js file

// UPLOADING USER PHOTOS
Multer allows multiple package files to be uploaded to the server. First I install 'npm i multer'
we add it to the route and specify some options

then, to test it in Postman, we send the body with not RAW but with FORM data

// RESIZING USER PHOTOS
Sharp allows to resize images. First, we install the 'npm i sharp' and then we add it to another middleware

// FOR ADVANCED EMAIL SENDING I have to install 'npm i html-to-text@5'
also, later I have t create an accound in sendgrid (which I did, but it is under review now =( )

// For accepting payments, we have to go to stripe.com and create account
I install 'npm i stripe@7' and take the secret key from my account to the CONFIG.
I also add the third parrty script to the HTML to make it all work on the client side

// AFTER I added my files to github, I started modifying some stuff to make it ready for deployment

1. I install 'npm i compression' to make my responses/requests compressed. I add it to app.js
2. I remove all console.logs, except for the most important ones
3. I fix the URLs to make them fit the server I am planning to use.
4. build final JS bundle

// HEROKU
I install Heroku on my computer and sign up in the website.
Then I go to the CMD in VScode and typy 'heroku login'
Now, I go to package.json to fix the start script... I make it 'node server.js' ... also, it is important that I specify the engine in package.js
When I checked the PORT, I entered 'heroku create' and it created a new repo in my GIT
then I type 'git push heroku master' (to make it work, I have to first create the master or main brahc. Otherwise, it won't work.. won't build)
I have to speify the config.env variables manually
I don't have to assign the PORT variable. Heroku does it itself
After we have set all the variables (either through VSCode or through Heroku website) we can start the app writing 'heroku open'
We can change the name of the app (that is then shown in the URL) througg the CMD 'heroku apps:rename deevdevs-natours-portfolio'

HERE I CAN TEST THE SPEED
https://www.giftofspeed.com/gzip-test/

TEST FOR SECURE HTTP CONNECTION
I changed settings in the CreateSendToken function in authoController, also I added Trust Proxy to app.js

//Listening to SIGTERM signals from Heroku
we go to server.js and add code to gracefully shut down the server when SIGTERM signal comes
then we upload everything... and ... to check our dynos we can type in CMD 'heroku ps'
then we can restart the app by 'heroku ps:restart' and see the logs through 'heroku logs --tail'

// TO ALLOW CORS, we need to install a package 'npm i cors'
then we add it as another middleware
app.use(cors()); //if we want to allow it everywhere, we add it here. If we want to allow CORS only on specific route, we should go to that router, and add it there in the req,res cycle

in case we want our api to be allowed to access only from one domain(e.g. front-end is www.natours.com), then we would write it this way
app.use(cors({
origin: 'https://www.natours.com'
}));

but it is not enough... it will only work with simple requests (GET and POST). In case we want to allow PATCH, DELETE, we have to remember about the options-request (the one that browser sends to our server before the actual PATCH/DELETE request). So, we have to enable our server to respond to such requests. Once we respond to such request, the browser will understand that it is safe, and will execute the actual request
this is for the options request that occurs at the pre-flight phase
app.options('\*', cors()); // this way we allow even complex requests on all routes
if we want to restrict it, then we can e.g. make it like this
app.options('/api/v1/tours/:id', cors()); // then it is the only path that is allowed to have pre-flight phase

// IN PACKAGE JSON I SWITCHED FROM
"engines": {
"node": ">=10.0.0"
}
to
"engines": {
"node": "^10"
}

// ONCE THE APP IS DEPLOYED, WE SET WEBHOOK IN STRIPES. We pass in the URL that the Stripe will go to once the payment is successful. Once we set a unique URL, we have to handle it, so we go to app.js to add the route THERE.
Then we fixed/removed all the URLs and previosly used handlers because now we are using another handler. As the handler requires raw data, we also placed the URL BEFORE the JSON CONVERTER. Now, we using handler to check if everything is correct (for that I copied secret for webhook from stripe )
