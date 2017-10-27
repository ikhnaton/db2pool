const _ = require('lodash');
const ibmdb = require('ibm_db');

function dbPool()
{
	var pool = {};
	var mi = this;

	this.getConnection = function(dbName)
	{
		var promise = new Promise((resolve, reject) =>
		{
			mi.init(dbName)
				.then(connections => {
					var available = _.findIndex(pool[dbName].connections, { active: false });

					if ((available == -1) && (pool[dbName].connections.length < pool[dbName].maxPoolSize))
					{
						resolve(addNewConnection(dbName));
					}
					else if (available == -1)
					{
						// all connections are in use, start stacking.
						var x = Math.floor(Math.random() * pool[dbName].maxPoolSize);

						resolve(pool[dbName].connections[x]);
					}
					else
					{
						resolve(pool[dbName].connections[available]);
					}
				})
				.catch(error => {
					console.log(error);
					reject(error);
				});
		});

		return promise;
	}

	this.query = function(connection, queryString, bindingParameters)
	{
		var promise = new Promise((resolve, reject) =>
		{
			connection.active = true;
			connection._connection.query(queryString, bindingParameters).then((result) => {
				connection.active = false;
				resolve(result);
			}, (error) => {
				console.log(error);
				connection.active = false;
				reject(error);
			});
		});

		return promise;
	};

	this.setPoolMax = function(dbName, size)
	{
		return new Promise((resolve, reject) =>
		{
			mi.init(dbName)
				.then(success => {
					pool[dbName].maxPoolSize = size;
					resolve("success");
				})
				.catch(failure => {
					console.log(failure);
					reject(failure);
				})
		});
	}

	this.setConnectionBusy = function(connection)
	{
		connection.active = true;
	}

	this.setConnectionNotBusy = function(connection)
	{
		connection.active = false;
	}

	this.purgeConnection = function(connection)
	{
		_.forEach(pool, (dbpool, index) => {
			pool[index].connections = _.reduce(dbpool.connections, (arry,current) => {
				if (!(current === connection)) arry.push(current);
				return arry;
			}, []);
			pool[index].counter = pool[index].connections.length;
		});
	}

	this.purgePool = function(dbName)
	{
		pool[dbName].counter = 0;
		pool[dbName].connections = [];
		return refreshPool(dbName);
	}

	this.refreshPool = function(dbName)
	{
		let promise = new Promise((resolve, reject) =>
		{
			let promises = [];
			let actives = _.filter(pool[dbName].connections, item => item.active == true);
			pool[dbName].counter = actives.length;
			pool[dbName].connections = actives;

			let need = pool[dbName].maxPoolSize - pool[dbName].counter;

			for (let x = 0; x < need; x++)
			{
				promises.push(addNewConnection(dbName));
			}

			Promise.all(promises)
				.then(connections => resolve(connections))
				.catch(err => {
					console.log(err);
					reject(err);;
				});
		});

		return promise;
	}

	this.init = function(dbName)
	{
		if (pool[dbName] == null)
		{
			pool[dbName] = {
				counter: 0,
				connections: []
			};

			let config = getConfig(dbName);

			pool[dbName].maxPoolSize = (config.maxPoolSize != null)?config.maxPoolSize:10;

			return mi.refreshPool(dbName);
		}

		return Promise.resolve(pool[dbName].connections);
	}

	function getConfig(dbName)
	{
		if (process.env.DBPOOL)
		{
			return JSON.parse(process.env.DBPOOL)[dbName];
		}
		else
		{
			return require(__basedir + 'credentials/' + dbName + '.json');
		}
	}

	function addNewConnection(dbName)
	{
		let promise = new Promise((resolve, reject) =>
		{
			var config = (process.env.DBPOOL != null)?JSON.parse(process.env.DBPOOL)[dbName]:require(__basedir + 'credentials/' + dbName + '.json');

			ibmdb.open(_buildConectionString(config), function (err, conn)
			{
				if (err)
				{
					reject(err);
				}
				else
				{
					pool[dbName].counter++;
					pool[dbName].connections.push({ _connection: conn, active: false, id: pool[dbName].counter });
					var dex = _.findIndex(pool[dbName].connections, { id: pool[dbName].counter });
					resolve(pool[dbName].connections[dex]);
				}
			});
		});
		return promise;
	}

	function _buildConectionString(json)
	{
		var conStr = "DATABASE=" + json.database;
		conStr += ";HOSTNAME=" + json.hostname;
		conStr += ";UID=" + json.username;
		conStr += ";PWD=" + json.password;
		conStr += ";PORT=" + json.port;
		conStr += ";PROTOCOL=" + json.protocol;
		conStr += ";Security=" + json.security;
		conStr += ";SSLServerCertificate=" + __basedir + "certificates/" + json.sslCert;
		conStr += (json.other != null)?";" + json.other:"";

		return conStr;
	}
}

module.exports = new dbPool();
