angular.module('mopidy-mobile.settings', [
  'ionic',
  'mopidy-mobile.coverart',
  'mopidy-mobile.locale',
  'mopidy-mobile.logging',
  'mopidy-mobile.storage',
  'mopidy-mobile.ui'
])

.config(function($stateProvider) {
  $stateProvider.state('main.settings', {
    abstract: true,
    url: '/settings',
    views: {
      'settings': {
        template: '<ion-nav-view></ion-nav-view>',
        controller: 'SettingsCtrl'
      }
    }
  }).state('main.settings.root', {
    templateUrl: 'templates/settings.html',
    url: ''
  }).state('main.settings.servers', {
    abstract: true,
    controller: 'ServerCtrl',
    template: '<ion-nav-view></ion-nav-view>',
    url: '/servers'
  }).state('main.settings.servers.add', {
    templateUrl: 'templates/servers.add.html',
    url: '/add'
  }).state('main.settings.servers.edit', {
    templateUrl: 'templates/servers.edit.html',
    url: '/edit'
  }).state('main.settings.servers.view', {
    templateUrl: 'templates/servers.view.html',
    url: ''
  }).state('main.settings.interface', {
    templateUrl: 'templates/interface.html',
    url: '/interface'
  }).state('main.settings.coverart', {
    templateUrl: 'templates/coverart.html',
    url: '/coverart'
  }).state('main.settings.licenses', {
    templateUrl: 'templates/licenses.html',
    url: '/licenses'
 }).state('main.settings.about', {
    templateUrl: 'templates/about.html',
    url: '/about'
  });
})

.controller('SettingsCtrl', function(connection, coverart, locale, popup, servers, storage, stylesheet, $ionicHistory, $log, $q, $rootScope, $scope, $state, $window) {
  angular.extend($scope, {
    addServer: function(server) {
      $scope.settings.servers.push(server);
      storage.set('servers', $scope.settings.servers);
      return servers().then(function(servers) {
        $rootScope.servers = servers;
        return servers;
      });
    },
    confirmRemoveServer: function(index) {
      popup.confirm('Remove server').then(function(result) {
        if (result) {
          return $scope.removeServer(index);
        }
      });
    },
    connect: function(url) {
      connection.reset(url).then(function() {
        $ionicHistory.clearCache();
      }).then(function() {
        return $state.go('main.playback');
      }).then(function() {
        $ionicHistory.clearHistory();
      });
    },
    locales: locale.all(),
    removeServer: function(index) {
      $scope.settings.servers.splice(index, 1);
      storage.set('servers', $scope.settings.servers);
      return servers().then(function(servers) {
        $rootScope.servers = servers;
        return servers;
      });
    },
    reset: function(clearSettings) {
      if (clearSettings) {
        storage.clear();
      }
      $window.location.reload(true);
    },
    settings: {}
  });

  storage.bind($scope, 'settings.coverart', 'coverart');
  storage.bind($scope, 'settings.action', 'action');
  storage.bind($scope, 'settings.locale', 'locale');
  storage.bind($scope, 'settings.stylesheet', 'stylesheet');
  // storage.bind doesn't handle arrays...
  $scope.settings.servers = storage.get('servers'),

  $scope.$watchCollection('settings.coverart', function(value) {
    angular.forEach(value, function(enabled, service) {
      if (enabled) {
        coverart.enable(service);
      } else {
        coverart.disable(service);
      }
    });
  });

  $scope.$watch('settings.locale', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      $log.info('Locale set to "' + newValue + '"');
      // layout issues with ion-nav-bar back button title:
      // https://github.com/tkem/mopidy-mobile/issues/87
      //$ionicHistory.clearCache();
      //locale.set(newValue);
      popup.confirm('Restart application').then(function(result) {
        if (result) {
          $scope.reset();
        }
      });
    }
  });

  $scope.$watch('settings.stylesheet', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      $log.info('Style sheet set to "' + newValue + '"');
      stylesheet.set(newValue);
    }
  });

  connection.settings().then(function(settings) {
    $scope.webSocketUrl = settings.webSocketUrl;
  });
})

.controller('SettingsMenuCtrl', function($scope, popoverMenu, popup) {
  angular.extend($scope, {
    confirmReset: function() {
      popup.confirm('Reset all settings to default values and restart application').then(function(result) {
        if (result) {
          $scope.reset(true);
        }
      });
    },
    popover: popoverMenu([{
      text: 'Reset',
        click: 'popover.hide() && confirmReset()',
        hellip: true
    }, {
      text: 'Exit',
      click: 'popover.hide() && platform.exitApp()',
      hidden: '!platform.isWebView()'
    }], {
      scope: $scope
    })
  });
})

.controller('CoverartMenuCtrl', function($scope, coverart, popoverMenu) {
  angular.extend($scope, {
    clearCache: coverart.clearCache,
    popover: popoverMenu([{
      text: 'Clear cache',
      click: 'popover.hide() && clearCache()'
    }], {
      scope: $scope
    })
  });
});
