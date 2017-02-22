(function(){
  'use strict';

  var app = angular.module('app',[], function config($httpProvider){
    $httpProvider.interceptors.push('AuthInterceptor');
  });

  app.constant('API_URL', 'http://localhost:3000');

  // main app controller
  app.controller('MainCtrl', function MainCtrl(RandomUserFactory, UserFactory) {
    'use strict';
    var vm = this;
    vm.getRandomUser = getRandomUser;
    vm.login = login;
    vm.logout = logout;

    // initialization
    UserFactory.getUser().then(function success(response) {
      vm.user = response.data;
    });

    function getRandomUser() {
      RandomUserFactory.getUser().then(function success(response) {
        vm.randomUser = response.data;
      }, handleError);
    }

    function login(username, password) {
      UserFactory.login(username, password).then(function success(response) {
        vm.user = response.data.user;
        console.log('Token: ', response.data.token);
      }, handleError);
    }

    function logout() {
      UserFactory.logout();
      vm.user = null;
    }

    function handleError(response) {
      console.log('Error: ' + response.data);
    }
  });

  // factory gets a random user from API
  app.factory('RandomUserFactory', function RandomUserFactory($http, API_URL) {
    'use strict';

    return {
      getRandomUser: getRandomUser
    };

    function getRandomUser() {
      return $http.get(API_URL + '/random-user');
    }
  });

  // fatory to login, logout, and getUser
  app.factory('UserFactory', function UserFactory($http, API_URL, AuthTokenFactory, $q){
    'use strict';

    return {
      login: login,
      logout: logout,
      getUser: getUser
    };

    function login(username, password) {
      return $http.post(API_URL + '/login', {
        username: username,
        password: password
      }).then(function success(response) {
        console.log('response',response.data.token);
        AuthTokenFactory.setToken(response.data.token);
        return response;
      });
    }

    function logout() {
      AuthTokenFactory.setToken();
    }

    function getUser() {
      if (AuthTokenFactory.getToken()) {
        return $http.get(API_URL + '/me');
      } else {
        return $q.reject({ data: 'client has no auth token'});
      }
    }
  });

  app.factory('AuthTokenFactory', function AuthTokenFactory($window) {
    'use strict';

    var store = $window.localStorage;
    var key = 'auth-token';
    return {
      getToken: getToken,
      setToken: setToken
    };

    function getToken() {
      return store.getItem(key);
    }

    function setToken(token) {
      if (token) {
        store.setItem(key, token);
      } else {
        store.removeItem(key);
      }
    }
  });

  app.factory('AuthInterceptor', function AuthInterceptor(AuthTokenFactory) {
    'use strict';

    return {
      request: addToken
    };

    function addToken(config) {
      var token = AuthTokenFactory.getToken();
      if(token){
        config.headers = config.headers || {};
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    }
  })
})();