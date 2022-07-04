# Natours Application

This modern application is built using Node.js, Express framework, PUG, MongoDB, Mongoose, and the API was tested through Postman. In general, this application allows potential travellers to look for a tour they want to have during the year, book it, and edit their profile information. They can login and logout, edit their profile photo, name, email and password, and even make the fake payment for the booking through the Stripe platform. The backend is built in a way that grants users secure connection, while the accessibility to certain apllications features is restricted depending on the role of the user (be it simple user, tour guide, or admin). The server-side renders the website, and has the REST API that allows to work with user and tour data.

Not all the features of the API are represented in the frontend, as it also gives users a chance to leave reviews, or search for the tours using various parameters (difficulty level, price, duration, rating, etc.), while admins are granted power to manipulate data in the database. Of course, sensitive data related to users is successfully encrypted using crypto and even admins have no access to it. The request/response cycle is protected by the JWT tokens. if the user is logged in.

I participated in building backend for this application, while I was learning how to code in Node.js with Jonas Schmedtmann (see his Udemy account: https://www.udemy.com/user/jonasschmedtmann/). The result code is what the basic version of the application looks like, and I have not added any extra features or upgrades yet. But I am planning to do that the way I upgraded my Forkify and Mapty projects. Eventually, I deployed it through Heroku and you may try to use it here: https://deevdevs-natours-portfolio.herokuapp.com/

IMPORTANT: You may try to sign in using 'laura@example.com' (password: test1234). However, to make the test use available for anyone who visits the platform after reading application description, please make sure you return 'username' and 'password' to their default values. Thank you and have fun!

Это современное приложение было создано с помощью Node.js, Express фреймворк, PUG, MongoDB, Mongoose, а API был протестирован в приложении Postman. В целом, это приложение позволяет потенциальным путешественникам находить тур, в котором они хотели бы побывать в течение года, покупать участие в нем, а также редактировать свои данные в профиле. Они могу залогиниться, выйти из профиля, изменить фотографию, имейл, имя и фамилию, сменить пароль, и даже якобы заплатить за тур с помощью платформы Stripe. Бэкенд построен так, что предоставляет безопасное соединение, а доступ к функциональности может быть ограничен в зависмости от роли пользователя (обычный пользователь, гид, или администратор). Сервер отвечает за рендеринг страниц, а также имеет REST API, которое позволяет работать с данными пользователей или туров.

Не вся функциональность API представлена на вебсайте, так как оно позволяет пользователям оставлять отзывы и ставить оценку турам, искать туры по определенным параметрам поиска (сложность, длительность, оценка, стоимость, и т.д.), а администратор может управлять базой данных. Конечно же, все личные данные пользователей заскриптованы с помощью crypto, и даже у администратора нет к ним доступа. А деятельность залогинившегося пользователя на сайте защищено JWT токенами.

Я участвовал в разработке бэкенд части приложения, пока учился работать с Node.js вместе с Йонасом Шмедтманном (аккаунт на Udemy: https://www.udemy.com/user/jonasschmedtmann/). Результат работы перед вами, и представляет собой базовый комплект функций, так как я еще не работал над апгрейдом. Однако, я планирую сделать это в ближайшем будущем, как я поступил с проектами Forkify и Mapty. В конце концв, я запустил этот проект на платформе Heroku, и вы можете испытать его в деле здесь: https://deevdevs-natours-portfolio.herokuapp.com/

ВАЖНО: Вы можете попробовать залогиниться с помощью имейла 'laura@example.com' (пароль: test1234). Только для того, чтобы этот тестовый режим был доступен любому моему гостю, не могли бы вы проследить за тем, чтобы поле вашего ухода имейл и пароль имели свои изначальные значения? Спасибо и удачи!
